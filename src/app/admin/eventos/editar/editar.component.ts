import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventosService, Evento } from '../../../core/services/eventos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { SeccionesService, SeccionResponse } from '../../../core/services/secciones.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './editar.component.html',
  styleUrls: ['./editar.component.scss']
})
export class EditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventosService = inject(EventosService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private seccionesService = inject(SeccionesService);

  form!: FormGroup;
  eventoId!: number;
  imagenPreview: string = '';
  imagenUrl: string = '';
  imagenSeleccionada: File | null = null;
  cargando = false;
  guardando = false;
  secciones: SeccionResponse[] = [];
  cargandoSecciones = false;

  eventos: Evento[] = [];
  autorIdActual: number = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.eventoId = Number(idParam);
      this.verificarPermisosYCargarEvento();
    } else {
      this.cargarTodosLosEventos();
    }
  }

  verificarPermisosYCargarEvento(): void {
    this.eventosService.obtenerPorId(this.eventoId).subscribe({
      next: (evento) => {
        const autorIdActual = this.authService.obtenerIdUsuario();

        // Verificar si el evento pertenece al usuario actual consultando la lista de sus eventos
        this.eventosService.listarPorCreador(autorIdActual || 0).subscribe({
          next: (eventosDelUsuario) => {
            const eventoPertenece = eventosDelUsuario.some(e => e.id === this.eventoId);

            if (!eventoPertenece) {
              this.snackBar.open('No tienes permiso para editar este evento', 'Cerrar', { duration: 5000 });
              this.router.navigate(['/admin']);
              return;
            }

            this.cargarEvento();
          },
          error: (error) => {
            this.snackBar.open('Error al verificar permisos', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/admin']);
          }
        });
      },
      error: (error) => {
        this.snackBar.open('Evento no encontrado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      }
    });
  }

  cargarTodosLosEventos(): void {
    this.cargando = true;
    this.autorIdActual = this.authService.obtenerIdUsuario() || 0;

    // Usar listarPorCreador en lugar de listarTodos para obtener solo eventos del usuario actual
    this.eventosService.listarPorCreador(this.autorIdActual).subscribe({
      next: (eventos) => {
        this.eventos = eventos;
        this.cargando = false;
        if (eventos.length === 0) {
          this.snackBar.open('No tienes eventos creados', 'Cerrar', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error al cargar eventos del usuario:', error);
        this.snackBar.open('Error al cargar tus eventos', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  seleccionarEvento(id?: number): void {
    if (id != null) {
      // Como todos los eventos mostrados son del usuario actual, puede editarlos
      this.router.navigate(['/admin/eventos/editar', id]);
    }
  }

  cargarEvento(): void {
    this.cargando = true;
    this.eventosService.obtenerPorId(this.eventoId).subscribe({
      next: (evento) => {
        if (!evento) {
          this.snackBar.open('Evento no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/admin']);
          return;
        }

        this.form = this.fb.group({
          nombre: [evento.nombre ?? '', Validators.required],
          descripcion: [evento.descripcion ?? '', Validators.required],
          fecha: [evento.fecha ?? '', Validators.required],
          hora: [evento.hora ?? ''],
          lugar: [evento.lugar ?? '', Validators.required],
          ciudad: [evento.ciudad ?? ''],
          tipoEvento: [evento.tipoEvento ?? 'partido'],
          importancia: [evento.importancia ?? 'media'],
          equipoLocal: [evento.equipoLocal ?? ''],
          equipoVisitante: [evento.equipoVisitante ?? ''],
          seccionId: [evento.seccion_id ?? ''],
          competicion: [evento.competicion ?? ''],
          estado: [evento.estado ?? 'programado'],
          precioEstimado: [evento.precioEstimado ?? 0],
          videoUrl: [evento.videoUrl ?? ''],
          tags: [evento.tags ?? ''],
          notas: [evento.notas ?? '']
        });

        this.imagenPreview = evento.imagenEvento ?? '';
        this.imagenUrl = evento.imagenEvento ?? '';
        this.cargando = false;

        // Cargar secciones después de cargar el evento
        this.cargarSecciones();
      },
      error: (error) => {
        this.snackBar.open('Error al cargar el evento', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      }
    });
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
        this.snackBar.open('Error al cargar las secciones', 'Cerrar', { duration: 3000 });
        this.cargandoSecciones = false;
      }
    });
  }

  actualizarEvento(): void {
    if (!this.form || this.form.invalid) {
      this.snackBar.open('Por favor completa todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;
    const formData = new FormData();

    // Campos básicos
    formData.append('nombre', this.form.get('nombre')?.value || '');
    formData.append('descripcion', this.form.get('descripcion')?.value || '');
    formData.append('fecha', this.form.get('fecha')?.value || '');
    formData.append('hora', this.form.get('hora')?.value || '');
    formData.append('lugar', this.form.get('lugar')?.value || '');
    formData.append('ciudad', this.form.get('ciudad')?.value || '');
    formData.append('tipoEvento', this.form.get('tipoEvento')?.value || 'partido');
    formData.append('importancia', this.form.get('importancia')?.value || 'media');
    formData.append('equipoLocal', this.form.get('equipoLocal')?.value || '');
    formData.append('equipoVisitante', this.form.get('equipoVisitante')?.value || '');
    formData.append('competicion', this.form.get('competicion')?.value || '');
    formData.append('estado', this.form.get('estado')?.value || 'programado');
    formData.append('precioEstimado', this.form.get('precioEstimado')?.value || 0);
    formData.append('videoUrl', this.form.get('videoUrl')?.value || '');
    formData.append('tags', this.form.get('tags')?.value || '');
    formData.append('notas', this.form.get('notas')?.value || '');

    // Imagen si se seleccionó una nueva
    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    // Agregar sección si se seleccionó
    if (this.form.get('seccionId')?.value) {
      formData.append('seccionId', this.form.get('seccionId')?.value.toString());
    }

    this.eventosService.actualizar(this.eventoId, formData).subscribe({
      next: () => {
        this.snackBar.open('Evento actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.guardando = false;
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.snackBar.open('Error al actualizar el evento', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.imagenSeleccionada = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelarEdicion(): void {
    if (this.form) {
      this.form.reset();
    }

    this.eventoId = 0;
    this.imagenPreview = '';
    this.imagenUrl = '';
    this.imagenSeleccionada = null;
    this.router.navigate(['/admin/eventos/editar']);
  }

  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  esEventoEditable(evento: any): boolean {
    // Como usamos listarPorCreador(), todos los eventos son del usuario actual
    return true;
  }
}
