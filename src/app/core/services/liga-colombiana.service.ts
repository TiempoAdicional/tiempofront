import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// === ENUMS ===
export enum EstadoPartido {
  PROGRAMADO = 'PROGRAMADO',
  EN_VIVO = 'EN_VIVO',
  ENTRETIEMPO = 'ENTRETIEMPO',
  FINALIZADO = 'FINALIZADO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO'
}

export enum Semestre {
  I = 'I',
  II = 'II'
}

// === INTERFACES OPTIMIZADAS ===
export interface Equipo {
  id: number;
  nombre: string;
  nombreCompleto: string;
  ciudad: string;
  escudo: string;
  activo: boolean;
  // Estadísticas automáticas
  puntos: number;
  partidosJugados: number;
  golesFavor: number;
  golesContra: number;
}

export interface Temporada {
  id: number;
  nombre: string;
  año: number;
  semestre: Semestre;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export interface PartidoLigaColombiana {
  id?: number;
  fecha: string;
  estado: EstadoPartido;
  jornada: string;
  nombreEquipoLocal: string;
  nombreEquipoVisitante: string;
  golesLocal?: number;
  golesVisitante?: number;
  estadio?: string;
  arbitro?: string;
  equipoLocal?: Equipo;
  equipoVisitante?: Equipo;
  temporada?: Temporada;
}

export interface EstadisticasLigaColombiana {
  partidosHoy: number;
  partidosTemporadaActual: number;
  temporadaActual?: string;
  equipoLider?: string;
  totalEquipos: number;
}

@Injectable({
  providedIn: 'root'
})
export class LigaColombianService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/liga-colombiana`;
  
  // Estado reactivo
  private estadisticasSubject = new BehaviorSubject<EstadisticasLigaColombiana | null>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  // Cache simple
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 2 * 60 * 1000; // 2 minutos

  constructor(private http: HttpClient) {}

  // === MÉTODOS PRINCIPALES ===

  obtenerPartidosHoy(): Observable<PartidoLigaColombiana[]> {
    return this.getCached('partidos-hoy', () => 
      this.http.get<PartidoLigaColombiana[]>(`${this.apiUrl}/partidos/hoy`)
    );
  }

  obtenerTemporadaActual(): Observable<Temporada> {
    return this.getCached('temporada-actual', () =>
      this.http.get<Temporada>(`${this.apiUrl}/temporadas/actual`)
    );
  }

  obtenerEquipos(): Observable<Equipo[]> {
    return this.getCached('equipos', () =>
      this.http.get<Equipo[]>(`${this.apiUrl}/equipos`)
    );
  }

  obtenerTablaPosiciones(): Observable<Equipo[]> {
    return this.getCached('tabla-posiciones', () =>
      this.http.get<Equipo[]>(`${this.apiUrl}/equipos/tabla-posiciones`)
    );
  }

  /**
   * Obtener estadísticas optimizadas
   */
  obtenerEstadisticas(): Observable<EstadisticasLigaColombiana> {
    const estadisticas$ = this.http.get<any>(`${this.apiUrl}/resumen`).pipe(
      map(resumen => ({
        partidosHoy: resumen.partidosHoy || 0,
        partidosTemporadaActual: (resumen.partidosJugados || 0) + (resumen.partidosPendientes || 0),
        temporadaActual: resumen.temporadaActual?.nombre,
        equipoLider: resumen.lider?.nombre,
        totalEquipos: resumen.totalEquipos || 0
      })),
      catchError(() => of({
        partidosHoy: 0,
        partidosTemporadaActual: 0,
        totalEquipos: 0
      })),
      shareReplay(1)
    );

    estadisticas$.subscribe(stats => this.estadisticasSubject.next(stats));
    return estadisticas$;
  }

  // === UTILIDADES ===

  obtenerEstadoLegible(estado: EstadoPartido): string {
    const estados = {
      [EstadoPartido.PROGRAMADO]: 'Programado',
      [EstadoPartido.EN_VIVO]: 'En Vivo',
      [EstadoPartido.ENTRETIEMPO]: 'Entretiempo',
      [EstadoPartido.FINALIZADO]: 'Finalizado',
      [EstadoPartido.SUSPENDIDO]: 'Suspendido',
      [EstadoPartido.CANCELADO]: 'Cancelado'
    };
    return estados[estado] || estado;
  }

  obtenerColorEstado(estado: EstadoPartido): string {
    const colores = {
      [EstadoPartido.PROGRAMADO]: '#2196F3',
      [EstadoPartido.EN_VIVO]: '#4CAF50',
      [EstadoPartido.ENTRETIEMPO]: '#FF9800',
      [EstadoPartido.FINALIZADO]: '#9E9E9E',
      [EstadoPartido.SUSPENDIDO]: '#F44336',
      [EstadoPartido.CANCELADO]: '#F44336'
    };
    return colores[estado] || '#9E9E9E';
  }

  limpiarCache(): void {
    this.cache.clear();
  }

  // === MÉTODOS PRIVADOS ===

  private getCached<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp < this.cacheTimeout)) {
      return of(cached.data);
    }

    const request$ = factory().pipe(
      catchError(() => of([] as unknown as T)),
      shareReplay(1)
    );

    request$.subscribe(data => {
      this.cache.set(key, { data, timestamp: now });
    });

    return request$;
  }
}
