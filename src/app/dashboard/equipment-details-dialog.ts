import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EquipmentDetailsDialogData {
  referenceNumber: string;
  equipment: string;
}

export interface EquipmentDetailsDialogResult {
  description: string;
  serialNumber: string;
  barCodeNumber: string;
}

@Component({
  selector: 'app-equipment-details-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './equipment-details-dialog.html',
  styleUrl: './equipment-details-dialog.scss',
})
export class EquipmentDetailsDialog {
  protected readonly form: EquipmentDetailsDialogResult = {
    description: '',
    serialNumber: '',
    barCodeNumber: '',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: EquipmentDetailsDialogData,
    private readonly dialogRef: MatDialogRef<EquipmentDetailsDialog, EquipmentDetailsDialogResult>,
  ) {}

  protected submit(): void {
    this.dialogRef.close({
      description: this.form.description.trim(),
      serialNumber: this.form.serialNumber.trim(),
      barCodeNumber: this.form.barCodeNumber.trim(),
    });
  }
}
