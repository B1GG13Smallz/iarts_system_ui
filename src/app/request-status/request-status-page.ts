import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService, AuthSession } from '../auth/auth';
import { IntraRequestRecord, IntraRequestService } from '../request-intake/intra-request.service';

@Component({
  selector: 'app-request-status-page',
  imports: [MatProgressBarModule, RouterLink],
  templateUrl: './request-status-page.html',
  styleUrl: './request-status-page.scss',
})
export class RequestStatusPage {
  protected readonly requests = signal<IntraRequestRecord[]>([]);
  protected readonly message = signal('');

  private readonly statusProgress: Record<string, number> = {
    SUBMITTED: 20,
    ASSIGNED: 40,
    IN_PROGRESS: 65,
    READY_FOR_DELIVERY: 85,
    COMPLETED: 100,
  };

  constructor(
    private readonly authService: AuthService,
    private readonly intraRequestService: IntraRequestService,
    private readonly router: Router,
  ) {
    this.loadRequests();
  }

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected progressFor(status: string): number {
    return this.statusProgress[status] ?? 0;
  }

  protected statusLabel(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private loadRequests(): void {
    this.intraRequestService.findMine().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.message.set(requests.length ? '' : 'No submitted request forms found.');
      },
      error: () => this.message.set('Could not load request status.'),
    });
  }
}
