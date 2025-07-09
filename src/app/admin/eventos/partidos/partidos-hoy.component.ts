import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// Material modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';

// Services
import { PartidosService, PartidoDTO, TablaEquipo, EstadoPartido } from '../../../core/services/partidos.service';

@Component({
  selector: 'app-partidos-hoy',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatSelectModule,
    MatTabsModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatMenuModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './partidos-hoy.component.html',
  styleUrls: ['./partidos-hoy.component.scss']
})
export class PartidosHoyComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // ================================
  // 🎯 ESTADO DEL COMPONENTE
  // ================================
  
  cargando = false;
  errorCarga = false;
  mensajeError = '';
  
  // Datos de partidos
  partidosEnVivo: PartidoDTO[] = [];
  proximosPartidos: PartidoDTO[] = [];
  ultimosResultados: PartidoDTO[] = [];
  todosLosPartidos: PartidoDTO[] = [];
  tablaLigaColombiana: TablaEquipo[] = [];
  
  // Control de pestañas
  tabSeleccionada = 0;
  
  // Búsqueda
  busquedaEquipo = '';
  busquedaFecha = '';
  partidosBusqueda: PartidoDTO[] = [];
  mostrandoBusqueda = false;
  
  // Auto-refresh para partidos en vivo
  private autoRefreshInterval: any;
  readonly AUTO_REFRESH_INTERVAL = 30000; // 30 segundos
  
  constructor(
    private router: Router,
    private partidosService: PartidosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detenerAutoRefresh();
  }

  // ================================
  // 📊 CARGA DE DATOS
  // ================================

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = false;
    
    console.log('🔄 Cargando datos de partidos...');
    
    // Cargar todos los datos en paralelo
    forkJoin({
      enVivo: this.partidosService.obtenerPartidosEnVivo(),
      proximos: this.partidosService.obtenerProximosPartidos(),
      resultados: this.partidosService.obtenerUltimosResultados(),
      tabla: this.partidosService.obtenerTablaLigaColombiana(),
      todos: this.partidosService.obtenerTodosLosPartidos()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (datos) => {
        console.log('✅ Datos cargados exitosamente:', datos);
        
        this.partidosEnVivo = datos.enVivo || [];
        this.proximosPartidos = datos.proximos || [];
        this.ultimosResultados = datos.resultados || [];
        this.tablaLigaColombiana = datos.tabla || [];
        this.todosLosPartidos = datos.todos || [];
        
        this.cargando = false;
        this.mostrarNotificacion('✅ Datos actualizados');
      },
      error: (error) => {
        console.error('❌ Error cargando datos:', error);
        this.errorCarga = true;
        this.mensajeError = 'Error al cargar los datos de partidos';
        this.cargando = false;
        this.mostrarNotificacion('❌ Error al cargar datos', 'error');
      }
    });
  }

  recargarDatos(): void {
    this.cargarDatos();
  }

  // ================================
  // 🔍 BÚSQUEDA Y FILTROS
  // ================================

  buscarPorEquipo(): void {
    if (!this.busquedaEquipo.trim()) {
      this.limpiarBusqueda();
      return;
    }
    
    this.cargando = true;
    console.log(`🔍 Buscando partidos del equipo: ${this.busquedaEquipo}`);
    
    this.partidosService.buscarPartidosPorEquipo(this.busquedaEquipo.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidos) => {
          console.log(`✅ ${partidos.length} partidos encontrados`);
          this.partidosBusqueda = partidos;
          this.mostrandoBusqueda = true;
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error en búsqueda:', error);
          this.partidosBusqueda = [];
          this.mostrandoBusqueda = false;
          this.cargando = false;
          this.mostrarNotificacion('❌ Error en la búsqueda', 'error');
        }
      });
  }

  buscarPorFecha(): void {
    if (!this.busquedaFecha) {
      this.limpiarBusqueda();
      return;
    }
    
    this.cargando = true;
    console.log(`📅 Buscando partidos para la fecha: ${this.busquedaFecha}`);
    
    this.partidosService.buscarPartidosPorFecha(this.busquedaFecha)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidos) => {
          console.log(`✅ ${partidos.length} partidos encontrados`);
          this.partidosBusqueda = partidos;
          this.mostrandoBusqueda = true;
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error en búsqueda:', error);
          this.partidosBusqueda = [];
          this.mostrandoBusqueda = false;
          this.cargando = false;
          this.mostrarNotificacion('❌ Error en la búsqueda', 'error');
        }
      });
  }

  limpiarBusqueda(): void {
    this.busquedaEquipo = '';
    this.busquedaFecha = '';
    this.partidosBusqueda = [];
    this.mostrandoBusqueda = false;
  }

  // ================================
  // 🔄 AUTO-REFRESH
  // ================================

  private iniciarAutoRefresh(): void {
    // Solo hacer auto-refresh si hay partidos en vivo
    this.autoRefreshInterval = setInterval(() => {
      if (this.partidosEnVivo.length > 0 && !this.cargando) {
        console.log('🔄 Auto-refresh de partidos en vivo...');
        this.actualizarPartidosEnVivo();
      }
    }, this.AUTO_REFRESH_INTERVAL);
  }

  private detenerAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  private actualizarPartidosEnVivo(): void {
    this.partidosService.obtenerPartidosEnVivo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidos) => {
          this.partidosEnVivo = partidos;
          console.log(`🔄 Partidos en vivo actualizados: ${partidos.length}`);
        },
        error: (error) => {
          console.warn('⚠️ Error actualizando partidos en vivo:', error);
        }
      });
  }

  // ================================
  // 🎯 MÉTODOS AUXILIARES
  // ================================

  obtenerEstadoLegible(estado: string): string {
    return this.partidosService.obtenerEstadoLegible(estado as EstadoPartido);
  }

  obtenerColorEstado(estado: string): string {
    return this.partidosService.obtenerColorEstado(estado as EstadoPartido);
  }

  estaEnVivo(partido: PartidoDTO): boolean {
    return this.partidosService.estaEnVivo(partido.estado as EstadoPartido);
  }

  haFinalizado(partido: PartidoDTO): boolean {
    return this.partidosService.haFinalizado(partido.estado as EstadoPartido);
  }

  esGanador(partido: PartidoDTO, tipo: 'local' | 'visitante'): boolean {
    if (!this.haFinalizado(partido)) return false;
    
    if (tipo === 'local') {
      return partido.golesLocal > partido.golesVisitante;
    } else {
      return partido.golesVisitante > partido.golesLocal;
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ================================
  // 📊 CONTADORES PARA STATS
  // ================================

  get partidosEnVivoCount(): number {
    return this.partidosEnVivo.length;
  }

  get proximosPartidosCount(): number {
    return this.proximosPartidos.length;
  }

  get ultimosResultadosCount(): number {
    return this.ultimosResultados.length;
  }

  get totalPartidos(): number {
    return this.todosLosPartidos.length;
  }

  // ================================
  // 🎮 NAVEGACIÓN Y ACCIONES
  // ================================

  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  verDetallesPartido(partido: PartidoDTO): void {
    // Navegar a página de detalles (implementar después)
    console.log('📋 Ver detalles del partido:', partido);
    this.mostrarNotificacion(`🔍 Detalles: ${partido.nombreEquipoLocal} vs ${partido.nombreEquipoVisitante}`);
  }

  onTabChange(index: number): void {
    this.tabSeleccionada = index;
    
    // Limpiar búsqueda al cambiar de pestaña
    if (this.mostrandoBusqueda) {
      this.limpiarBusqueda();
    }
  }

  // ================================
  // 🎨 TRACKING FUNCTIONS
  // ================================

  trackByPartido(index: number, partido: PartidoDTO): string {
    return partido.codigoApi;
  }

  trackByEquipoTabla(index: number, equipo: TablaEquipo): number {
    return equipo.team.id;
  }

  // ================================
  // 🔧 UTILIDADES
  // ================================

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
}
