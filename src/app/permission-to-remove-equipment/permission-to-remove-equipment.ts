import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, AuthSession } from '../auth/auth';
import {
  PermissionSignaturePayload,
  PermissionToRemoveEquipmentPayload,
  PermissionToRemoveEquipmentService,
} from './permission-to-remove-equipment.service';

interface SignatureState {
  fileName: string;
  contentType: string;
  base64: string;
  previewUrl: string;
  isDragging: boolean;
}

@Component({
  selector: 'app-permission-to-remove-equipment',
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
  templateUrl: './permission-to-remove-equipment.html',
  styleUrl: './permission-to-remove-equipment.scss',
})
export class PermissionToRemoveEquipment implements OnDestroy {
  protected readonly form = {
    officialName: '',
    unitDirectorateBranch: '',
    telephoneNumber: '',
    identityOrPersalNumber: '',
    removalReason: '',
    equipmentDescription: '',
    barCode: '',
    serialNumber: '',
    currentLocation: '',
    period: '',
    newLocation: '',
    ictDate: null as Date | null,
    mamDate: null as Date | null,
    securityDate: null as Date | null,
  };
  protected readonly officialSignature = this.createSignatureState();
  protected readonly ictSignature = this.createSignatureState();
  protected readonly mamSignature = this.createSignatureState();
  protected readonly securitySignature = this.createSignatureState();
  protected saveMessage = '';
  protected pdfMessage = '';
  protected isSaving = false;
  protected isGeneratingPdf = false;
  protected pdfObjectUrl = '';
  protected pdfPreviewUrl: SafeResourceUrl | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly permissionService: PermissionToRemoveEquipmentService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnDestroy(): void {
    this.clearSignaturePreview(this.officialSignature);
    this.clearSignaturePreview(this.ictSignature);
    this.clearSignaturePreview(this.mamSignature);
    this.clearSignaturePreview(this.securitySignature);
    this.clearPdfPreview();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected canGeneratePdf(): boolean {
    return this.authService.hasRole('ICT_STOREROOM');
  }

  protected saveForm(): void {
    this.saveMessage = '';
    const payload = this.createPayload();

    if (!payload.officialName || !payload.equipmentDescription || !payload.barCode || !payload.serialNumber) {
      this.saveMessage = 'Complete official name, equipment description, bar code and serial number before saving.';
      return;
    }

    this.isSaving = true;
    this.permissionService.save(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Permission to remove equipment saved successfully.';
      },
      error: () => {
        this.isSaving = false;
        this.saveMessage = 'Could not save permission to remove equipment.';
      },
    });
  }

  protected generatePdfPreview(): void {
    this.pdfMessage = '';
    this.clearPdfPreview();
    this.isGeneratingPdf = true;
    this.permissionService.generatePdf(this.createPayload()).subscribe({
      next: (pdfBlob) => {
        this.isGeneratingPdf = false;
        this.pdfObjectUrl = URL.createObjectURL(pdfBlob);
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
      },
      error: () => {
        this.isGeneratingPdf = false;
        this.pdfMessage = 'Could not generate PDF preview.';
      },
    });
  }

  protected uploadSignature(signature: SignatureState, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.readSignatureFile(signature, file);
    input.value = '';
  }

  protected handleSignatureDragOver(signature: SignatureState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = true;
  }

  protected handleSignatureDragLeave(signature: SignatureState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = false;
  }

  protected handleSignatureDrop(signature: SignatureState, event: DragEvent): void {
    event.preventDefault();
    signature.isDragging = false;
    this.readSignatureFile(signature, event.dataTransfer?.files?.[0]);
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private createPayload(): PermissionToRemoveEquipmentPayload {
    return {
      officialName: this.form.officialName.trim(),
      unitDirectorateBranch: this.form.unitDirectorateBranch.trim(),
      telephoneNumber: this.form.telephoneNumber.trim(),
      identityOrPersalNumber: this.form.identityOrPersalNumber.trim(),
      removalReason: this.form.removalReason.trim(),
      officialSignature: this.signaturePayload(this.officialSignature),
      equipmentDescription: this.form.equipmentDescription.trim(),
      barCode: this.form.barCode.trim(),
      serialNumber: this.form.serialNumber.trim(),
      currentLocation: this.form.currentLocation.trim(),
      period: this.form.period.trim(),
      newLocation: this.form.newLocation.trim(),
      ictSignature: this.signaturePayload(this.ictSignature),
      ictDate: this.formatDate(this.form.ictDate),
      mamSignature: this.signaturePayload(this.mamSignature),
      mamDate: this.formatDate(this.form.mamDate),
      securitySignature: this.signaturePayload(this.securitySignature),
      securityDate: this.formatDate(this.form.securityDate),
    };
  }

  private signaturePayload(signature: SignatureState): PermissionSignaturePayload | undefined {
    if (!signature.fileName || !signature.contentType || !signature.base64) {
      return undefined;
    }

    return {
      fileName: signature.fileName,
      contentType: signature.contentType,
      base64: signature.base64,
    };
  }

  private readSignatureFile(signature: SignatureState, file: File | undefined): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.saveMessage = 'Upload a signature image or PDF file.';
      return;
    }

    signature.fileName = file.name;
    signature.contentType = file.type;
    signature.base64 = '';
    this.saveMessage = '';
    this.clearSignaturePreview(signature);
    signature.previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      signature.base64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      signature.base64 = '';
      this.saveMessage = 'Could not read the signature file.';
    };
    reader.readAsDataURL(file);
  }

  private clearSignaturePreview(signature: SignatureState): void {
    if (signature.previewUrl) {
      URL.revokeObjectURL(signature.previewUrl);
      signature.previewUrl = '';
    }
  }

  private clearPdfPreview(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = '';
      this.pdfPreviewUrl = null;
    }
  }

  private createSignatureState(): SignatureState {
    return {
      fileName: '',
      contentType: '',
      base64: '',
      previewUrl: '',
      isDragging: false,
    };
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
