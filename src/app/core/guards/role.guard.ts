import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  const currentRole = authService.userRole();

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Admins always have access
  if (authService.isAdmin() || allowedRoles.includes(currentRole)) {
    return true;
  }

  notify.error(`Acceso denegado. Este módulo requiere permisos de: ${allowedRoles.join(' o ')}`);
  router.navigate(['/dashboard']);
  return false;
};
