import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// === INTERFACES CENTRALIZADAS ===
export interface BaseEntity {
  id: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Noticia extends BaseEntity {
  titulo: string;
  resumen: string;
  contenidoUrl: string;
  imagenDestacada: string;
  esPublica: boolean;
  destacada: boolean;
  visitas: number;
  autorId: number;
  autorNombre: string;
  fechaPublicacion: string;
  seccion_id?: number;
  tags?: string[];
}

export interface Evento extends BaseEntity {
  titulo: string;
  fecha: string;
  descripcion?: string;
  ubicacion?: string;
  creadorId: number;
  seccion_id?: number;
}

export interface Seccion extends BaseEntity {
  titulo: string;
  tipo: 'NOTICIAS' | 'EVENTOS' | 'PARTIDOS';
  orden: number;
  descripcion?: string;
  activa: boolean;
  visible?: boolean;
}

export interface EstadisticasGenerales {
  totalNoticias: number;
  totalEventos: number;
  totalSecciones: number;
  noticiasRecientes: number;
  eventosProximos: number;
  fechaActualizacion: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiUrl = environment.apiBaseUrl;
  
  // Cache para evitar múltiples requests
  private readonly cache = new Map<string, Observable<any>>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutos
  
  // Subjects para estado reactivo
  private estadisticasSubject = new BehaviorSubject<EstadisticasGenerales | null>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS GENERALES ===
  
  /**
   * Método genérico para GET con cache
   */
  private get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const cacheKey = `${endpoint}${params?.toString() || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const request$ = this.http.get<T>(`${this.apiUrl}${endpoint}`, { params }).pipe(
      shareReplay(1),
      catchError(this.handleError<T>())
    );

    this.cache.set(cacheKey, request$);
    
    // Limpiar cache después del timeout
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
    
    return request$;
  }

  /**
   * Limpiar cache manualmente
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // === NOTICIAS ===
  
  obtenerNoticias(): Observable<Noticia[]> {
    return this.get<Noticia[]>('/api/noticias');
  }

  obtenerNoticiaPorId(id: number): Observable<Noticia> {
    return this.get<Noticia>(`/api/noticias/${id}`);
  }

  obtenerNoticiasRecientes(dias: number = 7): Observable<Noticia[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.get<Noticia[]>('/api/noticias/recientes', params);
  }

  // === EVENTOS ===
  
  obtenerEventos(): Observable<Evento[]> {
    return this.get<Evento[]>('/api/eventos');
  }

  obtenerEventosProximos(dias: number = 30): Observable<Evento[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.get<Evento[]>('/api/eventos/proximos', params);
  }

  // === SECCIONES ===
  
  obtenerSecciones(): Observable<Seccion[]> {
    return this.get<Seccion[]>('/api/secciones');
  }

  obtenerSeccionesActivas(): Observable<Seccion[]> {
    return this.get<Seccion[]>('/api/secciones/activas');
  }

  // === ESTADÍSTICAS OPTIMIZADAS ===
  
  /**
   * Obtiene todas las estadísticas de una vez
   */
  obtenerEstadisticasCompletas(): Observable<EstadisticasGenerales> {
    const estadisticas$ = forkJoin({
      noticias: this.obtenerNoticias(),
      eventos: this.obtenerEventos(),
      secciones: this.obtenerSecciones(),
      noticiasRecientes: this.obtenerNoticiasRecientes(7),
      eventosProximos: this.obtenerEventosProximos(30)
    }).pipe(
      map(({ noticias, eventos, secciones, noticiasRecientes, eventosProximos }) => ({
        totalNoticias: noticias?.length || 0,
        totalEventos: eventos?.length || 0,
        totalSecciones: secciones?.length || 0,
        noticiasRecientes: noticiasRecientes?.length || 0,
        eventosProximos: eventosProximos?.length || 0,
        fechaActualizacion: new Date()
      })),
      shareReplay(1)
    );

    // Actualizar subject
    estadisticas$.subscribe(stats => this.estadisticasSubject.next(stats));
    
    return estadisticas$;
  }

  /**
   * Refrescar estadísticas y limpiar cache
   */
  refrescarEstadisticas(): Observable<EstadisticasGenerales> {
    this.clearCache();
    return this.obtenerEstadisticasCompletas();
  }

  // === UTILIDADES ===
  
  /**
   * Manejo centralizado de errores
   */
  private handleError<T>(defaultValue?: T) {
    return (error: any): Observable<T> => {
      console.error('Error en DataService:', error);
      
      // Log detallado solo en desarrollo
      if (!environment.production) {
        console.error('Detalles del error:', error);
      }

      // Retornar valor por defecto o array vacío
      return of(defaultValue || ([] as unknown as T));
    };
  }

  /**
   * Verificar si hay conexión con el backend
   */
  verificarConexion(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
