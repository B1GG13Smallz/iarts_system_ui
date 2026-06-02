import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, AuthSession } from '../auth/auth';
import { AssetsApprovalService } from './assets-approval.service';
import { IntraRequestPayload, IntraRequestRecord, IntraRequestService } from '../request-intake/intra-request.service';
import { TechnicianRequestDetails, TechnicianService } from '../technician/technician.service';

interface SignatureUploadState {
  fileName: string;
  previewUrl: string;
  contentType: string;
  base64: string;
  isDragging: boolean;
}

@Component({
  selector: 'app-assets-approval',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    RouterLink,
  ],
  templateUrl: './assets-approval.html',
  styleUrl: './assets-approval.scss',
})
export class AssetsApproval implements OnInit, OnDestroy {
  @Input() mode: 'approval' | 'return' = 'approval';
  protected readonly requests = signal<IntraRequestRecord[]>([]);
  protected readonly selectedRequestId = signal(0);
  protected readonly availabilityDetails = signal<TechnicianRequestDetails | null>(null);
  protected readonly loadMessage = signal('');
  protected readonly saveMessage = signal('');
  protected signatureFileName = '';
  protected signaturePreviewUrl = '';
  protected signatureContentType = '';
  protected signatureBase64 = '';
  protected isDraggingSignature = false;
  protected isSavingApproval = false;
  protected technicianName = '';
  protected readonly clientCurrentSignature = this.createSignatureState();
  protected readonly clientDestinationSignature = this.createSignatureState();
  protected readonly technicianSignature = this.createSignatureState();
  protected readonly movableAsset = {
    name: '',
    date: null as Date | null,
  };
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
    currentOwner: '',
    currentBuilding: '',
    currentFloor: '',
    currentOffice: '',
    currentRegion: '',
    currentContact: '',
    destinationOwner: '',
    destinationBuilding: '',
    destinationFloor: '',
    destinationOffice: '',
    destinationRegion: '',
    destinationContact: '',
    movementReason: '',
  };

  protected readonly destinationFields = [
    'Owner:',
    'Building:',
    'Floor:',
    'Office: (white sticker on the door)',
    'Region:',
    'Contact:',
  ];

  protected currentLocation = [
    { label: 'Owner:', value: '' },
    { label: 'Building:', value: '' },
    { label: 'Floor:', value: '' },
    { label: 'Office: (white sticker on the door)', value: '' },
    { label: 'Region:', value: '' },
    { label: 'Contact:', value: '' },
  ];

  protected isAssetReturnMode(): boolean {
    return this.mode === 'return';
  }

  constructor(
    private readonly assetsApprovalService: AssetsApprovalService,
    private readonly authService: AuthService,
    private readonly intraRequestService: IntraRequestService,
    private readonly router: Router,
    private readonly technicianService: TechnicianService,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.clearSignaturePreview();
    this.clearAdditionalSignaturePreview(this.clientCurrentSignature);
    this.clearAdditionalSignaturePreview(this.clientDestinationSignature);
    this.clearAdditionalSignaturePreview(this.technicianSignature);
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected selectRequest(requestId: number | string): void {
    const numericRequestId = Number(requestId);
    const request = this.requests().find((item) => item.id === numericRequestId);

    if (!request) {
      return;
    }

    this.selectedRequestId.set(request.id);
    this.saveMessage.set('');
    this.populateRequest(request);
  }

  protected uploadSignature(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.readSignatureFile(file);
    input.value = '';
  }

  protected handleSignatureDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingSignature = true;
  }

  protected handleSignatureDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingSignature = false;
  }

  protected handleSignatureDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingSignature = false;
    this.readSignatureFile(event.dataTransfer?.files?.[0]);
  }

  protected uploadAdditionalSignature(signature: SignatureUploadState, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.readAdditionalSignatureFile(signature, file);
    input.value = '';
  }

  protected handleAdditionalSignatureDragOver(signature: SignatureUploadState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = true;
  }

  protected handleAdditionalSignatureDragLeave(signature: SignatureUploadState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = false;
  }

  protected handleAdditionalSignatureDrop(signature: SignatureUploadState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = false;
    this.readAdditionalSignatureFile(signature, event.dataTransfer?.files?.[0]);
  }

  protected saveApproval(): void {
    const requestId = this.selectedRequestId();
    const movableAssetName = this.movableAsset.name.trim();
    const approvalDate = this.formatApprovalDate(this.movableAsset.date);

    this.saveMessage.set('');

    if (!requestId) {
      this.saveMessage.set('Select an INTRA request before saving approval.');
      return;
    }

    if (!movableAssetName || !approvalDate) {
      this.saveMessage.set('Moveable asset name and date are required.');
      return;
    }

    if (!this.signatureBase64 || !this.signatureFileName || !this.signatureContentType) {
      this.saveMessage.set('Upload a signature image or PDF before saving approval.');
      return;
    }

    this.isSavingApproval = true;
    this.assetsApprovalService.save({
      requestId,
      movableAssetName,
      approvalDate,
      signatureFileName: this.signatureFileName,
      signatureContentType: this.signatureContentType,
      signatureBase64: this.signatureBase64,
    }).subscribe({
      next: () => {
        this.isSavingApproval = false;
        this.saveMessage.set('Asset approval saved successfully.');
      },
      error: () => {
        this.isSavingApproval = false;
        this.saveMessage.set('Could not save asset approval.');
      },
    });
  }

  private loadRequests(): void {
    this.loadMessage.set('');
    this.intraRequestService.findAll().subscribe({
      next: (requests) => {
        this.requests.set(requests);

        if (!requests.length) {
          this.loadMessage.set('No INTRA requests are available for asset approval.');
          return;
        }

        this.selectRequest(requests[0].id);
      },
      error: () => {
        this.loadMessage.set('Could not load INTRA requests for asset approval.');
      },
    });
  }

  private populateRequest(request: IntraRequestRecord): void {
    this.intraRequest.referenceNumber = request.referenceNumber;
    this.intraRequest.itpNumber = request.itpNumber;
    this.intraRequest.orderNumber = request.orderNumber;
    this.intraRequest.chiefDirectorate = request.chiefDirectorate;
    this.intraRequest.subDirectorate = request.subDirectorate;
    this.intraRequest.objective = request.objective;
    this.intraRequest.responsibility = request.responsibility;
    this.intraRequest.chiefUser = request.chiefUser;
    this.intraRequest.callReference = request.callReference;
    this.intraRequest.currentOwner = this.isAssetReturnMode() ? '' : request.currentOwner;
    this.intraRequest.currentBuilding = this.isAssetReturnMode() ? '' : request.currentBuilding;
    this.intraRequest.currentFloor = this.isAssetReturnMode() ? '' : request.currentFloor;
    this.intraRequest.currentOffice = this.isAssetReturnMode() ? '' : request.currentOffice;
    this.intraRequest.currentRegion = this.isAssetReturnMode() ? '' : request.currentRegion;
    this.intraRequest.currentContact = this.isAssetReturnMode() ? '' : request.currentContact;
    this.intraRequest.destinationOwner = request.destinationOwner;
    this.intraRequest.destinationBuilding = request.destinationBuilding;
    this.intraRequest.destinationFloor = request.destinationFloor;
    this.intraRequest.destinationOffice = request.destinationOffice;
    this.intraRequest.destinationRegion = request.destinationRegion;
    this.intraRequest.destinationContact = request.destinationContact;
    this.intraRequest.movementReason = request.movementReason;
    this.currentLocation = this.isAssetReturnMode()
      ? [
          { label: 'Owner:', value: '' },
          { label: 'Building:', value: '' },
          { label: 'Floor:', value: '' },
          { label: 'Office: (white sticker on the door)', value: '' },
          { label: 'Region:', value: '' },
          { label: 'Contact:', value: '' },
        ]
      : [
          { label: 'Owner:', value: request.currentOwner || 'IS STOREROOM' },
          { label: 'Building:', value: request.currentBuilding || 'CGO' },
          { label: 'Floor:', value: request.currentFloor || '4TH' },
          { label: 'Office: (white sticker on the door)', value: request.currentOffice || '441' },
          { label: 'Region:', value: request.currentRegion || 'HEAD OFFICE' },
          { label: 'Contact:', value: request.currentContact || '012 406 1724' },
        ];
    this.loadAvailabilityDetails(request.referenceNumber);
  }

  private loadAvailabilityDetails(referenceNumber: string): void {
    this.availabilityDetails.set(null);
    this.technicianService.findByReference(referenceNumber).subscribe({
      next: (details) => {
        this.availabilityDetails.set(details);
      },
      error: () => {
        this.availabilityDetails.set(null);
      },
    });
  }

  private readSignatureFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.saveMessage.set('Upload a signature image or PDF file.');
      return;
    }

    this.signatureFileName = file.name;
    this.signatureContentType = file.type;
    this.signatureBase64 = '';
    this.saveMessage.set('');
    this.clearSignaturePreview();
    this.signaturePreviewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.signatureBase64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      this.signatureBase64 = '';
      this.saveMessage.set('Could not read the signature file.');
    };
    reader.readAsDataURL(file);
  }

  private readAdditionalSignatureFile(signature: SignatureUploadState, file: File | undefined): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.saveMessage.set('Upload a signature image or PDF file.');
      return;
    }

    signature.fileName = file.name;
    signature.contentType = file.type;
    signature.base64 = '';
    this.saveMessage.set('');
    this.clearAdditionalSignaturePreview(signature);
    signature.previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      signature.base64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      signature.base64 = '';
      this.saveMessage.set('Could not read the signature file.');
    };
    reader.readAsDataURL(file);
  }

  private clearSignaturePreview(): void {
    if (this.signaturePreviewUrl) {
      URL.revokeObjectURL(this.signaturePreviewUrl);
      this.signaturePreviewUrl = '';
    }
  }

  private clearAdditionalSignaturePreview(signature: SignatureUploadState): void {
    if (signature.previewUrl) {
      URL.revokeObjectURL(signature.previewUrl);
      signature.previewUrl = '';
    }
  }

  private createSignatureState(): SignatureUploadState {
    return {
      fileName: '',
      previewUrl: '',
      contentType: '',
      base64: '',
      isDragging: false,
    };
  }

  private formatApprovalDate(date: Date | null): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
