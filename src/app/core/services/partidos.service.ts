import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// ================================
// 📊 INTERFACES PARA LA NUEVA API
// ================================

export interface PartidoDTO {
  // Información básica
  codigoApi: string;              // ID único de la API
  fecha: string;                  // ISO DateTime
  estadio: string;                // Nombre del estadio
  ciudadEstadio: string;          // Ciudad donde se juega
  arbitro: string;                // Nombre del árbitro
  estado: string;                 // "EN_VIVO", "FINALIZADO", etc.
  minutoActual: number;           // Minuto actual del partido
  
  // Equipos
  nombreEquipoLocal: string;      // Nombre equipo local
  escudoEquipoLocal: string;      // URL del escudo (imagen)
  nombreEquipoVisitante: string;  // Nombre equipo visitante
  escudoEquipoVisitante: string;  // URL del escudo (imagen)
  
  // Resultado
  golesLocal: number;             // Goles del equipo local
  golesVisitante: number;         // Goles del equipo visitante
  
  // Datos avanzados (solo en /detalles)
  estadisticasLocal?: EstadisticasEquipo;
  estadisticasVisitante?: EstadisticasEquipo;
  eventos?: EventoPartido[];
  alineacionLocal?: JugadorAlineacion[];
  alineacionVisitante?: JugadorAlineacion[];
  predicciones?: PrediccionesPartido;
}

export interface EstadisticasEquipo {
  posesion: string;
  tiros: number;
  tirosAPuerta: number;
  corners: number;
  faltas: number;
  tarjetasAmarillas?: number;
  tarjetasRojas?: number;
  fueras?: number;
}

export interface EventoPartido {
  minuto: number;
  tipo: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio' | 'penalti';
  jugador: string;
  equipo: 'local' | 'visitante';
  descripcion?: string;
}

export interface JugadorAlineacion {
  numero: number;
  nombre: string;
  posicion: string;
  edad?: number;
  nacionalidad?: string;
}

export interface PrediccionesPartido {
  local: string;
  empate: string;
  visitante: string;
}

export interface TablaEquipo {
  position: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

// ================================
// 🏆 NUEVAS INTERFACES PARA CUADRANGULARES
// ================================

export interface GrupoInfo {
  nombreGrupo: string;        // "Cuadrangular A", "Cuadrangular B"
  equipos: TablaEquipo[];     // Array de equipos del grupo
  totalEquipos: number;       // Cantidad de equipos en el grupo
}

export interface TablasCompletas {
  grupos: GrupoInfo[];        // Array de todos los grupos
  tablaCompleta: TablaEquipo[]; // Todos los equipos unidos
  totalEquipos: number;       // Total de equipos en todos los grupos
  totalGrupos: number;        // Cantidad de grupos/cuadrangulares
  temporada: string;          // Temporada actual
}

// Estados posibles del partido
export type EstadoPartido = 
  | "Not Started"
  | "First Half"
  | "Halftime"
  | "Second Half"
  | "Extra Time"
  | "Penalty In Progress"
  | "Match Finished"
  | "Match Postponed"
  | "Match Cancelled"
  | "Match Suspended";

@Injectable({
  providedIn: 'root'
})
export class PartidosService {
  
  private readonly apiUrl = `${environment.apiBaseUrl}/api/liga`;

  constructor(private http: HttpClient) {}

  // ================================
  // 🔥 NUEVOS ENDPOINTS PRINCIPALES
  // ================================

