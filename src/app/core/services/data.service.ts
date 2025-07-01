import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { NoticiasService, Noticia, EstadisticasNoticias } from './noticias.service';
import { EventosService, Evento } from './eventos.service';
import { SeccionesService, SeccionResponse } from './secciones.service';

export interface EstadisticasGenerales {
  totalNoticias: number;
  totalEventos: number;
  totalSecciones: number;
  noticiasRecientes: number;
  eventosProximos: number;
  fechaActualizacion: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly cache = new Map<string, Observable<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(
    private noticiasService: NoticiasService,
    private eventosService: EventosService,
    private seccionesService: SeccionesService
  ) {}

  // === MÉTODOS DELEGADOS OPTIMIZADOS ===

  obtenerNoticias(limite?: number): Observable<Noticia[]> {
    return this.getCachedData('noticias', () => 
      limite 
        ? this.noticiasService.obtenerRecientes(limite)
        : this.noticiasService.listarTodas().pipe(map(response => response.noticias))
    );
  }

  obtenerNoticiasPublicas(limite?: number): Observable<Noticia[]> {
    return this.getCachedData(`noticias-publicas-${limite}`, () => 
      this.noticiasService.obtenerPublicas(limite)
    );
  }

  obtenerNoticiasDestacadas(limite?: number): Observable<Noticia[]> {
    return this.getCachedData(`noticias-destacadas-${limite}`, () => 
      this.noticiasService.obtenerDestacadas(limite)
    );
  }

  obtenerEventos(): Observable<Evento[]> {
    return this.getCachedData('eventos', () => 
      this.eventosService.listarTodos()
    );
  }

  obtenerEventosProximos(): Observable<Evento[]> {
    return this.getCachedData('eventos-proximos', () => 
      this.eventosService.obtenerProximos()
    );
  }

  obtenerSecciones(): Observable<SeccionResponse[]> {
    return this.getCachedData('secciones', () => 
      this.seccionesService.listar()
    );
  }

  obtenerSeccionesActivas(): Observable<SeccionResponse[]> {
    return this.getCachedData('secciones-activas', () => 
      this.seccionesService.obtenerSeccionesActivas()
    );
  }

  // === ESTADÍSTICAS CENTRALIZADAS ===

  obtenerEstadisticasCompletas(): Observable<EstadisticasGenerales> {
    console.log('📊 DataService: Iniciando obtención de estadísticas completas...');
    
    return this.getCachedData('estadisticas-completas', () => 
      combineLatest([
        this.noticiasService.obtenerEstadisticas(),
        this.eventosService.listarTodos(),
        this.eventosService.obtenerProximos(),
        this.seccionesService.listar()
      ]).pipe(
        map(([statsNoticias, todosEventos, eventosProximos, secciones]) => {
          console.log('📊 DataService: Datos recibidos:');
          console.log('  - Stats noticias:', statsNoticias);
          console.log('  - Todos eventos:', todosEventos?.length || 0);
          console.log('  - Eventos próximos:', eventosProximos?.length || 0);
          console.log('  - Secciones:', secciones?.length || 0);
          
          const estadisticas: EstadisticasGenerales = {
            totalNoticias: statsNoticias?.totalNoticias || 0,
            totalEventos: todosEventos?.length || 0,
            totalSecciones: secciones?.length || 0,
            noticiasRecientes: statsNoticias?.noticiasRecientes || 0,
            eventosProximos: eventosProximos?.length || 0,
            fechaActualizacion: new Date()
          };
          
          console.log('✅ DataService: Estadísticas finales calculadas:', estadisticas);
          return estadisticas;
        }),
        catchError((error) => {
          console.error('❌ DataService: Error al obtener estadísticas completas:', error);
          
          const estadisticasDefault: EstadisticasGenerales = {
            totalNoticias: 0,
            totalEventos: 0,
            totalSecciones: 0,
            noticiasRecientes: 0,
            eventosProximos: 0,
            fechaActualizacion: new Date()
          };
          
          console.log('📊 DataService: Usando estadísticas por defecto:', estadisticasDefault);
          return of(estadisticasDefault);
        })
      )
    );
  }

  /**
   * Fuerza la recarga de estadísticas limpiando el cache
   */
  refrescarEstadisticas(): Observable<EstadisticasGenerales> {
    this.limpiarCacheEspecifico(['estadisticas-completas']);
    return this.obtenerEstadisticasCompletas();
  }

  // === BÚSQUEDAS OPTIMIZADAS ===

  buscarNoticias(termino: string): Observable<Noticia[]> {
    return this.noticiasService.buscarPorTitulo(termino);
  }

  buscarPorTags(tags: string[]): Observable<Noticia[]> {
    return this.noticiasService.buscarPorTags(tags);
  }

  obtenerNoticiasPorSeccion(seccionId: number): Observable<Noticia[]> {
    return this.noticiasService.obtenerPorSeccion(seccionId);
  }

  // === GESTIÓN DE CACHE ===

  private getCachedData<T>(key: string, dataFactory: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached as Observable<T>;
    }

    const data$ = dataFactory().pipe(
      shareReplay(1)
    );

    this.cache.set(key, data$);
    
    // Limpiar cache después del tiempo especificado
    setTimeout(() => this.cache.delete(key), this.CACHE_DURATION);
    
    return data$;
  }

  limpiarCache(): void {
    this.cache.clear();
  }

  limpiarCacheEspecifico(keys: string[]): void {
    keys.forEach(key => this.cache.delete(key));
  }
}
