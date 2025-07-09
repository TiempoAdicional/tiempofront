import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PartidosService, PartidoDTO } from '../../../core/services/partidos.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-gestionar-partidos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './gestionar-partidos.component.html',
  styleUrls: ['./gestionar-partidos.component.scss']
})
export class GestionarPartidosComponent implements OnInit {
  
  // Formularios
  busquedaForm!: FormGroup;
  crearPartidoForm!: FormGroup;
  
  // Data
  partidosApi: PartidoDTO[] = [];
  partidosEnVivo: PartidoDTO[] = [];
  partidosProximos: PartidoDTO[] = [];
  partidosResultados: PartidoDTO[] = [];
  
  // Estados
  cargandoApi = false;
  cargandoEnVivo = false;
  cargandoProximos = false;
  cargandoResultados = false;
  
  // Configuración de tabla
  columnasTabla: string[] = ['fecha', 'equipos', 'estado', 'resultado', 'acciones'];
  
  // Tab activo
  tabSeleccionado = 0;

  constructor(
    private fb: FormBuilder,
    private partidosService: PartidosService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.cargarPartidosEnVivo();
    this.cargarPartidosProximos();
    this.cargarPartidosResultados();
  }

  initForms(): void {
    this.busquedaForm = this.fb.group({
      fecha: [''],
      equipo: [''],
      tipoFuente: ['api'] // 'en-vivo', 'proximos', 'resultados'
    });

    this.crearPartidoForm = this.fb.group({
      equipoLocal: ['', Validators.required],
      equipoVisitante: ['', Validators.required],
      fecha: ['', Validators.required],
      competencia: ['Liga Colombiana', Validators.required],
      estado: ['Not Started', Validators.required],
      golesLocal: [0],
      golesVisitante: [0]
    });
  }

  // === CARGA DE DATOS ===

  cargarPartidosEnVivo(): void {
    this.cargandoEnVivo = true;
    this.partidosService.obtenerPartidosEnVivo().subscribe({
      next: (partidos: PartidoDTO[]) => {
        this.partidosEnVivo = partidos;
        this.cargandoEnVivo = false;
      },
      error: (error: any) => {
        console.error('Error cargando partidos en vivo:', error);
        this.mostrarNotificacion('Error al cargar partidos en vivo', 'error');
        this.cargandoEnVivo = false;
      }
    });
  }

  cargarPartidosProximos(): void {
    this.cargandoProximos = true;
    this.partidosService.obtenerProximosPartidos().subscribe({
      next: (partidos: PartidoDTO[]) => {
        this.partidosProximos = partidos;
        this.cargandoProximos = false;
      },
      error: (error: any) => {
        console.error('Error cargando próximos partidos:', error);
        this.mostrarNotificacion('Error al cargar próximos partidos', 'error');
        this.cargandoProximos = false;
      }
    });
  }

  cargarPartidosResultados(): void {
    this.cargandoResultados = true;
    this.partidosService.obtenerUltimosResultados().subscribe({
      next: (partidos: PartidoDTO[]) => {
        this.partidosResultados = partidos;
        this.cargandoResultados = false;
      },
      error: (error: any) => {
        console.error('Error cargando resultados:', error);
        this.mostrarNotificacion('Error al cargar resultados', 'error');
        this.cargandoResultados = false;
      }
    });
  }

  // === BÚSQUEDAS ===

  buscarPartidos(): void {
    const { fecha, equipo, tipoFuente } = this.busquedaForm.value;

    if (fecha) {
      this.buscarPorFecha(fecha, tipoFuente);
    } else if (equipo) {
      this.buscarPorEquipo(equipo, tipoFuente);
    } else {
      this.mostrarNotificacion('Ingresa una fecha o nombre de equipo para buscar', 'warning');
    }
  }

  private buscarPorFecha(fecha: string, tipoFuente: string): void {
    const fechaISO = new Date(fecha).toISOString().split('T')[0];

    switch (tipoFuente) {
      case 'api':
        this.cargandoApi = true;
        this.partidosService.buscarPartidosPorFecha(fechaISO).subscribe({
          next: (partidos: PartidoDTO[]) => {
            this.partidosApi = partidos;
            this.cargandoApi = false;
            this.tabSeleccionado = 0;
          },
          error: (error: any) => this.manejarError(error, 'Error en búsqueda por fecha')
        });
        break;

      case 'en-vivo':
        this.cargarPartidosEnVivo();
        this.tabSeleccionado = 0;
        break;

      case 'proximos':
        this.cargarPartidosProximos();
        this.tabSeleccionado = 1;
        break;

      case 'resultados':
        this.cargarPartidosResultados();
        this.tabSeleccionado = 2;
        break;
    }
  }

