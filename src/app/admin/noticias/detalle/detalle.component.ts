import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NoticiasService, NoticiaDetalleDTO } from '../../../core/services/noticias.service';
import { AuthService } from '../../../auth/services/auth.service';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-detalle-noticia',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    // Material Design
    MatCardModule, MatButtonModule, MatIconModule, MatToolbarModule,
    MatProgressSpinnerModule, MatChipsModule, MatDividerModule, MatTooltipModule,
    MatBadgeModule, MatMenuModule, MatTabsModule, MatExpansionModule, MatListModule
  ],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss']
})
export class DetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noticiasService = inject(NoticiasService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  detalle: NoticiaDetalleDTO | null = null;
  contenidoHtml = '';
  cargando = true;
  error: string | null = null;
  
  // Estados y funcionalidades adicionales
  mostrandoEstadisticas = false;
  noticiasRelacionadas: any[] = [];
  esAutorDeLaNoticia = false;
  activeTab = 0;

  // Métricas mejoradas
  metricas = {
    visitas: 0,
    tiempoPromedioPagina: '0:00',
    rebote: 0,
    compartidos: 0,
    comentarios: 0,
    reacciones: 0
  };

  ngOnInit(): void {
    const noticiaId = Number(this.route.snapshot.paramMap.get('id'));
    if (!noticiaId || isNaN(noticiaId)) {
      this.error = 'ID de noticia no válido';
      this.cargando = false;
      return;
    }

    this.cargarDetalleCompleto(noticiaId);
    this.verificarAutoria(noticiaId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARGA DEL DETALLE COMPLETO
   * Carga la noticia con toda la información detallada
   */
  private cargarDetalleCompleto(noticiaId: number): void {
    this.cargando = true;
    
    this.noticiasService.verDetalleConComentarios(noticiaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.detalle = data;
          this.cargarContenidoHtml(data.noticia.contenidoUrl);
          this.cargarMetricas(noticiaId);
          this.cargarNoticiasRelacionadas(noticiaId);
          this.incrementarVisita(noticiaId);
        },
        error: (err) => {
          console.error('❌ Error al cargar detalle de noticia:', err);
          this.error = 'No se pudo cargar la noticia.';
          this.cargando = false;
        }
      });
  }

  /**
   * VERIFICACIÓN DE AUTORÍA
   * Verifica si el usuario actual es el autor de la noticia
   */
  private verificarAutoria(noticiaId: number): void {
    const usuarioActual = this.authService.obtenerIdUsuario();
    if (usuarioActual) {
      this.noticiasService.obtenerPorId(noticiaId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (noticia) => {
            this.esAutorDeLaNoticia = noticia.autorId === usuarioActual;
          },
          error: (error) => console.error('Error al verificar autoría:', error)
        });
    }
  }

  /**
   * CARGA DEL CONTENIDO HTML
   * Obtiene el contenido completo de la noticia
   */
  private cargarContenidoHtml(url: string): void {
    fetch(url)
      .then(resp => resp.text())
      .then(html => {
        this.contenidoHtml = html;
        this.cargando = false;
      })
      .catch(err => {
        console.error('❌ Error al cargar el contenido HTML:', err);
        this.error = 'No se pudo cargar el contenido.';
        this.cargando = false;
      });
  }

  /**
   * CARGA DE MÉTRICAS AVANZADAS
   * Obtiene estadísticas detalladas de la noticia
   */
  private cargarMetricas(noticiaId: number): void {
    this.noticiasService.obtenerEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estadisticas) => {
          this.metricas = {
            visitas: this.detalle?.noticia.visitas || 0,
            tiempoPromedioPagina: '2:30', // valor simulado
            rebote: 0.25, // valor simulado 
            compartidos: 0,
            comentarios: this.detalle?.comentarios.length || 0,
            reacciones: 0
          };
        },
        error: (error: any) => {
          console.error('Error al cargar métricas:', error);
          // Usar métricas básicas
          this.metricas = {
            ...this.metricas,
            visitas: this.detalle?.noticia.visitas || 0,
            comentarios: this.detalle?.comentarios.length || 0
          };
        }
      });
  }

  /**
   * CARGA DE NOTICIAS RELACIONADAS
   * Obtiene noticias similares o del mismo autor
   */
  private cargarNoticiasRelacionadas(noticiaId: number): void {
    this.noticiasService.obtenerRelacionadas(noticiaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticias) => {
          this.noticiasRelacionadas = noticias.slice(0, 5); // Máximo 5
        },
        error: (error: any) => {
          console.error('Error al cargar noticias relacionadas:', error);
          this.noticiasRelacionadas = [];
        }
      });
  }

  /**
   * INCREMENTO DE VISITA
   * Registra la visita a la noticia
   */
  private incrementarVisita(noticiaId: number): void {
    // Solo incrementar si no es el autor viendo su propia noticia
    if (!this.esAutorDeLaNoticia && this.detalle) {
      // Incrementar localmente
      this.detalle.noticia.visitas = (this.detalle.noticia.visitas || 0) + 1;
      this.metricas.visitas++;
    }
  }

  /**
   * ACCIONES DE EDICIÓN
   * Funciones para editar la noticia
   */
  editarNoticia(): void {
    if (this.detalle && this.esAutorDeLaNoticia) {
      this.router.navigate(['/admin/noticias/editar', this.detalle.noticia.id]);
    }
  }

  duplicarNoticia(): void {
    if (this.detalle && this.esAutorDeLaNoticia) {
      this.noticiasService.duplicarNoticia(this.detalle.noticia.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (nuevaNoticia) => {
            this.mostrarExito('Noticia duplicada correctamente');
            this.router.navigate(['/admin/noticias/editar', nuevaNoticia.id]);
          },
          error: (error) => {
            console.error('Error al duplicar noticia:', error);
            this.mostrarError('Error al duplicar la noticia');
          }
        });
    }
  }

  cambiarEstadoPublicacion(): void {
    if (this.detalle && this.esAutorDeLaNoticia) {
      const nuevoEstado = !this.detalle.noticia.esPublica;
      
      // Simulamos el cambio de estado localmente
      this.detalle.noticia.esPublica = nuevoEstado;
      this.mostrarExito(
        `Noticia ${nuevoEstado ? 'publicada' : 'despublicada'} correctamente`
      );
    }
  }

  /**
   * ACCIONES DE EXPORTACIÓN Y COMPARTIR
   */
  exportarNoticia(): void {
    if (this.detalle) {
      // Simular exportación
      this.mostrarExito('Funcionalidad de exportación en desarrollo');
    }
  }

  compartirNoticia(): void {
    if (this.detalle && navigator.share) {
      navigator.share({
        title: this.detalle.noticia.titulo,
        text: this.detalle.noticia.resumen,
        url: window.location.href
      }).catch(err => console.log('Error al compartir:', err));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.mostrarExito('Enlace copiado al portapapeles');
      });
    }
  }

  /**
   * NAVEGACIÓN
   */
  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  volverAListado(): void {
    this.router.navigate(['/admin/noticias/listar']);
  }

  irANoticia(noticiaId: number): void {
    this.router.navigate(['/admin/noticias/detalle', noticiaId]);
  }

  abrirVistaPrevia(): void {
    if (this.detalle) {
      const url = `/noticia/${this.detalle.noticia.id}/preview`;
      window.open(url, '_blank');
    }
  }

  /**
   * TOGGLE DE PESTAÑAS Y VISTAS
   */
  toggleEstadisticas(): void {
    this.mostrandoEstadisticas = !this.mostrandoEstadisticas;
  }

  /**
   * UTILIDADES
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calcularTiempoLectura(): number {
    if (!this.contenidoHtml) return 0;
    const palabras = this.contenidoHtml.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(palabras / 200); // Asumiendo 200 palabras por minuto
  }

  obtenerColorEstado(): string {
    if (!this.detalle) return 'accent';
    return this.detalle.noticia.esPublica ? 'primary' : 'warn';
  }

  obtenerTextoEstado(): string {
    if (!this.detalle) return '';
    return this.detalle.noticia.esPublica ? 'Pública' : 'Borrador';
  }

  private mostrarExito(mensaje: string): void {
    console.log('✅ ' + mensaje);
    // Aquí se podría integrar con un servicio de notificaciones
  }

  private mostrarError(mensaje: string): void {
    console.error('❌ ' + mensaje);
    // Aquí se podría integrar con un servicio de notificaciones
  }

  /**
   * Recarga la página actual
   */
  recargarPagina(): void {
    window.location.reload();
  }

  // Getters para el template
  get fechaFormateada(): string {
    return this.detalle ? this.formatearFecha(this.detalle.noticia.fechaPublicacion) : '';
  }

  get tiempoLectura(): number {
    return this.calcularTiempoLectura();
  }

  get tieneTags(): boolean {
    return !!(this.detalle?.noticia.tags && this.detalle.noticia.tags.length > 0);
  }

  get tags(): string[] {
    return this.detalle?.noticia.tags || [];
  }
}
