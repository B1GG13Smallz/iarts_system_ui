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
import { AuthSession } from '../models/auth.model';
import {
  PermissionRemovalRecord,
  PermissionSignaturePayload,
  PermissionToRemoveEquipmentPayload,
} from '../models/permission-removal.model';
import { AuthService } from '../services/auth.service';
import { PermissionToRemoveEquipmentService } from '../services/permission-to-remove-equipment.service';

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
  protected isSendingToStoreroom = false;
  protected isSavingAssetsApproval = false;
  protected isGeneratingPdf = false;
  protected pdfObjectUrl = '';
  protected pdfPreviewUrl: SafeResourceUrl | null = null;
  protected isPreviewOpen = false;
  protected statusSearchTerm = '';
  protected statusRecords: PermissionRemovalRecord[] = [];
  protected isSearchingStatus = false;
  protected permissionSearchTerm = '';
  protected permissionRecords: PermissionRemovalRecord[] = [];
  protected selectedPermissionRecord: PermissionRemovalRecord | null = null;
  protected isSearchingPermission = false;
  private pendingPayload: PermissionToRemoveEquipmentPayload | null = null;

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

  protected isSystemAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected isAssetsUser(): boolean {
    return this.authService.hasRole('ASSET_MANAGEMENT');
  }

  protected canSendToStoreroom(): boolean {
    return !this.canGeneratePdf() && !this.isAssetsUser();
  }

  protected saveForm(): void {
    this.saveMessage = '';
    const payload = this.createPayload();

    if (!payload.officialName || !payload.equipmentDescription || !payload.barCode || !payload.serialNumber) {
      this.saveMessage = 'Complete official name, equipment description, bar code and serial number before saving.';
      return;
    }

    this.pendingPayload = payload;
    this.isPreviewOpen = true;
  }

  protected sendToStoreroom(): void {
    this.saveMessage = '';
    const payload = this.createPayload();

    if (
      !payload.officialName ||
      !payload.identityOrPersalNumber ||
      !payload.equipmentDescription ||
      !payload.barCode ||
      !payload.serialNumber ||
      !payload.currentLocation ||
      !payload.period ||
      !payload.newLocation
    ) {
      this.saveMessage = 'Complete official name, ID or Persal number, equipment description, bar code, serial number, current location, period and new location before sending to storeroom.';
      return;
    }

    if (!payload.officialSignature) {
      this.saveMessage = 'Upload the requestee signature before sending to storeroom.';
      return;
    }

    this.isSendingToStoreroom = true;
    this.permissionService.sendToStoreroom(payload).subscribe({
      next: () => {
        this.isSendingToStoreroom = false;
        this.saveMessage = 'Permission to remove equipment sent to storeroom for approval.';
      },
      error: () => {
        this.isSendingToStoreroom = false;
        this.saveMessage = 'Could not send permission to remove equipment to storeroom.';
      },
    });
  }

  protected searchSubmittedForms(): void {
    this.saveMessage = '';
    this.isSearchingStatus = true;
    this.permissionService.search(this.statusSearchTerm).subscribe({
      next: (records) => {
        this.isSearchingStatus = false;
        this.statusRecords = records;
        this.saveMessage = records.length ? '' : 'No permission removal forms found for that ID or Persal number.';
      },
      error: () => {
        this.isSearchingStatus = false;
        this.saveMessage = 'Could not search permission removal forms.';
      },
    });
  }

  protected searchPermissionFormsForAssets(): void {
    this.saveMessage = '';
    this.isSearchingPermission = true;
    this.permissionService.search(this.permissionSearchTerm, 'SENT_TO_ASSETS').subscribe({
      next: (records) => {
        this.isSearchingPermission = false;
        this.permissionRecords = records;
        this.selectedPermissionRecord = records[0] ?? null;
        if (this.selectedPermissionRecord) {
          this.populateFromRecord(this.selectedPermissionRecord);
        }
        this.saveMessage = records.length ? '' : 'No permission removal forms found for Assets approval.';
      },
      error: () => {
        this.isSearchingPermission = false;
        this.saveMessage = 'Could not search permission removal forms.';
      },
    });
  }

  protected selectPermissionRecord(record: PermissionRemovalRecord): void {
    this.selectedPermissionRecord = record;
    this.populateFromRecord(record);
    this.saveMessage = '';
  }

  protected saveAssetsApproval(): void {
    this.saveMessage = '';
    const selectedRecord = this.selectedPermissionRecord;

    if (!selectedRecord) {
      this.saveMessage = 'Search and select a permission removal form first.';
      return;
    }

    const payload = this.createPayload();

    if (!payload.mamSignature || !payload.mamDate) {
      this.saveMessage = 'Upload the MAM signature and capture the MAM date before saving.';
      return;
    }

    this.isSavingAssetsApproval = true;
    this.permissionService.saveAssetsApproval(selectedRecord.id, payload).subscribe({
      next: () => {
        this.isSavingAssetsApproval = false;
        this.saveMessage = 'Permission to remove equipment saved by Assets.';
        this.selectedPermissionRecord = {
          ...selectedRecord,
          ...payload,
          workflowStatus: 'ASSETS_APPROVED',
        };
      },
      error: () => {
        this.isSavingAssetsApproval = false;
        this.saveMessage = 'Could not save Assets approval on the permission form.';
      },
    });
  }

  protected closeSavePreview(): void {
    if (this.isSaving) {
      return;
    }

    this.isPreviewOpen = false;
    this.pendingPayload = null;
  }

  protected printSavePreview(): void {
    window.print();
  }

  protected persistPreviewedForm(): void {
    const payload = this.pendingPayload ?? this.createPayload();

    this.isSaving = true;
    this.permissionService.save(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isPreviewOpen = false;
        this.pendingPayload = null;
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

  protected displayDate(date: Date | null): string {
    return this.formatDate(date) || 'Not captured';
  }

  protected signatureLabel(signature: SignatureState): string {
    return signature.fileName || 'Not captured';
  }

  protected recordSignatureLabel(signature: PermissionSignaturePayload | undefined): string {
    return signature?.fileName || 'Not captured';
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

  private populateFromRecord(record: PermissionRemovalRecord): void {
    this.form.officialName = record.officialName;
    this.form.unitDirectorateBranch = record.unitDirectorateBranch;
    this.form.telephoneNumber = record.telephoneNumber;
    this.form.identityOrPersalNumber = record.identityOrPersalNumber;
    this.form.removalReason = record.removalReason;
    this.form.equipmentDescription = record.equipmentDescription;
    this.form.barCode = record.barCode;
    this.form.serialNumber = record.serialNumber;
    this.form.currentLocation = record.currentLocation;
    this.form.period = record.period;
    this.form.newLocation = record.newLocation;
    this.form.ictDate = this.parseDate(record.ictDate);
    this.form.mamDate = this.parseDate(record.mamDate);
    this.form.securityDate = this.parseDate(record.securityDate);
    this.applyStoredSignature(this.officialSignature, record.officialSignature);
    this.applyStoredSignature(this.ictSignature, record.ictSignature);
    this.applyStoredSignature(this.mamSignature, record.mamSignature);
    this.applyStoredSignature(this.securitySignature, record.securitySignature);
  }

  private applyStoredSignature(signature: SignatureState, storedSignature: PermissionSignaturePayload | undefined): void {
    this.clearSignaturePreview(signature);
    signature.fileName = storedSignature?.fileName ?? '';
    signature.contentType = storedSignature?.contentType ?? '';
    signature.base64 = storedSignature?.base64 ?? '';
    signature.previewUrl = storedSignature?.contentType.startsWith('image/')
      ? `data:${storedSignature.contentType};base64,${storedSignature.base64}`
      : '';
    signature.isDragging = false;
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

  private parseDate(date: string): Date | null {
    if (!date) {
      return null;
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
}
