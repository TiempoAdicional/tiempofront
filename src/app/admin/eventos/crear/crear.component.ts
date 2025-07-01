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
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      fecha: ['', Validators.required],
      lugar: ['', Validators.required],
      videoUrl: [''],
      seccionId: [''] // Nuevo campo para sección
    });
  }

  ngOnInit(): void {
    this.cargarSecciones();
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

  // ✅ Vista previa de imagen y almacenamiento de archivo
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.imagenSeleccionada = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
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
    formData.append('nombre', this.eventoForm.value.nombre);
    formData.append('descripcion', this.eventoForm.value.descripcion);

    // 🔧 Formato yyyy-MM-dd
    const fechaISO = new Date(this.eventoForm.value.fecha).toISOString().split('T')[0];
    formData.append('fecha', fechaISO);

    formData.append('lugar', this.eventoForm.value.lugar);
    formData.append('creadorId', creadorId.toString());

    // Asignar sección si se seleccionó una
    if (this.eventoForm.value.seccionId) {
      formData.append('seccionId', this.eventoForm.value.seccionId.toString());
    }

    if (this.eventoForm.value.videoUrl) {
      formData.append('videoUrl', this.eventoForm.value.videoUrl);
    }

    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    this.eventosService.crear(formData).subscribe({
      next: () => {
        this.mostrarToast('✅ Evento creado correctamente');
        this.eventoForm.reset();
        this.imagenUrl = null;
        this.imagenSeleccionada = null;
        this.guardando = false;
      },
      error: err => {
        console.error(err);
        this.mostrarToast('❌ Error al crear evento');
        this.guardando = false;
      }
    });
  }

  // ✅ Limpiar formulario
  limpiarFormulario(): void {
    this.eventoForm.reset();
    this.imagenUrl = null;
    this.imagenSeleccionada = null;
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
