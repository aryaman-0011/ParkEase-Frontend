import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches the JWT Bearer token and user identity headers to outgoing HTTP requests.
 * Downstream microservices (parkinglot-service, vehicle-service, etc.) use
 * X-User-Id and X-User-Role headers to identify the caller.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Add user identity headers for downstream microservices
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.id) headers['X-User-Id'] = user.id.toString();
        if (user.role) headers['X-User-Role'] = user.role;
      } catch {
        // ignore parse errors
      }
    }

    const cloned = req.clone({ setHeaders: headers });
    return next(cloned);
  }

  return next(req);
};
