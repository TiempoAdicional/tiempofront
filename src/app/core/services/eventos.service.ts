import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { EquipoService } from './equipo.service'; // 🆕 Importar EquipoService

export interface Evento {
  id?: number;
  nombre: string;
  descripcion: string;
  fecha: string; // formato YYYY-MM-DD
  hora?: string; // formato HH:mm:ss
  lugar: string;
  ciudad?: string; // 🆕 Nueva propiedad
  imagenEvento?: string;
  videoUrl?: string;
  creador_id?: number;
  creadorId?: number; // 🆕 También viene así
  creadorNombre?: string;
  seccion_id?: number;
  seccionId?: number; // 🆕 También viene así
  seccionNombre?: string; // 🆕 Nueva propiedad
  
  // Campos específicos del evento deportivo
  equipoLocal?: string;
  equipoVisitante?: string;
  tipoEvento?: string; // PARTIDO, TORNEO, etc.
  estado?: string; // PROGRAMADO, EN_CURSO, FINALIZADO
  categoria?: string;
  competencia?: string;
  competicion?: string; // 🆕 También viene así (LIGA_BETPLAY)
  importancia?: string; // 🆕 ALTA, MEDIA, BAJA
  precioEstimado?: number; // 🆕 Precio estimado (no valorEstimado)
  valorEstimado?: number; // Mantener compatibilidad
  
  // Campos adicionales
  tags?: string; // 🆕 Tags del evento
  notas?: string; // 🆕 Notas adicionales
  
  // Metadatos
  fechaCreacion?: string;
  fechaActualizacion?: string;
  activo?: boolean;
  visitas?: number;
  destacado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/eventos`;
  private readonly eventosSubject = new BehaviorSubject<Evento[]>([]);
  
  readonly eventos$ = this.eventosSubject.asObservable();

  constructor(
    private http: HttpClient,
    private equipoService: EquipoService // 🆕 Inyectar EquipoService
  ) {}

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
        // 🆕 Actualizar estadísticas del equipo automáticamente
        switchMap(evento => {
          const creadorId = evento.creador_id;
          if (creadorId) {
            console.log('📊 Actualizando estadísticas de evento para creador:', creadorId);
            return this.equipoService.actualizarEstadisticasEvento(creadorId, 'crear')
              .pipe(
                map(() => evento),
                catchError(error => {
                  console.warn('⚠️ Error actualizando estadísticas de evento:', error);
                  return of(evento);
                })
              );
          }
          return of(evento);
        }),
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
    // Primero obtenemos el evento para conocer el creador_id
    return this.obtenerPorId(id).pipe(
      switchMap(evento => {
        const creadorId = evento.creador_id;
        
        return this.http.delete<string>(`${this.apiUrl}/${id}`)
          .pipe(
            tap(() => this.eliminarDelCache(id)),
            // 🆕 Actualizar estadísticas del equipo automáticamente
            switchMap(result => {
              if (creadorId) {
                console.log('📊 Actualizando estadísticas tras eliminar evento del creador:', creadorId);
                return this.equipoService.actualizarEstadisticasEvento(creadorId, 'eliminar')
                  .pipe(
                    map(() => result),
                    catchError(error => {
                      console.warn('⚠️ Error actualizando estadísticas tras eliminar evento:', error);
                      return of(result);
                    })
                  );
              }
              return of(result);
            })
          );
      }),
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
   * ✅ Permite ver contenido público completo
   */
  obtenerDetallePublico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(evento => console.log(`✅ Detalle público evento id=${id}:`, evento)),
        catchError(error => {
          console.warn(`⚠️ Error obteniendo detalle público para evento id=${id}:`, error);
          
          // Si falla el endpoint directo, intentar con el endpoint público
          return this.http.get<any>(`${this.apiUrl}/proximos`).pipe(
            map(response => {
              console.log('🔄 Intentando obtener desde endpoint público:', response);
              
              // Buscar el evento específico en la lista pública
              let eventos = [];
              if (Array.isArray(response)) {
                eventos = response;
              } else if (response?.eventos) {
                eventos = response.eventos;
              }
              
              const eventoEncontrado = eventos.find((e: any) => e.id === id);
              
              if (eventoEncontrado) {
                console.log('✅ Evento encontrado en endpoint público:', eventoEncontrado);
                return eventoEncontrado;
              } else {
                console.warn(`⚠️ Evento id=${id} no encontrado en endpoint público`);
                throw new Error(`Evento ${id} no disponible públicamente`);
              }
            }),
            catchError(fallbackError => {
              console.error(`❌ Error en todos los métodos para evento id=${id}:`, fallbackError);
              return throwError(() => fallbackError);
            })
          );
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
