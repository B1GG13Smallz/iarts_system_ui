import { Routes } from '@angular/router';
import { AssetReturn } from './asset-return/asset-return';
import { AssetCapture } from './asset-capture/asset-capture';
import { AssetsApproval } from './assets-approval/assets-approval';
import { Dashboard } from './dashboard/dashboard';
import { ExportReport } from './export-report/export-report';
import { LaptopPolicyAcceptance } from './laptop-policy-acceptance/laptop-policy-acceptance';
import { Login } from './login/login';
import { PermissionToRemoveEquipment } from './permission-to-remove-equipment/permission-to-remove-equipment';
import { PermissionRemovalStoreroom } from './permission-removal-storeroom/permission-removal-storeroom';
import { Register } from './register/register';
import { RequestIntake } from './request-intake/request-intake';
import { RequestStatusPage } from './request-status/request-status-page';
import { Technician } from './technician/technician';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'export-report', component: ExportReport },
  { path: 'assets-approval', component: AssetsApproval },
  { path: 'asset-capture', component: AssetCapture },
  { path: 'asset-return', component: AssetReturn },
  { path: 'register', component: Register },
  { path: 'permission-to-remove-equipment', component: PermissionToRemoveEquipment },
  { path: 'permission-removal-storeroom', component: PermissionRemovalStoreroom },
  { path: 'requests', component: RequestIntake },
  { path: 'request-status', component: RequestStatusPage },
  { path: 'laptop-policy-acceptance', component: LaptopPolicyAcceptance },
  { path: 'technician', component: Technician },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
