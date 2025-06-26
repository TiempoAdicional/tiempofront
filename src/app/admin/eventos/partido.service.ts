import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Partido {
  fecha: string;
  estado: string;
  equipoLocal: string;
  equipoVisitante: string;
  liga: string;
  golesLocal: number | null;
  golesVisitante: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PartidoService {
  private apiUrl = `${environment.apiBaseUrl}/api/partidos`;

  constructor(private http: HttpClient) {}

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
}