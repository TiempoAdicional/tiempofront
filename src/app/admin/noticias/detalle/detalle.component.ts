import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NoticiasService, NoticiaDetalleDTO } from '../../../core/services/noticias.service';
import { ComentariosService, ComentarioDTO } from '../../../core/services/comentarios.service';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environment/environment';

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
  private comentariosService = inject(ComentariosService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  detalle: NoticiaDetalleDTO | null = null;
  contenidoHtml = '';
  cargando = true;
  cargandoComentarios = false;
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
   * Carga la noticia con toda la información detallada incluidos TODOS los comentarios
   */
  private cargarDetalleCompleto(noticiaId: number): void {
    this.cargando = true;
    
    // Para administradores, cargamos la noticia y TODOS los comentarios por separado
    this.noticiasService.obtenerPorId(noticiaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticia) => {
          console.log('📰 Noticia recibida del servicio:', noticia);
          
          if (!noticia) {
            console.error('❌ Error: noticia no encontrada');
            this.error = 'No se pudo cargar la noticia - datos inválidos.';
            this.cargando = false;
            return;
          }
          
          // Crear estructura de detalle temporal
          this.detalle = {
            noticia: noticia,
            comentarios: []
          };
          
          // Cargar TODOS los comentarios para admin (incluidos pendientes)
          this.cargarTodosLosComentarios(noticiaId);
          
          // Cargar el contenido HTML si está disponible
          if (noticia.contenidoUrl) {
            this.cargarContenidoHtml(noticia.contenidoUrl);
          } else {
            console.warn('⚠️ No hay contenidoUrl, usando contenidoHtml directo');
            this.contenidoHtml = noticia.contenidoHtml || 'Sin contenido disponible';
            this.cargando = false;
          }
          
          this.cargarMetricas(noticiaId);
          this.cargarNoticiasRelacionadas(noticiaId);
          this.incrementarVisita(noticiaId);
        },
        error: (err) => {
          console.error('❌ Error al cargar noticia:', err);
          this.error = 'No se pudo cargar la noticia. Verifique que existe y que tiene permisos para verla.';
          this.cargando = false;
        }
      });
  }

  /**
   * CARGA TODOS LOS COMENTARIOS PARA ADMINISTRADORES
   * Incluye comentarios aprobados y pendientes
   */
  private cargarTodosLosComentarios(noticiaId: number): void {
    console.log(`🔄 [ADMIN] Intentando cargar comentarios para noticia ${noticiaId}`);
    console.log(`🔄 [ADMIN] Usuario autenticado:`, this.authService.estaAutenticado());
    console.log(`🔄 [ADMIN] Token:`, this.authService.obtenerToken());
    
    // Primero probar el endpoint público para ver si hay comentarios
    console.log('🔄 [ADMIN] Probando endpoint público primero...');
    this.comentariosService.obtenerComentariosDeNoticia(noticiaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentariosPublicos: ComentarioDTO[]) => {
          console.log(`✅ [ADMIN] Comentarios públicos encontrados: ${comentariosPublicos.length}`, comentariosPublicos);
          
          // Luego intentar con el endpoint de admin
          console.log('🔄 [ADMIN] Ahora probando endpoint de admin...');
          this.comentariosService.obtenerTodosLosComentariosDeNoticia(noticiaId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (comentariosAdmin: ComentarioDTO[]) => {
                console.log(`✅ [ADMIN] Comentarios de admin cargados: ${comentariosAdmin.length}`, comentariosAdmin);
                if (this.detalle) {
                  this.detalle.comentarios = comentariosAdmin;
                }
              },
              error: (errAdmin: any) => {
                console.error('❌ Error con endpoint de admin, usando comentarios públicos:', errAdmin);
                if (this.detalle) {
                  this.detalle.comentarios = comentariosPublicos;
                }
              }
            });
        },
        error: (errPublico: any) => {
          console.error('❌ Error con endpoint público:', errPublico);
          if (this.detalle) {
            this.detalle.comentarios = [];
          }
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
    if (!url) {
      console.warn('⚠️ No hay URL de contenido disponible');
      this.contenidoHtml = 'Sin contenido disponible';
      this.cargando = false;
      return;
    }
    
    fetch(url)
      .then(resp => {
        if (!resp.ok) {
          throw new Error(`HTTP error! status: ${resp.status}`);
        }
        return resp.text();
      })
      .then(html => {
        this.contenidoHtml = html || 'Sin contenido disponible';
        this.cargando = false;
      })
      .catch(err => {
        console.error('❌ Error al cargar el contenido HTML:', err);
        // Usar contenido HTML directo como fallback
        if (this.detalle?.noticia?.contenidoHtml) {
          this.contenidoHtml = this.detalle.noticia.contenidoHtml;
        } else {
          this.contenidoHtml = 'No se pudo cargar el contenido.';
        }
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
            visitas: this.detalle?.noticia?.visitas || 0,
            tiempoPromedioPagina: '2:30', // valor simulado
            rebote: 0.25, // valor simulado 
            compartidos: 0,
            comentarios: this.detalle?.comentarios?.length || 0,
            reacciones: 0
          };
        },
        error: (error: any) => {
          console.error('Error al cargar métricas:', error);
          // Usar métricas básicas
          this.metricas = {
            ...this.metricas,
            visitas: this.detalle?.noticia?.visitas || 0,
            comentarios: this.detalle?.comentarios?.length || 0
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
        next: (noticias: any) => {
          console.log('🔄 Noticias relacionadas recibidas:', noticias);
          
          // Validar que noticias sea un array
          if (Array.isArray(noticias)) {
            this.noticiasRelacionadas = noticias.slice(0, 5); // Máximo 5
          } else if (noticias && noticias.noticias && Array.isArray(noticias.noticias)) {
            // Si viene en formato envuelto
            this.noticiasRelacionadas = noticias.noticias.slice(0, 5);
          } else {
            console.warn('⚠️ Formato de noticias relacionadas inesperado:', noticias);
            this.noticiasRelacionadas = [];
          }
          
          console.log('✅ Noticias relacionadas procesadas:', this.noticiasRelacionadas.length);
        },
        error: (error: any) => {
          console.error('❌ Error al cargar noticias relacionadas:', error);
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
    } else if (this.detalle) {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.mostrarExito('Enlace copiado al portapapeles');
      }).catch(() => {
        this.mostrarError('Error al copiar enlace');
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
  calcularTiempoLectura(): number {
    if (!this.contenidoHtml) return 0;
    const palabras = this.contenidoHtml.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(palabras / 200); // Asumiendo 200 palabras por minuto
  }

  obtenerColorEstado(): string {
    if (!this.detalle?.noticia) return 'accent';
    return this.detalle.noticia.esPublica ? 'primary' : 'warn';
  }

  obtenerTextoEstado(): string {
    if (!this.detalle?.noticia) return '';
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

  /**
   * Método público para recargar comentarios manualmente
   */
  recargarComentarios(): void {
    if (this.detalle?.noticia?.id) {
      console.log('🔄 Recargando comentarios manualmente...');
      console.log('🔄 URL del endpoint:', `${environment.apiBaseUrl}/api/comentarios/admin/noticia/${this.detalle.noticia.id}`);
      
      this.cargandoComentarios = true;
      this.cargarTodosLosComentarios(this.detalle.noticia.id);
      
      // Resetear el estado de carga después de un tiempo
      setTimeout(() => {
        this.cargandoComentarios = false;
      }, 2000);
    }
  }

  /**
   * Alternar vista de comentarios (para móvil)
   */
  mostrarComentarios = false;
  mostrarFormularioComentario = false;
  
  toggleComentarios(): void {
    this.mostrarComentarios = !this.mostrarComentarios;
  }

  // Getters para el template
  get fechaFormateada(): string {
    return this.detalle?.noticia?.fechaPublicacion ? 
      this.formatearFecha(this.detalle.noticia.fechaPublicacion) : '';
  }

  get tiempoLectura(): number {
    return this.calcularTiempoLectura();
  }

  get tieneTags(): boolean {
    return !!(this.detalle?.noticia?.tags && this.detalle.noticia.tags.length > 0);
  }

  get tags(): string[] {
    return this.detalle?.noticia?.tags || [];
  }

  get comentariosAprobados(): number {
    return this.detalle?.comentarios?.filter(c => c.aprobado)?.length || 0;
  }

  get comentariosPendientes(): number {
    return this.detalle?.comentarios?.filter(c => !c.aprobado)?.length || 0;
  }

  // === GESTIÓN DE EVENTOS DE COMENTARIOS ===

  /**
   * Maneja cuando se crea un nuevo comentario
   */
  onComentarioCreado(comentario: ComentarioDTO): void {
    console.log('✅ Nuevo comentario creado en admin:', comentario);
    
    // Ocultar el formulario después de crear
    this.mostrarFormularioComentario = false;
    
    // Recargar todos los comentarios para mostrar el nuevo
    if (this.detalle?.noticia?.id) {
      this.cargarTodosLosComentarios(this.detalle.noticia.id);
    }
  }

  /**
   * Maneja cuando se aprueba un comentario
   */
  onComentarioAprobado(comentario: ComentarioDTO): void {
    console.log('✅ Comentario aprobado en admin:', comentario);
    
    // Actualizar el comentario en la lista local
    if (this.detalle?.comentarios) {
      const index = this.detalle.comentarios.findIndex(c => c.id === comentario.id);
      if (index >= 0) {
        this.detalle.comentarios[index] = comentario;
      }
    }
  }

  /**
   * Maneja cuando se elimina un comentario
   */
  onComentarioEliminado(comentarioId: number): void {
    console.log('✅ Comentario eliminado en admin:', comentarioId);
    
    // Remover el comentario de la lista local
    if (this.detalle?.comentarios) {
      this.detalle.comentarios = this.detalle.comentarios.filter(c => c.id !== comentarioId);
    }
  }

  /**
   * Método para agregar comentarios de prueba (solo para desarrollo)
   */
  agregarComentariosPrueba(): void {
    if (this.detalle?.noticia?.id) {
      console.log('🔄 Creando comentario de prueba...');
      
      // Usar el servicio para crear un comentario real
      this.comentariosService.crearComentario({
        noticiaId: this.detalle.noticia.id,
        contenido: 'Este es un comentario de prueba creado desde el admin para verificar que funciona la integración con la base de datos.'
      }).subscribe({
        next: (response) => {
          console.log('✅ Comentario de prueba creado:', response);
          if (response.success) {
            // Recargar todos los comentarios
            this.cargarTodosLosComentarios(this.detalle!.noticia.id);
          }
        },
        error: (error) => {
          console.error('❌ Error al crear comentario de prueba:', error);
        }
      });
    }
  }

  /**
   * Método para debuggear el estado de los comentarios
   */
  debugComentarios(): void {
    if (this.detalle?.noticia?.id) {
      console.log('🔍 DEBUG - Estado actual de comentarios:');
      console.log('🔍 Noticia ID:', this.detalle.noticia.id);
      console.log('🔍 Comentarios en detalle:', this.detalle.comentarios);
      console.log('🔍 Usuario autenticado:', this.authService.estaAutenticado());
      console.log('🔍 Token:', this.authService.obtenerToken());
      console.log('🔍 Rol:', this.authService.obtenerRol());
      console.log('🔍 Endpoint admin:', `${environment.apiBaseUrl}/api/comentarios/admin/noticia/${this.detalle.noticia.id}`);
      console.log('🔍 Endpoint público:', `${environment.apiBaseUrl}/api/comentarios/noticia/${this.detalle.noticia.id}`);
    }
  }

  /**
   * Cargar estadísticas generales de comentarios
   */
  cargarEstadisticasComentarios(): void {
    this.comentariosService.obtenerEstadisticas().subscribe({
      next: (estadisticas) => {
        console.log('📊 Estadísticas de comentarios:', estadisticas);
        this.mostrarExito(`Sistema: ${estadisticas.total} comentarios, ${estadisticas.pendientes} pendientes`);
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
      }
    });
  }

  /**
   * Obtener comentarios pendientes del sistema (útil para admin general)
   */
  verComentariosPendientesGlobal(): void {
    this.comentariosService.obtenerComentariosPendientes().subscribe({
      next: (comentarios) => {
        console.log('📝 Comentarios pendientes en el sistema:', comentarios);
        const mensaje = comentarios.length > 0 
          ? `Hay ${comentarios.length} comentarios pendientes de aprobación`
          : 'No hay comentarios pendientes';
        this.mostrarExito(mensaje);
      },
      error: (error) => {
        console.error('❌ Error al obtener comentarios pendientes:', error);
      }
    });
  }

  /**
   * Aprobar un comentario específico
   */
  aprobarComentario(comentario: ComentarioDTO): void {
    if (comentario.id) {
      console.log('🔄 Aprobando comentario:', comentario.id);
      
      this.comentariosService.aprobarComentario(comentario.id).subscribe({
        next: (response) => {
          console.log('✅ Comentario aprobado:', response);
          if (response.success) {
            // Actualizar el comentario localmente
            if (this.detalle?.comentarios) {
              const index = this.detalle.comentarios.findIndex(c => c.id === comentario.id);
              if (index >= 0) {
                this.detalle.comentarios[index] = { ...comentario, aprobado: true };
              }
            }
            this.mostrarExito('Comentario aprobado exitosamente');
          }
        },
        error: (error) => {
          console.error('❌ Error al aprobar comentario:', error);
          this.mostrarError('Error al aprobar el comentario');
        }
      });
    }
  }

  /**
   * Eliminar un comentario específico
   */
  eliminarComentario(comentario: ComentarioDTO): void {
    if (comentario.id && confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      console.log('🔄 Eliminando comentario:', comentario.id);
      
      this.comentariosService.eliminarComentario(comentario.id).subscribe({
        next: (response) => {
          console.log('✅ Comentario eliminado:', response);
          if (response.success) {
            // Remover el comentario localmente
            if (this.detalle?.comentarios) {
              this.detalle.comentarios = this.detalle.comentarios.filter(c => c.id !== comentario.id);
            }
            this.mostrarExito('Comentario eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('❌ Error al eliminar comentario:', error);
          this.mostrarError('Error al eliminar el comentario');
        }
      });
    }
  }

  /**
   * Formatear fecha para mostrar en comentarios
   */
  formatearFecha(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  }
}
