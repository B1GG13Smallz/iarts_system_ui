import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AvailabilityRequestService } from './availability-request.service';

@Component({
  selector: 'app-request-status',
  imports: [MatButtonModule],
  templateUrl: './request-status.html',
  styleUrl: './request-status.scss',
})
export class RequestStatus implements OnDestroy {
  @Output() proceed = new EventEmitter<void>();
  private readonly refreshIntervalId: ReturnType<typeof setInterval>;

  constructor(protected readonly availabilityService: AvailabilityRequestService) {
    this.refreshStatus();
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

    if (request.status === 'PENDING') {
      return 'Waiting for admin confirmation';
    }

    return request.status === 'AVAILABLE' ? 'Equipment is available' : 'Equipment is not available';
  }

  protected canProceed(): boolean {
    return this.availabilityService.request()?.status === 'AVAILABLE';
  }

  private refreshStatus(): void {
    this.availabilityService.loadLatestMine().subscribe();
  }
}
