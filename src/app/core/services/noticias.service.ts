import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

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

export interface Comentario {
  id: number;
  autor: string;
  mensaje: string;
  fecha: string;
  aprobado?: boolean;
}

export interface NoticiaDetalleDTO {
  noticia: Noticia;
  comentarios: Comentario[];
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
  private readonly publicUrl = `${environment.apiBaseUrl}/public/noticias`;
  private readonly noticiasSubject = new BehaviorSubject<Noticia[]>([]);
  
  readonly noticias$ = this.noticiasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS CRUD OPTIMIZADOS ===

  /**
   * Obtiene todas las noticias con paginación (RECOMENDADO)
   */
  listarTodas(pagina: number = 1, limite: number = 10): Observable<ListarNoticiasResponse> {
    const params = new HttpParams()
      .set('page', pagina.toString())
      .set('limit', limite.toString());
    
    return this.http.get<ListarNoticiasResponse>(`${this.apiUrl}`, { params })
      .pipe(
        tap(response => console.log('✅ Noticias obtenidas con paginación:', response)),
        catchError(this.handleError<ListarNoticiasResponse>('listarTodas'))
      );
  }

  /**
   * Obtiene noticias públicas con paginación
   */
  listarNoticiasPublicas(limite: number = 10): Observable<Noticia[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<Noticia[]>(`${this.publicUrl}/limitadas`, { params })
      .pipe(
        tap(noticias => console.log('✅ Noticias públicas obtenidas:', noticias)),
        catchError(this.handleError<Noticia[]>('listarNoticiasPublicas', []))
      );
  }

  /**
   * Obtiene una noticia específica por ID
   */
  obtenerPorId(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(noticia => console.log(`✅ Noticia obtenida id=${id}:`, noticia)),
        catchError(this.handleError<Noticia>(`obtenerPorId id=${id}`))
      );
  }

  /**
   * Obtiene el detalle completo de una noticia (con comentarios)
   */
  verDetalleConComentarios(id: number): Observable<NoticiaDetalleDTO> {
    return this.http.get<NoticiaDetalleDTO>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(detalle => console.log(`✅ Detalle noticia id=${id}:`, detalle)),
        catchError(this.handleError<NoticiaDetalleDTO>(`verDetalleConComentarios id=${id}`))
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
    return this.http.get<Noticia[]>(`${this.publicUrl}/destacadas`)
      .pipe(
        tap(noticias => console.log('✅ Noticias destacadas obtenidas:', noticias)),
        catchError(this.handleError<Noticia[]>('obtenerDestacadas', []))
      );
  }

  /**
   * Obtiene noticias por autor
   */
  obtenerPorAutor(autorId: number): Observable<Noticia[]> {
    const params = new HttpParams().set('autorId', autorId.toString());
    
    return this.http.get<Noticia[]>(`${this.apiUrl}`, { params })
      .pipe(
        tap(noticias => console.log(`✅ Noticias del autor id=${autorId}:`, noticias)),
        catchError(this.handleError<Noticia[]>('obtenerPorAutor', []))
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
   * Método compatible con el dashboard de usuarios
   * Obtiene noticias públicas limitadas según la documentación del backend
   */
  listarNoticiasPublicas2(limite: number = 10): Observable<any> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<any>(`${this.publicUrl}/limitadas`, { params })
      .pipe(
        map(response => {
          // Normalizar respuesta para que siempre tenga el formato esperado por el dashboard
          if (Array.isArray(response)) {
            return { noticias: response };
          } else {
            return response;
          }
        }),
        tap(response => console.log('✅ Noticias públicas obtenidas:', response)),
        catchError(this.handleError<any>('listarNoticiasPublicas2', { noticias: [] }))
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
   * Autoguardar borrador de noticia (método moderno)
   */
  autoguardarModerno(request: any): Observable<any> {
    return this.autoguardar(request);
  }

  /**
   * Actualizar noticia (método moderno)
   */
  actualizarNoticiaModerno(id: number, payload: EditarNoticiaPayload): Observable<Noticia> {
    return this.actualizarNoticia(id, payload);
  }

  /**
   * Vista previa de noticia (método moderno)
   */
  vistaPreviaModerno(request: any): Observable<string> {
    return this.generarVistaPrevia(request);
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
   * Método robusto para cargar noticias
   */
  cargarNoticiasRobusta(autorId: number): Observable<Noticia[]> {
    return this.obtenerPorAutor(autorId);
  }

  /**
   * Lista noticias por autor (método alternativo)
   */
  listarPorAutor(autorId: number): Observable<Noticia[]> {
    return this.obtenerPorAutor(autorId);
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