  private buscarPorEquipo(equipo: string, tipoFuente: string): void {
    switch (tipoFuente) {
      case 'api':
        this.cargandoApi = true;
        this.partidosService.buscarPartidosPorEquipo(equipo).subscribe({
          next: (partidos: PartidoDTO[]) => {
            this.partidosApi = partidos;
            this.cargandoApi = false;
            this.tabSeleccionado = 0;
          },
          error: (error: any) => this.manejarError(error, 'Error en búsqueda por equipo')
        });
        break;

      case 'en-vivo':
        // Filtrar partidos en vivo por equipo
        this.partidosEnVivo = this.partidosEnVivo.filter(p => 
          p.nombreEquipoLocal.toLowerCase().includes(equipo.toLowerCase()) ||
          p.nombreEquipoVisitante.toLowerCase().includes(equipo.toLowerCase())
        );
        this.tabSeleccionado = 0;
        break;

      case 'proximos':
        // Filtrar próximos partidos por equipo
        this.partidosProximos = this.partidosProximos.filter(p => 
          p.nombreEquipoLocal.toLowerCase().includes(equipo.toLowerCase()) ||
          p.nombreEquipoVisitante.toLowerCase().includes(equipo.toLowerCase())
        );
        this.tabSeleccionado = 1;
        break;

      case 'resultados':
        // Filtrar resultados por equipo
        this.partidosResultados = this.partidosResultados.filter(p => 
          p.nombreEquipoLocal.toLowerCase().includes(equipo.toLowerCase()) ||
          p.nombreEquipoVisitante.toLowerCase().includes(equipo.toLowerCase())
        );
        this.tabSeleccionado = 2;
        break;
    }
  }

  // === GESTIÓN DE PARTIDOS ===

  verDetallesPartido(partido: PartidoDTO): void {
    // Implementar navegación a detalles o modal
    console.log('Ver detalles del partido:', partido);
    this.mostrarNotificacion(`🔍 Detalles: ${partido.nombreEquipoLocal} vs ${partido.nombreEquipoVisitante}`, 'success');
  }

  // === UTILIDADES ===

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearEquipos(partido: PartidoDTO): string {
    return `${partido.nombreEquipoLocal} vs ${partido.nombreEquipoVisitante}`;
  }

  formatearResultado(partido: PartidoDTO): string {
    if (partido.golesLocal !== null && partido.golesVisitante !== null) {
      return `${partido.golesLocal} - ${partido.golesVisitante}`;
    }
    return partido.estado === 'Match Finished' ? 'Sin datos' : '-';
  }

  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'First Half':
      case 'Second Half':
      case 'Halftime':
        return 'accent';
      case 'Match Finished':
        return 'primary';
      case 'Not Started':
        return 'warn';
      default:
        return '';
    }
  }

  obtenerEstadoLegible(estado: string): string {
    switch (estado) {
      case 'Not Started':
        return 'Programado';
      case 'First Half':
        return 'Primer Tiempo';
      case 'Halftime':
        return 'Medio Tiempo';
      case 'Second Half':
        return 'Segundo Tiempo';
      case 'Match Finished':
        return 'Finalizado';
      case 'Match Postponed':
        return 'Aplazado';
      case 'Match Cancelled':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  estaEnVivo(partido: PartidoDTO): boolean {
    return ['First Half', 'Second Half', 'Halftime', 'Extra Time'].includes(partido.estado);
  }

  limpiarBusqueda(): void {
    this.busquedaForm.reset({ tipoFuente: 'api' });
    this.cargarPartidosEnVivo();
    this.cargarPartidosProximos();
    this.cargarPartidosResultados();
  }

  private manejarError(error: any, mensaje: string): void {
    console.error(mensaje, error);
    this.mostrarNotificacion(`❌ ${mensaje}`, 'error');
    this.cargandoApi = false;
    this.cargandoEnVivo = false;
    this.cargandoProximos = false;
    this.cargandoResultados = false;
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${tipo}`]
    });
  }

  // Getters para el template
  get equipoLocal() { return this.crearPartidoForm.get('equipoLocal'); }
  get equipoVisitante() { return this.crearPartidoForm.get('equipoVisitante'); }
  get fechaPartido() { return this.crearPartidoForm.get('fecha'); }
  get competencia() { return this.crearPartidoForm.get('competencia'); }
}
