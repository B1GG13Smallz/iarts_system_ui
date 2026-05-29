import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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

type RoleKey = 'user' | 'store' | 'asset' | 'security' | 'manager';

interface WorkflowStep {
  label: string;
  owner: string;
  status: 'Complete' | 'Active' | 'Pending';
}

@Component({
  selector: 'app-dashboard',
  imports: [
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
  protected readonly activeRole = signal<RoleKey>('store');
  protected readonly activeModule = signal('Request control');

  constructor(
    protected readonly availabilityService: AvailabilityRequestService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {
    this.availabilityService.loadAll().subscribe();
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

  protected updateAvailability(id: number, status: AvailabilityStatus): void {
    this.availabilityService.updateStatus(id, status).subscribe();
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

        this.availabilityService.updateStatus(request.id, 'AVAILABLE', details).subscribe();
      });
  }

  protected readonly stats = [
    { label: 'Open requests', value: '128', trend: '24 awaiting stock checks' },
    { label: 'Assets in stock', value: '342', trend: '86 laptops, 41 monitors' },
    { label: 'Approvals due', value: '37', trend: '12 take-home, 9 removals' },
    { label: 'Audit events', value: '1,486', trend: 'Captured this month' },
  ];

  protected readonly roles: { key: RoleKey; title: string; summary: string }[] = [
    {
      key: 'user',
      title: 'End User',
      summary: 'Submit requests, acknowledge policy, confirm receipt and movement details.',
    },
    {
      key: 'store',
      title: 'ICT Storeroom',
      summary: 'Verify stock, issue assets, approve ICT removal sections and update allocations.',
    },
    {
      key: 'asset',
      title: 'Asset Management',
      summary: 'Verify movable asset details and approve MAM removal controls.',
    },
    {
      key: 'security',
      title: 'Security',
      summary: 'Validate approved removal documentation before equipment exits premises.',
    },
    {
      key: 'manager',
      title: 'ICT Management',
      summary: 'Review governance, escalations, reporting and audit evidence.',
    },
  ];

  protected readonly modules = [
    'Request control',
    'Issuing',
    'Movement',
    'Removal',
    'Damage',
    'Audit',
  ];

  protected readonly workflow: WorkflowStep[] = [
    { label: 'Request submitted', owner: 'End user', status: 'Complete' },
    { label: 'Printer check and QTS routing', owner: 'System', status: 'Complete' },
    { label: 'Stock verification', owner: 'ICT Storeroom', status: 'Active' },
    { label: 'Approval decision', owner: 'Approver', status: 'Pending' },
    { label: 'Policy acknowledgement', owner: 'Requester', status: 'Pending' },
    { label: 'Issue and assignment', owner: 'ICT Storeroom', status: 'Pending' },
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

  protected setRole(role: RoleKey): void {
    this.activeRole.set(role);
  }

  protected setModule(module: string): void {
    this.activeModule.set(module);
  }
}
