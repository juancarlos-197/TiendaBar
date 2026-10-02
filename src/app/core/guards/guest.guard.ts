import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional Guard en Angular moderno (CanActivateFn)
 * Redirige a los usuarios que ya tienen sesión activa en Firebase Authentication
 * fuera de las pantallas públicas de autenticación (/auth/login, /auth/registro) hacia /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
