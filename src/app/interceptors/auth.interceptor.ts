import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches the JWT Bearer token to outgoing HTTP requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
