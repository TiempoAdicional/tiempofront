import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CookiesBannerComponent } from './shared/cookies/cookies-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookiesBannerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'tiempoadicional-front';
  
  // Propiedades para controlar la visibilidad del header
  mostrarHeader = true;
  private destroy$ = new Subject<void>();
  
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Escuchar cambios de ruta para actualizar la visibilidad del header
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.actualizarVisibilidadHeader();
      });

    // Verificar inicialmente
    this.actualizarVisibilidadHeader();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determina si se debe mostrar el header basado en la ruta actual y el rol del usuario
   */
  private actualizarVisibilidadHeader(): void {
    const rutaActual = this.router.url;
    const esRutaAdmin = rutaActual.startsWith('/admin');
    const esRutaSuperAdmin = rutaActual.startsWith('/super-admin');
    const esUsuarioAdmin = this.authService.esAdmin();
    const esUsuarioSuperAdmin = this.authService.esSuperAdmin();

    // Ocultar header si:
    // - Estamos en rutas admin Y el usuario es admin, O
    // - Estamos en rutas super-admin Y el usuario es super admin
    this.mostrarHeader = !((esRutaAdmin && esUsuarioAdmin) || (esRutaSuperAdmin && esUsuarioSuperAdmin));
  }
}
