import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventoService, Evento } from '../evento.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})
export class EditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventoService = inject(EventoService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  eventoId!: number;
  imagenPreview: string = '';
  cargando = false;

  eventosDelAutor: Evento[] = [];
  modoSeleccion = true;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.eventoId = Number(idParam);
      this.modoSeleccion = false;
      this.cargarEvento();
    } else {
      this.cargarEventosDelAutor();
    }
  }

  cargarEventosDelAutor(): void {
    this.cargando = true;
    const autorId = Number(localStorage.getItem('userId'));
    this.eventoService.listarPorCreador(autorId).subscribe({
      next: (eventos) => {
        this.eventosDelAutor = eventos;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar los eventos del autor', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      }
    });
  }

  seleccionarEvento(id?: number): void {
    this.router.navigate(['/admin/eventos/editar', id]);
  }

  cargarEvento(): void {
    this.cargando = true;
    this.eventoService.obtenerPorId(this.eventoId).subscribe({
      next: (evento) => {
        this.form = this.fb.group({
          nombre: [evento.nombre ?? '', Validators.required],
          descripcion: [evento.descripcion ?? '', Validators.required],
          fecha: [evento.fecha ?? '', Validators.required],
          lugar: [evento.lugar ?? '', Validators.required],
          imagenEvento: [evento.imagenEvento ?? '', Validators.required],
          videoUrl: [evento.videoUrl ?? '']
        });
        this.imagenPreview = evento.imagenEvento ?? '';
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar el evento', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      }
    });
  }

  actualizarEvento(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor completa todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.form.get('nombre')?.value || '');
    formData.append('descripcion', this.form.get('descripcion')?.value || '');
    formData.append('fecha', this.form.get('fecha')?.value || '');
    formData.append('lugar', this.form.get('lugar')?.value || '');
    formData.append('imagenEvento', this.form.get('imagenEvento')?.value || '');
    formData.append('videoUrl', this.form.get('videoUrl')?.value || '');

    this.eventoService.actualizar(this.eventoId, formData).subscribe({
      next: () => {
        this.snackBar.open('Evento actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.snackBar.open('Error al actualizar el evento', 'Cerrar', { duration: 3000 });
      }
    });
  }

  actualizarPreview(): void {
    const nuevaUrl = this.form.get('imagenEvento')?.value;
    this.imagenPreview = nuevaUrl || '';
  }

  volver(): void {
    this.router.navigate(['/admin']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.form.patchValue({ imagenEvento: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  cancelarEdicion(): void {
  // Limpiar el formulario si está inicializado
  if (this.form) {
    this.form.reset();
  }

  // Volver al modo de selección de eventos
  this.modoSeleccion = true;

  // Limpiar valores auxiliares
  this.eventoId = 0;
  this.imagenPreview = '';

  // Navegar de nuevo a la lista de eventos del autor
  this.router.navigate(['/admin/eventos/editar']);
}



}
