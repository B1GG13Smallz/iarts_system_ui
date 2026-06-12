import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
}

@Component({
  selector: 'app-permission-removal-storeroom',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './permission-removal-storeroom.html',
  styleUrl: './permission-removal-storeroom.scss',
})
export class PermissionRemovalStoreroom {
  protected searchTerm = '';
  protected records: PermissionRemovalRecord[] = [];
  protected selectedRecord: PermissionRemovalRecord | null = null;
  protected message = '';
  protected isSearching = false;
  protected isSending = false;
  protected ictDate = this.today();
  protected readonly ictSignature: SignatureState = {
    fileName: '',
    contentType: '',
    base64: '',
    previewUrl: '',
  };

  constructor(
    private readonly authService: AuthService,
    private readonly permissionService: PermissionToRemoveEquipmentService,
    private readonly router: Router,
  ) {}

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected search(): void {
    this.message = '';
    this.isSearching = true;
    this.permissionService.search(this.searchTerm, 'SENT_TO_STOREROOM').subscribe({
      next: (records) => {
        this.isSearching = false;
        this.records = records;
        this.selectedRecord = records[0] ?? null;
        this.message = records.length ? '' : 'No storeroom approval forms found.';
      },
      error: () => {
        this.isSearching = false;
        this.message = 'Could not search permission removal forms.';
      },
    });
  }

  protected selectRecord(record: PermissionRemovalRecord): void {
    this.selectedRecord = record;
    this.message = '';
  }

  protected uploadIctSignature(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.message = 'Upload a signature image or PDF file.';
      return;
    }

    if (this.ictSignature.previewUrl) {
      URL.revokeObjectURL(this.ictSignature.previewUrl);
    }
    this.ictSignature.fileName = file.name;
    this.ictSignature.contentType = file.type;
    this.ictSignature.previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    this.ictSignature.base64 = '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.ictSignature.base64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.onerror = () => {
      this.ictSignature.base64 = '';
      this.message = 'Could not read the signature file.';
    };
    reader.readAsDataURL(file);
  }

  protected sendToAssets(): void {
    if (!this.selectedRecord) {
      this.message = 'Select a permission removal form first.';
      return;
    }

    if (!this.ictSignature.fileName || !this.ictSignature.base64 || !this.ictDate) {
      this.message = 'Upload the ICT signature and capture the ICT date before sending to Assets.';
      return;
    }

    this.isSending = true;
    this.permissionService.sendToAssets(this.selectedRecord.id, this.payloadFor(this.selectedRecord)).subscribe({
      next: () => {
        this.isSending = false;
        this.message = 'Permission removal form sent to Assets for approval.';
        this.records = this.records.filter((record) => record.id !== this.selectedRecord?.id);
        this.selectedRecord = this.records[0] ?? null;
      },
      error: () => {
        this.isSending = false;
        this.message = 'Could not send permission removal form to Assets.';
      },
    });
  }

  protected signaturePreview(signature: PermissionSignaturePayload | undefined): string {
    if (!signature || !signature.contentType.startsWith('image/')) {
      return '';
    }

    return `data:${signature.contentType};base64,${signature.base64}`;
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private payloadFor(record: PermissionRemovalRecord): PermissionToRemoveEquipmentPayload {
    return {
      officialName: record.officialName,
      unitDirectorateBranch: record.unitDirectorateBranch,
      telephoneNumber: record.telephoneNumber,
      identityOrPersalNumber: record.identityOrPersalNumber,
      removalReason: record.removalReason,
      officialSignature: record.officialSignature,
      equipmentDescription: record.equipmentDescription,
      barCode: record.barCode,
      serialNumber: record.serialNumber,
      currentLocation: record.currentLocation,
      period: record.period,
      newLocation: record.newLocation,
      ictSignature: this.signaturePayload(),
      ictDate: this.ictDate,
      mamSignature: record.mamSignature,
      mamDate: record.mamDate,
      securitySignature: record.securitySignature,
      securityDate: record.securityDate,
    };
  }

  private signaturePayload(): PermissionSignaturePayload {
    return {
      fileName: this.ictSignature.fileName,
      contentType: this.ictSignature.contentType,
      base64: this.ictSignature.base64,
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
