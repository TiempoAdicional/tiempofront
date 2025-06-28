import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface CrearNoticiaPayload {
  titulo: string;
  resumen?: string;
  contenidoHtml: string;
  esPublica: boolean;
  imagen?: File;
}

export interface Noticia {
  id: number;
  titulo: string;
  resumen: string;
  contenidoHtml: string;
  contenidoUrl: string;
  imagenDestacada: string;
  esPublica: boolean;
  destacada: boolean;
  visitas: number;
  autorId: number;
  autorNombre: string;
  fechaPublicacion: string;
  seccion_id?: number; // ID de la sección asignada
}

export interface NoticiaDetalleDTO {
  noticia: Noticia;
  comentarios: string[];
}
export interface Comentario {
  autor: string;
  mensaje: string;
  fecha: string;
}
@Injectable({
  providedIn: 'root'
})
export class NoticiaService {
  private apiUrl = `${environment.apiBaseUrl}/api/noticias`;

  constructor(private http: HttpClient) { }

  // ✅ Crear noticia (POST)
  crearNoticia(formData: FormData, autorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, formData);
  }


  // ✅ Actualizar noticia (PUT)
  actualizarNoticia(id: number, data: FormData): Observable<Noticia> {
    return this.http.put<Noticia>(`${this.apiUrl}/${id}`, data);
  }

  // ✅ Eliminar noticia (DELETE)
  eliminarNoticia(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  // ✅ Listar todas las noticias (GET)
  listarTodas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}`);
  }

  // ✅ Listar noticias públicas (GET)
  listarPublicas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/publicas`);
  }

  // ✅ Obtener noticia por ID (GET)
  obtenerPorId(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.apiUrl}/${id}`);
  }

  // ✅ Buscar por título (GET con query param)
  buscarPorTitulo(titulo: string): Observable<Noticia[]> {
    const params = new HttpParams().set('titulo', titulo);
    return this.http.get<Noticia[]>(`${this.apiUrl}/buscar`, { params });
  }

  // ✅ Filtrar por fecha (GET con query param)
  filtrarPorFecha(desde: string, hasta: string): Observable<Noticia[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<Noticia[]>(`${this.apiUrl}/publicadas`, { params });
  }

  // ✅ Ver noticia y sumar visitas (GET)
  verYSumarVisita(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.apiUrl}/ver/${id}`);
  }

  // ✅ Listar destacadas (GET)
  listarDestacadas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/destacadas`);
  }

  // ✅ Listar por autor (GET)
  listarPorAutor(autorId: number): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.apiUrl}/autor/${autorId}`);
  }

  // ✅ Cambiar estado de destacada (PATCH)
  cambiarDestacada(id: number, autorId: number, destacada: boolean): Observable<Noticia> {
    const params = new HttpParams()
      .set('destacada', destacada.toString())
      .set('autorId', autorId.toString());
    return this.http.patch<Noticia>(`${this.apiUrl}/${id}/destacar`, null, { params });
  }
  // ✅ Ver detalle con comentarios (GET)
  verDetalleConComentarios(id: number): Observable<NoticiaDetalleDTO> {
    return this.http.get<NoticiaDetalleDTO>(`${this.apiUrl}/detalle/${id}`);
  }

}
