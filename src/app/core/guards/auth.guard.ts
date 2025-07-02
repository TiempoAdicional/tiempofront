import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
 const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  } else {
    // Redirigir a página de acceso no autorizado
    router.navigate(['/unauthorized']);
    return false;
  }
};
