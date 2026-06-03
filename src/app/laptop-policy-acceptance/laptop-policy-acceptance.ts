import { Component, OnDestroy } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, AuthSession } from '../auth/auth';

@Component({
  selector: 'app-laptop-policy-acceptance',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    RouterLink,
  ],
  templateUrl: './laptop-policy-acceptance.html',
  styleUrl: './laptop-policy-acceptance.scss',
  animations: [
    trigger('policyAlertAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.98)' }),
        animate('220ms cubic-bezier(0.2, 0, 0, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(16px) scale(0.98)' })),
      ]),
    ]),
  ],
})
export class LaptopPolicyAcceptance implements OnDestroy {
  protected readonly policyText = [
    `I understand that all laptops, equipment, and/or accessories provided to me by the Information Services(Chief Directorate ar the property of the National Department onf Public Works. I agree to all the terms of the NDPW Notebook Policy and Staff Laptop Use Manual. I agree to return the equipment to the IS Chief Directorate in the same condition which it was provided to me, fair wear and teat expected.`,
    `I understand that I am personolly liable for any damage to or loss of any laptop and/or related equipment and accesories depending on the circumstances. In case of damage or loss, I agree to replace or pay the full cost of replacement of the damaged or lost equipment with equipment of equal value and functionality subjected to the approval of the IS Chief Directorate.`,
    `I agree no to install any additional software or change the configuration of the equipment in any way without prior consultation with Directorate: IT Support. I will not allow any aunauthorizec individuals to use any laptop and/or related equipment and accesories that have be provided to me by IS.`,
    `I understand that violation of the terms and conditions set out in the NDPW Notebook policy and User Manual will result in the restriction and/or termination of my use of the Department's laptop; and accesories and may result in further disciplinary action and/or other legal action.`,
  ];
  protected acceptance = {
    fullNames: '',
    persalNumber: '',
    acceptanceDate: null as Date | null,
    unitName: '',
    laptopMake: '',
    laptopModel: '',
    serialNumber: '',
    barcode: '',
    replacementValue: '',
  };

  protected saveMessage = '';
  protected signatureFileName = '';
  protected signaturePreviewUrl = '';
  protected signatureContentType = '';
  protected signatureBase64 = '';
  protected isDraggingSignature = false;
  protected hasAcceptedPolicy = false;
  protected showPolicyAlert = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

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

  protected saveAcceptance(): void {
    this.saveMessage = '';

    if (!this.hasAcceptedPolicy) {
      this.showPolicyAlert = true;
      this.saveMessage = 'Agree to the laptop policy before completing the form.';
      return;
    }

    if (!this.acceptance.fullNames.trim() || !this.acceptance.persalNumber.trim() || !this.acceptance.acceptanceDate) {
      this.saveMessage = 'Complete the full names, Persal number and date.';
      return;
    }

    if (!this.signatureBase64 || !this.signatureFileName || !this.signatureContentType) {
      this.saveMessage = 'Upload a signature image or PDF before saving.';
      return;
    }

    this.saveMessage = 'Laptop policy acceptance captured.';
  }

  protected uploadSignature(event: Event): void {
    if (!this.hasAcceptedPolicy) {
      this.showPolicyAlert = true;
      this.saveMessage = 'Agree to the laptop policy before uploading a signature.';
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.readSignatureFile(file);
    input.value = '';
  }

  protected handleSignatureDragOver(event: DragEvent): void {
    if (!this.hasAcceptedPolicy) {
      return;
    }

    event.preventDefault();
    this.isDraggingSignature = true;
  }

  protected handleSignatureDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingSignature = false;
  }

  protected handleSignatureDrop(event: DragEvent): void {
    if (!this.hasAcceptedPolicy) {
      return;
    }

    event.preventDefault();
    this.isDraggingSignature = false;
    this.readSignatureFile(event.dataTransfer?.files?.[0]);
  }

  protected agreeToPolicy(): void {
    this.hasAcceptedPolicy = true;
    this.showPolicyAlert = false;
    this.saveMessage = '';
  }

  protected disagreeToPolicy(): void {
    this.hasAcceptedPolicy = false;
    this.showPolicyAlert = false;
    this.saveMessage = 'You must agree to the laptop policy before completing this form.';
  }

  private readSignatureFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.saveMessage = 'Upload a signature image or PDF file.';
      return;
    }

    this.signatureFileName = file.name;
    this.signatureContentType = file.type;
    this.signatureBase64 = '';
    this.saveMessage = '';
    this.clearSignaturePreview();
    this.signaturePreviewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.signatureBase64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      this.signatureBase64 = '';
      this.saveMessage = 'Could not read the signature file.';
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
