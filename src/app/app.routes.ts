import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { SignupComponent } from './pages/signup/signup';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { OauthSuccessComponent } from './pages/oauth-success/oauth-success';
import { SettingsComponent } from './pages/settings/settings';
import { AdminUsersComponent } from './pages/admin/users/admin-users';
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
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '/dashboard' },
];

