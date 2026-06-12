import { Component, EventEmitter, OnDestroy, Output, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { catchError, of } from 'rxjs';
import { EquipmentStockItem } from '../models/asset-capture.model';
import { AssetCaptureService } from '../services/asset-capture.service';
import { AvailabilityRequestService } from '../services/availability-request.service';

@Component({
  selector: 'app-request-status',
  imports: [MatButtonModule],
  templateUrl: './request-status.html',
  styleUrl: './request-status.scss',
})
export class RequestStatus implements OnDestroy {
  @Output() proceed = new EventEmitter<void>();
  private readonly refreshIntervalId: ReturnType<typeof setInterval>;
  private readonly matchingAsset = computed(() => {
    const request = this.availabilityService.request();

    if (!request) {
      return null;
    }

    return this.assetCaptureService.stock().find((item) => this.matchesRequest(item, request.equipment, request.rank)) ?? null;
  });

  constructor(
    private readonly assetCaptureService: AssetCaptureService,
    protected readonly availabilityService: AvailabilityRequestService,
  ) {
    this.assetCaptureService.loadAll().pipe(catchError(() => of([]))).subscribe();
    this.refreshIntervalId = setInterval(() => this.refreshStatus(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshIntervalId);
  }

  protected statusLabel(): string {
    const request = this.availabilityService.request();

    if (!request) {
      return 'No availability request sent';
    }

    return this.matchingAsset() ? 'Equipment is available' : 'Equipment is not available';
  }

  protected canProceed(): boolean {
    return this.matchingAsset() !== null;
  }

  private refreshStatus(): void {
    if (this.availabilityService.request()) {
      this.availabilityService.loadLatestMine().subscribe();
      this.assetCaptureService.loadAll().pipe(catchError(() => of([]))).subscribe();
    }
  }

  private matchesRequest(item: EquipmentStockItem, equipment: string, rank: string | null): boolean {
    return item.stockStatus === 'AVAILABLE'
      && this.normalize(item.storeroomLocation) === this.normalize(rank)
      && this.equipmentMatches(item, equipment);
  }

  private equipmentMatches(item: EquipmentStockItem, equipment: string): boolean {
    const requested = this.normalize(equipment);
    const assetType = this.normalize(item.assetType);
    const description = this.normalize(`${item.make ?? ''} ${item.model ?? ''}`);

    return assetType === requested
      || assetType.includes(requested)
      || requested.includes(assetType)
      || (!!description && description.includes(requested));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }
}
