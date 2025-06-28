import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SeccionesService, SeccionRequest, SeccionResponse } from '../../services/secciones.service';

@Component({
  selector: 'app-crear-editar-seccion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './crear-editar.component.html',
  styleUrls: ['./crear-editar.component.scss']
})
export class CrearEditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seccionesService = inject(SeccionesService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  seccionId?: number;
  isEditMode = false;
  cargando = false;

  tipos = [
    { value: 'NOTICIAS', label: '📰 Noticias', icon: 'article' },
    { value: 'EVENTOS', label: '🎉 Eventos', icon: 'event' },
    { value: 'PARTIDOS', label: '⚽ Partidos', icon: 'sports_soccer' }
  ];

  ngOnInit(): void {
    this.inicializarFormulario();
    this.verificarModoEdicion();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', [Validators.maxLength(200)]],
      tipo: ['NOTICIAS', Validators.required],
      orden: [1, [Validators.required, Validators.min(1)]],
      activa: [true]
    });
  }

  verificarModoEdicion(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.seccionId = Number(id);
      this.isEditMode = true;
      this.cargarSeccion();
    } else {
      this.calcularProximoOrden();
    }
  }

  cargarSeccion(): void {
    if (!this.seccionId) return;
    
    this.cargando = true;
    this.seccionesService.obtenerPorId(this.seccionId).subscribe({
      next: (seccion) => {
        this.form.patchValue({
          titulo: seccion.titulo,
          descripcion: seccion.descripcion || '',
          tipo: seccion.tipo,
          orden: seccion.orden,
          activa: seccion.activa
        });
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar sección:', error);
        this.snackBar.open('Error al cargar la sección', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      }
    });
  }

  calcularProximoOrden(): void {
    this.seccionesService.listar().subscribe({
      next: (secciones) => {
        const maxOrden = secciones.reduce((max, seccion) => Math.max(max, seccion.orden), 0);
        this.form.patchValue({ orden: maxOrden + 1 });
      },
      error: (error) => {
        console.error('Error al calcular orden:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const seccionData: SeccionRequest = this.form.value;
    this.cargando = true;

    if (this.isEditMode && this.seccionId) {
      this.actualizarSeccion(seccionData);
    } else {
      this.crearSeccion(seccionData);
    }
  }

  crearSeccion(seccionData: SeccionRequest): void {
    this.seccionesService.crear(seccionData).subscribe({
      next: (seccion) => {
        this.snackBar.open('Sección creada correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        console.error('Error al crear sección:', error);
        this.snackBar.open('Error al crear la sección', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  actualizarSeccion(seccionData: SeccionRequest): void {
    if (!this.seccionId) return;

    this.seccionesService.actualizar(this.seccionId, seccionData).subscribe({
      next: (seccion) => {
        this.snackBar.open('Sección actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        console.error('Error al actualizar sección:', error);
        this.snackBar.open('Error al actualizar la sección', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin']);
  }

  // Helpers para el template
  get titulo() { return this.form.get('titulo'); }
  get descripcion() { return this.form.get('descripcion'); }
  get tipo() { return this.form.get('tipo'); }
  get orden() { return this.form.get('orden'); }
  get activa() { return this.form.get('activa'); }

  getTituloComponente(): string {
    return this.isEditMode ? 'Editar Sección' : 'Crear Nueva Sección';
  }

  getIconoComponente(): string {
    return this.isEditMode ? 'edit' : 'add';
  }
} 
