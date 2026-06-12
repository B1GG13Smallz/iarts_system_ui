import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AssetsApproval } from '../assets-approval/assets-approval';
import { AuthSession } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-asset-return',
  imports: [AssetsApproval, RouterLink],
  templateUrl: './asset-return.html',
  styleUrl: './asset-return.scss',
})
export class AssetReturn {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected session(): AuthSession | null {
    return this.authService.currentSession();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
