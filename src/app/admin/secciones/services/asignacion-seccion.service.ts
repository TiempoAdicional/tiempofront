import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { SeccionesService, SeccionResponse } from '../../../core/services/secciones.service';

@Injectable({
  providedIn: 'root'
})
export class AsignacionSeccionService {

  constructor(private seccionesService: SeccionesService) {}

  /**
   * Obtiene la sección correspondiente al tipo de contenido
   * @param tipo - Tipo de contenido: 'EVENTOS', 'NOTICIAS', 'PARTIDOS'
   * @returns Observable con el ID de la sección o null si no existe
   */
  obtenerSeccionPorTipo(tipo: 'EVENTOS' | 'NOTICIAS' | 'PARTIDOS'): Observable<number | null> {
    return this.seccionesService.listar().pipe(
      map((secciones: SeccionResponse[]) => {
        // Buscar la primera sección activa del tipo especificado
        const seccionEncontrada = secciones.find(seccion => 
          seccion.tipo === tipo && seccion.activa === true
        );
        
        return seccionEncontrada ? seccionEncontrada.id : null;
      }),
      catchError(error => {
        console.error('Error al obtener sección por tipo:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene la sección por defecto para eventos
   */
  obtenerSeccionEventos(): Observable<number | null> {
    return this.obtenerSeccionPorTipo('EVENTOS');
  }

  /**
   * Obtiene la sección por defecto para noticias
   */
  obtenerSeccionNoticias(): Observable<number | null> {
    return this.obtenerSeccionPorTipo('NOTICIAS');
  }

  /**
   * Obtiene la sección por defecto para partidos
   */
  obtenerSeccionPartidos(): Observable<number | null> {
    return this.obtenerSeccionPorTipo('PARTIDOS');
  }

  /**
   * Crea las secciones por defecto si no existen
   */
  crearSeccionesPorDefecto(): Observable<boolean> {
    return this.seccionesService.listar().pipe(
      map((secciones: SeccionResponse[]) => {
        const tiposExistentes = secciones.map(s => s.tipo);
        
        // Crear secciones faltantes
        const seccionesACrear = [
          {
            titulo: 'Noticias',
            tipo: 'NOTICIAS' as const,
            orden: 1,
            descripcion: 'Sección de noticias del sitio',
            activa: true
          },
          {
            titulo: 'Eventos',
            tipo: 'EVENTOS' as const,
            orden: 2,
            descripcion: 'Sección de eventos del sitio',
            activa: true
          },
          {
            titulo: 'Partidos',
            tipo: 'PARTIDOS' as const,
            orden: 3,
            descripcion: 'Sección de partidos del sitio',
            activa: true
          }
        ].filter(seccion => !tiposExistentes.includes(seccion.tipo));

        // Crear las secciones faltantes
        seccionesACrear.forEach(seccion => {
          this.seccionesService.crear(seccion).subscribe({
            next: () => console.log(`✅ Sección ${seccion.titulo} creada`),
            error: (err) => console.error(`❌ Error creando sección ${seccion.titulo}:`, err)
          });
        });

        return true;
      }),
      catchError(error => {
        console.error('Error al crear secciones por defecto:', error);
        return of(false);
      })
    );
  }
}
