import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface Partido {
  id?: number;
  fecha: string;
  estado: string;
  equipoLocal: string;
  equipoVisitante: string;
  liga?: string;
  competencia?: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  seccion_id?: number;
  esDeApi?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PartidosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/partidos`;
  private readonly partidosSubject = new BehaviorSubject<Partido[]>([]);
  
  readonly partidos$ = this.partidosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS PRINCIPALES ===

  obtenerPartidosHoy(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/hoy`)
      .pipe(
        tap(partidos => this.partidosSubject.next(partidos)),
        catchError(this.handleError<Partido[]>('obtenerPartidosHoy', []))
      );
  }

  obtenerPartidosCombinados(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/combinados`)
      .pipe(
        catchError(this.handleError<Partido[]>('obtenerPartidosCombinados', []))
      );
  }

  listarTodos(): Observable<Partido[]> {
    return this.http.get<Partido[]>(this.apiUrl)
      .pipe(
        tap(partidos => this.partidosSubject.next(partidos)),
        catchError(this.handleError<Partido[]>('listarTodos', []))
      );
  }

  // === MÉTODOS API EXTERNA ===

  obtenerPartidosApiHoy(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/hoy`)
      .pipe(
        catchError(this.handleError<Partido[]>('obtenerPartidosApiHoy', []))
      );
  }

  buscarPorFechaApi(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/buscar/fecha`, {
      params: { fecha }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPorFechaApi', []))
    );
  }

  buscarPorEquipoApi(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/buscar/equipo`, {
      params: { nombre }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPorEquipoApi', []))
    );
  }

  guardarPartidoDeApi(partido: Partido, seccionId?: number): Observable<Partido> {
    const params = seccionId ? new HttpParams().set('seccionId', seccionId.toString()) : undefined;
    return this.http.post<Partido>(`${this.apiUrl}/api/guardar`, partido, { params })
      .pipe(
        tap(p => this.actualizarCachePartido(p)),
        catchError(this.handleError<Partido>('guardarPartidoDeApi'))
      );
  }

  // === MÉTODOS BASE DE DATOS LOCAL ===

  listarPartidosLocales(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/local`)
      .pipe(
        catchError(this.handleError<Partido[]>('listarPartidosLocales', []))
      );
  }

  obtenerPartidoLocalPorId(id: number): Observable<Partido> {
    return this.http.get<Partido>(`${this.apiUrl}/local/${id}`)
      .pipe(
        catchError(this.handleError<Partido>(`obtenerPartidoLocalPorId id=${id}`))
      );
  }

  crearPartidoLocal(formData: FormData, seccionId?: number): Observable<Partido> {
    const params = seccionId ? new HttpParams().set('seccionId', seccionId.toString()) : undefined;
    return this.http.post<Partido>(`${this.apiUrl}/local/crear`, formData, { params })
      .pipe(
        tap(p => this.actualizarCachePartido(p)),
        catchError(this.handleError<Partido>('crearPartidoLocal'))
      );
  }

  actualizarPartidoLocal(id: number, formData: FormData): Observable<Partido> {
    return this.http.put<Partido>(`${this.apiUrl}/local/${id}`, formData)
      .pipe(
        tap(p => this.actualizarCachePartido(p)),
        catchError(this.handleError<Partido>('actualizarPartidoLocal'))
      );
  }

  eliminarPartidoLocal(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/local/${id}`)
      .pipe(
        tap(() => this.eliminarDelCache(id)),
        catchError(this.handleError<string>('eliminarPartidoLocal'))
      );
  }

  // === MÉTODOS CRUD GENERALES ===

  crear(formData: FormData): Observable<Partido> {
    return this.http.post<Partido>(`${this.apiUrl}/crear`, formData)
      .pipe(
        tap(p => this.actualizarCachePartido(p)),
        catchError(this.handleError<Partido>('crear'))
      );
  }

  actualizar(id: number, formData: FormData): Observable<Partido> {
    return this.http.put<Partido>(`${this.apiUrl}/actualizar/${id}`, formData)
      .pipe(
        tap(p => this.actualizarCachePartido(p)),
        catchError(this.handleError<Partido>('actualizar'))
      );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.eliminarDelCache(id)),
        catchError(this.handleError<string>('eliminar'))
      );
  }

  // === MÉTODOS DE BÚSQUEDA ===

  buscarPorFecha(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/buscar/fecha`, {
      params: { fecha }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPorFecha', []))
    );
  }

  buscarPorNombre(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/buscar/equipo`, {
      params: { nombre }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPorNombre', []))
    );
  }

  buscarPorFechaCombinado(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/combinados/buscar/fecha`, {
      params: { fecha }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPorFechaCombinado', []))
    );
  }

  buscarPartidosLocalesPorEquipo(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/local/buscar/equipo`, {
      params: { nombre }
    }).pipe(
      catchError(this.handleError<Partido[]>('buscarPartidosLocalesPorEquipo', []))
    );
  }

  buscarPartidosLocalesPorFechas(desde: string, hasta: string): Observable<Partido[]> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);
    
    return this.http.get<Partido[]>(`${this.apiUrl}/local/buscar/fechas`, { params })
      .pipe(
        catchError(this.handleError<Partido[]>('buscarPartidosLocalesPorFechas', []))
      );
  }

  // === MÉTODOS PARA CONTENIDO PÚBLICO ===
  
  /**
   * Obtiene partidos públicos limitados sin requerir autenticación
   * Usa el endpoint específico /public/partidos/limitados configurado en el backend
   */
  obtenerPartidosPublicos(limite: number = 6): Observable<Partido[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    // Usar endpoint público específico según documentación del backend
    const publicUrl = `${environment.apiBaseUrl}/public/partidos/limitados`;
    
    return this.http.get<Partido[]>(publicUrl, { params })
      .pipe(
        tap(partidos => {
          console.log('⚽ Partidos públicos obtenidos desde /public/partidos/limitados:', partidos);
          this.partidosSubject.next(partidos);
        }),
        catchError(error => {
          console.error('❌ Error al obtener partidos públicos:', error);
          // Si falla el endpoint específico, intentar con el endpoint general para compatibilidad
          return this.obtenerPartidosHoy();
        })
      );
  }

  // === ALIAS PARA COMPATIBILIDAD ===

  obtenerPartidosHoyApi(): Observable<Partido[]> {
    return this.obtenerPartidosApiHoy();
  }

  // === MÉTODOS AUXILIARES ===

  private actualizarCachePartido(partido: Partido): void {
    const partidosActuales = this.partidosSubject.value;
    const index = partidosActuales.findIndex(p => p.id === partido.id);
    
    if (index !== -1) {
      partidosActuales[index] = partido;
    } else {
      partidosActuales.push(partido);
    }
    
    this.partidosSubject.next([...partidosActuales]);
  }

  private eliminarDelCache(id: number): void {
    const partidosActuales = this.partidosSubject.value;
    const partidosFiltered = partidosActuales.filter(p => p.id !== id);
    this.partidosSubject.next(partidosFiltered);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
  }
}
