import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PartidoService, Partido } from '../partido.service';
import { AsignacionSeccionService } from '../../secciones/services/asignacion-seccion.service';

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
  partidosApi: Partido[] = [];
  partidosLocales: Partido[] = [];
  partidosCombinados: Partido[] = [];
  
  // Estados
  cargandoApi = false;
  cargandoLocales = false;
  cargandoCombinados = false;
  guardandoPartido = false;
  creandoPartido = false;
  
  // Configuración de tabla
  columnasTabla: string[] = ['fecha', 'equipos', 'estado', 'resultado', 'competencia', 'origen', 'acciones'];
  
  // Tab activo
  tabSeleccionado = 0;

  constructor(
    private fb: FormBuilder,
    private partidoService: PartidoService,
    private asignacionSeccionService: AsignacionSeccionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.cargarPartidosHoy();
    this.cargarPartidosLocales();
  }

  initForms(): void {
    this.busquedaForm = this.fb.group({
      fecha: [''],
      equipo: [''],
      tipoFuente: ['api'] // 'api', 'local', 'combinado'
    });

    this.crearPartidoForm = this.fb.group({
      equipoLocal: ['', Validators.required],
      equipoVisitante: ['', Validators.required],
      fecha: ['', Validators.required],
      competencia: ['', Validators.required],
      estado: ['SCHEDULED', Validators.required],
      golesLocal: [null],
      golesVisitante: [null]
    });
  }

  // === CARGA DE DATOS ===

  cargarPartidosHoy(): void {
    this.cargandoApi = true;
    this.partidoService.obtenerPartidosHoyApi().subscribe({
      next: (partidos) => {
        this.partidosApi = partidos;
        this.cargandoApi = false;
      },
      error: (error) => {
        console.error('Error cargando partidos de API:', error);
        this.mostrarNotificacion('Error al cargar partidos de la API', 'error');
        this.cargandoApi = false;
      }
    });
  }

  cargarPartidosLocales(): void {
    this.cargandoLocales = true;
    this.partidoService.listarPartidosLocales().subscribe({
      next: (partidos) => {
        this.partidosLocales = partidos;
        this.cargandoLocales = false;
      },
      error: (error) => {
        console.error('Error cargando partidos locales:', error);
        this.mostrarNotificacion('Error al cargar partidos locales', 'error');
        this.cargandoLocales = false;
      }
    });
  }

  cargarPartidosCombinados(): void {
    this.cargandoCombinados = true;
    this.partidoService.obtenerPartidosCombinados().subscribe({
      next: (partidos) => {
        this.partidosCombinados = partidos;
        this.cargandoCombinados = false;
      },
      error: (error) => {
        console.error('Error cargando partidos combinados:', error);
        this.mostrarNotificacion('Error al cargar vista combinada', 'error');
        this.cargandoCombinados = false;
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
        this.partidoService.buscarPorFechaApi(fechaISO).subscribe({
          next: (partidos) => {
            this.partidosApi = partidos;
            this.cargandoApi = false;
            this.tabSeleccionado = 0;
          },
          error: (error) => this.manejarError(error, 'Error en búsqueda por fecha (API)')
        });
        break;

      case 'combinado':
        this.cargandoCombinados = true;
        this.partidoService.buscarPorFechaCombinado(fechaISO).subscribe({
          next: (partidos) => {
            this.partidosCombinados = partidos;
            this.cargandoCombinados = false;
            this.tabSeleccionado = 2;
          },
          error: (error) => this.manejarError(error, 'Error en búsqueda combinada por fecha')
        });
        break;
    }
  }

  private buscarPorEquipo(equipo: string, tipoFuente: string): void {
    switch (tipoFuente) {
      case 'api':
        this.cargandoApi = true;
        this.partidoService.buscarPorEquipoApi(equipo).subscribe({
          next: (partidos) => {
            this.partidosApi = partidos;
            this.cargandoApi = false;
            this.tabSeleccionado = 0;
          },
          error: (error) => this.manejarError(error, 'Error en búsqueda por equipo (API)')
        });
        break;

      case 'local':
        this.cargandoLocales = true;
        this.partidoService.buscarPartidosLocalesPorEquipo(equipo).subscribe({
          next: (partidos) => {
            this.partidosLocales = partidos;
            this.cargandoLocales = false;
            this.tabSeleccionado = 1;
          },
          error: (error) => this.manejarError(error, 'Error en búsqueda por equipo (Local)')
        });
        break;
    }
  }

  // === GESTIÓN DE PARTIDOS ===

  guardarPartidoDeApi(partido: Partido): void {
    this.guardandoPartido = true;
    
    this.asignacionSeccionService.obtenerSeccionPartidos().subscribe({
      next: (seccionId) => {
        this.partidoService.guardarPartidoDeApi(partido, seccionId || undefined).subscribe({
          next: (partidoGuardado) => {
            this.mostrarNotificacion('✅ Partido guardado en base de datos local', 'success');
            this.cargarPartidosLocales(); // Recargar la lista local
            this.guardandoPartido = false;
          },
          error: (error) => {
            this.manejarError(error, 'Error al guardar partido');
            this.guardandoPartido = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener sección de partidos:', error);
        // Guardar sin sección asignada
        this.partidoService.guardarPartidoDeApi(partido).subscribe({
          next: () => {
            this.mostrarNotificacion('✅ Partido guardado (sin sección asignada)', 'success');
            this.cargarPartidosLocales();
            this.guardandoPartido = false;
          },
          error: (error) => this.manejarError(error, 'Error al guardar partido')
        });
      }
    });
  }

  crearPartidoLocal(): void {
    if (this.crearPartidoForm.invalid) {
      this.mostrarNotificacion('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.creandoPartido = true;
    const formData = new FormData();
    const formValue = this.crearPartidoForm.value;

    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== null && formValue[key] !== '') {
        if (key === 'fecha') {
          const fechaISO = new Date(formValue[key]).toISOString();
          formData.append(key, fechaISO);
        } else {
          formData.append(key, formValue[key].toString());
        }
      }
    });

    this.asignacionSeccionService.obtenerSeccionPartidos().subscribe({
      next: (seccionId) => {
        this.partidoService.crearPartidoLocal(formData, seccionId || undefined).subscribe({
          next: (partidoCreado) => {
            this.mostrarNotificacion('✅ Partido creado correctamente', 'success');
            this.crearPartidoForm.reset();
            this.cargarPartidosLocales();
            this.creandoPartido = false;
          },
          error: (error) => {
            this.manejarError(error, 'Error al crear partido');
            this.creandoPartido = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener sección:', error);
        this.partidoService.crearPartidoLocal(formData).subscribe({
          next: () => {
            this.mostrarNotificacion('✅ Partido creado (sin sección)', 'success');
            this.crearPartidoForm.reset();
            this.cargarPartidosLocales();
            this.creandoPartido = false;
          },
          error: (error) => this.manejarError(error, 'Error al crear partido')
        });
      }
    });
  }

  eliminarPartidoLocal(partido: Partido): void {
    if (!partido.id) return;

    const confirmacion = confirm(`¿Estás seguro de eliminar el partido ${partido.equipoLocal} vs ${partido.equipoVisitante}?`);
    if (!confirmacion) return;

    this.partidoService.eliminarPartidoLocal(partido.id).subscribe({
      next: () => {
        this.mostrarNotificacion('✅ Partido eliminado correctamente', 'success');
        this.cargarPartidosLocales();
      },
      error: (error) => this.manejarError(error, 'Error al eliminar partido')
    });
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

  formatearEquipos(partido: Partido): string {
    return `${partido.equipoLocal} vs ${partido.equipoVisitante}`;
  }

  formatearResultado(partido: Partido): string {
    if (partido.golesLocal !== null && partido.golesVisitante !== null) {
      return `${partido.golesLocal} - ${partido.golesVisitante}`;
    }
    return partido.estado === 'FINISHED' ? 'Sin datos' : '-';
  }

  obtenerColorEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'LIVE': return 'accent';
      case 'FINISHED': return 'primary';
      case 'SCHEDULED': return 'warn';
      default: return '';
    }
  }

  obtenerIconoOrigen(esDeApi: boolean): string {
    return esDeApi ? 'cloud' : 'storage';
  }

  limpiarBusqueda(): void {
    this.busquedaForm.reset({ tipoFuente: 'api' });
    this.cargarPartidosHoy();
    this.cargarPartidosLocales();
  }

  private manejarError(error: any, mensaje: string): void {
    console.error(mensaje, error);
    this.mostrarNotificacion(`❌ ${mensaje}`, 'error');
    this.cargandoApi = false;
    this.cargandoLocales = false;
    this.cargandoCombinados = false;
    this.guardandoPartido = false;
    this.creandoPartido = false;
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
