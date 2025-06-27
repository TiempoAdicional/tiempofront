import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment/environment';

// === INTERFACES ===
export interface SeccionRequest {
  titulo: string;
  tipo: 'NOTICIAS' | 'EVENTOS' | 'PARTIDOS'; // puedes expandir tipos si cambian en el backend
  orden: number;
}

export interface SeccionResponse {
  id: number;
  titulo: string;
  tipo: string;
  orden: number;
}

@Injectable({
  providedIn: 'root'
})
export class SeccionesService {
  private apiUrl = `${environment.apiBaseUrl}/secciones`;

  constructor(private http: HttpClient) {}

  // === CREAR o EDITAR SECCIÓN ===
  crear(seccion: SeccionRequest): Observable<SeccionResponse> {
    return this.http.post<SeccionResponse>(this.apiUrl, seccion);
  }

  // === LISTAR TODAS LAS SECCIONES ===
  listar(): Observable<SeccionResponse[]> {
    return this.http.get<SeccionResponse[]>(this.apiUrl);
  }

  // === ELIMINAR SECCIÓN POR ID ===
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
