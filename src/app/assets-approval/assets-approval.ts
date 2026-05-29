import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, AuthSession } from '../auth/auth';
import { AssetsApprovalService } from './assets-approval.service';
import { IntraRequestPayload, IntraRequestRecord, IntraRequestService } from '../request-intake/intra-request.service';
import { TechnicianRequestDetails, TechnicianService } from '../technician/technician.service';

@Component({
  selector: 'app-assets-approval',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './assets-approval.html',
  styleUrl: './assets-approval.scss',
})
export class AssetsApproval implements OnInit, OnDestroy {
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
  protected readonly movableAsset = {
    name: '',
    date: '',
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

  protected saveApproval(): void {
    const requestId = this.selectedRequestId();
    const movableAssetName = this.movableAsset.name.trim();

    this.saveMessage.set('');

    if (!requestId) {
      this.saveMessage.set('Select an INTRA request before saving approval.');
      return;
    }

    if (!movableAssetName || !this.movableAsset.date) {
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
      approvalDate: this.movableAsset.date,
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
    this.intraRequest.currentOwner = request.currentOwner;
    this.intraRequest.currentBuilding = request.currentBuilding;
    this.intraRequest.currentFloor = request.currentFloor;
    this.intraRequest.currentOffice = request.currentOffice;
    this.intraRequest.currentRegion = request.currentRegion;
    this.intraRequest.currentContact = request.currentContact;
    this.intraRequest.destinationOwner = request.destinationOwner;
    this.intraRequest.destinationBuilding = request.destinationBuilding;
    this.intraRequest.destinationFloor = request.destinationFloor;
    this.intraRequest.destinationOffice = request.destinationOffice;
    this.intraRequest.destinationRegion = request.destinationRegion;
    this.intraRequest.destinationContact = request.destinationContact;
    this.intraRequest.movementReason = request.movementReason;
    this.currentLocation = [
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

  private clearSignaturePreview(): void {
    if (this.signaturePreviewUrl) {
      URL.revokeObjectURL(this.signaturePreviewUrl);
      this.signaturePreviewUrl = '';
    }
  }
}
