import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

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

export interface Noticia {
  id: number;
  titulo: string;
  resumen: string;
  contenidoUrl: string;
  contenidoHtml?: string; // Campo para contenido HTML directo
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
  autoguardadoData?: string; // Campo para datos de autoguardado
  estadisticas?: {
    visitas: number;
    compartidas: number;
    reacciones: number;
  };
}

export interface NoticiaDetalleDTO {
  noticia: Noticia;
  comentarios: Comentario[];
  relacionadas?: Noticia[];
}

export interface Comentario {
  id: number;
  autor: string;
  mensaje: string;
  fecha: string;
  aprobado: boolean;
}

export interface FiltrosNoticia {
  titulo?: string;
  autorId?: number;
  esPublica?: boolean;
  destacada?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  seccionId?: number;
  tags?: string[];
}

export interface EstadisticasNoticias {
  totalNoticias: number;
  noticiasPublicas: number;
  noticiasDestacadas: number;
  visitasTotales: number;
  noticiasRecientes: number;
  borradores: number;
  archivadas: number;
  promedioVisitasPorNoticia: number;
}

export interface MetricasNoticia {
  visitas: number;
  tiempoLectura: number;
  compartidas: number;
  reacciones: number;
}

export interface ListarNoticiasResponse {
  noticias: Noticia[];
  total: number;
  pagina: number;
  limite: number;
}

