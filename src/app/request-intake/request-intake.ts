import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { AssetsApproval } from '../assets-approval/assets-approval';
import { AuthService, AuthSession } from '../auth/auth';
import { AvailabilityRequest } from '../availability/availability-request';
import { RequestStatus } from '../availability/request-status';
import { IntraRequestPayload, IntraRequestService } from './intra-request.service';

@Component({
  selector: 'app-request-intake',
  imports: [
    AssetsApproval,
    AvailabilityRequest,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatStepperModule,
    RequestStatus,
    RouterLink,
  ],
  templateUrl: './request-intake.html',
  styleUrl: './request-intake.scss',
})
export class RequestIntake implements OnDestroy {
  private readonly referenceNumberPattern = /^(SR|IR)\d{6}$/i;
  protected readonly activeView = signal<'request' | 'assetsApproval'>('request');
  protected referenceNumber = '';
  protected showIntraForm = false;
  protected saveMessage = '';
  protected isSaving = false;
  protected destinationSignatureFileName = '';
  protected destinationSignaturePreviewUrl = '';
  protected destinationSignatureContentType = '';
  protected destinationSignatureBase64 = '';
  protected isDraggingDestinationSignature = false;
  protected destinationSignatureDate: Date | null = null;
  protected readonly intraRequest: IntraRequestPayload = {
    referenceNumber: '',
    itpNumber: '',
    orderNumber: '',
    chiefDirectorate: '',
    subDirectorate: '',
    objective: '',
    responsibility: '',
    chiefUser: '',
    callReference: '',
    currentOwner: 'IS STOREROOM',
    currentBuilding: 'CGO',
    currentFloor: '4TH',
    currentOffice: '441',
    currentRegion: 'HEAD OFFICE',
    currentContact: '012 406 1724',
    destinationOwner: '',
    destinationBuilding: '',
    destinationFloor: '',
    destinationOffice: '',
    destinationRegion: '',
    destinationContact: '',
    movementReason: '',
  };

  constructor(
    private readonly authService: AuthService,
    private readonly intraRequestService: IntraRequestService,
    private readonly router: Router,
  ) {}

  ngOnDestroy(): void {
    this.clearDestinationSignaturePreview();
  }

  protected isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected showRequest(): void {
    this.activeView.set('request');
  }

  protected showAssetsApproval(): void {
    this.activeView.set('assetsApproval');
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected proceedToIntraForm(): void {
    queueMicrotask(() => {
      this.showIntraForm = true;
    });
  }

  protected updateReferenceNumber(value: string): void {
    this.referenceNumber = value;
    this.intraRequest.callReference = value;
    this.intraRequest.referenceNumber = value;
  }

  protected updateCallReference(value: string): void {
    this.intraRequest.callReference = value;
    this.referenceNumber = value;
    this.intraRequest.referenceNumber = value;
  }

  protected saveIntraRequest(): void {
    this.saveMessage = '';
    const cleanReference = this.intraRequest.callReference.trim() || this.referenceNumber.trim();
    const destinationSignatureDate = this.formatDate(this.destinationSignatureDate);
    this.updateReferenceNumber(cleanReference);
    this.intraRequest.referenceNumber = cleanReference;
    this.intraRequest.destinationSignatureDate = destinationSignatureDate;
    this.intraRequest.destinationSignatureFileName = this.destinationSignatureFileName;
    this.intraRequest.destinationSignatureContentType = this.destinationSignatureContentType;
    this.intraRequest.destinationSignatureBase64 = this.destinationSignatureBase64;
    this.applyCurrentLocationDetails();

    if (!this.intraRequest.referenceNumber || !this.intraRequest.chiefDirectorate.trim() || !this.intraRequest.subDirectorate.trim() || !this.intraRequest.chiefUser.trim()) {
      this.saveMessage = 'Complete the reference number, Chief Directorate, Sub-Directorate and Chief User fields.';
      return;
    }

    if (!this.isValidReferenceNumber(this.intraRequest.referenceNumber)) {
      this.saveMessage = 'Reference number must start with SR or IR followed by 6 digits, for example SR123456.';
      return;
    }

    this.isSaving = true;
    this.intraRequestService.save(this.intraRequest).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'INTRA request saved successfully.';
      },
      error: () => {
        this.isSaving = false;
        this.saveMessage = 'Could not save INTRA request. Please try again.';
      },
    });
  }

  protected uploadDestinationSignature(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.readDestinationSignatureFile(file);
    input.value = '';
  }

  protected handleDestinationSignatureDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingDestinationSignature = true;
  }

  protected handleDestinationSignatureDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingDestinationSignature = false;
  }

  protected handleDestinationSignatureDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingDestinationSignature = false;
    this.readDestinationSignatureFile(event.dataTransfer?.files?.[0]);
  }

  protected readonly destinationFields = [
    'Owner:',
    'Building:',
    'Floor:',
    'Office: (white sticker on the door)',
    'Region:',
    'Contact:',
  ];

  protected readonly currentLocation = [
    { label: 'Owner:', value: 'IS STOREROOM' },
    { label: 'Building:', value: 'CGO' },
    { label: 'Floor:', value: '4TH' },
    { label: 'Office: (white sticker on the door)', value: '441' },
    { label: 'Region:', value: 'HEAD OFFICE' },
    { label: 'Contact:', value: '012 406 1724' },
  ];

  private applyCurrentLocationDetails(): void {
    this.intraRequest.currentOwner = this.currentLocation[0].value;
    this.intraRequest.currentBuilding = this.currentLocation[1].value;
    this.intraRequest.currentFloor = this.currentLocation[2].value;
    this.intraRequest.currentOffice = this.currentLocation[3].value;
    this.intraRequest.currentRegion = this.currentLocation[4].value;
    this.intraRequest.currentContact = this.currentLocation[5].value;
  }

  private isValidReferenceNumber(referenceNumber: string): boolean {
    return this.referenceNumberPattern.test(referenceNumber.trim());
  }

  private readDestinationSignatureFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.saveMessage = 'Upload a destination signature image or PDF file.';
      return;
    }

    this.destinationSignatureFileName = file.name;
    this.destinationSignatureContentType = file.type;
    this.destinationSignatureBase64 = '';
    this.saveMessage = '';
    this.clearDestinationSignaturePreview();
    this.destinationSignaturePreviewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.destinationSignatureBase64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      this.destinationSignatureBase64 = '';
      this.saveMessage = 'Could not read the destination signature file.';
    };
    reader.readAsDataURL(file);
  }

  private clearDestinationSignaturePreview(): void {
    if (this.destinationSignaturePreviewUrl) {
      URL.revokeObjectURL(this.destinationSignaturePreviewUrl);
      this.destinationSignaturePreviewUrl = '';
    }
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
