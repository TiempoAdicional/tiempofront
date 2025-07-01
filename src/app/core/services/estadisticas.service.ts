import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DataService, EstadisticasGenerales } from './data.service';
import { LigaColombianService, EstadisticasLigaColombiana } from './liga-colombiana.service';

export interface EstadisticasDashboard extends EstadisticasGenerales, EstadisticasLigaColombiana {
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(
    private dataService: DataService,
    private ligaColombianService: LigaColombianService
  ) {}

  /**
   * Obtiene todas las estadísticas combinadas de forma optimizada
   */
  obtenerEstadisticas(): Observable<EstadisticasDashboard> {
    return combineLatest([
      this.dataService.obtenerEstadisticasCompletas(),
      this.ligaColombianService.obtenerEstadisticas()
    ]).pipe(
      map(([estadisticasGenerales, estadisticasLiga]) => ({
        ...estadisticasGenerales,
        ...estadisticasLiga
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
    this.ligaColombianService.limpiarCache();
    return this.obtenerEstadisticas();
  }
}
