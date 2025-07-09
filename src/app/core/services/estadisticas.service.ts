import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DataService, EstadisticasGenerales } from './data.service';


export interface EstadisticasDashboard extends EstadisticasGenerales {
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(
    private dataService: DataService,
  ) {}

  /**
   * Obtiene todas las estadísticas combinadas de forma optimizada
   */
  obtenerEstadisticas(): Observable<EstadisticasDashboard> {
    return combineLatest([
      this.dataService.obtenerEstadisticasCompletas(),
    ]).pipe(
      map(([estadisticasGenerales]) => ({
        ...estadisticasGenerales,
     
      })),
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return of({
          totalNoticias: 0,
          totalEventos: 0,
          totalSecciones: 0,
          noticiasRecientes: 0,
          eventosProximos: 0,
          partidosHoy: 0,
          partidosTemporadaActual: 0,
          totalEquipos: 0,
          fechaActualizacion: new Date(),
          error: 'Error al cargar las estadísticas'
        });
      })
    );
  }

  /**
   * Refrescar todas las estadísticas
   */
  refrescar(): Observable<EstadisticasDashboard> {
    this.dataService.limpiarCache();
    return this.obtenerEstadisticas();
  }
}
