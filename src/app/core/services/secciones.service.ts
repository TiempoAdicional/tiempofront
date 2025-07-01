import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface SeccionRequest {
  titulo: string;
  tipo: 'NOTICIAS' | 'EVENTOS' | 'PARTIDOS';
  orden: number;
  descripcion?: string;
  activa?: boolean;
  visible?: boolean;
}

export interface SeccionResponse {
  id: number;
  titulo: string;
  tipo: string;
  orden: number;
  descripcion?: string;
  activa: boolean;
  visible?: boolean;
  fechaCreacion?: string;
}

export interface VistaPreviaPeriodicoResponse {
  secciones: SeccionConContenidoResponse[];
}

export interface SeccionConContenidoResponse {
  seccion: SeccionResponse;
  contenido: ContenidoSeccion[];
}

export interface ContenidoSeccion {
  id: number;
  tipo: 'NOTICIA' | 'EVENTO' | 'PARTIDO';
  titulo: string;
  descripcion?: string;
  fecha: string;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeccionesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/secciones`;
  private readonly seccionesSubject = new BehaviorSubject<SeccionResponse[]>([]);
  
  readonly secciones$ = this.seccionesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS CRUD ===

  listar(): Observable<SeccionResponse[]> {
    return this.http.get<SeccionResponse[]>(this.apiUrl)
      .pipe(
        tap(secciones => this.seccionesSubject.next(secciones)),
        catchError(this.handleError<SeccionResponse[]>('listar', []))
      );
  }

  obtenerPorId(id: number): Observable<SeccionResponse> {
    return this.http.get<SeccionResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<SeccionResponse>(`obtenerPorId id=${id}`))
      );
  }

  crear(seccion: SeccionRequest): Observable<SeccionResponse> {
    return this.http.post<SeccionResponse>(`${this.apiUrl}/crear`, seccion)
      .pipe(
        tap(nuevaSeccion => this.actualizarCacheSeccion(nuevaSeccion)),
        catchError(this.handleError<SeccionResponse>('crear'))
      );
  }

  actualizar(id: number, seccion: SeccionRequest): Observable<SeccionResponse> {
    return this.http.put<SeccionResponse>(`${this.apiUrl}/actualizar/${id}`, seccion)
      .pipe(
        tap(seccionActualizada => this.actualizarCacheSeccion(seccionActualizada)),
        catchError(this.handleError<SeccionResponse>('actualizar'))
      );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.eliminarDelCache(id)),
        catchError(this.handleError<string>('eliminar'))
      );
  }

  // === GESTIÓN DE ESTADO ===

  cambiarEstado(id: number, activa: boolean): Observable<SeccionResponse> {
    return this.http.patch<SeccionResponse>(`${this.apiUrl}/${id}/estado`, { activa })
      .pipe(
        tap(seccion => this.actualizarCacheSeccion(seccion)),
        catchError(this.handleError<SeccionResponse>('cambiarEstado'))
      );
  }

  reordenar(secciones: { id: number; orden: number }[]): Observable<SeccionResponse[]> {
    return this.http.put<SeccionResponse[]>(`${this.apiUrl}/reordenar`, { secciones })
      .pipe(
        tap(seccionesReordenadas => this.seccionesSubject.next(seccionesReordenadas)),
        catchError(this.handleError<SeccionResponse[]>('reordenar', []))
      );
  }

  // === VISTA PREVIA Y CONTENIDO ===

  obtenerVistaPreviaPeriodicoCompleto(): Observable<VistaPreviaPeriodicoResponse> {
    return this.http.get<VistaPreviaPeriodicoResponse>(`${this.apiUrl}/vista-previa`)
      .pipe(
        catchError(this.handleError<VistaPreviaPeriodicoResponse>('obtenerVistaPreviaPeriodicoCompleto'))
      );
  }

  obtenerSeccionesActivasConContenido(): Observable<SeccionConContenidoResponse[]> {
    return this.http.get<SeccionConContenidoResponse[]>(`${this.apiUrl}/activas/contenido`)
      .pipe(
        catchError(this.handleError<SeccionConContenidoResponse[]>('obtenerSeccionesActivasConContenido', []))
      );
  }

  // === MÉTODOS AUXILIARES ===

  obtenerSeccionesActivas(): Observable<SeccionResponse[]> {
    return this.http.get<SeccionResponse[]>(`${this.apiUrl}/activas`)
      .pipe(
        catchError(this.handleError<SeccionResponse[]>('obtenerSeccionesActivas', []))
      );
  }

  obtenerPorTipo(tipo: 'NOTICIAS' | 'EVENTOS' | 'PARTIDOS'): Observable<SeccionResponse[]> {
    return this.http.get<SeccionResponse[]>(`${this.apiUrl}/tipo/${tipo}`)
      .pipe(
        catchError(this.handleError<SeccionResponse[]>('obtenerPorTipo', []))
      );
  }

  // === CACHE MANAGEMENT ===

  private actualizarCacheSeccion(seccion: SeccionResponse): void {
    const seccionesActuales = this.seccionesSubject.value;
    const index = seccionesActuales.findIndex(s => s.id === seccion.id);
    
    if (index !== -1) {
      seccionesActuales[index] = seccion;
    } else {
      seccionesActuales.push(seccion);
    }
    
    this.seccionesSubject.next([...seccionesActuales]);
  }

  private eliminarDelCache(id: number): void {
    const seccionesActuales = this.seccionesSubject.value;
    const seccionesFiltradas = seccionesActuales.filter(s => s.id !== id);
    this.seccionesSubject.next(seccionesFiltradas);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
  }
}
