import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

// Servicios
import { AuthService } from '../../auth/services/auth.service';
import { NoticiasService } from '../../core/services/noticias.service';
import { EventosService } from '../../core/services/eventos.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';

interface EstadisticasDashboard {
  totalNoticias: number;
  totalEventos: number;
  totalSecciones: number;
  noticiasRecientes: number;
  eventosProximos: number;
  fechaActualizacion: Date;
  partidosHoy: any[];
  partidosTemporadaActual: number;
  temporadaActual?: string;
  equipoLider?: string;
  totalEquipos: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estado del dashboard
  isLoading = true;
  error: string | null = null;
  nombreEditor = '';

  // Estadísticas
  estadisticas: EstadisticasDashboard = {
    totalNoticias: 0,
    totalEventos: 0,
    totalSecciones: 0,
    noticiasRecientes: 0,
    eventosProximos: 0,
    fechaActualizacion: new Date(),
    partidosHoy: [],
    partidosTemporadaActual: 0,
    temporadaActual: undefined,
    equipoLider: undefined,
    totalEquipos: 20
  };

  // Propiedades computadas para el template
  get totalNoticias(): number {
    return this.estadisticas.totalNoticias;
  }

  get totalEventos(): number {
    return this.estadisticas.totalEventos;
  }

  get totalSecciones(): number {
    return this.estadisticas.totalSecciones;
  }

  get noticiasRecientes(): number {
    return this.estadisticas.noticiasRecientes;
  }

  get eventosProximos(): number {
    return this.estadisticas.eventosProximos;
  }

  get temporadaActual(): string | undefined {
    return this.estadisticas.temporadaActual;
  }

  get equipoLider(): string | undefined {
    return this.estadisticas.equipoLider;
  }

  get totalEquipos(): number {
    return this.estadisticas.totalEquipos;
  }

  get partidosHoy(): number {
    return this.estadisticas.partidosHoy?.length || 0;
  }

  // Estados de los paneles
  paneles = {
    noticias: false,
    eventos: false,
    secciones: false
  };

  // Propiedades específicas
  noticiasExpandido = false;
  eventosExpandido = false;
  seccionesExpandido = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private noticiasService: NoticiasService,
    private eventosService: EventosService,
    private estadisticasService: EstadisticasService
  ) {}

  ngOnInit(): void {
    this.inicializarDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarDashboard(): void {
    this.obtenerDatosUsuario();
    this.cargarEstadisticas();
  }

  private obtenerDatosUsuario(): void {
    // Obtener datos del usuario de forma segura
    this.nombreEditor = 'Administrador'; // Valor por defecto
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        this.nombreEditor = user?.nombre || 'Administrador';
      }
    } catch (error) {
      console.warn('Error al obtener datos del usuario:', error);
    }
  }

  private cargarEstadisticas(): void {
    this.isLoading = true;
    this.error = null;

    console.log('📊 Iniciando carga de estadísticas del dashboard...');

    // Usar el servicio de estadísticas centralizado
    this.estadisticasService.obtenerEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          console.log('✅ Estadísticas cargadas exitosamente:', stats);
          
          this.estadisticas = {
            totalNoticias: stats.totalNoticias || 0,
            totalEventos: stats.totalEventos || 0,
            totalSecciones: stats.totalSecciones || 0,
            noticiasRecientes: stats.noticiasRecientes || 0,
            eventosProximos: stats.eventosProximos || 0,
            fechaActualizacion: new Date(),
            partidosHoy: stats.partidosHoy || [],
            partidosTemporadaActual: stats.partidosTemporadaActual || 0,
            temporadaActual: stats.temporadaActual,
            equipoLider: stats.equipoLider,
            totalEquipos: stats.totalEquipos || 20
          };

          this.isLoading = false;
          console.log('📊 Dashboard actualizado correctamente');
        },
        error: (error: any) => {
          console.error('❌ Error al cargar estadísticas:', error);
          this.error = 'No se pudieron cargar las estadísticas. Verifique la conexión.';
          this.isLoading = false;
        }
      });
  }

  // === MÉTODOS DE UI ===

  togglePanel(panel: keyof typeof this.paneles): void {
    // Cerrar todos los paneles
    Object.keys(this.paneles).forEach(key => {
      this.paneles[key as keyof typeof this.paneles] = false;
    });
    // Abrir el panel seleccionado
    this.paneles[panel] = !this.paneles[panel];
  }

  navegar(ruta: string): void {
    this.router.navigate([ruta]);
  }

  cerrarSesion(): void {
    try {
      // Usar el método del AuthService para limpiar correctamente la sesión
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      // Forzar navegación incluso si hay error
      this.router.navigate(['/auth/login']);
    }
  }

  refrescarEstadisticas(): void {
    this.error = null;
    this.isLoading = true;
    
    console.log('🔄 Refrescando estadísticas (limpiando cache)...');
    
    // Usar el método de refresh que limpia el cache
    this.estadisticasService.refrescar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          console.log('✅ Estadísticas refrescadas exitosamente:', stats);
          
          this.estadisticas = {
            totalNoticias: stats.totalNoticias || 0,
            totalEventos: stats.totalEventos || 0,
            totalSecciones: stats.totalSecciones || 0,
            noticiasRecientes: stats.noticiasRecientes || 0,
            eventosProximos: stats.eventosProximos || 0,
            fechaActualizacion: new Date(),
            partidosHoy: stats.partidosHoy || [],
            partidosTemporadaActual: stats.partidosTemporadaActual || 0,
            temporadaActual: stats.temporadaActual,
            equipoLider: stats.equipoLider,
            totalEquipos: stats.totalEquipos || 20
          };

          this.isLoading = false;
          console.log('📊 Dashboard refrescado correctamente');
        },
        error: (error: any) => {
          console.error('❌ Error al refrescar estadísticas:', error);
          this.error = 'No se pudieron refrescar las estadísticas. Verifique la conexión.';
          this.isLoading = false;
        }
      });
  }

  // === MÉTODOS DE NAVEGACIÓN ESPECÍFICOS ===

  toggleNoticias(): void {
    this.togglePanel('noticias');
  }

  toggleEventos(): void {
    this.togglePanel('eventos');
  }

  toggleSecciones(): void {
    this.togglePanel('secciones');
  }
}
