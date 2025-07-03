import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isAuthenticated = this.authService.estaAutenticado();
    const isUser = this.authService.esUsuario();
    const isAdmin = this.authService.esAdmin();
    const isSuperAdmin = this.authService.esSuperAdmin();

    console.log('UsuarioGuard: Checking access', {
      isAuthenticated,
      isUser,
      isAdmin,
      isSuperAdmin,
      url: state.url
    });

    // If user is authenticated and has USER role, allow access
    if (isAuthenticated && isUser) {
      return true;
    }

    // If user is authenticated but has different role, redirect to appropriate dashboard
    if (isAuthenticated && isAdmin) {
      console.log('UsuarioGuard: Redirecting admin to admin dashboard');
      this.router.navigate(['/admin']);
      return false;
    }
    
    if (isAuthenticated && isSuperAdmin) {
      console.log('UsuarioGuard: Redirecting super admin to super admin dashboard');
      this.router.navigate(['/super-admin']);
      return false;
    }

    // Allow access to authenticated users with valid roles and non-authenticated users
    // (The component will handle displaying appropriate content for each case)
    return true;
  }
}
