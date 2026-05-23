import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const homeGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/products']);
    }

    switch (authService.getRole()) {
        case 'INDIVIDUAL': return router.createUrlTree(['/individual']);
        case 'CORPORATE':  return router.createUrlTree(['/corporate']);
        case 'ADMIN':      return router.createUrlTree(['/admin']);
        default:           return router.createUrlTree(['/login']);
    }
};
