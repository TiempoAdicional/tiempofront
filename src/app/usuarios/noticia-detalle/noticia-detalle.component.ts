import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Servicios
import { NoticiasService, Noticia, Comentario } from '../../core/services/noticias.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-noticia-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './noticia-detalle.component.html',
  styleUrls: ['./noticia-detalle.component.scss']
})
export class NoticiaDetalleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  noticia: Noticia | null = null;
  comentarios: Comentario[] = [];
  cargando = true;
  estaAutenticado = false;
  nuevoComentario = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noticiasService: NoticiasService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.estaAutenticado = this.authService.estaAutenticado();
    this.cargarNoticia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarNoticia(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.cargando = false;
      return;
    }

    this.noticiasService.verDetalleConComentarios(Number(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalle) => {
          this.noticia = detalle.noticia;
          if (this.estaAutenticado && detalle.comentarios) {
            this.comentarios = detalle.comentarios;
          } else {
            this.cargarComentarios(); // Usa los comentarios simulados si no hay
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar noticia:', error);
          this.cargando = false;
          this.snackBar.open('Error al cargar la noticia', 'Cerrar', { duration: 3000 });
        }
      });
  }

  private cargarComentarios(): void {
    if (!this.noticia || !this.estaAutenticado) return;

    // Simular comentarios para demostración (en el futuro vendrían del servicio)
    this.comentarios = [
      {
        id: 1,
        autor: 'Carlos Rodríguez',
        mensaje: '¡Excelente análisis! Muy detallado.',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // hace 2 horas
        aprobado: true
      },
      {
        id: 2,
        autor: 'María González',
        mensaje: 'Totalmente de acuerdo con el artículo.',
        fecha: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // hace 4 horas
        aprobado: true
      }
    ];
  }

  enviarComentario(): void {
    if (!this.nuevoComentario.trim() || !this.noticia) return;

    // Crear el nuevo comentario
    const comentario: Comentario = {
      id: Date.now(), // ID temporal
      autor: this.authService.obtenerNombreUsuario() || 'Usuario',
      mensaje: this.nuevoComentario.trim(),
      fecha: new Date().toISOString(),
      aprobado: false // Los comentarios nuevos requieren moderación
    };

    // Agregar el comentario al inicio de la lista
    this.comentarios.unshift(comentario);

    // Aquí enviarías el comentario al servicio
    // Por ahora simulamos el proceso
    this.snackBar.open('Comentario enviado. Será revisado antes de publicarse.', 'Cerrar', { 
      duration: 3000 
    });
    this.nuevoComentario = '';
  }

  volverAlDashboard(): void {
    this.router.navigate(['/usuarios']);
  }

  irARegistro(): void {
    this.router.navigate(['/auth/register']);
  }
}
