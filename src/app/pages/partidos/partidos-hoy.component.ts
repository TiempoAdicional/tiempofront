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
import { PartidosService, PartidoDTO, TablaEquipo, EstadoPartido, TablasCompletas, GrupoInfo } from '../../core/services/partidos.service';

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
  
  // 🆕 Nuevos datos de cuadrangulares
  tablasCompletas: TablasCompletas | null = null;
  cuadrangularA: TablaEquipo[] = [];
  cuadrangularB: TablaEquipo[] = [];
  vistaTablaActiva: 'completa' | 'cuadrangular-a' | 'cuadrangular-b' = 'completa';
  
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
    
    console.log('🔄 Cargando datos de partidos y cuadrangulares...');
    
    // Cargar todos los datos en paralelo con los nuevos endpoints
    forkJoin({
      enVivo: this.partidosService.obtenerPartidosEnVivo(),
      proximos: this.partidosService.obtenerProximosPartidos(),
      resultados: this.partidosService.obtenerUltimosResultados(),
      tabla: this.partidosService.obtenerTablaLigaColombiana(), // Ahora incluye TODOS los equipos
      todos: this.partidosService.obtenerTodosLosPartidos(),
      // 🆕 Nuevos endpoints de cuadrangulares
      tablasCompletas: this.partidosService.obtenerTodasLasTablas(),
      cuadrangularA: this.partidosService.obtenerCuadrangularA(),
      cuadrangularB: this.partidosService.obtenerCuadrangularB()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (datos) => {
        console.log('✅ Datos cargados exitosamente:', datos);
        
        // Datos originales
        this.partidosEnVivo = datos.enVivo || [];
        this.proximosPartidos = datos.proximos || [];
        this.ultimosResultados = datos.resultados || [];
        this.tablaLigaColombiana = datos.tabla || []; // Ahora incluye todos los equipos
        this.todosLosPartidos = datos.todos || [];
        
        // 🆕 Nuevos datos de cuadrangulares
        this.tablasCompletas = datos.tablasCompletas || null;
        this.cuadrangularA = datos.cuadrangularA || [];
        this.cuadrangularB = datos.cuadrangularB || [];
        
        this.cargando = false;
        this.mostrarNotificacion('✅ Datos actualizados');
        
        // Log de estadísticas de cuadrangulares
        if (this.tablasCompletas) {
          const stats = this.partidosService.obtenerEstadisticasCuadrangulares(this.tablasCompletas);
          console.log('📊 Estadísticas de cuadrangulares:', stats);
        }
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
    this.router.navigate(['/']);
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
  // 🆕 MÉTODOS PARA CUADRANGULARES
  // ================================

  /**
   * Cambia la vista activa de la tabla de posiciones
   */
  cambiarVistaTabla(vista: 'completa' | 'cuadrangular-a' | 'cuadrangular-b'): void {
    this.vistaTablaActiva = vista;
    console.log(`🔄 Vista de tabla cambiada a: ${vista}`);
  }

  /**
   * Obtiene los equipos según la vista activa
   */
  obtenerEquiposVistaActiva(): TablaEquipo[] {
    switch (this.vistaTablaActiva) {
      case 'cuadrangular-a':
        return this.cuadrangularA;
      case 'cuadrangular-b':
        return this.cuadrangularB;
      case 'completa':
      default:
        return this.tablaLigaColombiana;
    }
  }

  /**
   * Obtiene el título de la vista activa
   */
  obtenerTituloVistaActiva(): string {
    switch (this.vistaTablaActiva) {
      case 'cuadrangular-a':
        return `🔵 Cuadrangular A (${this.cuadrangularA.length} equipos)`;
      case 'cuadrangular-b':
        return `🔴 Cuadrangular B (${this.cuadrangularB.length} equipos)`;
      case 'completa':
      default:
        return `🏆 Tabla Completa (${this.tablaLigaColombiana.length} equipos)`;
    }
  }

  /**
   * Obtiene estadísticas rápidas de los cuadrangulares
   */
  obtenerEstadisticasCuadrangulares() {
    if (!this.tablasCompletas) {
      return null;
    }
    return this.partidosService.obtenerEstadisticasCuadrangulares(this.tablasCompletas);
  }

  /**
   * Busca un equipo en todos los cuadrangulares
   */
  buscarEquipoEnCuadrangulares(nombreEquipo: string) {
    if (!this.tablasCompletas) {
      return { equipo: null, grupo: null };
    }
    return this.partidosService.buscarEquipoEnCuadrangulares(this.tablasCompletas, nombreEquipo);
  }

  // ================================
  // 🆕 MÉTODOS PARA CLASIFICACIÓN DE EQUIPOS EN CUADRANGULARES
  // ================================

  /**
   * Verifica si un equipo pertenece al Cuadrangular A
   */
  esCuadrangularA(equipo: TablaEquipo): boolean {
    return this.cuadrangularA.some(equipoA => equipoA.team.id === equipo.team.id);
  }

  /**
   * Verifica si un equipo pertenece al Cuadrangular B
   */
  esCuadrangularB(equipo: TablaEquipo): boolean {
    return this.cuadrangularB.some(equipoB => equipoB.team.id === equipo.team.id);
  }

  /**
   * Obtiene el nombre del grupo al que pertenece un equipo
   */
  obtenerGrupoEquipo(equipo: TablaEquipo): string {
    if (this.esCuadrangularA(equipo)) {
      return 'A';
    } else if (this.esCuadrangularB(equipo)) {
      return 'B';
    }
    return equipo.group || 'N/A';
  }

  /**
   * Obtiene el color del chip según el cuadrangular
   */
  obtenerColorChipCuadrangular(equipo: TablaEquipo): string {
    if (this.esCuadrangularA(equipo)) {
      return '#1976d2'; // Azul
    } else if (this.esCuadrangularB(equipo)) {
      return '#d32f2f'; // Rojo
    }
    return '#757575'; // Gris por defecto
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
