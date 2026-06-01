import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AssetsApproval } from '../assets-approval/assets-approval';
import { AuthService, AuthSession } from '../auth/auth';
import {
  AvailabilityRequestService,
  AvailabilityStatus,
  EquipmentAvailabilityRequest,
} from '../availability/availability-request.service';
import {
  EquipmentDetailsDialog,
  EquipmentDetailsDialogResult,
} from './equipment-details-dialog';
import { IntraRequestRecord, IntraRequestService } from '../request-intake/intra-request.service';

interface ProcessingQueueItem {
  id: number;
  referenceNumber: string;
  requester: string;
  equipment: string;
  status: AvailabilityStatus;
  decisionDate: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    AssetsApproval,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    RouterLink,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly processingQueuePageSize = 10;
  protected readonly intraRequests = signal<IntraRequestRecord[]>([]);
  protected readonly activeView = signal<'dashboard' | 'assetsApproval'>('dashboard');
  protected readonly processingQueuePage = signal(0);
  protected readonly pendingAvailabilityRequests = computed(() =>
    this.availabilityService.requests().filter((request) => request.status === 'PENDING'),
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

  constructor(
    protected readonly availabilityService: AvailabilityRequestService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly intraRequestService: IntraRequestService,
    private readonly router: Router,
  ) {
    this.availabilityService.loadAll().subscribe();
    this.intraRequestService.findAll().subscribe({
      next: (requests) => this.intraRequests.set(requests),
      error: () => this.intraRequests.set([]),
    });
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

  protected updateAvailability(id: number, status: AvailabilityStatus): void {
    this.availabilityService.updateStatus(id, status).subscribe(() => this.resetProcessingQueuePageIfEmpty());
  }

  protected openAvailableDialog(request: EquipmentAvailabilityRequest): void {
    this.dialog
      .open<EquipmentDetailsDialog, EquipmentAvailabilityRequest, EquipmentDetailsDialogResult>(
        EquipmentDetailsDialog,
        {
          autoFocus: 'first-tabbable',
          data: request,
          disableClose: true,
        },
      )
      .afterClosed()
      .subscribe((details) => {
        if (!details) {
          return;
        }

        this.availabilityService
          .updateStatus(request.id, 'AVAILABLE', details)
          .subscribe(() => this.resetProcessingQueuePageIfEmpty());
      });
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

  protected readonly stats = [
    { label: 'Open requests', value: '128', trend: '24 awaiting stock checks' },
    { label: 'Assets in stock', value: '342', trend: '86 laptops, 41 monitors' },
    { label: 'Approvals due', value: '37', trend: '12 take-home, 9 removals' },
    { label: 'Audit events', value: '1,486', trend: 'Captured this month' },
  ];

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

  protected readonly stock = [
    { item: 'Laptop', available: 86, reserved: 14, threshold: 'Healthy' },
    { item: 'Monitor', available: 41, reserved: 9, threshold: 'Watch' },
    { item: 'Docking station', available: 18, reserved: 7, threshold: 'Low' },
    { item: 'Keyboard and mouse set', available: 197, reserved: 22, threshold: 'Healthy' },
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

  private resetProcessingQueuePageIfEmpty(): void {
    const total = this.processingQueue().length;
    const pageStart = this.processingQueuePage() * this.processingQueuePageSize;

    if (pageStart >= total) {
      this.processingQueuePage.set(0);
    }
  }
}
