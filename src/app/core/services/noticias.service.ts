import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { ComentarioDTO } from './comentarios.service';

// Interfaces para payloads
export interface CrearNoticiaPayload {
  titulo: string;
  resumen?: string;
  contenidoHtml: string;
  esPublica: boolean;
  imagen?: File;
  destacada?: boolean;
  archivada?: boolean;
  seccionId?: number;
  tags?: string[];
  autoguardadoData?: string;
}

export interface EditarNoticiaPayload {
  titulo: string;
  resumen?: string;
  contenidoHtml: string;
  esPublica: boolean;
  imagenDestacada?: string;
  seccionId?: number;
  tags?: string[];
  fechaPublicacion?: string;
  destacada?: boolean;
  archivada?: boolean;
  autoguardadoData?: string;
}

// Interfaces para respuestas
export interface Noticia {
  id: number;
  titulo: string;
  resumen: string;
  contenidoUrl: string;
  contenidoHtml?: string;
  imagenDestacada: string;
  comentariosUrl?: string;
  esPublica: boolean;
  destacada: boolean;
  archivada?: boolean;
  visitas: number;
  autorId: number;
  autorNombre: string;
  fechaPublicacion: string;
  fechaActualizacion?: string;
  fechaArchivado?: string;
  seccion_id?: number;
  tags?: string[];
  autoguardadoData?: string;
  estadisticas?: {
    visitas: number;
    compartidas: number;
    reacciones: number;
  };
}

