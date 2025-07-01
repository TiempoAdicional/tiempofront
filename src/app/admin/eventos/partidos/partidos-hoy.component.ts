import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

// Services
import { PartidosService, Partido } from '../../../core/services/partidos.service';
import { LigaColombianService, PartidoLigaColombiana, EstadoPartido, Temporada } from '../../../core/services/liga-colombiana.service';

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
    FormsModule
  ],
  templateUrl: './partidos-hoy.component.html',
  styleUrls: ['./partidos-hoy.component.scss']
})
export class PartidosHoyComponent implements OnInit, OnDestroy {
  // Estados de la aplicación
  cargando = true;
  tabSeleccionada = 0;
  nombre = '';

  // Datos
  partidosLigaColombiana: PartidoLigaColombiana[] = [];
  partidos: Partido[] = [];
  temporadaActual: Temporada | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private partidosService: PartidosService,
    private ligaColombianService: LigaColombianService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga datos de ambos sistemas: Liga Colombiana y partidos generales
   */
  cargarDatos(): void {
    this.cargando = true;
    
    forkJoin({
      partidosLigaColombiana: this.ligaColombianService.obtenerPartidosHoy(),
      temporadaActual: this.ligaColombianService.obtenerTemporadaActual(),
      partidosGenerales: this.partidosService.obtenerPartidosHoy()
    }).subscribe({
      next: (datos) => {
        this.partidosLigaColombiana = datos.partidosLigaColombiana;
        this.temporadaActual = datos.temporadaActual;
        this.partidos = datos.partidosGenerales;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.cargando = false;
        // Cargar solo partidos generales como fallback
        this.obtenerPartidosLegacy();
      }
    });
  }

  /**
   * Método legacy de carga de partidos (fallback)
   */
  obtenerPartidosLegacy(): void {
    this.cargando = true;
    this.partidosService.obtenerPartidosHoy().subscribe({
      next: (partidos) => {
        this.partidos = partidos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar partidos legacy:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Navegar de vuelta al dashboard
   */
  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Limpiar búsqueda
   */
  limpiarBusqueda(): void {
    this.nombre = '';
    this.buscarPorNombre();
  }

  /**
   * Obtener cantidad de partidos en vivo (Liga Colombiana)
   */
  getPartidosEnVivoLigaColombiana(): number {
    return this.partidosLigaColombiana.filter(p => p.estado === EstadoPartido.EN_VIVO).length;
  }

  /**
   * Obtener cantidad de partidos finalizados (Liga Colombiana)
   */
  getPartidosFinalizadosLigaColombiana(): number {
    return this.partidosLigaColombiana.filter(p => p.estado === EstadoPartido.FINALIZADO).length;
  }

  /**
   * Obtener cantidad de partidos en vivo (Legacy)
   */
  getPartidosEnVivo(): number {
    return this.partidos.filter(p => p.estado === 'EN JUEGO').length;
  }

  /**
   * Obtener cantidad de partidos finalizados (Legacy)
   */
  getPartidosFinalizados(): number {
    return this.partidos.filter(p => p.estado === 'FINALIZADO').length;
  }

  /**
   * TrackBy function para partidos Liga Colombiana
   */
  trackByPartidoLigaColombiana(index: number, partido: PartidoLigaColombiana): any {
    return partido.id || index;
  }

  /**
   * TrackBy function para partidos legacy
   */
  trackByPartido(index: number, partido: Partido): any {
    return partido.id || index;
  }

  /**
   * Obtener color del estado del partido (Liga Colombiana)
   */
  obtenerColorEstado(estado: EstadoPartido): string {
    return this.ligaColombianService.obtenerColorEstado(estado);
  }

  /**
   * Obtener texto legible del estado (Liga Colombiana)
   */
  obtenerEstadoLegible(estado: EstadoPartido): string {
    return this.ligaColombianService.obtenerEstadoLegible(estado);
  }

  buscarPorNombre(): void {
    if (!this.nombre.trim()) {
      this.cargarDatos();
      return;
    }

    this.cargando = true;
    this.partidosService.buscarPorNombre(this.nombre).subscribe({
      next: (partidos) => {
        this.partidos = partidos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Determina si un equipo es ganador (Liga Colombiana)
   */
  esGanadorLigaColombiana(partido: PartidoLigaColombiana, tipo: 'local' | 'visitante'): boolean {
    if (partido.estado !== EstadoPartido.FINALIZADO) {
      return false;
    }

    const gLocal = partido.golesLocal ?? -1;
    const gVisitante = partido.golesVisitante ?? -1;

    if (gLocal === -1 || gVisitante === -1 || gLocal === gVisitante) {
      return false;
    }

    return tipo === 'local' ? gLocal > gVisitante : gVisitante > gLocal;
  }

  /**
   * Determina si un equipo es ganador (Legacy)
   */
  esGanador(partido: Partido, tipo: 'local' | 'visitante'): boolean {
    const gLocal = partido.golesLocal ?? -1;
    const gVisitante = partido.golesVisitante ?? -1;

    if (gLocal === -1 || gVisitante === -1 || gLocal === gVisitante) {
      return false;
    }

    return tipo === 'local' ? gLocal > gVisitante : gVisitante > gLocal;
  }

  /**
   * Cambiar entre tabs
   */
  onTabChange(index: number): void {
    this.tabSeleccionada = index;
  }
}
