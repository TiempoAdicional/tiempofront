import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventosService, Evento } from '../../../core/services/eventos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionSeccionService } from '../../../core/services/asignacion-seccion.service';
import { SeccionesService, SeccionResponse } from '../../../core/services/secciones.service';

// 📦 Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // Material UI
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatSelectModule
  ]
})
export class CrearEventoComponent implements OnInit {
  eventoForm: FormGroup;
  imagenUrl: string | null = null;
  imagenSeleccionada: File | null = null;
  guardando = false;
  secciones: SeccionResponse[] = [];
  cargandoSecciones = false;

  constructor(
    private fb: FormBuilder,
    private eventosService: EventosService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private asignacionSeccionService: AsignacionSeccionService,
    private seccionesService: SeccionesService
  ) {
    this.eventoForm = this.fb.group({
      // Información básica
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipoEvento: ['partido', Validators.required],
      importancia: ['media'],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      
      // Fecha y ubicación
      fecha: ['', Validators.required],
      hora: [''],
      lugar: ['', [Validators.required, Validators.maxLength(100)]],
      ciudad: ['', Validators.maxLength(50)],
      
      // Equipos (para partidos)
      equipoLocal: ['', Validators.maxLength(50)],
      equipoVisitante: ['', Validators.maxLength(50)],
      
      // Organización
      seccionId: [''],
      competicion: [''],
      estado: ['programado'],
      precioEstimado: [0, [Validators.min(0)]],
      
      // Multimedia
      videoUrl: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)],
      
      // Información adicional
      tags: [''],
      notas: ['', Validators.maxLength(300)]
    });
  }

  ngOnInit(): void {
    this.cargarSecciones();
    
    // Suscribirse a cambios en el tipo de evento para validaciones dinámicas
    this.eventoForm.get('tipoEvento')?.valueChanges.subscribe(() => {
      this.validarCamposSegunTipo();
    });
    
    // Configurar validaciones iniciales
    this.validarCamposSegunTipo();
  }

  /**
   * Carga la lista de secciones disponibles
   */
  cargarSecciones(): void {
    this.cargandoSecciones = true;
    this.seccionesService.listar().subscribe({
      next: (secciones: SeccionResponse[]) => {
        // Filtrar solo secciones de eventos que estén activas
        this.secciones = secciones.filter((s: SeccionResponse) => 
          s.tipo === 'EVENTOS' && s.activa
        );
        this.cargandoSecciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar secciones:', error);
        this.mostrarToast('Error al cargar las secciones');
        this.cargandoSecciones = false;
      }
    });
  }

  // ✅ Getters para validaciones
  get nombre() { return this.eventoForm.get('nombre')!; }
  get descripcion() { return this.eventoForm.get('descripcion')!; }
  get fecha() { return this.eventoForm.get('fecha')!; }
  get lugar() { return this.eventoForm.get('lugar')!; }
  get tipoEvento() { return this.eventoForm.get('tipoEvento')!; }
  get videoUrl() { return this.eventoForm.get('videoUrl')!; }

  // ✅ Vista previa de imagen y almacenamiento de archivo
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.mostrarToast('⚠️ Por favor seleccione un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarToast('⚠️ La imagen debe ser menor a 5MB');
        return;
      }

      this.imagenSeleccionada = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
      
      this.mostrarToast('✅ Imagen seleccionada correctamente');
    }
  }

  /**
   * Método para poblar el formulario con datos de ejemplo para pruebas
   */
  llenarFormularioEjemplo(): void {
    this.eventoForm.patchValue({
      nombre: 'Final Liga BetPlay 2025',
      tipoEvento: 'final',
      importancia: 'alta',
      descripcion: 'Gran final del torneo más importante del fútbol colombiano. Un clásico que definirá al nuevo campeón.',
      fecha: new Date('2025-12-15'),
      hora: '20:00',
      lugar: 'Estadio El Campín',
      ciudad: 'Bogotá',
      equipoLocal: 'Atlético Nacional',
      equipoVisitante: 'Millonarios FC',
      competicion: 'liga-betplay',
      estado: 'programado',
      precioEstimado: 150000,
      tags: 'fútbol, liga, final, nacional, millonarios, clásico',
      notas: 'Partido de alta expectativa. Se esperan más de 40,000 espectadores.'
    });
    
    this.mostrarToast('📝 Formulario rellenado con datos de ejemplo');
  }

  /**
   * Validar campos específicos según el tipo de evento
   */
  validarCamposSegunTipo(): void {
    const tipoEvento = this.eventoForm.get('tipoEvento')?.value;
    const equipoLocalControl = this.eventoForm.get('equipoLocal');
    const equipoVisitanteControl = this.eventoForm.get('equipoVisitante');

    if (tipoEvento === 'partido' || tipoEvento === 'final' || tipoEvento === 'semifinal') {
      // Para partidos, los equipos son recomendados
      equipoLocalControl?.setValidators([Validators.maxLength(50)]);
      equipoVisitanteControl?.setValidators([Validators.maxLength(50)]);
    } else {
      // Para torneos y otros eventos, los equipos no son necesarios
      equipoLocalControl?.clearValidators();
      equipoVisitanteControl?.clearValidators();
    }

    equipoLocalControl?.updateValueAndValidity();
    equipoVisitanteControl?.updateValueAndValidity();
  }

  /**
   * Obtener placeholder dinámico según el tipo de evento
   */
  obtenerPlaceholderNombre(): string {
    const tipo = this.eventoForm.get('tipoEvento')?.value;
    
    const placeholders: { [key: string]: string } = {
      'partido': 'Ej. Nacional vs Millonarios',
      'torneo': 'Ej. Copa Colombia 2025',
      'final': 'Ej. Final Liga BetPlay 2025',
      'semifinal': 'Ej. Semifinal Copa Libertadores',
      'cuartos': 'Ej. Cuartos de Final Copa América',
      'amistoso': 'Ej. Amistoso Internacional',
      'clasificatorio': 'Ej. Eliminatorias Qatar 2026',
      'copa': 'Ej. Copa Sudamericana 2025'
    };
    
    return placeholders[tipo] || 'Ej. Nombre del evento deportivo';
  }

  /**
   * Limpiar formulario con confirmación
   */
  limpiarFormulario(): void {
    if (confirm('¿Está seguro de que desea limpiar todo el formulario?')) {
      this.eventoForm.reset();
      this.eventoForm.patchValue({
        tipoEvento: 'partido',
        importancia: 'media',
        estado: 'programado',
        precioEstimado: 0
      });
      this.imagenUrl = null;
      this.imagenSeleccionada = null;
      this.mostrarToast('🗑️ Formulario limpiado');
    }
  }

  // ✅ Envío del formulario como FormData
  onSubmit(): void {
    if (this.eventoForm.invalid || this.guardando) return;

    this.guardando = true;
    const creadorId = this.authService.obtenerIdUsuario();

    if (!creadorId) {
      this.mostrarToast('⚠️ No se pudo obtener el ID del usuario');
      this.guardando = false;
      return;
    }

    const formData = new FormData();
    const formValue = this.eventoForm.value;

    // Información básica
    formData.append('nombre', formValue.nombre);
    formData.append('tipoEvento', formValue.tipoEvento || 'partido');
    formData.append('importancia', formValue.importancia || 'media');
    formData.append('descripcion', formValue.descripcion);

    // Fecha y ubicación
    const fechaISO = new Date(formValue.fecha).toISOString().split('T')[0];
    formData.append('fecha', fechaISO);
    
    if (formValue.hora) {
      formData.append('hora', formValue.hora);
    }
    
    formData.append('lugar', formValue.lugar);
    
    if (formValue.ciudad) {
      formData.append('ciudad', formValue.ciudad);
    }

    // Equipos (si aplica)
    if (formValue.equipoLocal) {
      formData.append('equipoLocal', formValue.equipoLocal);
    }
    
    if (formValue.equipoVisitante) {
      formData.append('equipoVisitante', formValue.equipoVisitante);
    }

    // Organización
    if (formValue.seccionId) {
      formData.append('seccionId', formValue.seccionId.toString());
    }
    
    if (formValue.competicion) {
      formData.append('competicion', formValue.competicion);
    }
    
    formData.append('estado', formValue.estado || 'programado');
    
    if (formValue.precioEstimado && formValue.precioEstimado > 0) {
      formData.append('precioEstimado', formValue.precioEstimado.toString());
    }

    // Multimedia
    if (formValue.videoUrl) {
      formData.append('videoUrl', formValue.videoUrl);
    }

    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    // Información adicional
    if (formValue.tags) {
      formData.append('tags', formValue.tags);
    }
    
    if (formValue.notas) {
      formData.append('notas', formValue.notas);
    }

    // ID del creador
    formData.append('creadorId', creadorId.toString());

    this.eventosService.crear(formData).subscribe({
      next: () => {
        this.mostrarToast('✅ Evento creado correctamente');
        this.eventoForm.reset();
        this.imagenUrl = null;
        this.imagenSeleccionada = null;
        this.guardando = false;
        
        // Opcional: redirigir al dashboard después de crear
        setTimeout(() => {
          this.volverAlDashboard();
        }, 1500);
      },
      error: err => {
        console.error('Error al crear evento:', err);
        this.mostrarToast('❌ Error al crear evento: ' + (err.error?.message || 'Error desconocido'));
        this.guardando = false;
      }
    });
  }

  // ✅ Mostrar notificaciones
  mostrarToast(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-toast']
    });
  }

  // ✅ Regresar al dashboard
  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }
}
