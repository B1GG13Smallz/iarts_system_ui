import { Component, OnDestroy, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentStockItem } from '../models/asset-capture.model';
import { AuthSession } from '../models/auth.model';
import { AvailabilityStatus } from '../models/availability-request.model';
import { IntraRequestRecord } from '../models/intra-request.model';
import { AssetCaptureService } from '../services/asset-capture.service';
import { AssetsApproval } from '../assets-approval/assets-approval';
import { AuthService } from '../services/auth.service';
import { AvailabilityRequestService } from '../services/availability-request.service';
import { IntraRequestService } from '../services/intra-request.service';

interface ProcessingQueueItem {
  id: number;
  referenceNumber: string | null;
  requester: string;
  equipment: string;
  status: AvailabilityStatus;
  decisionDate: string;
}

interface DashboardStat {
  label: string;
  value: string;
  trend: string;
}

interface DashboardStockItem {
  item: string;
  available: number;
  reserved: number;
  threshold: 'Healthy' | 'Watch' | 'Low';
}

@Component({
  selector: 'app-dashboard',
  imports: [
    AssetsApproval,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    RouterLink,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnDestroy {
  private readonly processingQueuePageSize = 10;
  private readonly adminConfirmationExpiryMs = 60 * 60 * 1000;
  private readonly refreshIntervalId: ReturnType<typeof setInterval>;
  protected readonly intraRequests = signal<IntraRequestRecord[]>([]);
  protected readonly activeView = signal<'dashboard' | 'assetsApproval'>('dashboard');
  protected readonly processingQueuePage = signal(0);
  protected readonly pendingAvailabilityRequests = computed(() =>
    this.availabilityService.requests().filter((request) => request.status === 'PENDING' && !this.isExpiredUnreferencedRequest(request)),
  );
  protected readonly processingQueue = computed<ProcessingQueueItem[]>(() =>
    this.availabilityService
      .requests()
      .filter((request) => request.status !== 'PENDING')
      .map((request) => {
        const intraRequest = this.intraRequests().find((item) => item.referenceNumber === request.referenceNumber);

        return {
          id: request.id,
          referenceNumber: request.referenceNumber,
          requester: request.requesterName || intraRequest?.chiefUser || 'Not captured',
          equipment: request.equipment,
          status: request.status,
          decisionDate: request.updatedAt,
        };
      }),
  );
  protected readonly pagedProcessingQueue = computed(() => {
    const start = this.processingQueuePage() * this.processingQueuePageSize;

    return this.processingQueue().slice(start, start + this.processingQueuePageSize);
  });
  protected readonly canViewMoreProcessingQueue = computed(
    () => (this.processingQueuePage() + 1) * this.processingQueuePageSize < this.processingQueue().length,
  );
  protected readonly stats = computed<DashboardStat[]>(() => [
    {
      label: 'Open requests',
      value: String(this.pendingAvailabilityRequests().length),
      trend: this.openRequestsTrend(),
    },
    {
      label: 'Assets in stock',
      value: String(this.assetCaptureService.stock().length),
      trend: this.inventoryTrend(),
    },
    { label: 'Approvals due', value: '37', trend: '12 take-home, 9 removals' },
    {
      label: 'Audit events',
      value: String(this.reportRecordCount()),
      trend: this.reportRecordTrend(),
    },
  ]);
  protected readonly stock = computed<DashboardStockItem[]>(() => {
    const groups = this.groupInventoryByType(this.assetCaptureService.stock());

    return Object.entries(groups)
      .map(([item, counts]) => ({
        item,
        available: counts.available,
        reserved: counts.reserved,
        threshold: this.stockThreshold(counts.available),
      }))
      .sort((left, right) => left.item.localeCompare(right.item));
  });

  constructor(
    private readonly assetCaptureService: AssetCaptureService,
    protected readonly availabilityService: AvailabilityRequestService,
    private readonly authService: AuthService,
    private readonly intraRequestService: IntraRequestService,
    private readonly router: Router,
  ) {
    this.reloadDashboardData();
    this.refreshIntervalId = setInterval(() => this.reloadDashboardData(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshIntervalId);
  }

  protected isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected showDashboard(): void {
    this.activeView.set('dashboard');
  }

  protected showAssetsApproval(): void {
    this.activeView.set('assetsApproval');
  }

  protected viewMoreProcessingQueue(): void {
    if (!this.canViewMoreProcessingQueue()) {
      return;
    }

    this.processingQueuePage.update((page) => page + 1);
  }

  protected previousProcessingQueuePage(): void {
    this.processingQueuePage.update((page) => Math.max(0, page - 1));
  }

  protected processingQueueRange(): string {
    const total = this.processingQueue().length;

    if (!total) {
      return '0 of 0';
    }

    const start = this.processingQueuePage() * this.processingQueuePageSize + 1;
    const end = Math.min(start + this.processingQueuePageSize - 1, total);

    return `${start}-${end} of ${total}`;
  }

  protected readonly requests = [
    {
      id: 'REQ-2048',
      requester: 'L. Mokoena',
      asset: 'Laptop',
      department: 'Public Works: Facilities',
      status: 'Stock verification',
      priority: 'High',
    },
    {
      id: 'REQ-2049',
      requester: 'T. Nkosi',
      asset: 'Printer',
      department: 'Regional Office',
      status: 'Routed to QTS',
      priority: 'Medium',
    },
    {
      id: 'REQ-2050',
      requester: 'A. Jacobs',
      asset: 'Monitor',
      department: 'Asset Management',
      status: 'Ready to issue',
      priority: 'High',
    },
  ];

  protected readonly approvals = [
    { lane: 'Take-home approval', owner: 'Line manager', count: 12 },
    { lane: 'ICT removal section', owner: 'ICT Storeroom', count: 7 },
    { lane: 'MAM removal section', owner: 'Asset Management', count: 9 },
    { lane: 'Security validation', owner: 'Security', count: 9 },
  ];

  protected readonly auditLog = [
    'REQ-2048 created by L. Mokoena',
    'Printer request REQ-2049 flagged for QTS',
    'Asset DPW-LT-1092 reserved by ICT Storeroom',
    'Laptop policy acknowledgement requested',
  ];

  protected formatDate(value: string | undefined): string {
    if (!value) {
      return 'Not captured';
    }

    return value.slice(0, 10);
  }

  private reloadDashboardData(): void {
    this.availabilityService.loadAll().subscribe();
    this.assetCaptureService.loadAll().pipe(catchError(() => of([]))).subscribe();
    this.intraRequestService.findAll().subscribe({
      next: (requests) => this.intraRequests.set(requests),
      error: () => this.intraRequests.set([]),
    });
  }

  private isExpiredUnreferencedRequest(request: { referenceNumber: string | null; createdAt: string }): boolean {
    if (request.referenceNumber?.trim()) {
      return false;
    }

    const createdAt = Date.parse(request.createdAt);

    if (Number.isNaN(createdAt)) {
      return false;
    }

    return Date.now() - createdAt >= this.adminConfirmationExpiryMs;
  }


  private resetProcessingQueuePageIfEmpty(): void {
    const total = this.processingQueue().length;
    const pageStart = this.processingQueuePage() * this.processingQueuePageSize;

    if (pageStart >= total) {
      this.processingQueuePage.set(0);
    }
  }

  private inventoryTrend(): string {
    const groups = this.groupInventoryByType(this.assetCaptureService.stock());
    const summary = Object.entries(groups)
      .sort((left, right) => right[1].total - left[1].total)
      .slice(0, 2)
      .map(([assetType, counts]) => `${counts.total} ${this.pluralize(assetType, counts.total)}`);

    return summary.length ? summary.join(', ') : 'No equipment captured';
  }

  private openRequestsTrend(): string {
    const pendingCount = this.pendingAvailabilityRequests().length;

    return pendingCount === 1 ? '1 awaiting stock check' : `${pendingCount} awaiting stock checks`;
  }

  private reportRecordCount(): number {
    return this.assetCaptureService.stock().length + this.availabilityService.requests().length;
  }

  private reportRecordTrend(): string {
    const stockCount = this.assetCaptureService.stock().length;
    const requestCount = this.availabilityService.requests().length;

    return `${stockCount} stock records, ${requestCount} request records`;
  }

  private groupInventoryByType(stock: EquipmentStockItem[]): Record<string, { total: number; available: number; reserved: number }> {
    return stock.reduce<Record<string, { total: number; available: number; reserved: number }>>((groups, item) => {
      const assetType = item.assetType || 'Other';

      groups[assetType] ??= { total: 0, available: 0, reserved: 0 };
      groups[assetType].total += 1;

      if (item.stockStatus === 'AVAILABLE') {
        groups[assetType].available += 1;
      }

      if (item.stockStatus === 'RESERVED') {
        groups[assetType].reserved += 1;
      }

      return groups;
    }, {});
  }

  private stockThreshold(available: number): 'Healthy' | 'Watch' | 'Low' {
    if (available <= 2) {
      return 'Low';
    }

    if (available <= 5) {
      return 'Watch';
    }

    return 'Healthy';
  }

  private pluralize(value: string, count: number): string {
    return count === 1 ? value.toLowerCase() : `${value.toLowerCase()}s`;
  }
}
