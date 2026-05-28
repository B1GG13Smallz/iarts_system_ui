import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService, AuthSession } from '../auth/auth';
import { AvailabilityRequest } from '../availability/availability-request';
import { RequestStatus } from '../availability/request-status';
import { IntraRequestPayload, IntraRequestService } from './intra-request.service';

@Component({
  selector: 'app-request-intake',
  imports: [
    AvailabilityRequest,
    FormsModule,
    MatButtonModule,
    MatStepperModule,
    RequestStatus,
    RouterLink,
  ],
  templateUrl: './request-intake.html',
  styleUrl: './request-intake.scss',
})
export class RequestIntake {
  protected referenceNumber = '';
  protected showIntraForm = false;
  protected saveMessage = '';
  protected isSaving = false;
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

  protected isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected proceedToIntraForm(): void {
    this.showIntraForm = true;
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
    this.updateReferenceNumber(cleanReference);
    this.intraRequest.referenceNumber = cleanReference;

    if (!this.intraRequest.referenceNumber || !this.intraRequest.chiefDirectorate.trim() || !this.intraRequest.subDirectorate.trim() || !this.intraRequest.chiefUser.trim()) {
      this.saveMessage = 'Complete the reference number, Chief Directorate, Sub-Directorate and Chief User fields.';
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
}
