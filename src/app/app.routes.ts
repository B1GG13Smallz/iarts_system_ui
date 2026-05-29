import { Routes } from '@angular/router';
import { AssetsApproval } from './assets-approval/assets-approval';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { RequestIntake } from './request-intake/request-intake';
import { RequestStatusPage } from './request-status/request-status-page';
import { Technician } from './technician/technician';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'assets-approval', component: AssetsApproval },
  { path: 'requests', component: RequestIntake },
  { path: 'request-status', component: RequestStatusPage },
  { path: 'technician', component: Technician },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
