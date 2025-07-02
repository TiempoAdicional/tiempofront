import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Permitir acceso si el usuario está autenticado Y es USUARIO
    // También permitir acceso público (sin autenticación) con restricciones
    if (this.authService.estaAutenticado() && this.authService.esUsuario()) {
      return true;
    }
    
    // Si no está autenticado, permitir acceso pero con restricciones
    if (!this.authService.estaAutenticado()) {
      return true; // Acceso público limitado
    }
    
    // Si está autenticado pero no es USUARIO (es ADMIN o SUPER_ADMIN)
    // Redirigir a su dashboard correspondiente
    if (this.authService.esAdmin()) {
      this.router.navigate(['/admin']);
      return false;
    }
    
    if (this.authService.esSuperAdmin()) {
      this.router.navigate(['/super-admin']);
      return false;
    }

    // Si no es ningún rol válido, mostrar página de no autorizado
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