@Injectable({
  providedIn: 'root'
})
export class NoticiasService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/noticias`;
  private readonly noticiasSubject = new BehaviorSubject<Noticia[]>([]);
  private readonly estadisticasSubject = new BehaviorSubject<EstadisticasNoticias | null>(null);
  
  readonly noticias$ = this.noticiasSubject.asObservable();
  readonly estadisticas$ = this.estadisticasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS CRUD PRINCIPALES ===

  listarTodas(pagina: number = 1, limite: number = 10, filtros?: FiltrosNoticia): Observable<ListarNoticiasResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ListarNoticiasResponse>(this.apiUrl, { params })
      .pipe(
        tap(response => this.noticiasSubject.next(response.noticias)),
        catchError(this.handleError<ListarNoticiasResponse>('listarTodas'))
      );
  }

  obtenerPorId(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<Noticia>(`obtenerPorId id=${id}`))
      );
  }

  obtenerDetalleCompleto(id: number): Observable<NoticiaDetalleDTO> {
    return this.http.get<NoticiaDetalleDTO>(`${this.apiUrl}/${id}/detalle`)
      .pipe(
        catchError(this.handleError<NoticiaDetalleDTO>(`obtenerDetalleCompleto id=${id}`))
      );
  }

  crear(payload: CrearNoticiaPayload): Observable<Noticia> {
    const formData = this.buildFormData(payload);
    
    return this.http.post<Noticia>(`${this.apiUrl}/crear`, formData)
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('crear'))
      );
  }

  actualizar(id: number, payload: EditarNoticiaPayload): Observable<Noticia> {
    const formData = this.buildFormDataForEdit(payload);
    
    return this.http.put<Noticia>(`${this.apiUrl}/${id}`, formData)
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('actualizar'))
      );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.eliminarDelCache(id)),
        catchError(this.handleError<string>('eliminar'))
      );
  }

  // === MÉTODOS ESPECIALIZADOS ===

  obtenerPublicas(limite?: number): Observable<Noticia[]> {
    const params = limite ? new HttpParams().set('limite', limite.toString()) : undefined;
    
    return this.http.get<Noticia[]>(`${this.apiUrl}/publicas`, { params })
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerPublicas', []))
      );
  }

  obtenerDestacadas(limite?: number): Observable<Noticia[]> {
    const params = limite ? new HttpParams().set('limite', limite.toString()) : undefined;
    
    return this.http.get<Noticia[]>(`${this.apiUrl}/destacadas`, { params })
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerDestacadas', []))
      );
  }

  obtenerRecientes(limite: number = 5): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/recientes`, {
      params: { limite: limite.toString() }
    }).pipe(
      catchError(this.handleError<Noticia[]>('obtenerRecientes', []))
    );
  }

  obtenerPorAutor(autorId: number): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/autor/${autorId}`)
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerPorAutor', []))
      );
  }

  obtenerPorSeccion(seccionId: number): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/seccion/${seccionId}`)
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerPorSeccion', []))
      );
  }

  buscarPorTitulo(titulo: string): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/buscar`, {
      params: { titulo }
    }).pipe(
      catchError(this.handleError<Noticia[]>('buscarPorTitulo', []))
    );
  }

  buscarPorTags(tags: string[]): Observable<Noticia[]> {
    let params = new HttpParams();
    tags.forEach(tag => params = params.append('tags', tag));
    
    return this.http.get<Noticia[]>(`${this.apiUrl}/buscar/tags`, { params })
      .pipe(
        catchError(this.handleError<Noticia[]>('buscarPorTags', []))
      );
  }

  // === GESTIÓN DE ESTADO ===

  cambiarEstadoPublicacion(id: number, esPublica: boolean): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/estado`, { esPublica })
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('cambiarEstadoPublicacion'))
      );
  }

  destacar(id: number): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/destacar`, {})
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('destacar'))
      );
  }

  archivar(id: number): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/archivar`, {})
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('archivar'))
      );
  }

  restaurar(id: number): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/restaurar`, {})
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('restaurar'))
      );
  }

  cambiarDestacada(id: number, autorId: number, destacada: boolean): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/destacada`, { destacada, autorId })
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('cambiarDestacada'))
      );
  }

  // === ESTADÍSTICAS ===

  obtenerEstadisticas(): Observable<EstadisticasNoticias> {
    console.log('📊 Obteniendo estadísticas de noticias...');
    
    // Usar directamente el método sin parámetros que funciona
    return this.obtenerNoticiasSinParametros().pipe(
      map((noticias: Noticia[]) => {
        console.log('📋 Calculando estadísticas desde noticias obtenidas:', noticias.length);
        
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        
        const stats: EstadisticasNoticias = {
          totalNoticias: noticias.length,
          noticiasPublicas: noticias.filter(n => n?.esPublica === true).length,
          noticiasDestacadas: noticias.filter(n => n?.destacada === true).length,
          visitasTotales: noticias.reduce((sum, n) => sum + (n?.visitas || 0), 0),
          noticiasRecientes: noticias.filter(n => {
            if (!n?.fechaPublicacion) return false;
            const fechaNoticia = new Date(n.fechaPublicacion);
            return fechaNoticia >= fechaLimite;
          }).length,
          borradores: noticias.filter(n => n?.esPublica === false).length,
          archivadas: noticias.filter(n => n?.archivada === true).length,
          promedioVisitasPorNoticia: noticias.length > 0 
            ? Math.round(noticias.reduce((sum, n) => sum + (n?.visitas || 0), 0) / noticias.length)
            : 0
        };
        
        console.log('📊 Estadísticas calculadas exitosamente:', stats);
        this.estadisticasSubject.next(stats);
        return stats;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener estadísticas de noticias:', error);
        
        // Estadísticas por defecto en caso de error
        const statsDefault: EstadisticasNoticias = {
          totalNoticias: 0,
          noticiasPublicas: 0,
          noticiasDestacadas: 0,
          visitasTotales: 0,
          noticiasRecientes: 0,
          borradores: 0,
          archivadas: 0,
          promedioVisitasPorNoticia: 0
        };
        
        this.estadisticasSubject.next(statsDefault);
        return of(statsDefault);
      })
    );
  }

  obtenerMetricas(id: number): Observable<MetricasNoticia> {
    return this.http.get<MetricasNoticia>(`${this.apiUrl}/${id}/metricas`)
      .pipe(
        catchError(this.handleError<MetricasNoticia>('obtenerMetricas'))
      );
  }

  incrementarVisitas(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/visita`, {})
      .pipe(
        catchError(this.handleError<void>('incrementarVisitas'))
      );
  }

  // === GESTIÓN DE COMENTARIOS ===

  obtenerComentarios(noticiaId: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}/${noticiaId}/comentarios`)
      .pipe(
        catchError(this.handleError<Comentario[]>('obtenerComentarios', []))
      );
  }

  aprobarComentario(noticiaId: number, comentarioId: number): Observable<Comentario> {
    return this.http.patch<Comentario>(`${this.apiUrl}/${noticiaId}/comentarios/${comentarioId}/aprobar`, {})
      .pipe(
        catchError(this.handleError<Comentario>('aprobarComentario'))
      );
  }

  eliminarComentario(noticiaId: number, comentarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${noticiaId}/comentarios/${comentarioId}`)
      .pipe(
        catchError(this.handleError<void>('eliminarComentario'))
      );
  }

  // === MÉTODOS MODERNOS ===

  autoguardarModerno(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/autoguardar`, request)
      .pipe(
        catchError(this.handleError<any>('autoguardarModerno'))
      );
  }

  vistaPreviaModerno(request: any): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/vista-previa`, request)
      .pipe(
        catchError(this.handleError<string>('vistaPreviaModerno'))
      );
  }

  crearNoticiaModerno(payload: any, autorId: number): Observable<Noticia> {
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

    return this.http.post<Noticia>(`${this.apiUrl}/crear-moderno`, formData)
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('crearNoticiaModerno'))
      );
  }

  // === MÉTODOS ADICIONALES PARA COMPATIBILIDAD ===

  listarPorAutorRobusto(autorId: number): Observable<Noticia[]> {
    return this.obtenerPorAutor(autorId);
  }

  listarTodasRobusto(): Observable<Noticia[]> {
    return this.listarTodas().pipe(
      map(response => response.noticias)
    );
  }

  duplicarNoticia(id: number): Observable<Noticia> {
    return this.http.post<Noticia>(`${this.apiUrl}/${id}/duplicar`, {})
      .pipe(
        tap(noticia => this.actualizarCacheNoticia(noticia)),
        catchError(this.handleError<Noticia>('duplicarNoticia'))
      );
  }

  eliminarNoticia(id: number): Observable<string> {
    return this.eliminar(id);
  }

  exportarNoticias(formato: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/exportar`, {
      params: { formato }
    }).pipe(
      catchError(this.handleError<any>('exportarNoticias'))
    );
  }

  // === MÉTODOS ADICIONALES PARA EDITAR COMPONENT ===

  obtenerPorIdRobusto(id: number): Observable<Noticia> {
    return this.obtenerPorId(id);
  }

  obtenerContenidoHtml(url: string): Observable<string> {
    console.log('🔄 Obteniendo contenido HTML desde:', url);
    
    if (!this.validarUrlContenido(url)) {
      console.warn('⚠️ URL inválida para obtener contenido HTML:', url);
      return throwError(() => new Error('URL inválida o no es de Cloudinary'));
    }

    return this.http.get<string>(`${this.apiUrl}/obtener-contenido-html`, {
      params: { url },
      responseType: 'text' as 'json'
    }).pipe(
      map((response: any) => {
        console.log('✅ Contenido HTML obtenido exitosamente');
        return typeof response === 'string' ? response : JSON.stringify(response);
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener contenido HTML desde backend:', {
          url,
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        // Si falla el backend, intentar obtener directamente desde Cloudinary
        console.log('🔄 Intentando fallback: obtener contenido directamente desde Cloudinary');
        return this.obtenerContenidoDirectoDeCloudinary(url);
      })
    );
  }

  /**
   * Valida si una URL de contenido es válida
   */
  private validarUrlContenido(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      // Verificar que sea una URL de Cloudinary válida
      return urlObj.hostname.includes('cloudinary.com') && urlObj.pathname.includes('.html');
    } catch {
      return false;
    }
  }

  cargarNoticiasRobusta(autorId: number): Observable<Noticia[]> {
    return this.obtenerPorAutor(autorId);
  }

  listarPorAutor(autorId: number): Observable<Noticia[]> {
    return this.obtenerPorAutor(autorId);
  }

  actualizarNoticiaModerno(id: number, payload: any): Observable<Noticia> {
    return this.actualizar(id, payload);
  }

  verDetalleConComentarios(id: number): Observable<NoticiaDetalleDTO> {
    return this.http.get<NoticiaDetalleDTO>(`${this.apiUrl}/${id}/detalle`)
      .pipe(
        catchError(this.handleError<NoticiaDetalleDTO>('verDetalleConComentarios'))
      );
  }

  obtenerRelacionadas(id: number): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/${id}/relacionadas`)
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerRelacionadas', []))
      );
  }

  /**
   * Método alternativo para obtener contenido HTML directamente desde Cloudinary
   * (sin pasar por el backend)
   */
  private obtenerContenidoDirectoDeCloudinary(url: string): Observable<string> {
    console.log('🔄 Intentando obtener contenido directamente desde Cloudinary:', url);
    
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((response: string) => {
        console.log('✅ Contenido obtenido directamente desde Cloudinary');
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener contenido directamente desde Cloudinary:', error);
        return throwError(() => error);
      })
    );
  }

  // === GESTIÓN DE ARCHIVADO ===

  obtenerArchivadas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/archivadas`)
      .pipe(
        catchError(this.handleError<Noticia[]>('obtenerArchivadas', []))
      );
  }

  // === AUTOGUARDADO ===

  autoguardar(id: number, contenidoHtml: string, titulo?: string): Observable<void> {
    const payload = {
      contenidoHtml,
      titulo: titulo || '',
      autoguardadoData: JSON.stringify({
        timestamp: new Date().toISOString(),
        contenidoHtml,
        titulo
      })
    };

    return this.http.patch<void>(`${this.apiUrl}/${id}/autoguardar`, payload)
      .pipe(
        catchError(this.handleError<void>('autoguardar'))
      );
  }

  recuperarAutoguardado(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/autoguardado`)
      .pipe(
        catchError(this.handleError<any>('recuperarAutoguardado'))
      );
  }

  // === MÉTODOS AUXILIARES ===

  private buildFormData(payload: CrearNoticiaPayload): FormData {
    const formData = new FormData();
    
    formData.append('titulo', payload.titulo);
    formData.append('contenidoHtml', payload.contenidoHtml);
    formData.append('esPublica', payload.esPublica.toString());
    
    if (payload.resumen) formData.append('resumen', payload.resumen);
    if (payload.imagen) formData.append('imagen', payload.imagen);
    if (payload.destacada !== undefined) formData.append('destacada', payload.destacada.toString());
    if (payload.archivada !== undefined) formData.append('archivada', payload.archivada.toString());
    if (payload.seccionId) formData.append('seccionId', payload.seccionId.toString());
    if (payload.autoguardadoData) formData.append('autoguardadoData', payload.autoguardadoData);
    if (payload.tags?.length) {
      payload.tags.forEach(tag => formData.append('tags[]', tag));
    }
    
    return formData;
  }

  private buildFormDataForEdit(payload: EditarNoticiaPayload): FormData {
    const formData = new FormData();
    
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(`${key}[]`, v));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    return formData;
  }

  private actualizarCacheNoticia(noticia: Noticia): void {
    const noticiasActuales = this.noticiasSubject.value;
    const index = noticiasActuales.findIndex(n => n.id === noticia.id);
    
    if (index !== -1) {
      noticiasActuales[index] = noticia;
    } else {
      noticiasActuales.push(noticia);
    }
    
    this.noticiasSubject.next([...noticiasActuales]);
  }

  private eliminarDelCache(id: number): void {
    const noticiasActuales = this.noticiasSubject.value;
    const noticiasFiltered = noticiasActuales.filter(n => n.id !== id);
    this.noticiasSubject.next(noticiasFiltered);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
  }

  /**
   * Obtiene estadísticas de noticias calculadas desde el frontend
   * Usado como fallback cuando el endpoint de estadísticas del backend no está disponible
   */
  calcularEstadisticasDesdeNoticias(): Observable<EstadisticasNoticias> {
    console.log('🔄 Calculando estadísticas desde frontend...');
    
    return this.listarTodas(1, 100).pipe(
      map((response: ListarNoticiasResponse) => {
        console.log('📋 Respuesta del servidor para estadísticas:', response);
        
        const noticias = response?.noticias || [];
        console.log(`📊 Total de noticias encontradas: ${noticias.length}`);
        
        if (noticias.length === 0) {
          console.warn('⚠️ No se encontraron noticias para calcular estadísticas');
        }
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7); // Últimos 7 días
        console.log('📅 Fecha límite para noticias recientes:', fechaLimite.toISOString());

        // Calcular estadísticas paso a paso con logging
        const noticiasPublicas = noticias.filter(n => n?.esPublica === true);
        const noticiasDestacadas = noticias.filter(n => n?.destacada === true);
        const borradores = noticias.filter(n => n?.esPublica === false);
        const archivadas = noticias.filter(n => n?.archivada === true);
        
        const visitasTotales = noticias.reduce((sum, n) => {
          const visitas = n?.visitas || 0;
          return sum + visitas;
        }, 0);
        
        const noticiasRecientes = noticias.filter(n => {
          if (!n?.fechaPublicacion) return false;
          const fechaNoticia = new Date(n.fechaPublicacion);
          return fechaNoticia >= fechaLimite;
        });
        
        const promedioVisitas = noticias.length > 0 
          ? Math.round(visitasTotales / noticias.length)
          : 0;

        const stats: EstadisticasNoticias = {
          totalNoticias: noticias.length,
          noticiasPublicas: noticiasPublicas.length,
          noticiasDestacadas: noticiasDestacadas.length,
          visitasTotales: visitasTotales,
          noticiasRecientes: noticiasRecientes.length,
          borradores: borradores.length,
          archivadas: archivadas.length,
          promedioVisitasPorNoticia: promedioVisitas
        };

        console.log('📊 Estadísticas calculadas paso a paso:');
        console.log('  - Total noticias:', stats.totalNoticias);
        console.log('  - Noticias públicas:', stats.noticiasPublicas);
        console.log('  - Noticias destacadas:', stats.noticiasDestacadas);
        console.log('  - Visitas totales:', stats.visitasTotales);
        console.log('  - Noticias recientes (7 días):', stats.noticiasRecientes);
        console.log('  - Borradores:', stats.borradores);
        console.log('  - Archivadas:', stats.archivadas);
        console.log('  - Promedio visitas:', stats.promedioVisitasPorNoticia);

        return stats;
      }),
      catchError((error) => {
        console.error('❌ Error al calcular estadísticas desde noticias:', error);
        
        // Retornar estadísticas por defecto con valores 0
        const statsDefault: EstadisticasNoticias = {
          totalNoticias: 0,
          noticiasPublicas: 0,
          noticiasDestacadas: 0,
          visitasTotales: 0,
          noticiasRecientes: 0,
          borradores: 0,
          archivadas: 0,
          promedioVisitasPorNoticia: 0
        };
        
        console.log('📊 Usando estadísticas por defecto:', statsDefault);
        return of(statsDefault);
      })
    );
  }

  /**
   * Método de prueba para obtener noticias directamente
   * Útil para debugging de estadísticas
   */
  debugObtenerTodasLasNoticias(): Observable<Noticia[]> {
    console.log('🔍 DEBUG: Obteniendo todas las noticias...');
    
    return this.obtenerTodasRobusto().pipe(
      map((noticias: Noticia[]) => {
        console.log('🔍 DEBUG: Noticias obtenidas:', noticias.length);
        
        if (noticias && Array.isArray(noticias) && noticias.length > 0) {
          console.log('🔍 DEBUG: Primera noticia (ejemplo):', noticias[0]);
        }
        
        return noticias || [];
      }),
      catchError((error) => {
        console.error('❌ DEBUG: Error al obtener noticias:', error);
        return of([]);
      })
    );
  }

  /**
   * Método robusto para obtener todas las noticias con manejo de errores mejorado
   */
  obtenerTodasRobusto(): Observable<Noticia[]> {
    console.log('🔍 Obteniendo noticias de forma robusta...');
    
    // Primero intentar con el método más simple
    return this.obtenerNoticiasSimple()
      .pipe(
        catchError((error: any) => {
          console.warn('⚠️ Error con método simple, intentando endpoint básico:', error);
          
          // Si falla, intentar con parámetros muy básicos
          return this.http.get<ListarNoticiasResponse>(`${this.apiUrl}`, {
            params: { limite: '10' } // Solo límite, sin página
          }).pipe(
            map(response => {
              console.log('✅ Noticias obtenidas con límite básico:', response);
              return response?.noticias || [];
            }),
            catchError((error2: any) => {
              console.warn('⚠️ Error con límite básico, intentando sin parámetros:', error2);
              
              // Último intento: sin parámetros en absoluto
              return this.http.get<any>(`${this.apiUrl}`)
                .pipe(
                  map(response => {
                    console.log('✅ Respuesta sin parámetros:', response);
                    // Manejar diferentes formatos de respuesta
                    if (Array.isArray(response)) {
                      return response;
                    } else if (response?.noticias) {
                      return response.noticias;
                    } else if (response?.data) {
                      return response.data;
                    }
                    return [];
                  }),
                  catchError((error3: any) => {
                    console.error('❌ Error definitivo al obtener noticias:', error3);
                    return of([]);
                  })
                );
            })
          );
        })
      );
  }

  /**
   * Método simplificado para obtener noticias sin filtros problemáticos
   */
  obtenerNoticiasSimple(): Observable<Noticia[]> {
    console.log('🔍 Obteniendo noticias con método simplificado...');
    
    // Llamada más simple sin parámetros que puedan causar problemas
    return this.http.get<{ noticias: Noticia[] }>(`${this.apiUrl}/simple`)
      .pipe(
        map(response => {
          console.log('✅ Noticias obtenidas (método simple):', response);
          return response?.noticias || [];
        }),
        catchError((error: any) => {
          console.warn('⚠️ Error con endpoint simple, intentando endpoint básico sin parámetros:', error);
          
          // Si falla, intentar con el endpoint básico
          return this.http.get<Noticia[]>(`${this.apiUrl}/todas`)
            .pipe(
              map(noticias => {
                console.log('✅ Noticias obtenidas (endpoint todas):', noticias);
                return noticias || [];
              }),
              catchError((error2: any) => {
                console.error('❌ Error definitivo al obtener noticias simples:', error2);
                return of([]);
              })
            );
        })
      );
  }

  /**
   * Método de estadísticas directo que evita endpoints problemáticos
   */
  obtenerEstadisticasDirectas(): Observable<EstadisticasNoticias> {
    console.log('📊 Obteniendo estadísticas de forma directa...');
    
    // Intentar endpoint de estadísticas específico
    return this.http.get<EstadisticasNoticias>(`${this.apiUrl}/stats`)
      .pipe(
        tap(stats => {
          console.log('✅ Estadísticas directas obtenidas:', stats);
          this.estadisticasSubject.next(stats);
        }),
        catchError((error) => {
          console.warn('⚠️ Error con /stats, intentando /count:', error);
          
          // Si falla, intentar endpoint de conteo
          return this.http.get<any>(`${this.apiUrl}/count`)
            .pipe(
              map(countData => {
                const stats: EstadisticasNoticias = {
                  totalNoticias: countData?.total || 0,
                  noticiasPublicas: countData?.publicas || 0,
                  noticiasDestacadas: countData?.destacadas || 0,
                  visitasTotales: countData?.visitas || 0,
                  noticiasRecientes: countData?.recientes || 0,
                  borradores: countData?.borradores || 0,
                  archivadas: countData?.archivadas || 0,
                  promedioVisitasPorNoticia: countData?.promedioVisitas || 0
                };
                console.log('✅ Estadísticas desde /count:', stats);
                this.estadisticasSubject.next(stats);
                return stats;
              }),
              catchError((error2) => {
                console.warn('⚠️ Error con /count, usando estadísticas básicas:', error2);
                return this.obtenerEstadisticasBasicas();
              })
            );
        })
      );
  }

  /**
   * Método de estadísticas básicas usando conteo manual
   */
  private obtenerEstadisticasBasicas(): Observable<EstadisticasNoticias> {
    console.log('📊 Calculando estadísticas básicas...');
    
    // Usar el método robusto para obtener noticias y calcular stats manualmente
    return this.obtenerTodasRobusto().pipe(
      map((noticias: Noticia[]) => {
        console.log(`📋 Calculando estadísticas para ${noticias.length} noticias`);
        
        const stats: EstadisticasNoticias = {
          totalNoticias: noticias.length,
          noticiasPublicas: noticias.filter(n => n?.esPublica === true).length,
          noticiasDestacadas: noticias.filter(n => n?.destacada === true).length,
          visitasTotales: noticias.reduce((sum, n) => sum + (n?.visitas || 0), 0),
          noticiasRecientes: noticias.filter(n => {
            if (!n?.fechaPublicacion) return false;
            const fechaNoticia = new Date(n.fechaPublicacion);
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 7);
            return fechaNoticia >= fechaLimite;
          }).length,
          borradores: noticias.filter(n => n?.esPublica === false).length,
          archivadas: noticias.filter(n => n?.archivada === true).length,
          promedioVisitasPorNoticia: noticias.length > 0 
            ? Math.round(noticias.reduce((sum, n) => sum + (n?.visitas || 0), 0) / noticias.length)
            : 0
        };
        
        console.log('📊 Estadísticas básicas calculadas:', stats);
        this.estadisticasSubject.next(stats);
        return stats;
      })
    );
  }

  /**
   * Método directo que evita completamente los parámetros problemáticos
   */
  obtenerNoticiasDirecto(): Observable<Noticia[]> {
    console.log('🔍 Obteniendo noticias SIN parámetros...');
    
    // Intentar diferentes endpoints sin parámetros
    return this.http.get<any>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          console.log('✅ Respuesta sin parámetros:', response);
          
          // Manejar diferentes formatos de respuesta
          if (Array.isArray(response)) {
            console.log('📋 Respuesta es array directo:', response.length);
            return response;
          } else if (response?.noticias && Array.isArray(response.noticias)) {
            console.log('📋 Respuesta con propiedad noticias:', response.noticias.length);
            return response.noticias;
          } else if (response?.data && Array.isArray(response.data)) {
            console.log('📋 Respuesta con propiedad data:', response.data.length);
            return response.data;
          } else {
            console.warn('⚠️ Formato de respuesta desconocido:', response);
            return [];
          }
        }),
        catchError((error: any) => {
          console.error('❌ Error incluso sin parámetros:', error);
          return of([]);
        })
      );
  }

  /**
   * Método que obtiene noticias sin parámetros problemáticos
   * Evita el error 400 que está ocurriendo con pagina/limite
   */
  obtenerNoticiasSinParametros(): Observable<Noticia[]> {
    console.log('🔍 Obteniendo noticias SIN parámetros...');
    
    // Intentar diferentes endpoints sin parámetros
    return this.http.get<any>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          console.log('✅ Respuesta sin parámetros:', response);
          
          // Manejar diferentes formatos de respuesta
          if (Array.isArray(response)) {
            console.log('📋 Respuesta es array directo:', response.length);
            return response;
          } else if (response?.noticias && Array.isArray(response.noticias)) {
            console.log('📋 Respuesta con propiedad noticias:', response.noticias.length);
            return response.noticias;
          } else if (response?.data && Array.isArray(response.data)) {
            console.log('📋 Respuesta con propiedad data:', response.data.length);
            return response.data;
          } else {
            console.warn('⚠️ Formato de respuesta desconocido:', response);
            return [];
          }
        }),
        catchError((error: any) => {
          console.warn('⚠️ Error sin parámetros, probando /todas:', error);
          
          // Si falla, intentar endpoint /todas
          return this.http.get<any>(`${this.apiUrl}/todas`)
            .pipe(
              map(response => {
                console.log('✅ Respuesta desde /todas:', response);
                return Array.isArray(response) ? response : response?.noticias || [];
              }),
              catchError((error2: any) => {
                console.warn('⚠️ Error con /todas, probando /list:', error2);
                
                // Último intento con /list
                return this.http.get<any>(`${this.apiUrl}/list`)
                  .pipe(
                    map(response => {
                      console.log('✅ Respuesta desde /list:', response);
                      return Array.isArray(response) ? response : response?.noticias || [];
                    }),
                    catchError((error3: any) => {
                      console.error('❌ Todos los métodos fallaron:', error3);
                      return of([]);
                    })
                  );
              })
            );
        })
      );
  }
}