export interface NoticiaDetalleDTO {
  noticia: Noticia;
  comentarios: ComentarioDTO[];
  relacionadas?: Noticia[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ListarNoticiasResponse {
  noticias: Noticia[];
  total: number;
  pagina: number;
  tamanioPagina: number;
  totalPaginas: number;
}

export interface FiltrosNoticia {
  titulo?: string;
  esPublica?: boolean;
  destacada?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  autorId?: number;
  seccionId?: number;
}

export interface EstadisticasNoticias {
  totalNoticias: number;
  publicadas: number;
  noticiasPublicas: number;
  destacadas: number;
  ultimosDias: number;
  borradores: number;
  archivadas: number;
  visitasTotales: number;
  promedioVisitasPorNoticia: number;
}

@Injectable({
  providedIn: 'root'
})
export class NoticiasService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/noticias`;
  private readonly noticiasSubject = new BehaviorSubject<Noticia[]>([]);
  
  readonly noticias$ = this.noticiasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS CRUD OPTIMIZADOS ===

  /**
   * Lista todas las noticias - Método público que funciona sin autenticación
   */
  listarTodas(pagina: number = 1, limite: number = 20): Observable<ListarNoticiasResponse> {
    console.log('🔄 Listando todas las noticias usando endpoint público...');
    
    // 🔥 CORREGIDO: Usar endpoint público /publicas que no requiere autenticación
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<any>(`${this.apiUrl}/publicas`, { params })
      .pipe(
        map(response => {
          console.log('✅ Respuesta del servidor (públicas):', response);
          
          // Manejar diferentes formatos de respuesta del backend
          let noticias: Noticia[] = [];
          let total = 0;
          
          if (Array.isArray(response)) {
            // Si es un array directo
            noticias = response;
            total = response.length;
          } else if (response && (response as any).noticias && Array.isArray((response as any).noticias)) {
            // Si viene envuelto en un objeto con propiedad noticias
            noticias = (response as any).noticias;
            total = (response as any).total || (response as any).noticias.length;
          } else if (response && (response as any).content && Array.isArray((response as any).content)) {
            // Si viene en formato paginado de Spring Boot
            noticias = (response as any).content;
            total = (response as any).totalElements || (response as any).content.length;
          } else {
            console.warn('⚠️ Formato de respuesta inesperado:', response);
            noticias = [];
            total = 0;
          }
          
          console.log(`✅ Noticias públicas procesadas: ${noticias.length} de ${total} total`);
          
          // Retornar en el formato esperado por ListarNoticiasResponse
          const result: ListarNoticiasResponse = {
            noticias,
            total,
            pagina,
            tamanioPagina: limite,
            totalPaginas: Math.ceil(total / limite)
          };
          
          return result;
        }),
        catchError(error => {
          console.error('❌ Error en listarTodas (endpoint público):', error);
          console.error('Status:', error.status, 'URL:', error.url);
          
          // 🔥 FALLBACK: Si falla el endpoint público, intentar con datos mock
          console.log('🔄 Usando datos mock como último recurso...');
          
          const mockNoticias: Noticia[] = [
            {
              id: 1,
              titulo: 'Noticia de ejemplo',
              resumen: 'Esta es una noticia de ejemplo para mantener la funcionalidad',
              contenidoUrl: '',
              contenidoHtml: '<p>Contenido de ejemplo</p>',
              imagenDestacada: '/assets/logo-tiempo.png',
              esPublica: true,
              destacada: false,
              visitas: 0,
              autorId: 1,
              autorNombre: 'TiempoAdicional',
              fechaPublicacion: new Date().toISOString(),
              tags: ['ejemplo']
            }
          ];
          
          const fallbackResult: ListarNoticiasResponse = {
            noticias: mockNoticias,
            total: mockNoticias.length,
            pagina,
            tamanioPagina: limite,
            totalPaginas: 1
          };
          
          return of(fallbackResult);
        })
      );
  }

  /**
   * Obtiene noticias públicas con paginación (endpoint público documentado)
   */
  listarNoticiasPublicas(limite: number = 10): Observable<any> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<any>(`${this.apiUrl}/publicas`, { params })
      .pipe(
        tap(response => {
          console.log('✅ Noticias públicas obtenidas:', response);
          // Handle different response formats
          let noticias = [];
          if (response && response.noticias) {
            noticias = response.noticias;
          } else if (Array.isArray(response)) {
            noticias = response;
          }
          
          if (noticias.length > 0) {
            this.noticiasSubject.next(noticias);
          }
          
          return { noticias, total: noticias.length };
        }),
        catchError(error => {
          console.error('❌ Error al obtener noticias públicas:', error);
          return this.handleError<any>('listarNoticiasPublicas', { noticias: [], total: 0 })(error);
        })
      );
  }

  /**
   * Obtiene noticias recientes públicas (endpoint documentado)
   */
  obtenerNoticiasRecientes(limite: number = 5): Observable<Noticia[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<Noticia[]>(`${this.apiUrl}/recientes`, { params })
      .pipe(
        tap(noticias => console.log('✅ Noticias recientes obtenidas:', noticias)),
        catchError(error => {
          console.error('❌ Error al obtener noticias recientes:', error);
          return this.handleError<Noticia[]>('obtenerNoticiasRecientes', [])(error);
        })
      );
  }

  /**
   * Obtiene una noticia específica por ID e incrementa el contador de visitas
   */
  obtenerPorId(id: number): Observable<Noticia> {
    console.log(`🔄 Obteniendo noticia ${id} e incrementando visitas...`);
    
    // 🔥 USAR ENDPOINT QUE INCREMENTA VISITAS AUTOMÁTICAMENTE
    return this.http.get<Noticia>(`${this.apiUrl}/ver/${id}`)
      .pipe(
        tap(noticia => {
          console.log(`✅ Noticia obtenida id=${id}, visitas: ${noticia.visitas}`);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(error => {
          console.warn(`⚠️ Error con endpoint /ver/${id}, intentando endpoint básico:`, error);
          
          // Fallback: usar endpoint básico sin incremento
          return this.http.get<Noticia>(`${this.apiUrl}/${id}`)
            .pipe(
              tap(noticia => console.log(`✅ Noticia obtenida (sin incremento) id=${id}:`, noticia)),
              catchError(this.handleError<Noticia>(`obtenerPorId id=${id}`))
            );
        })
      );
  }

  /**
   * Obtiene el detalle completo de una noticia (con comentarios)
   * Usa el nuevo endpoint del backend que incluye comentarios automáticamente
   */
  verDetalleConComentarios(id: number): Observable<NoticiaDetalleDTO> {
    console.log(`🔄 Obteniendo detalle completo de noticia id=${id}`);
    
    return this.http.get<any>(`${this.apiUrl}/${id}/detalle`)
      .pipe(
        map(response => {
          console.log(`✅ Respuesta del backend (detalle):`, response);
          
          // El backend ahora devuelve { success: true, data: { noticia, comentarios, relacionadas } }
          if (response.success && response.data) {
            const detalle: NoticiaDetalleDTO = {
              noticia: response.data.noticia,
              comentarios: response.data.comentarios || []
            };
            console.log(`✅ Detalle procesado correctamente:`, detalle);
            return detalle;
          } else {
            // Fallback para formato anterior (solo noticia)
            const detalle: NoticiaDetalleDTO = {
              noticia: response,
              comentarios: []
            };
            console.log(`✅ Detalle procesado (formato legacy):`, detalle);
            return detalle;
          }
        }),
        tap(detalle => console.log(`✅ Detalle final id=${id}:`, detalle)),
        catchError(error => {
          console.error(`❌ Error obteniendo detalle de noticia id=${id}:`, error);
          // Retornar estructura vacía para evitar errores en el componente
          const detalleVacio: NoticiaDetalleDTO = {
            noticia: null as any,
            comentarios: []
          };
          return of(detalleVacio);
        })
      );
  }

  /**
   * Crea una nueva noticia con imagen
   */
  crearNoticia(payload: CrearNoticiaPayload, autorId: number): Observable<Noticia> {
    const formData = new FormData();
    
    // Agregar campos básicos
    formData.append('titulo', payload.titulo);
    formData.append('resumen', payload.resumen || '');
    formData.append('contenidoHtml', payload.contenidoHtml);
    formData.append('esPublica', payload.esPublica.toString());
    formData.append('autorId', autorId.toString());
    
    // Agregar campos opcionales
    if (payload.destacada !== undefined) {
      formData.append('destacada', payload.destacada.toString());
    }
    if (payload.seccionId) {
      formData.append('seccionId', payload.seccionId.toString());
    }
    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    if (payload.imagen) {
      formData.append('imagen', payload.imagen);
    }

    console.log('📤 Enviando noticia al backend:', { ...payload, imagen: payload.imagen ? 'FILE_SELECTED' : 'NO_IMAGE' });

    return this.http.post<Noticia>(`${this.apiUrl}`, formData)
      .pipe(
        tap(noticia => {
          console.log('✅ Noticia creada exitosamente:', noticia);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(error => {
          console.error('❌ Error al crear noticia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualiza una noticia existente
   */
  actualizarNoticia(id: number, payload: EditarNoticiaPayload): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        tap(noticia => {
          console.log(`✅ Noticia actualizada id=${id}:`, noticia);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('actualizarNoticia'))
      );
  }

  /**
   * Elimina una noticia por ID
   */
  eliminarNoticia(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          console.log(`✅ Noticia eliminada id=${id}`);
          this.eliminarDelCache(id);
        }),
        catchError(this.handleError<any>('eliminarNoticia'))
      );
  }

  /**
   * Duplica una noticia existente
   */
  duplicarNoticia(id: number): Observable<Noticia> {
    return this.http.post<Noticia>(`${this.apiUrl}/${id}/duplicar`, {})
      .pipe(
        tap(noticia => {
          console.log(`✅ Noticia duplicada, nuevo id=${noticia.id}`);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('duplicarNoticia'))
      );
  }

  /**
   * Archiva una noticia (soft delete)
   */
  archivarNoticia(id: number): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}/archivar`, {})
      .pipe(
        tap(noticia => {
          console.log(`✅ Noticia archivada id=${id}`);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('archivarNoticia'))
      );
  }

