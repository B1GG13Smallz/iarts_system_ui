import { Component, OnDestroy } from '@angular/core';
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
})
export class LaptopPolicyAcceptance implements OnDestroy {
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
