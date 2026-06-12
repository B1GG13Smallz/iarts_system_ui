import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EquipmentStockItem } from '../models/asset-capture.model';
import { AuthSession } from '../models/auth.model';
import { EquipmentAvailabilityRequest } from '../models/availability-request.model';
import { AssetCaptureService } from '../services/asset-capture.service';
import { AuthService } from '../services/auth.service';
import { AvailabilityRequestService } from '../services/availability-request.service';

interface InventorySummaryRow {
  assetType: string;
  total: number;
  available: number;
  reserved: number;
  issued: number;
  damaged: number;
  retired: number;
}

@Component({
  selector: 'app-export-report',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './export-report.html',
  styleUrl: './export-report.scss',
})
export class ExportReport implements OnInit {
  protected readonly message = signal('');
  protected readonly generatedAt = signal(new Date());
  protected readonly pendingRequests = computed(() =>
    this.availabilityService.requests().filter((request) => request.status === 'PENDING'),
  );
  protected readonly inventorySummary = computed<InventorySummaryRow[]>(() => {
    const groups = this.assetCaptureService.stock().reduce<Record<string, InventorySummaryRow>>((summary, item) => {
      const assetType = item.assetType || 'Other';

      summary[assetType] ??= {
        assetType,
        total: 0,
        available: 0,
        reserved: 0,
        issued: 0,
        damaged: 0,
        retired: 0,
      };

      summary[assetType].total += 1;
      this.incrementStatusCount(summary[assetType], item.stockStatus);

      return summary;
    }, {});

    return Object.values(groups).sort((left, right) => left.assetType.localeCompare(right.assetType));
  });

  constructor(
    protected readonly assetCaptureService: AssetCaptureService,
    protected readonly availabilityService: AvailabilityRequestService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected printPdf(): void {
    window.print();
  }

  protected downloadExcel(): void {
    const reportHtml = this.excelWorkbook();
    const blob = new Blob([reportHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `iarts-report-${this.reportDateForFile()}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected formatDate(value: string | Date | undefined): string {
    if (!value) {
      return 'Not captured';
    }

    return new Date(value).toLocaleString();
  }

  private loadReportData(): void {
    this.message.set('');
    this.generatedAt.set(new Date());
    this.assetCaptureService.loadAll().pipe(catchError(() => of([]))).subscribe({
      error: () => this.message.set('Could not load equipment stock for the report.'),
    });
    this.availabilityService.loadAll().pipe(catchError(() => of([]))).subscribe({
      error: () => this.message.set('Could not load availability requests for the report.'),
    });
  }

  private incrementStatusCount(row: InventorySummaryRow, status: string): void {
    switch (status) {
      case 'RESERVED':
        row.reserved += 1;
        break;
      case 'ISSUED':
        row.issued += 1;
        break;
      case 'DAMAGED':
        row.damaged += 1;
        break;
      case 'RETIRED':
        row.retired += 1;
        break;
      default:
        row.available += 1;
    }
  }

  private excelWorkbook(): string {
    return `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>IARTS Equipment Report</h1>
          <p>Generated: ${this.escapeHtml(this.formatDate(this.generatedAt()))}</p>
          <h2>Inventory Summary</h2>
          ${this.tableHtml(
            ['Asset type', 'Total', 'Available', 'Reserved', 'Issued', 'Damaged', 'Retired'],
            this.inventorySummary().map((row) => [
              row.assetType,
              row.total,
              row.available,
              row.reserved,
              row.issued,
              row.damaged,
              row.retired,
            ]),
          )}
          <h2>Equipment Stock</h2>
          ${this.tableHtml(
            ['Barcode', 'Type', 'Serial number', 'Make', 'Model', 'Status', 'Location'],
            this.assetCaptureService.stock().map((item) => [
              item.assetTag,
              item.assetType,
              item.serialNumber || '',
              item.make || '',
              item.model || '',
              item.stockStatus,
              item.storeroomLocation || item.location || '',
            ]),
          )}
          <h2>Requests Waiting For Approval</h2>
          ${this.tableHtml(
            ['Reference', 'Requester', 'Equipment', 'Status', 'Created'],
            this.pendingRequests().map((request) => [
              request.referenceNumber || '',
              request.requesterName || '',
              request.equipment,
              request.status,
              this.formatDate(request.createdAt),
            ]),
          )}
        </body>
      </html>
    `;
  }

  private tableHtml(headers: string[], rows: Array<Array<string | number>>): string {
    const headerHtml = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('');
    const rowHtml = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${this.escapeHtml(String(cell))}</td>`).join('')}</tr>`)
      .join('');

    return `<table border="1"><thead><tr>${headerHtml}</tr></thead><tbody>${rowHtml}</tbody></table>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private reportDateForFile(): string {
    return this.generatedAt().toISOString().slice(0, 10);
  }
}
