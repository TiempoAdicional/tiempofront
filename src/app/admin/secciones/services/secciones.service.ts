import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment/environment';

// === INTERFACES ===
export interface SeccionRequest {
  titulo: string;
  tipo: 'NOTICIAS' | 'EVENTOS' | 'PARTIDOS';
  orden: number;
  descripcion?: string;
  activa?: boolean;
}

export interface SeccionResponse {
  id: number;
  titulo: string;
  tipo: string;
  orden: number;
  descripcion?: string;
  activa: boolean;
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
  private apiUrl = `${environment.apiBaseUrl}/api/secciones`;

  constructor(private http: HttpClient) {}

  // === CREAR SECCIÓN ===
  crear(seccion: SeccionRequest): Observable<SeccionResponse> {
    return this.http.post<SeccionResponse>(`${this.apiUrl}/crear`, seccion);
  }

  // === LISTAR TODAS LAS SECCIONES ===
  listar(): Observable<SeccionResponse[]> {
    return this.http.get<SeccionResponse[]>(this.apiUrl);
  }

  // === OBTENER SECCIÓN POR ID ===
  obtenerPorId(id: number): Observable<SeccionResponse> {
    return this.http.get<SeccionResponse>(`${this.apiUrl}/${id}`);
  }

  // === ACTUALIZAR SECCIÓN ===
  actualizar(id: number, seccion: SeccionRequest): Observable<SeccionResponse> {
    return this.http.put<SeccionResponse>(`${this.apiUrl}/actualizar/${id}`, seccion);
  }

  // === ELIMINAR SECCIÓN POR ID ===
  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  // === REORDENAR SECCIONES ===
  reordenar(secciones: { id: number; orden: number }[]): Observable<SeccionResponse[]> {
    return this.http.put<SeccionResponse[]>(`${this.apiUrl}/reordenar`, { secciones });
  }

  // === ACTIVAR/DESACTIVAR SECCIÓN ===
  cambiarEstado(id: number, activa: boolean): Observable<SeccionResponse> {
    return this.http.patch<SeccionResponse>(`${this.apiUrl}/${id}/estado`, { activa });
  }

  // === VISTA PREVIA DEL PERIÓDICO ===
  obtenerVistaPreviaPeriodicoCompleto(): Observable<VistaPreviaPeriodicoResponse> {
    return this.http.get<VistaPreviaPeriodicoResponse>(`${this.apiUrl}/vista-previa`);
  }

  // === OBTENER SECCIONES ACTIVAS CON CONTENIDO ===
  obtenerSeccionesActivasConContenido(): Observable<SeccionConContenidoResponse[]> {
    return this.http.get<SeccionConContenidoResponse[]>(`${this.apiUrl}/activas/contenido`);
  }
}
