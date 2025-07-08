import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CookiesService, ConsentimientoCookies } from './cookies.service';

@Component({
  selector: 'app-cookies-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './cookies-banner.component.html',
  styleUrls: ['./cookies-banner.component.scss']
})
export class CookiesBannerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  mostrarBanner = false;
  mostrarConfiguracion = false;
  
  configuracionCookies = {
    esenciales: true,      // Siempre true, no se puede cambiar
    rendimiento: false,    // Google Analytics, métricas
    funcionales: false,    // Preferencias de usuario
    marketing: false       // Publicidad, remarketing
  };

  constructor(private cookiesService: CookiesService) {}

  ngOnInit(): void {
    // Verificar si ya se ha dado consentimiento
    const consentimientoPrevio = this.cookiesService.obtenerConsentimiento();
    
    if (!consentimientoPrevio) {
      this.mostrarBanner = true;
      // Bloquear scroll del body cuando se muestra el banner
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  toggleConfiguracion(): void {
    this.mostrarConfiguracion = !this.mostrarConfiguracion;
  }

  aceptarTodas(): void {
    const configuracion: ConsentimientoCookies = {
      esenciales: true,
      rendimiento: true,
      funcionales: true,
      marketing: true,
      fechaConsentimiento: new Date().toISOString(),
      version: '1.0'
    };

    this.cookiesService.guardarConsentimiento(configuracion);
    this.cerrarBanner();
    
    // Inicializar servicios según las cookies aceptadas
    this.inicializarServicios(configuracion);
  }

  aceptarSeleccionadas(): void {
    const configuracion: ConsentimientoCookies = {
      ...this.configuracionCookies,
      fechaConsentimiento: new Date().toISOString(),
      version: '1.0'
    };

    this.cookiesService.guardarConsentimiento(configuracion);
    this.cerrarBanner();
    
    // Inicializar servicios según las cookies aceptadas
    this.inicializarServicios(configuracion);
  }

  rechazarOpcionales(): void {
    const configuracion: ConsentimientoCookies = {
      esenciales: true,
      rendimiento: false,
      funcionales: false,
      marketing: false,
      fechaConsentimiento: new Date().toISOString(),
      version: '1.0'
    };

    this.cookiesService.guardarConsentimiento(configuracion);
    this.cerrarBanner();
    
    // Solo inicializar servicios esenciales
    this.inicializarServicios(configuracion);
  }

  private cerrarBanner(): void {
    this.mostrarBanner = false;
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  private inicializarServicios(configuracion: ConsentimientoCookies): void {
    // Google Analytics
    if (configuracion.rendimiento) {
      this.cookiesService.inicializarGoogleAnalytics();
    }

    // Servicios funcionales
    if (configuracion.funcionales) {
      this.cookiesService.inicializarServiciosFuncionales();
    }

    // Servicios de marketing
    if (configuracion.marketing) {
      this.cookiesService.inicializarServiciosMarketing();
    }

    console.log('🍪 Servicios inicializados según preferencias de cookies:', configuracion);
  }
}
