import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
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
    console.log('🔄 Obteniendo partidos de hoy...');
    
    return this.http.get<Partido[]>(`${this.apiUrl}/hoy`)
      .pipe(
        tap(partidos => {
          console.log('✅ Partidos de hoy obtenidos:', partidos.length);
          this.partidosSubject.next(partidos);
        }),
        catchError(error => {
          console.error('❌ Error al obtener partidos de hoy:', error);
          console.log('🔄 Devolviendo array vacío - no hay partidos disponibles');
          
          // 🔥 NO usar datos ficticios - devolver array vacío
          this.partidosSubject.next([]);
          return of([]);
        })
      );
  }

  obtenerPartidosCombinados(): Observable<Partido[]> {
    console.log('🔄 Obteniendo partidos combinados (API + Liga Colombiana)...');
    
    return this.http.get<Partido[]>(`${this.apiUrl}/combinados`)
      .pipe(
        tap(partidos => console.log('✅ Partidos combinados obtenidos:', partidos.length)),
        catchError(error => {
          console.error('❌ Error al obtener partidos combinados:', error);
          console.log('🔄 Devolviendo array vacío - no hay partidos disponibles');
          
          // 🔥 NO usar datos ficticios - devolver array vacío
          return of([]);
        })
      );
  }

  listarTodos(): Observable<Partido[]> {
    return this.http.get<Partido[]>(this.apiUrl)
      .pipe(
        tap(partidos => this.partidosSubject.next(partidos)),
        catchError(this.handleError<Partido[]>('listarTodos', []))
      );
  }

  // === MÉTODOS PARA CONTENIDO PÚBLICO ===
  
  /**
   * Obtiene partidos públicos - solo datos reales del backend
   */
  obtenerPartidosPublicos(limite: number = 6): Observable<any> {
    console.log('🔄 Obteniendo partidos públicos...');
    
    return this.obtenerPartidosLigaColombiana(limite)
      .pipe(
        catchError(error => {
          console.warn('⚠️ Liga Colombiana no disponible:', error);
          console.log('🔄 Devolviendo array vacío - no hay partidos disponibles');
          
          // 🔥 NO usar datos ficticios - devolver array vacío
          return of({ partidos: [], total: 0 });
        })
      );
  }

  /**
   * Obtiene partidos de Liga Colombiana
   */
  private obtenerPartidosLigaColombiana(limite: number = 6): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/liga-colombiana/partidos/hoy`)
      .pipe(
        tap(response => {
          console.log('⚽ Partidos Liga Colombiana obtenidos:', response);
          
          let partidosLiga = [];
          if (Array.isArray(response)) {
            partidosLiga = response;
          } else if (response && response.partidos) {
            partidosLiga = response.partidos;
          }
          
          // Format Liga Colombiana matches with proper team names
          const partidosFormateados = partidosLiga.map((partido: any) => ({
            id: partido.id || Math.random() * 1000,
            equipoLocal: this.formatearNombreEquipo(partido.nombreEquipoLocal || partido.equipoLocal?.nombre),
            equipoVisitante: this.formatearNombreEquipo(partido.nombreEquipoVisitante || partido.equipoVisitante?.nombre),
            fecha: partido.fecha,
            liga: 'Liga BetPlay',
            estado: this.formatearEstado(partido.estado),
            golesLocal: partido.golesLocal,
            golesVisitante: partido.golesVisitante,
            jornada: partido.jornada,
            estadio: partido.estadio,
            esDeApi: false,
            tipo: 'liga-colombiana'
          }));
          
          const partidosLimitados = partidosFormateados.slice(0, limite);
          
          if (partidosLimitados.length > 0) {
            this.partidosSubject.next(partidosLimitados);
          }
          
          return { partidos: partidosLimitados, total: partidosLimitados.length };
        }),
        catchError(error => {
          console.error('❌ Error al obtener partidos Liga Colombiana:', error);
          return throwError(() => error);
        })
      );
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

  private formatearNombreEquipo(nombre: string | undefined): string {
    if (!nombre) return 'Equipo';
    
    // Clean up common API variations
    let nombreLimpio = nombre.toString().trim();
    
    // Handle common team name patterns
    if (nombreLimpio.length < 2) {
      return 'Equipo';
    }
    
    // Capitalize first letter and ensure proper formatting
    nombreLimpio = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
    
    return nombreLimpio;
  }

  private formatearLiga(liga: string | undefined): string {
    if (!liga) return 'Liga Colombiana';
    
    const ligaStr = liga.toString().trim();
    
    // Map common league names to display names
    const ligaMapping: { [key: string]: string } = {
      'liga_betplay': 'Liga BetPlay',
      'liga betplay': 'Liga BetPlay',
      'primera division': 'Primera División',
      'copa colombia': 'Copa Colombia',
      'torneo': 'Liga Colombiana',
      'championship': 'Liga Colombiana'
    };
    
    const ligaNormalizada = ligaStr.toLowerCase();
    return ligaMapping[ligaNormalizada] || ligaStr;
  }

  private formatearEstado(estado: string | undefined): string {
    if (!estado) return 'Programado';
    
    const estadoStr = estado.toString().trim();
    
    // Map common status to Spanish
    const estadoMapping: { [key: string]: string } = {
      'scheduled': 'Programado',
      'live': 'En Vivo',
      'finished': 'Finalizado',
      'postponed': 'Pospuesto',
      'cancelled': 'Cancelado',
      'full-time': 'Finalizado',
      'half-time': 'Descanso',
      'programado': 'Programado',
      'en_vivo': 'En Vivo',
      'finalizado': 'Finalizado'
    };
    
    const estadoNormalizado = estadoStr.toLowerCase().replace(/\s+/g, '_');
    return estadoMapping[estadoNormalizado] || estadoStr;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
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

  // === MÉTODOS RECIENTES Y LIMITADOS ===

  obtenerPartidosRecientes(limite: number = 6): Observable<Partido[]> {
    const params = new HttpParams().set('limite', limite.toString());
    
    return this.http.get<Partido[]>(`${this.apiUrl}/recientes`, { params })
      .pipe(
        tap(partidos => console.log('⚽ Partidos recientes obtenidos:', partidos)),
        catchError(error => {
          console.error('❌ Error al obtener partidos recientes:', error);
          return this.handleError<Partido[]>('obtenerPartidosRecientes', [])(error);
        })
      );
  }

  // === ALIAS PARA COMPATIBILIDAD ===

  obtenerPartidosHoyApi(): Observable<Partido[]> {
    return this.obtenerPartidosApiHoy();
  }
}
