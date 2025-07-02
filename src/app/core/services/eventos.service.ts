import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
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
   * Obtiene eventos públicos limitados sin requerir autenticación
   * Usa el endpoint específico /public/eventos/limitados configurado en el backend
   */
  listarEventosPublicos(limite: number = 8): Observable<Evento[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    // Usar endpoint público específico según documentación del backend
    const publicUrl = `${environment.apiBaseUrl}/public/eventos/limitados`;
    
    return this.http.get<Evento[]>(publicUrl, { params })
      .pipe(
        tap(eventos => {
          console.log('📅 Eventos públicos obtenidos desde /public/eventos/limitados:', eventos);
          this.eventosSubject.next(eventos);
        }),
        catchError(error => {
          console.error('❌ Error al obtener eventos públicos:', error);
          // Si falla el endpoint específico, intentar con el endpoint general para compatibilidad
          return this.listarTodosSinAuth();
        })
      );
  }

  /**
   * Intenta obtener eventos sin autenticación del endpoint general
   */
  private listarTodosSinAuth(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl)
      .pipe(
        tap(eventos => {
          console.log('📅 Eventos sin auth obtenidos:', eventos);
          this.eventosSubject.next(eventos);
        }),
        catchError(this.handleError<Evento[]>('listarTodosSinAuth', []))
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
