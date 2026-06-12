import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EquipmentStockItem, EquipmentStockPayload } from '../models/asset-capture.model';
import { AuthSession } from '../models/auth.model';
import { RANK_OPTIONS } from '../models/availability-request.model';
import { AssetCaptureService } from '../services/asset-capture.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-asset-capture',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './asset-capture.html',
  styleUrl: './asset-capture.scss',
})
export class AssetCapture implements OnInit {
  protected readonly isSaving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly query = signal('');
  protected readonly rankOptions = RANK_OPTIONS;
  protected readonly filteredStock = computed(() => {
    const search = this.query().trim().toLowerCase();

    if (!search) {
      return this.assetCaptureService.stock();
    }

    return this.assetCaptureService.stock().filter((item) =>
      [
        item.assetTag,
        item.serialNumber,
        item.assetType,
        item.make,
        item.model,
        item.location,
        item.stockStatus,
        item.storeroomLocation,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  });

  protected readonly form: EquipmentStockPayload = this.emptyForm();

  constructor(
    protected readonly assetCaptureService: AssetCaptureService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadStock();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected isAdminOrStoreroom(): boolean {
    return this.authService.isAdmin();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected save(): void {
    const payload = this.normalizedPayload();

    this.message.set('');

    if (!payload.assetTag || !payload.assetType) {
      this.message.set('Barcode and asset type are required.');
      return;
    }

    this.isSaving.set(true);
    const editingId = this.editingId();
    const request = editingId
      ? this.assetCaptureService.update(editingId, payload)
      : this.assetCaptureService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.message.set(editingId ? 'Equipment stock updated.' : 'Equipment stock captured.');
        this.resetForm();
      },
      error: () => {
        this.isSaving.set(false);
        this.message.set('Could not save equipment stock. Check duplicate asset tags or serial numbers.');
      },
    });
  }

  protected edit(item: EquipmentStockItem): void {
    this.editingId.set(item.id);
    this.message.set('');
    Object.assign(this.form, {
      assetTag: item.assetTag,
      serialNumber: item.serialNumber || '',
      assetType: item.assetType,
      make: item.make || '',
      model: item.model || '',
      location: item.location || '',
      netTrackReference: item.netTrackReference || '',
      laptopPolicyRequired: item.laptopPolicyRequired,
      stockStatus: item.stockStatus || 'AVAILABLE',
      storeroomLocation: item.storeroomLocation || '',
      remarks: item.remarks || '',
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
    this.message.set('');
  }

  protected delete(item: EquipmentStockItem): void {
    const confirmed = window.confirm(`Delete ${item.assetTag} from equipment stock?`);

    if (!confirmed) {
      return;
    }

    this.assetCaptureService.delete(item.id).subscribe({
      next: () => {
        if (this.editingId() === item.id) {
          this.resetForm();
        }
        this.message.set('Equipment stock deleted.');
      },
      error: () => this.message.set('Could not delete equipment stock because it may already be linked to another record.'),
    });
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
  }

  private loadStock(): void {
    this.assetCaptureService.loadAll().subscribe({
      error: () => this.message.set('Could not load equipment stock.'),
    });
  }

  private resetForm(): void {
    this.editingId.set(null);
    Object.assign(this.form, this.emptyForm());
  }

  private normalizedPayload(): EquipmentStockPayload {
    return {
      assetTag: this.form.assetTag.trim().toUpperCase(),
      serialNumber: this.optionalValue(this.form.serialNumber),
      assetType: this.form.assetType.trim(),
      make: this.optionalValue(this.form.make),
      model: this.optionalValue(this.form.model),
      location: this.optionalValue(this.form.location),
      netTrackReference: this.optionalValue(this.form.netTrackReference),
      laptopPolicyRequired: this.form.laptopPolicyRequired,
      stockStatus: this.form.stockStatus || 'AVAILABLE',
      storeroomLocation: this.optionalValue(this.form.storeroomLocation),
      remarks: this.optionalValue(this.form.remarks),
    };
  }

  private optionalValue(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed || null;
  }

  private emptyForm(): EquipmentStockPayload {
    return {
      assetTag: '',
      serialNumber: '',
      assetType: 'Laptop',
      make: '',
      model: '',
      location: '',
      netTrackReference: '',
      laptopPolicyRequired: true,
      stockStatus: 'AVAILABLE',
      storeroomLocation: '',
      remarks: '',
    };
  }
}
