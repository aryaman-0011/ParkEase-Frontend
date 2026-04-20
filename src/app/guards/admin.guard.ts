import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restricts route access to users with ADMIN role only.
 * Redirects to /dashboard if the user is authenticated but not an admin.
 * Redirects to /login if not authenticated at all.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
