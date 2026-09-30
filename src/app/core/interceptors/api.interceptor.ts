import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP Interceptor (ng g interceptor api)
 * Intercepts outgoing requests to Node Express API, attaches tokens,
 * headers and provides unified error handling.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const auth = inject(AuthService);

  // Clone and add authentication header & content-type
  let headers = req.headers.set('Accept', 'application/json');

  const token = auth.currentUser() ? 'Bearer token-session-nocturna-' + (auth.currentUser()?.uid || 'guest') : '';
  if (token) {
    headers = headers.set('Authorization', token);
  }

  // Prepend /api if it's an API request without host
  const cloned = req.clone({
    headers
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'Error en la petición al servidor Node/Express';
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMsg = error.error.message;
      } else if (error.status === 0) {
        errorMsg = 'No hay conexión con el servidor Node Express.';
      } else {
        errorMsg = `Error ${error.status}: ${error.statusText || 'Petición fallida'}`;
      }

      console.warn('[HTTP Interceptor Error]:', error);
      notify.error(errorMsg, 'Servidor Node/Express');
      return throwError(() => error);
    })
  );
};
