import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface Evento {
  id?: number;
  nombre: string;
  descripcion: string;
  fecha: string; // formato ISO yyyy-MM-dd
  lugar: string;
  imagenEvento?: string;
  videoUrl?: string;
  creador_id?: number;
  seccion_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/eventos`;
  private readonly eventosSubject = new BehaviorSubject<Evento[]>([]);
  
  readonly eventos$ = this.eventosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS CRUD OPTIMIZADOS ===

  listarTodos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl)
      .pipe(
        tap(eventos => this.eventosSubject.next(eventos)),
        catchError(this.handleError<Evento[]>('listarTodos', []))
      );
  }

  obtenerProximos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/proximos`)
      .pipe(
        catchError(this.handleError<Evento[]>('obtenerProximos', []))
      );
  }

  obtenerPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<Evento>(`obtenerPorId id=${id}`))
      );
  }

  crear(formData: FormData): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}/crear`, formData)
      .pipe(
        tap(evento => this.actualizarCacheEvento(evento)),
        catchError(this.handleError<Evento>('crear'))
      );
  }

  actualizar(id: number, formData: FormData): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/actualizar/${id}`, formData)
      .pipe(
        tap(evento => this.actualizarCacheEvento(evento)),
        catchError(this.handleError<Evento>('actualizar'))
      );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.eliminarDelCache(id)),
        catchError(this.handleError<string>('eliminar'))
      );
  }

  listarPorCreador(creadorId: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/creador/${creadorId}`)
      .pipe(
        catchError(this.handleError<Evento[]>('listarPorCreador', []))
      );
  }

  // === MÉTODOS PARA CONTENIDO PÚBLICO ===
  
  /**
   * Obtiene eventos públicos próximos sin requerir autenticación (endpoint público documentado)
   */
  listarEventosPublicos(limite: number = 8): Observable<any> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<any>(`${this.apiUrl}/proximos`, { params })
      .pipe(
        tap(response => {
          console.log('📅 Eventos próximos públicos obtenidos:', response);
          // Handle different response formats
          let eventos = [];
          if (response && response.eventos) {
            eventos = response.eventos;
          } else if (Array.isArray(response)) {
            eventos = response;
          }
          
          if (eventos.length > 0) {
            this.eventosSubject.next(eventos);
          }
          
          return { eventos, total: eventos.length };
        }),
        catchError(error => {
          console.error('❌ Error al obtener eventos públicos:', error);
          return this.handleError<any>('listarEventosPublicos', { eventos: [], total: 0 })(error);
        })
      );
  }

  /**
   * Obtiene eventos públicos (alias del endpoint proximos - endpoint documentado)
   */
  obtenerEventosPublicos(limite: number = 8): Observable<Evento[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<Evento[]>(`${this.apiUrl}/publicos`, { params })
      .pipe(
        tap(eventos => console.log('📅 Eventos públicos obtenidos:', eventos)),
        catchError(error => {
          console.error('❌ Error al obtener eventos públicos:', error);
          return this.handleError<Evento[]>('obtenerEventosPublicos', [])(error);
        })
      );
  }

  /**
   * Obtiene el detalle de un evento público (para usuarios no autenticados)
   * Si falla, devuelve información limitada en lugar de error
   */
  obtenerDetallePublico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(evento => console.log(`✅ Detalle público evento id=${id}:`, evento)),
        catchError(error => {
          console.warn(`⚠️ No se pudo obtener detalle público para evento id=${id}:`, error);
          // En lugar de error, devolver información básica indicando que necesita registro
          return of({
            id: id,
            nombre: 'Contenido Restringido',
            descripcion: 'Regístrate para ver los detalles completos de este evento.',
            fecha: new Date().toISOString(),
            lugar: 'Ubicación disponible para usuarios registrados',
            imagenEvento: '',
            videoUrl: '',
            requiereRegistro: true
          });
        })
      );
  }

  // === MÉTODOS AUXILIARES ===

  private actualizarCacheEvento(evento: Evento): void {
    const eventosActuales = this.eventosSubject.value;
    const index = eventosActuales.findIndex(e => e.id === evento.id);
    
    if (index !== -1) {
      eventosActuales[index] = evento;
    } else {
      eventosActuales.push(evento);
    }
    
    this.eventosSubject.next([...eventosActuales]);
  }

  private eliminarDelCache(id: number): void {
    const eventosActuales = this.eventosSubject.value;
    const eventosFiltered = eventosActuales.filter(e => e.id !== id);
    this.eventosSubject.next(eventosFiltered);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
  }
}
