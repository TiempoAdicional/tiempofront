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
  cargando = true;
  estaAutenticado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noticiasService: NoticiasService,
    private comentariosService: ComentariosService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.cargarNoticia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarAutenticacion(): void {
    this.authService.autenticado$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isAuth: boolean) => {
      this.estaAutenticado = isAuth;
      console.log('🔐 Estado de autenticación:', this.estaAutenticado);
    });
  }

  private cargarNoticia(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('❌ ID de noticia no encontrado');
      this.router.navigate(['/usuarios']);
      return;
    }

    // 🆕 Simplificado: usar siempre el endpoint público
    // El componente de comentarios maneja su propia carga
    this.noticiasService.obtenerDetallePublico(Number(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticia) => {
          console.log('📰 Noticia cargada:', noticia);
          this.noticia = noticia;
          this.cargando = false;
          
          // ✅ Verificar que el contenido esté disponible
          if (this.noticia && !this.noticia.contenidoHtml && this.noticia.resumen) {
            console.log('⚠️ Usando resumen como contenido principal');
            this.noticia.contenidoHtml = `<p>${this.noticia.resumen}</p>`;
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar noticia:', error);
          this.cargando = false;
          this.snackBar.open('No se pudo cargar la noticia', 'Cerrar', { duration: 5000 });
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 2000);
        }
      });
  }

  // === EVENT HANDLERS PARA COMENTARIOS ===

  onComentarioCreado(comentario: ComentarioDTO): void {
    console.log('✅ Comentario creado:', comentario);
    // El componente de comentarios maneja su propia actualización
  }

  onComentarioAprobado(comentario: ComentarioDTO): void {
    console.log('✅ Comentario aprobado:', comentario);
    // El componente de comentarios maneja su propia actualización
  }

  onComentarioEliminado(comentarioId: number): void {
    console.log('✅ Comentario eliminado:', comentarioId);
    // El componente de comentarios maneja su propia actualización
  }

  // === MÉTODOS DE NAVEGACIÓN ===

  volverAlDashboard(): void {
    this.router.navigate(['/usuarios']);
  }

  irARegistro(): void {
    this.router.navigate(['/auth/register']);
  }

  // === MÉTODOS DE UTILIDAD ===

  formatearFecha(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fecha;
    }
  }

  obtenerNombreAutor(): string {
    if (!this.noticia) return '';
    
    if (this.noticia.autorNombre) {
      return this.noticia.autorNombre;
    }
    
    return 'Equipo Tiempo Adicional';
  }

  // === COMPARTIR EN REDES SOCIALES ===

  compartirEnFacebook(): void {
    if (!this.noticia) return;
    
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  compartirEnTwitter(): void {
    if (!this.noticia) return;
    
    const url = window.location.href;
    const text = `${this.noticia.titulo} - Tiempo Adicional`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  compartirEnWhatsApp(): void {
    if (!this.noticia) return;
    
    const url = window.location.href;
    const text = `${this.noticia.titulo} - Tiempo Adicional: ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  }

  compartirNativo(): void {
    if (!this.noticia) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.noticia.titulo,
        text: this.noticia.resumen || this.noticia.titulo,
        url: window.location.href
      }).catch(err => {
        console.log('Error al compartir:', err);
      });
    } else {
      // Fallback: copiar enlace
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', { duration: 3000 });
      }).catch(() => {
        this.snackBar.open('Error al copiar enlace', 'Cerrar', { duration: 3000 });
      });
    }
  }
}