  /**
   * Obtiene todos los partidos que se están jugando actualmente
   */
  obtenerPartidosEnVivo(): Observable<PartidoDTO[]> {
    console.log('🔴 Obteniendo partidos en vivo...');
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos/en-vivo`)
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} partidos en vivo obtenidos`)),
        catchError(this.handleError<PartidoDTO[]>('obtenerPartidosEnVivo', []))
      );
  }

  /**
   * Obtiene los próximos 10 partidos programados
   */
  obtenerProximosPartidos(): Observable<PartidoDTO[]> {
    console.log('📅 Obteniendo próximos partidos...');
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos/proximos`)
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} próximos partidos obtenidos`)),
        catchError(this.handleError<PartidoDTO[]>('obtenerProximosPartidos', []))
      );
  }

  /**
   * Obtiene los últimos 10 resultados de partidos finalizados
   */
  obtenerUltimosResultados(): Observable<PartidoDTO[]> {
    console.log('📊 Obteniendo últimos resultados...');
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos/resultados`)
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} resultados obtenidos`)),
        catchError(this.handleError<PartidoDTO[]>('obtenerUltimosResultados', []))
      );
  }

  /**
   * Obtiene información completa de un partido (estadísticas, alineaciones, eventos)
   */
  obtenerDetallesPartido(fixtureId: string): Observable<PartidoDTO> {
    console.log(`🔍 Obteniendo detalles del partido ${fixtureId}...`);
    
    return this.http.get<PartidoDTO>(`${this.apiUrl}/partidos/${fixtureId}/detalles`)
      .pipe(
        tap(partido => console.log(`✅ Detalles del partido obtenidos: ${partido.nombreEquipoLocal} vs ${partido.nombreEquipoVisitante}`)),
        catchError(this.handleError<PartidoDTO>(`obtenerDetallesPartido ${fixtureId}`))
      );
  }

  /**
   * Obtiene la tabla de posiciones actualizada de la Liga Colombiana
   * ACTUALIZADO: Ahora devuelve TODOS los equipos de TODOS los cuadrangulares unidos
   */
  obtenerTablaLigaColombiana(): Observable<TablaEquipo[]> {
    console.log('🏆 Obteniendo tabla de posiciones completa...');
    
    return this.http.get<TablaEquipo[]>(`${this.apiUrl}/tabla`)
      .pipe(
        tap(tabla => console.log(`✅ Tabla completa obtenida con ${tabla.length} equipos`)),
        catchError(this.handleError<TablaEquipo[]>('obtenerTablaLigaColombiana', []))
      );
  }

  // ================================
  // 🏆 NUEVOS ENDPOINTS DE CUADRANGULARES
  // ================================

  /**
   * 🆕 Obtiene información completa de todos los cuadrangulares/grupos
   * Incluye metadatos y estructura detallada
   */
  obtenerTodasLasTablas(): Observable<TablasCompletas> {
    console.log('🏆 Obteniendo información completa de cuadrangulares...');
    
    return this.http.get<TablasCompletas>(`${this.apiUrl}/tablas-completas`)
      .pipe(
        tap(data => console.log(`✅ Cuadrangulares obtenidos: ${data.totalGrupos} grupos, ${data.totalEquipos} equipos`)),
        catchError(this.handleError<TablasCompletas>('obtenerTodasLasTablas'))
      );
  }

  /**
   * 🆕 Obtiene solo los equipos del Cuadrangular A
   */
  obtenerCuadrangularA(): Observable<TablaEquipo[]> {
    console.log('🔵 Obteniendo Cuadrangular A...');
    
    return this.http.get<TablaEquipo[]>(`${this.apiUrl}/cuadrangular-a`)
      .pipe(
        tap(equipos => console.log(`✅ Cuadrangular A obtenido con ${equipos.length} equipos`)),
        catchError(this.handleError<TablaEquipo[]>('obtenerCuadrangularA', []))
      );
  }

  /**
   * 🆕 Obtiene solo los equipos del Cuadrangular B
   */
  obtenerCuadrangularB(): Observable<TablaEquipo[]> {
    console.log('🔴 Obteniendo Cuadrangular B...');
    
    return this.http.get<TablaEquipo[]>(`${this.apiUrl}/cuadrangular-b`)
      .pipe(
        tap(equipos => console.log(`✅ Cuadrangular B obtenido con ${equipos.length} equipos`)),
        catchError(this.handleError<TablaEquipo[]>('obtenerCuadrangularB', []))
      );
  }

  /**
   * Obtiene todos los partidos de la temporada actual
   */
  obtenerTodosLosPartidos(): Observable<PartidoDTO[]> {
    console.log('📋 Obteniendo todos los partidos...');
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos`)
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} partidos totales obtenidos`)),
        catchError(this.handleError<PartidoDTO[]>('obtenerTodosLosPartidos', []))
      );
  }

  // ================================
  // 🔍 NUEVOS ENDPOINTS DE BÚSQUEDA
  // ================================

  /**
   * Busca partidos donde participe un equipo específico
   */
  buscarPartidosPorEquipo(nombreEquipo: string): Observable<PartidoDTO[]> {
    console.log(`🔍 Buscando partidos del equipo: ${nombreEquipo}`);
    
    const params = new HttpParams().set('equipo', nombreEquipo);
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos/buscar-por-equipo`, { params })
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} partidos encontrados para ${nombreEquipo}`)),
        catchError(this.handleError<PartidoDTO[]>(`buscarPartidosPorEquipo ${nombreEquipo}`, []))
      );
  }

  /**
   * Busca partidos programados para una fecha específica
   */
  buscarPartidosPorFecha(fecha: string): Observable<PartidoDTO[]> {
    console.log(`📅 Buscando partidos para la fecha: ${fecha}`);
    
    const params = new HttpParams().set('fecha', fecha);
    
    return this.http.get<PartidoDTO[]>(`${this.apiUrl}/partidos/buscar-por-fecha`, { params })
      .pipe(
        tap(partidos => console.log(`✅ ${partidos.length} partidos encontrados para ${fecha}`)),
        catchError(this.handleError<PartidoDTO[]>(`buscarPartidosPorFecha ${fecha}`, []))
      );
  }

  // ================================
  // 🛠️ MÉTODOS AUXILIARES
  // ================================

  /**
   * Convierte el estado del partido a texto legible en español
   */
  obtenerEstadoLegible(estado: EstadoPartido): string {
    const estados: Record<EstadoPartido, string> = {
      "Not Started": "Por jugar",
      "First Half": "Primer tiempo",
      "Halftime": "Medio tiempo",
      "Second Half": "Segundo tiempo",
      "Extra Time": "Tiempo extra",
      "Penalty In Progress": "Penales",
      "Match Finished": "Finalizado",
      "Match Postponed": "Aplazado",
      "Match Cancelled": "Cancelado",
      "Match Suspended": "Suspendido"
    };
    
    return estados[estado] || estado;
  }

  /**
   * Obtiene el color apropiado para el estado del partido
   */
  obtenerColorEstado(estado: EstadoPartido): string {
    switch (estado) {
      case "First Half":
      case "Second Half":
      case "Extra Time":
      case "Penalty In Progress":
        return "#4CAF50"; // Verde para en vivo
      case "Match Finished":
        return "#2196F3"; // Azul para finalizado
      case "Not Started":
        return "#FF9800"; // Naranja para programado
      case "Match Postponed":
      case "Match Cancelled":
      case "Match Suspended":
        return "#F44336"; // Rojo para problemas
      default:
        return "#757575"; // Gris por defecto
    }
  }

  /**
   * Verifica si un partido está en vivo
   */
  estaEnVivo(estado: EstadoPartido): boolean {
    return [
      "First Half",
      "Halftime", 
      "Second Half",
      "Extra Time",
      "Penalty In Progress"
    ].includes(estado);
  }

  /**
   * Verifica si un partido ha finalizado
   */
  haFinalizado(estado: EstadoPartido): boolean {
    return estado === "Match Finished";
  }

  /**
   * Obtiene la fecha de hoy en formato YYYY-MM-DD
   */
  obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ================================
  // 🆕 MÉTODOS AUXILIARES PARA CUADRANGULARES
  // ================================

  /**
   * Extrae solo los equipos del Cuadrangular A desde TablasCompletas
   */
  extraerCuadrangularA(tablasCompletas: TablasCompletas): TablaEquipo[] {
    const grupoA = tablasCompletas.grupos.find(g => 
      g.nombreGrupo.toLowerCase().includes('a') || 
      g.nombreGrupo.toLowerCase().includes('cuadrangular a')
    );
    return grupoA ? grupoA.equipos : [];
  }

  /**
   * Extrae solo los equipos del Cuadrangular B desde TablasCompletas
   */
  extraerCuadrangularB(tablasCompletas: TablasCompletas): TablaEquipo[] {
    const grupoB = tablasCompletas.grupos.find(g => 
      g.nombreGrupo.toLowerCase().includes('b') || 
      g.nombreGrupo.toLowerCase().includes('cuadrangular b')
    );
    return grupoB ? grupoB.equipos : [];
  }

  /**
   * Obtiene estadísticas rápidas de los cuadrangulares
   */
  obtenerEstadisticasCuadrangulares(tablasCompletas: TablasCompletas) {
    return {
      totalGrupos: tablasCompletas.totalGrupos,
      totalEquipos: tablasCompletas.totalEquipos,
      equiposA: this.extraerCuadrangularA(tablasCompletas).length,
      equiposB: this.extraerCuadrangularB(tablasCompletas).length,
      temporada: tablasCompletas.temporada,
      liderA: this.extraerCuadrangularA(tablasCompletas)[0]?.team.name || 'No disponible',
      liderB: this.extraerCuadrangularB(tablasCompletas)[0]?.team.name || 'No disponible'
    };
  }

  /**
   * Busca un equipo específico en todos los cuadrangulares
   */
  buscarEquipoEnCuadrangulares(tablasCompletas: TablasCompletas, nombreEquipo: string): {
    equipo: TablaEquipo | null;
    grupo: string | null;
  } {
    for (const grupo of tablasCompletas.grupos) {
      const equipo = grupo.equipos.find(e => 
        e.team.name.toLowerCase().includes(nombreEquipo.toLowerCase())
      );
      if (equipo) {
        return { equipo, grupo: grupo.nombreGrupo };
      }
    }
    return { equipo: null, grupo: null };
  }

  /**
   * Filtra partidos por estado
   */
  filtrarPorEstado(partidos: PartidoDTO[], estado: EstadoPartido): PartidoDTO[] {
    return partidos.filter(partido => partido.estado === estado);
  }

  /**
   * Ordena partidos por fecha
   */
  ordenarPorFecha(partidos: PartidoDTO[], ascendente: boolean = true): PartidoDTO[] {
    return partidos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return ascendente ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  // ================================
  // 🚨 MÉTODOS PARA COMPATIBILIDAD
  // ================================

  /**
   * @deprecated Usar obtenerPartidosEnVivo() o obtenerProximosPartidos()
   * Mantenido para compatibilidad con código existente
   */
  obtenerPartidosPublicos(limite: number = 10): Observable<PartidoDTO[]> {
    console.warn('⚠️ obtenerPartidosPublicos() está deprecado. Usar obtenerPartidosEnVivo() o obtenerProximosPartidos()');
    
    return this.obtenerProximosPartidos();
  }

  /**
   * @deprecated Usar obtenerTodosLosPartidos()
   * Mantenido para compatibilidad con código existente
   */
  listarTodos(): Observable<{ partidos: PartidoDTO[] }> {
    console.warn('⚠️ listarTodos() está deprecado. Usar obtenerTodosLosPartidos()');
    
    return this.obtenerTodosLosPartidos().pipe(
      map(partidos => ({ partidos }))
    );
  }

  // ================================
  // 🛡️ MANEJO DE ERRORES
  // ================================

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`❌ Error en ${operation}:`, error);
      
      // Log adicional para debugging
      if (error.status) {
        console.error(`Status: ${error.status}`);
        console.error(`Message: ${error.message}`);
      }
      
      // Retornar resultado por defecto para que la app siga funcionando
      return of(result as T);
    };
  }
}
