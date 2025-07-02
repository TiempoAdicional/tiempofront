import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.estaAutenticado() && this.authService.esSuperAdmin()) {
      return true;
    }

    // Redirigir a página de acceso no autorizado
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
