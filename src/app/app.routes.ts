import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { SignupComponent } from './pages/signup/signup';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { OauthSuccessComponent } from './pages/oauth-success/oauth-success';
import { SettingsComponent } from './pages/settings/settings';
import { AdminUsersComponent } from './pages/admin/users/admin-users';
import { AdminLotsComponent } from './pages/admin/lots/admin-lots';
import { ManagerLotsComponent } from './pages/manager/lots/manager-lots';
import { ManagerSpotsComponent } from './pages/manager/spots/manager-spots';
import { SearchLotsComponent } from './pages/lots/search/search-lots';
import { LotSpotsComponent } from './pages/lots/spots/lot-spots';
import { MyPaymentsComponent } from './pages/payments/my-payments/my-payments';
import { MyVehiclesComponent } from './pages/vehicles/my-vehicles/my-vehicles';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'oauth2/success', component: OauthSuccessComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'lots/search', component: SearchLotsComponent, canActivate: [authGuard] },
  { path: 'lots/:lotId/spots', component: LotSpotsComponent, canActivate: [authGuard] },
  { path: 'manager/lots', component: ManagerLotsComponent, canActivate: [authGuard] },
  { path: 'manager/lots/:lotId/spots', component: ManagerSpotsComponent, canActivate: [authGuard] },
  { path: 'payments', component: MyPaymentsComponent, canActivate: [authGuard] },
  { path: 'vehicles', component: MyVehiclesComponent, canActivate: [authGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] },
  { path: 'admin/lots', component: AdminLotsComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '/dashboard' },
];
