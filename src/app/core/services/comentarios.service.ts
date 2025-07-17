import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// === INTERFACES SEGÚN DOCUMENTACIÓN DEL BACKEND ===

export interface CrearComentarioDTO {
  noticiaId: number;
  autor: string;
  mensaje: string;
  autorId?: number;      // Para usuarios autenticados
}

export interface ComentarioDTO {
  id: number;
  autor?: string;        // Para comentarios públicos
  autorId?: number;      // Para comentarios de usuarios autenticados
  autorNombre?: string;  // Nombre del autor autenticado
  mensaje: string;       // Texto del comentario
  noticiaId: number;
  fecha: string;         // Fecha del comentario (compatibilidad backend)
  aprobado: boolean;
  noticiaTitle?: string; // Para administración
}

// 🆕 NUEVA INTERFAZ PARA INFO COMPLETA DE COMENTARIOS
export interface InfoComentariosDTO {
  comentarios: ComentarioDTO[];
  totalComentarios: number;        // Total (aprobados + pendientes)
  comentariosAprobados: number;    // Solo aprobados
  puedeComentary: boolean;         // Si puede agregar más comentarios
  limite: number;                  // Límite máximo (5)
  restantes: number;               // Comentarios restantes
}

export interface EstadisticasComentariosDTO {
  total: number;        // Total de comentarios en el sistema
  aprobados: number;    // Comentarios aprobados y visibles
  pendientes: number;   // Esperando aprobación
  rechazados: number;   // Eliminados
}

