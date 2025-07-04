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
import { NoticiasService, Noticia } from '../../core/services/noticias.service';
import { ComentariosService, ComentarioDTO } from '../../core/services/comentarios.service';
import { AuthService } from '../../auth/services/auth.service';

// Componentes
import { ComentariosComponent } from '../../shared/comentarios/comentarios.component';

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
    MatSnackBarModule,
    ComentariosComponent
  ],
  templateUrl: './noticia-detalle.component.html',
  styleUrls: ['./noticia-detalle.component.scss']
})
export class NoticiaDetalleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  noticia: Noticia | null = null;
  comentarios: ComentarioDTO[] = [];
  cargando = true;
  estaAutenticado = false;
  nuevoComentario = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noticiasService: NoticiasService,
    private comentariosService: ComentariosService,
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

    // Usar método según estado de autenticación
    const observable = this.estaAutenticado 
      ? this.noticiasService.verDetalleConComentarios(Number(id))
      : this.noticiasService.obtenerDetallePublico(Number(id));

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📰 Respuesta del servicio:', response);
          
          // Handle different response formats
          let noticia;
          let comentarios = [];
          
          // Check if response has detalle.noticia structure (authenticated) or is direct noticia (public)
          if (response && response.noticia) {
            // Authenticated user response: { noticia: {...}, comentarios: [...] }
            noticia = response.noticia;
            comentarios = response.comentarios || [];
          } else if (response && (response.id || response.titulo)) {
            // Public user response: direct noticia object
            noticia = response;
            comentarios = [];
          } else {
            console.error('❌ Error: formato de respuesta inválido:', response);
            this.cargando = false;
            this.snackBar.open('No se pudo cargar la noticia', 'Cerrar', { duration: 5000 });
            setTimeout(() => {
              this.router.navigate(['/usuarios']);
            }, 2000);
            return;
          }
          
          this.noticia = noticia;
          
          // Solo mostrar comentarios aprobados para usuarios no-admin
          if (this.estaAutenticado && comentarios.length > 0) {
            this.comentarios = comentarios.filter((c: any) => c.aprobado === true);
          } else {
            this.comentarios = []; // No mostrar comentarios para usuarios no autenticados
          }
          
          this.cargando = false;
          
          // ✅ Ya no mostrar mensaje de registro - permitir acceso público al contenido
          console.log('📰 Noticia cargada correctamente para usuario', this.estaAutenticado ? 'autenticado' : 'público');
        },
        error: (error) => {
          console.error('Error al cargar noticia:', error);
          this.cargando = false;
          
          // ✅ Mensaje genérico - no mencionar registro
          this.snackBar.open('Error al cargar la noticia', 'Cerrar', { duration: 5000 });
          
          // Redirigir al dashboard si hay error
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 2000);
        }
      });
  }

  private cargarComentarios(): void {
    if (!this.noticia || !this.estaAutenticado) return;

    // Los comentarios ya se cargan con la noticia en cargarNoticia()
    // Si necesitas recargarlos por separado, aquí llamarías al servicio
    console.log('ℹ️ Los comentarios se cargan automáticamente con la noticia');
  }

  enviarComentario(): void {
    if (!this.nuevoComentario.trim() || !this.noticia) return;

    const nuevoComentario = {
      autor: this.authService.obtenerNombreUsuario() || 'Usuario',
      mensaje: this.nuevoComentario.trim()
    };

    // Usar el servicio real de comentarios
    this.comentariosService.crearComentario(this.noticia.id, nuevoComentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.comentarios.unshift(response.data);
            this.snackBar.open('Comentario enviado y pendiente de aprobación', 'Cerrar', { 
              duration: 4000 
            });
            this.nuevoComentario = '';
          } else {
            this.snackBar.open(response.message || 'Error al enviar comentario', 'Cerrar', { 
              duration: 3000 
            });
          }
        },
        error: (error) => {
          console.error('Error al enviar comentario:', error);
          this.snackBar.open('Error al enviar comentario. Inténtalo de nuevo.', 'Cerrar', { 
            duration: 5000 
          });
        }
      });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/usuarios']);
  }

  irARegistro(): void {
    this.router.navigate(['/auth/register']);
  }

  // 🔥 NUEVO: Métodos para el componente de comentarios
  onComentarioCreado(comentario: ComentarioDTO): void {
    this.comentarios.unshift(comentario);
    console.log('✅ Comentario agregado a la lista:', comentario);
  }

  onComentarioAprobado(comentario: ComentarioDTO): void {
    const index = this.comentarios.findIndex(c => c.id === comentario.id);
    if (index !== -1) {
      this.comentarios[index] = comentario;
    }
  }

  onComentarioEliminado(comentarioId: number): void {
    this.comentarios = this.comentarios.filter(c => c.id !== comentarioId);
  }
}
