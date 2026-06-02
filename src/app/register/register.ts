import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthService, AuthSession } from '../auth/auth';
import { RegisterPayload, RegisterService, RegisterSignaturePayload, RegisterType } from './register.service';

interface SignatureState {
  fileName: string;
  contentType: string;
  base64: string;
  previewUrl: string;
  isDragging: boolean;
}

interface RegisterForm {
  registerType: RegisterType;
  dateOut: Date | null;
  itemDescription: string;
  serialNumber: string;
  barCode: string;
  orderNumber: string;
  userFullName: string;
  extension: string;
  roomNumber: string;
  storesOfficialName: string;
  comment: string;
}

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTableModule,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnDestroy {
  protected readonly dataSource = [{}];
  protected readonly displayedColumns = [
    'dateOut',
    'itemDescription',
    'serialNumber',
    'barCode',
    'orderNumber',
    'userFullName',
    'extension',
    'roomNumber',
    'userSignOut',
    'storesOfficialName',
    'storesOfficialSignOut',
  ];
  protected readonly commentColumns = ['comment'];
  protected readonly form: RegisterForm = {
    registerType: 'Permanent Issuing Equipment Register',
    dateOut: null,
    itemDescription: '',
    serialNumber: '',
    barCode: '',
    orderNumber: '',
    userFullName: '',
    extension: '',
    roomNumber: '',
    storesOfficialName: '',
    comment: '',
  };
  protected readonly userSignature = this.createSignatureState();
  protected readonly storesOfficialSignature = this.createSignatureState();
  protected saveMessage = '';
  protected isSaving = false;

  constructor(
    private readonly authService: AuthService,
    private readonly registerService: RegisterService,
    private readonly router: Router,
  ) {}

  ngOnDestroy(): void {
    this.clearSignaturePreview(this.userSignature);
    this.clearSignaturePreview(this.storesOfficialSignature);
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected registerOptions(): RegisterType[] {
    const options: RegisterType[] = [
      'Permanent Issuing Equipment Register',
      'Loaning of ICT Equipment Register',
    ];

    if (this.authService.isTechnician() || this.authService.isAdmin()) {
      options.push('Loaning Technicians Set-up Register');
    }

    if (!this.authService.isTechnician() || this.authService.isAdmin()) {
      options.push('Unit Storage Register');
    }

    return options;
  }

  protected saveRegister(): void {
    this.saveMessage = '';
    const payload = this.createPayload();

    if (!payload.dateOut || !payload.itemDescription || !payload.serialNumber || !payload.barCode || !payload.userFullName) {
      this.saveMessage = 'Complete Date out, Item Description, Serial Number, Bar code and Name & Surname of user.';
      return;
    }

    if (!payload.userSignOut || !payload.storesOfficialSignOut) {
      this.saveMessage = 'Upload both user and stores official signatures before saving.';
      return;
    }

    this.isSaving = true;
    this.registerService.save(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Register saved successfully.';
        this.resetForm();
      },
      error: () => {
        this.isSaving = false;
        this.saveMessage = 'Could not save register. Please check the database API and try again.';
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

  private createPayload(): RegisterPayload {
    return {
      registerType: this.form.registerType,
      dateOut: this.formatDate(this.form.dateOut),
      itemDescription: this.form.itemDescription.trim(),
      serialNumber: this.form.serialNumber.trim(),
      barCode: this.form.barCode.trim(),
      orderNumber: this.form.orderNumber.trim(),
      userFullName: this.form.userFullName.trim(),
      extension: this.form.extension.trim(),
      roomNumber: this.form.roomNumber.trim(),
      userSignOut: this.signaturePayload(this.userSignature),
      storesOfficialName: this.form.storesOfficialName.trim(),
      storesOfficialSignOut: this.signaturePayload(this.storesOfficialSignature),
      comment: this.form.comment.trim(),
    };
  }

  private signaturePayload(signature: SignatureState): RegisterSignaturePayload | undefined {
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

  private resetForm(): void {
    const selectedType = this.form.registerType;
    this.form.registerType = selectedType;
    this.form.dateOut = null;
    this.form.itemDescription = '';
    this.form.serialNumber = '';
    this.form.barCode = '';
    this.form.orderNumber = '';
    this.form.userFullName = '';
    this.form.extension = '';
    this.form.roomNumber = '';
    this.form.storesOfficialName = '';
    this.form.comment = '';
    this.resetSignature(this.userSignature);
    this.resetSignature(this.storesOfficialSignature);
  }

  private resetSignature(signature: SignatureState): void {
    this.clearSignaturePreview(signature);
    signature.fileName = '';
    signature.contentType = '';
    signature.base64 = '';
    signature.isDragging = false;
  }

  private clearSignaturePreview(signature: SignatureState): void {
    if (signature.previewUrl) {
      URL.revokeObjectURL(signature.previewUrl);
      signature.previewUrl = '';
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
