import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected username = '';
  protected password = '';
  protected readonly loginError = signal('');
  protected readonly isSubmitting = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected submitLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.loginError.set('Enter your username and password.');
      return;
    }

    this.loginError.set('');
    this.isSubmitting.set(true);
    this.authService
      .login(this.username.trim(), this.password)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const route = response.roles.includes('ADMIN')
            ? '/dashboard'
            : response.roles.includes('TECHNICIAN')
              ? '/technician'
              : '/requests';
          this.router.navigateByUrl(route);
        },
        error: () => this.loginError.set('Sign in failed. Check your username and password.'),
      });
  }
}
