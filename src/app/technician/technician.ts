import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, AuthSession } from '../auth/auth';
import { TechnicianRequestDetails, TechnicianService } from './technician.service';

@Component({
  selector: 'app-technician',
  imports: [FormsModule, MatButtonModule, RouterLink],
  templateUrl: './technician.html',
  styleUrl: './technician.scss',
})
export class Technician {
  protected referenceNumber = '';
  protected readonly result = signal<TechnicianRequestDetails | null>(null);
  protected readonly message = signal('');
  protected readonly isSearching = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly technicianService: TechnicianService,
  ) {}

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected search(): void {
    const cleanReference = this.referenceNumber.trim();

    if (!cleanReference) {
      this.message.set('Enter a reference number.');
      this.result.set(null);
      return;
    }

    this.message.set('');
    this.result.set(null);
    this.isSearching.set(true);
    this.technicianService
      .findByReference(cleanReference)
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: (details) => this.result.set(details),
        error: () => this.message.set('No request found for that reference number.'),
      });
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
