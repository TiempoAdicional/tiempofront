import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventoService } from '../evento.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionSeccionService } from '../../secciones/services/asignacion-seccion.service';

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
    MatTooltipModule
  ]
})
export class CrearEventoComponent {
  eventoForm: FormGroup;
  imagenUrl: string | null = null;
  imagenSeleccionada: File | null = null;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private asignacionSeccionService: AsignacionSeccionService
  ) {
    this.eventoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      fecha: ['', Validators.required],
      lugar: ['', Validators.required],
      videoUrl: ['']
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

  // ✅ Envío del formulario como FormData con asignación automática de sección
  onSubmit(): void {
    if (this.eventoForm.invalid || this.guardando) return;

    this.guardando = true;
    const creadorId = this.authService.obtenerIdUsuario();

    if (!creadorId) {
      this.mostrarToast('⚠️ No se pudo obtener el ID del usuario');
      this.guardando = false;
      return;
    }

    // Obtener la sección de eventos automáticamente
    this.asignacionSeccionService.obtenerSeccionEventos().subscribe({
      next: (seccionId) => {
        const formData = new FormData();
        formData.append('nombre', this.eventoForm.value.nombre);
        formData.append('descripcion', this.eventoForm.value.descripcion);

        // 🔧 Formato yyyy-MM-dd
        const fechaISO = new Date(this.eventoForm.value.fecha).toISOString().split('T')[0];
        formData.append('fecha', fechaISO);

        formData.append('lugar', this.eventoForm.value.lugar);
        formData.append('creadorId', creadorId.toString());

        // Asignar sección automáticamente si existe
        if (seccionId) {
          formData.append('seccionId', seccionId.toString());
        }

        if (this.eventoForm.value.videoUrl) {
          formData.append('videoUrl', this.eventoForm.value.videoUrl);
        }

        if (this.imagenSeleccionada) {
          formData.append('imagen', this.imagenSeleccionada);
        }

        this.eventoService.crear(formData).subscribe({
          next: () => {
            this.mostrarToast(
              seccionId 
                ? '✅ Evento creado correctamente y asignado a sección de Eventos' 
                : '✅ Evento creado correctamente (sin sección asignada)'
            );
            this.eventoForm.reset();
            this.imagenUrl = null;
            this.imagenSeleccionada = null;
          },
          error: err => {
            console.error(err);
            this.mostrarToast('❌ Error al crear evento');
          },
          complete: () => this.guardando = false
        });
      },
      error: (err) => {
        console.error('Error al obtener sección de eventos:', err);
        this.mostrarToast('⚠️ Error al asignar sección, pero se intentará crear el evento');
        // Continuar sin sección asignada
        this.crearEventoSinSeccion(creadorId);
      }
    });
  }

  // Método auxiliar para crear evento sin sección
  private crearEventoSinSeccion(creadorId: number): void {
    const formData = new FormData();
    formData.append('nombre', this.eventoForm.value.nombre);
    formData.append('descripcion', this.eventoForm.value.descripcion);

    const fechaISO = new Date(this.eventoForm.value.fecha).toISOString().split('T')[0];
    formData.append('fecha', fechaISO);

    formData.append('lugar', this.eventoForm.value.lugar);
    formData.append('creadorId', creadorId.toString());

    if (this.eventoForm.value.videoUrl) {
      formData.append('videoUrl', this.eventoForm.value.videoUrl);
    }

    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    this.eventoService.crear(formData).subscribe({
      next: () => {
        this.mostrarToast('✅ Evento creado correctamente');
        this.eventoForm.reset();
        this.imagenUrl = null;
        this.imagenSeleccionada = null;
      },
      error: err => {
        console.error(err);
        this.mostrarToast('❌ Error al crear evento');
      },
      complete: () => this.guardando = false
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