  /**
   * Restaura una noticia archivada
   */
  restaurarNoticia(id: number): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}/restaurar`, {})
      .pipe(
        tap(noticia => {
          console.log(`✅ Noticia restaurada id=${id}`);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('restaurarNoticia'))
      );
  }

  /**
   * Obtiene estadísticas de noticias
   */
  obtenerEstadisticas(): Observable<EstadisticasNoticias> {
    return this.http.get<EstadisticasNoticias>(`${this.apiUrl}/estadisticas`)
      .pipe(
        tap(stats => console.log('✅ Estadísticas obtenidas:', stats)),
        catchError(this.handleError<EstadisticasNoticias>('obtenerEstadisticas'))
      );
  }

  /**
   * Obtiene noticias relacionadas por ID
   */
  obtenerRelacionadas(id: number, limite: number = 5): Observable<Noticia[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<Noticia[]>(`${this.apiUrl}/${id}/relacionadas`, { params })
      .pipe(
        tap(noticias => console.log(`✅ Noticias relacionadas para id=${id}:`, noticias)),
        catchError(this.handleError<Noticia[]>('obtenerRelacionadas', []))
      );
  }

  /**
   * Obtiene noticias destacadas
   */
  obtenerDestacadas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/destacadas`)
      .pipe(
        tap(noticias => console.log('✅ Noticias destacadas obtenidas:', noticias)),
        catchError(this.handleError<Noticia[]>('obtenerDestacadas', []))
      );
  }

  /**
   * Obtiene noticias por autor - Método robusto con múltiples fallbacks
   */
  obtenerPorAutor(autorId: number): Observable<Noticia[]> {
    console.log(`🔄 Obteniendo noticias del autor ${autorId}...`);
    
    // 🔥 ESTRATEGIA: Usar endpoint específico /autor/{id}, luego fallbacks
    return this.http.get<Noticia[]>(`${this.apiUrl}/autor/${autorId}`)
      .pipe(
        tap(noticias => console.log(`✅ Noticias obtenidas por autor ${autorId} (endpoint directo):`, noticias.length)),
        catchError(errorDirecto => {
          console.warn(`⚠️ Error en endpoint directo para autor ${autorId}, intentando método autenticado:`, errorDirecto);
          
          // Fallback 1: usar endpoint autenticado con filtros
          return this.listarTodasAutenticado(1, 100, { autorId }).pipe(
            map((response: ListarNoticiasResponse) => {
              const noticiasFiltradas = response.noticias || [];
              console.log(`✅ Noticias obtenidas por autor ${autorId} (método autenticado):`, noticiasFiltradas.length);
              return noticiasFiltradas;
            }),
            catchError(errorAutenticado => {
              console.warn(`⚠️ Error en método autenticado para autor ${autorId}, intentando público:`, errorAutenticado);
              
              // Fallback 2: usar endpoint público y filtrar localmente
              return this.listarTodas().pipe(
                map((response: ListarNoticiasResponse) => {
                  const todasLasNoticias = response.noticias || [];
                  const noticiasFiltradas = todasLasNoticias.filter(noticia => noticia.autorId === autorId);
                  console.log(`✅ Noticias filtradas para autor ${autorId} (método público):`, noticiasFiltradas.length);
                  return noticiasFiltradas;
                }),
                catchError(errorPublico => {
                  console.error(`❌ Error en todos los métodos para autor ${autorId}:`, errorPublico);
                  
                  // Último fallback: devolver array vacío
                  console.log(`🔄 Devolviendo array vacío para autor ${autorId}`);
                  return of([]);
                })
              );
            })
          );
        })
      );
  }

  /**
   * Autoguarda un borrador de noticia
   */
  autoguardar(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/autoguardar`, request)
      .pipe(
        tap(response => console.log('✅ Borrador autoguardado:', response)),
        catchError(this.handleError<any>('autoguardar'))
      );
  }

  /**
   * Genera una vista previa de noticia
   */
  generarVistaPrevia(request: any): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/vista-previa`, request)
      .pipe(
        tap(html => console.log('✅ Vista previa generada')),
        catchError(this.handleError<string>('generarVistaPrevia'))
      );
  }

  /**
   * Obtiene todos los tags disponibles
   */
  obtenerTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`)
      .pipe(
        tap(tags => console.log('✅ Tags obtenidos:', tags)),
        catchError(this.handleError<string[]>('obtenerTags', []))
      );
  }

  /**
   * Cambia el estado de publicación de una noticia
   */
  cambiarEstadoPublicacion(id: number, esPublica: boolean): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}/estado`, { esPublica })
      .pipe(
        tap(noticia => {
          console.log(`✅ Estado de publicación cambiado id=${id}:`, noticia);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('cambiarEstadoPublicacion'))
      );
  }

  /**
   * Cambia el estado destacado de una noticia
   */
  cambiarDestacada(id: number, autorId: number, destacada: boolean): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}/destacada`, { destacada, autorId })
      .pipe(
        tap(noticia => {
          console.log(`✅ Estado destacado cambiado id=${id}:`, noticia);
          this.actualizarCacheNoticia(noticia);
        }),
        catchError(this.handleError<Noticia>('cambiarDestacada'))
      );
  }

  /**
   * Exporta noticias en el formato especificado
   */
  exportarNoticias(formato: 'csv' | 'pdf' | 'excel'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/${formato}`, { responseType: 'blob' })
      .pipe(
        tap(() => console.log(`✅ Noticias exportadas en formato ${formato}`)),
        catchError(this.handleError<Blob>('exportarNoticias'))
      );
  }

  /**
   * Obtiene el contenido HTML de una noticia
   */
  obtenerContenidoHtml(contenidoUrl: string): Observable<string> {
    return this.http.get(contenidoUrl, { responseType: 'text' })
      .pipe(
        tap(html => console.log('✅ Contenido HTML obtenido')),
        catchError(this.handleError<string>('obtenerContenidoHtml', ''))
      );
  }

  /**
   * Obtiene el detalle de una noticia pública (para usuarios no autenticados)
   * Si falla, devuelve información limitada en lugar de error
   */
  obtenerDetallePublico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(detalle => console.log(`✅ Detalle público noticia id=${id}:`, detalle)),
        catchError(error => {
          console.warn(`⚠️ No se pudo obtener detalle público para noticia id=${id}:`, error);
          // En lugar de error, devolver información básica indicando que necesita registro
          return of({
            noticia: {
              id: id,
              titulo: 'Contenido Restringido',
              resumen: 'Regístrate para leer el contenido completo de esta noticia.',
              contenidoHtml: '<p>Este contenido requiere registro. <a href="/register">Regístrate aquí</a> para acceder.</p>',
              imagenDestacada: '',
              fechaPublicacion: new Date().toISOString(),
              autorNombre: 'TiempoAdicional',
              esPublica: false,
              destacada: false,
              visitas: 0,
              autorId: 0,
              contenidoUrl: '',
              requiereRegistro: true
            },
            comentarios: [],
            relacionadas: []
          });
        })
      );
  }

  /**
   * Lista todas las noticias con autenticación (para usuarios admin/editor)
   */
  listarTodasAutenticado(pagina: number = 1, limite: number = 20, filtros?: FiltrosNoticia): Observable<ListarNoticiasResponse> {
    console.log('🔄 Listando todas las noticias con autenticación (admin)...');
    
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('limit', limite.toString());
    
    // Agregar filtros si se proporcionan
    if (filtros) {
      if (filtros.titulo) params = params.set('titulo', filtros.titulo);
      if (filtros.autorId) params = params.set('autorId', filtros.autorId.toString());
      if (filtros.esPublica !== undefined) params = params.set('esPublica', filtros.esPublica.toString());
      if (filtros.destacada !== undefined) params = params.set('destacada', filtros.destacada.toString());
      if (filtros.seccionId) params = params.set('seccionId', filtros.seccionId.toString());
      if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    }
    
    return this.http.get<any>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => {
          console.log('✅ Respuesta del servidor (autenticado):', response);
          
          // Manejar formato de respuesta de la API autenticada
          let noticias: Noticia[] = [];
          let total = 0;
          let totalPaginas = 0;
          
          if (response && response.success && response.data) {
            const data = response.data;
            noticias = data.noticias || [];
            total = data.total || 0;
            totalPaginas = data.totalPaginas || Math.ceil(total / limite);
          } else if (Array.isArray(response)) {
            noticias = response;
            total = response.length;
            totalPaginas = Math.ceil(total / limite);
          }
          
          console.log(`✅ Noticias autenticadas procesadas: ${noticias.length} de ${total} total`);
          
          const result: ListarNoticiasResponse = {
            noticias,
            total,
            pagina,
            tamanioPagina: limite,
            totalPaginas
          };
          
          return result;
        }),
        catchError(error => {
          console.error('❌ Error en listarTodasAutenticado:', error);
          console.error('Status:', error.status, 'URL:', error.url);
          
          // Si falla la API autenticada, fallar back al endpoint público
          console.log('🔄 Fallback a endpoint público...');
          return this.listarTodas(pagina, limite);
        })
      );
  }

  // === MÉTODOS DE UTILIDAD INTERNA ===

  private actualizarCacheNoticia(noticia: Noticia): void {
    const noticias = this.noticiasSubject.value;
    const index = noticias.findIndex(n => n.id === noticia.id);
    
    if (index !== -1) {
      noticias[index] = noticia;
    } else {
      noticias.push(noticia);
    }
    
    this.noticiasSubject.next([...noticias]);
  }

  private eliminarDelCache(id: number): void {
    const noticias = this.noticiasSubject.value.filter(n => n.id !== id);
    this.noticiasSubject.next(noticias);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`❌ Error en ${operation}:`, error);
      
      // Registrar detalles adicionales del error si están disponibles
      if (error.status) {
        console.error(`Status: ${error.status}, URL: ${error.url}`);
      }
      
      // Opcionalmente, se podría enviar el error a un servicio de log remoto
      
      // Devolver un resultado seguro para continuar la ejecución
      return of(result as T);
    };
  }
}