export interface ApiResponseDTO<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/comentarios`;

  constructor(private http: HttpClient) { }

  // === MÉTODOS PÚBLICOS (Sin Autenticación) ===

  /**
   * 🆕 NUEVO - Obtener información completa de comentarios con límite
   */
  obtenerInfoComentarios(noticiaId: number): Observable<ApiResponseDTO<InfoComentariosDTO>> {
    console.log(`🔄 Obteniendo información completa de comentarios para noticia ${noticiaId}`);

    return this.http.get<ApiResponseDTO<InfoComentariosDTO>>(`${this.apiUrl}/noticia/${noticiaId}/info`)
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ Información de comentarios obtenida:', response.data);
            console.log(`📊 Total: ${response.data.totalComentarios}, Aprobados: ${response.data.comentariosAprobados}, Restantes: ${response.data.restantes}`);
            if (response.data && Array.isArray(response.data.comentarios)) {
              console.log('📝 Detalle de comentarios:');
              response.data.comentarios.forEach((c, i) => {
                console.log(`  [${i}] id: ${c.id}, autor: ${c.autor || c.autorNombre}, mensaje: ${c.mensaje}, fecha: ${c.fecha}, aprobado: ${c.aprobado}`);
              });
            }
          }
        }),
        catchError(error => {
          console.error('❌ Error al obtener información de comentarios:', error);
          return of({
            success: false,
            message: 'Error al obtener información de comentarios',
            data: {
              comentarios: [],
              totalComentarios: 0,
              comentariosAprobados: 0,
              puedeComentary: false,
              limite: 5,
              restantes: 0
            }
          });
        })
      );
  }

  /**
   * Crear comentario con validación de límite
   */
  crearComentario(comentarioData: CrearComentarioDTO): Observable<ApiResponseDTO<ComentarioDTO>> {
    console.log(`🔄 Creando comentario para noticia ${comentarioData.noticiaId}:`, comentarioData);

    return this.http.post<ApiResponseDTO<ComentarioDTO>>(
      `${this.apiUrl}/noticia/${comentarioData.noticiaId}`,
      comentarioData
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Comentario creado exitosamente:', response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Error al crear comentario:', error);

        // Manejo específico para límite excedido
        if (error.error?.codigo === 'LIMITE_COMENTARIOS_EXCEDIDO') {
          return of({
            success: false,
            message: 'Esta noticia ya tiene el máximo de comentarios permitidos (5)',
            data: null as any
          });
        }

        return of({
          success: false,
          message: error.error?.message || 'Error al enviar el comentario. Inténtalo de nuevo.',
          data: null as any
        });
      })
    );
  }

  /**
   * Crear comentario simple (retrocompatibilidad)
   * @deprecated Usar crearComentario() en su lugar
   */
  crearComentarioSimple(autor: string, mensaje: string, noticiaId: number): Observable<ApiResponseDTO<ComentarioDTO>> {
    console.log(`🔄 Creando comentario simple para noticia ${noticiaId}`);
    const params = new HttpParams()
      .set('autor', autor)
      .set('mensaje', mensaje);
    return this.http.post<ApiResponseDTO<ComentarioDTO>>(
      `${this.apiUrl}/noticia/${noticiaId}/simple`,
      null,
      { params }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Comentario simple creado exitosamente:', response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Error al crear comentario simple:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al enviar el comentario simple. Inténtalo de nuevo.',
          data: null as any
        });
      })
    );
  }

  /**
   * Obtener comentarios aprobados de una noticia (público)
   */
  obtenerComentariosDeNoticia(noticiaId: number): Observable<ComentarioDTO[]> {
    console.log(`🔄 Obteniendo comentarios de noticia ${noticiaId}`);

    return this.http.get<ComentarioDTO[]>(`${this.apiUrl}/noticia/${noticiaId}`)
      .pipe(
        tap(comentarios => {
          console.log(`✅ Comentarios obtenidos: ${comentarios.length}`);
        }),
        catchError(error => {
          console.error('❌ Error al obtener comentarios:', error);
          return of([]);
        })
      );
  }

  /**
   * Buscar comentarios por contenido (público)
   */
  buscarComentarios(texto: string): Observable<ComentarioDTO[]> {
    console.log(`🔄 Buscando comentarios con texto: "${texto}"`);

    const params = new HttpParams().set('texto', texto);

    return this.http.get<ApiResponseDTO<ComentarioDTO[]>>(`${this.apiUrl}/buscar`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            console.log(`✅ Encontrados ${response.data.length} comentarios`);
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ Error al buscar comentarios:', error);
          return of([]);
        })
      );
  }

  // === MÉTODOS DE ADMINISTRACIÓN (Requieren Autenticación) ===

  /**
   * Ver todos los comentarios de una noticia (incluyendo pendientes) - Admin
   */
  obtenerTodosLosComentariosDeNoticia(noticiaId: number): Observable<ComentarioDTO[]> {
    console.log(`🔄 [ADMIN] Obteniendo todos los comentarios de noticia ${noticiaId}`);

    return this.http.get<ApiResponseDTO<ComentarioDTO[]>>(`${this.apiUrl}/admin/noticia/${noticiaId}`)
      .pipe(
        map(response => {
          if (response.success) {
            console.log(`✅ [ADMIN] Comentarios obtenidos: ${response.data.length}`);
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al obtener comentarios:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener comentarios pendientes de aprobación - Admin
   */
  obtenerComentariosPendientes(): Observable<ComentarioDTO[]> {
    console.log('🔄 [ADMIN] Obteniendo comentarios pendientes de aprobación');

    return this.http.get<ApiResponseDTO<ComentarioDTO[]>>(`${this.apiUrl}/admin/pendientes`)
      .pipe(
        map(response => {
          if (response.success) {
            console.log(`✅ [ADMIN] Comentarios pendientes: ${response.data.length}`);
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al obtener comentarios pendientes:', error);
          return of([]);
        })
      );
  }

  /**
   * Listado paginado para administración
   */
  obtenerComentariosPaginados(page: number = 1, limit: number = 20, soloAprobados: boolean = false): Observable<any> {
    console.log(`🔄 [ADMIN] Obteniendo comentarios paginados (página ${page}, límite ${limit})`);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('soloAprobados', soloAprobados.toString());

    return this.http.get<any>(`${this.apiUrl}/admin`, { params })
      .pipe(
        tap(response => {
          if (response.success) {
            console.log(`✅ [ADMIN] Página ${page} obtenida exitosamente`);
          }
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al obtener comentarios paginados:', error);
          return of({
            success: false,
            message: 'Error al cargar comentarios',
            data: {
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0
            }
          });
        })
      );
  }

  /**
   * Obtener estadísticas de comentarios - Admin
   */
  obtenerEstadisticas(): Observable<EstadisticasComentariosDTO> {
    console.log('🔄 [ADMIN] Obteniendo estadísticas de comentarios');

    return this.http.get<ApiResponseDTO<EstadisticasComentariosDTO>>(`${this.apiUrl}/admin/estadisticas`)
      .pipe(
        map(response => {
          if (response.success) {
            console.log('✅ [ADMIN] Estadísticas obtenidas:', response.data);
            return response.data;
          }
          // Devolver estadísticas vacías si hay error
          return {
            total: 0,
            aprobados: 0,
            pendientes: 0,
            rechazados: 0
          };
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al obtener estadísticas:', error);
          return of({
            total: 0,
            aprobados: 0,
            pendientes: 0,
            rechazados: 0
          });
        })
      );
  }

  /**
   * Aprobar comentario - Admin
   */
  aprobarComentario(comentarioId: number): Observable<ApiResponseDTO<ComentarioDTO>> {
    console.log(`🔄 [ADMIN] Aprobando comentario ${comentarioId}`);

    return this.http.patch<ApiResponseDTO<ComentarioDTO>>(`${this.apiUrl}/${comentarioId}/aprobar`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ [ADMIN] Comentario aprobado exitosamente:', response.data);
          }
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al aprobar comentario:', error);
          return of({
            success: false,
            message: 'Error al aprobar el comentario. Inténtalo de nuevo.',
            data: null as any
          });
        })
      );
  }

  /**
   * Eliminar comentario - Admin
   */
  eliminarComentario(comentarioId: number): Observable<ApiResponseDTO<string>> {
    console.log(`🔄 [ADMIN] Eliminando comentario ${comentarioId}`);

    return this.http.delete<ApiResponseDTO<string>>(`${this.apiUrl}/${comentarioId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ [ADMIN] Comentario eliminado exitosamente');
          }
        }),
        catchError(error => {
          console.error('❌ [ADMIN] Error al eliminar comentario:', error);
          return of({
            success: false,
            message: 'Error al eliminar el comentario. Inténtalo de nuevo.',
            data: 'Error'
          });
        })
      );
  }

  // === MÉTODOS UTILITARIOS ===

  /**
   * Contar comentarios aprobados de una noticia
   */
  contarComentariosAprobados(noticiaId: number): Observable<number> {
    return this.obtenerComentariosDeNoticia(noticiaId)
      .pipe(
        map(comentarios => comentarios.length),
        catchError(() => of(0))
      );
  }

  /**
   * Validar contenido del comentario antes de enviar
   */
  validarComentario(comentario: CrearComentarioDTO): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!comentario.mensaje || comentario.mensaje.trim().length === 0) {
      errores.push('El contenido del comentario es obligatorio');
    }

    if (comentario.mensaje && comentario.mensaje.length > 1000) {
      errores.push('El comentario no puede superar los 1000 caracteres');
    }

    if (!comentario.noticiaId || comentario.noticiaId <= 0) {
      errores.push('ID de noticia inválido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Validar formato de email
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  }

  /**
   * Obtener mensaje de estado del comentario
   */
  obtenerMensajeEstado(comentario: ComentarioDTO): string {
    if (comentario.aprobado) {
      return 'Comentario aprobado y visible';
    } else {
      return 'Comentario pendiente de aprobación';
    }
  }
}
