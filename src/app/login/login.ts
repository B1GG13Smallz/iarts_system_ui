import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';

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
  private readonly passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

  protected username = '';
  protected password = '';
  protected readonly loginError = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected submitLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.loginError.set('Enter your username and password.');
      return;
    }

    if (!this.passwordPattern.test(this.password)) {
      this.loginError.set(
        'Password must be at least 8 characters and include one uppercase letter and one special character.',
      );
      return;
    }

    this.loginError.set('');
    this.isSubmitting.set(true);
    this.authService
      .login(this.username.trim(), this.password)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.router.navigateByUrl(this.authService.routeForSession(response));
        },
        error: () => this.loginError.set('Sign in failed. Check your username and password.'),
      });
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }
}
