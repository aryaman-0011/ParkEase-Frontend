import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepts HTTP errors and ensures they propagate properly
 * through Angular's change detection.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ensure error.error is always a parsed object when possible
      if (error.error instanceof Blob) {
        // Handle blob errors
        return throwError(() => error);
      }
      
      if (typeof error.error === 'string') {
        try {
          const parsed = JSON.parse(error.error);
          return throwError(() => new HttpErrorResponse({
            error: parsed,
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url || undefined,
          }));
        } catch {
          // Not JSON, keep as-is
        }
      }
      
      return throwError(() => error);
    })
  );
};
