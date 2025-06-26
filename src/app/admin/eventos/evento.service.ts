import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Evento {
  id?: number;
  nombre: string;
  descripcion: string;
  fecha: string; // formato ISO yyyy-MM-dd
  lugar: string;
  imagenEvento?: string;
  videoUrl?: string;
  creadorNombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private apiUrl = `${environment.apiBaseUrl}/api/eventos`;

  constructor(private http: HttpClient) {}

  // ✅ GET - Listar todos los eventos
  listarTodos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }

  // ✅ GET - Listar solo eventos futuros
  listarProximos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/proximos`);
  }

  // ✅ GET - Obtener evento por ID
  obtenerPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  // ✅ POST - Crear evento con FormData
  crear(formData: FormData): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}/crear`, formData);
  }

  // ✅ PUT - Actualizar evento con FormData
  actualizar(id: number, formData: FormData): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/actualizar/${id}`, formData);
  }

  // ✅ DELETE - Eliminar evento por ID
  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  // ✅ GET - Listar eventos por creador
  listarPorCreador(creadorId: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/creador/${creadorId}`);
  }
}
