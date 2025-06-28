import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Partido {
  id?: number;
  fecha: string;
  estado: string;
  equipoLocal: string;
  equipoVisitante: string;
  liga?: string;
  competencia?: string; // Nueva propiedad para coincidir con backend
  golesLocal: number | null;
  golesVisitante: number | null;
  seccion_id?: number; // ID de la sección asignada
  esDeApi?: boolean; // true = API externa, false = BD local
}

@Injectable({
  providedIn: 'root'
})
export class PartidoService {
  private apiUrl = `${environment.apiBaseUrl}/api/partidos`;

  constructor(private http: HttpClient) {}

  // === API EXTERNA (TIEMPO REAL) ===
  
  // Partidos de hoy desde API externa
  obtenerPartidosHoyApi(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/hoy`);
  }

  // Buscar por fecha en API externa
  buscarPorFechaApi(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/buscar/fecha`, {
      params: { fecha }
    });
  }

  // Buscar por equipo en API externa
  buscarPorEquipoApi(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/api/buscar/equipo`, {
      params: { nombre }
    });
  }

  // Guardar partido de API en BD local
  guardarPartidoDeApi(partido: Partido, seccionId?: number): Observable<Partido> {
    const params = seccionId ? new HttpParams().set('seccionId', seccionId.toString()) : undefined;
    return this.http.post<Partido>(`${this.apiUrl}/api/guardar`, partido, { params });
  }

  // === BASE DE DATOS LOCAL ===
  
  // Listar partidos almacenados localmente
  listarPartidosLocales(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/local`);
  }

  // Obtener partido local por ID
  obtenerPartidoLocalPorId(id: number): Observable<Partido> {
    return this.http.get<Partido>(`${this.apiUrl}/local/${id}`);
  }

  // Crear partido directamente en BD local
  crearPartidoLocal(formData: FormData, seccionId?: number): Observable<Partido> {
    const params = seccionId ? new HttpParams().set('seccionId', seccionId.toString()) : undefined;
    return this.http.post<Partido>(`${this.apiUrl}/local/crear`, formData, { params });
  }

  // Actualizar partido local
  actualizarPartidoLocal(id: number, formData: FormData): Observable<Partido> {
    return this.http.put<Partido>(`${this.apiUrl}/local/${id}`, formData);
  }

  // Eliminar partido local
  eliminarPartidoLocal(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/local/${id}`, { responseType: 'text' });
  }

  // Buscar partidos locales por equipo
  buscarPartidosLocalesPorEquipo(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/local/buscar/equipo`, {
      params: { nombre }
    });
  }

  // Buscar partidos locales por rango de fechas
  buscarPartidosLocalesPorFechas(desde: string, hasta: string): Observable<Partido[]> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.get<Partido[]>(`${this.apiUrl}/local/buscar/fechas`, { params });
  }

  // === ENDPOINTS COMBINADOS ===
  
  // Obtener partidos de ambas fuentes
  obtenerPartidosCombinados(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/combinados`);
  }

  // Buscar por fecha en ambas fuentes
  buscarPorFechaCombinado(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/combinados/buscar/fecha`, {
      params: { fecha }
    });
  }

  // === ENDPOINTS LEGACY (COMPATIBILIDAD) ===
  
  // Mantienen compatibilidad con frontend existente
  obtenerPartidosHoy(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/hoy`);
  }

  buscarPorFecha(fecha: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/buscar/fecha`, {
      params: { fecha }
    });
  }

  buscarPorNombre(nombre: string): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${this.apiUrl}/buscar/equipo`, {
      params: { nombre }
    });
  }

  // === MÉTODOS NUEVOS PARA GESTIÓN COMPLETA ===
  
  // Crear partido con asignación automática de sección
  crear(formData: FormData): Observable<Partido> {
    return this.http.post<Partido>(`${this.apiUrl}/crear`, formData);
  }

  // Actualizar partido
  actualizar(id: number, formData: FormData): Observable<Partido> {
    return this.http.put<Partido>(`${this.apiUrl}/actualizar/${id}`, formData);
  }

  // Eliminar partido
  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  // Listar todos los partidos
  listarTodos(): Observable<Partido[]> {
    return this.http.get<Partido[]>(this.apiUrl);
  }
}