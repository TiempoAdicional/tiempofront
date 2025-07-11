import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

// Servicios
import { AuthService } from '../../auth/services/auth.service';
import { NoticiasService } from '../../core/services/noticias.service';
import { EventosService } from '../../core/services/eventos.service';
import { PartidosService } from '../../core/services/partidos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { SeccionesService, SeccionResponse, SeccionConContenidoResponse } from '../../core/services/secciones.service';

interface NoticiaLimitada {
  id: number;
  titulo: string;
  resumen: string;
  fechaPublicacion: string;
  seccion: string;
  imagenUrl?: string;
  bloqueada?: boolean;
  autorNombre?: string;
  creadorId?: number;
}

interface EventoLimitado {
  id: number;
  titulo: string;
  fecha: string;
  ubicacion: string;
  competicion: string;
  bloqueado?: boolean;
  autorNombre?: string;
  creadorId?: number;
}

interface PartidoLimitado {
  codigoApi: string;
  nombreEquipoLocal: string;
  nombreEquipoVisitante: string;
  escudoEquipoLocal: string;
  escudoEquipoVisitante: string;
  fecha: string;
  estado: string;
  golesLocal: number;
  golesVisitante: number;
  estadio: string;
  minutoActual: number;
  bloqueado?: boolean;
}

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatGridListModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class UsuarioDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Estados de carga
  cargandoNoticias = true;
  cargandoEventos = true;
  cargandoPartidos = true;
  cargandoSecciones = true;
  
  // Datos limitados para usuarios no registrados
  noticiasLimitadas: NoticiaLimitada[] = [];
  eventosLimitados: EventoLimitado[] = [];
  partidosLimitados: PartidoLimitado[] = [];
  
  // 🆕 Secciones dinámicas
  seccionesActivas: SeccionResponse[] = [];
  seccionesConContenido: SeccionConContenidoResponse[] = [];
  seccionesPorTipo: { [key: string]: SeccionConContenidoResponse[] } = {
    'NOTICIAS': [],
    'EVENTOS': [],
    'PARTIDOS': []
  };
  
  // Noticia destacada para hero section (carousel)
  noticiasDestacadas: NoticiaLimitada[] = [];
  noticiaDestacadaActual: NoticiaLimitada | null = null;
  indiceNoticiaActual = 0;
  progressValue = 0;
  carouselInterval: any;
  progressInterval: any;
  readonly CAROUSEL_DURATION = 2000; // 2 segundos por noticia
  
  // Límites para usuarios no registrados
  readonly LIMITE_NOTICIAS = 10;
  readonly LIMITE_EVENTOS = 8;
  readonly LIMITE_PARTIDOS = 6;
  
  // Estado del usuario
  estaAutenticado = false;
  mostrarLimites = true;
  nombreUsuario = '';

  // Estado de conexión con el backend
  backendDisponible = true;
  mensajeConexion = '';
  
  // Avisos de límites para usuarios no autenticados
  mostrarAvisoLimiteNoticias = false;
  mostrarAvisoLimiteEventos = false;

  // Cache simple para nombres de usuarios
  private usuariosCache = new Map<number, string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private noticiasService: NoticiasService,
    private eventosService: EventosService,
    private partidosService: PartidosService,
    private usuariosService: UsuariosService,
    private seccionesService: SeccionesService, // 🆕 Servicio de secciones
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.cargarDatos();
    
    // Manejar query parameters para filtros específicos
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.manejarFiltros(params);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pararCarousel();
  }

  ngAfterViewInit(): void {
    // Manejar navegación basada en fragments
    this.route.fragment
      .pipe(takeUntil(this.destroy$))
      .subscribe(fragment => {
        if (fragment) {
          this.scrollToSection(fragment);
        }
      });
  }

  private verificarAutenticacion(): void {
    this.estaAutenticado = this.authService.estaAutenticado();
    this.mostrarLimites = !this.estaAutenticado;
    this.nombreUsuario = this.authService.obtenerNombreUsuario() || 'Usuario';
    
    console.log('🔍 Estado de autenticación:', {
      estaAutenticado: this.estaAutenticado,
      mostrarLimites: this.mostrarLimites,
      nombreUsuario: this.nombreUsuario
    });
  }

  private cargarDatos(): void {
    this.cargarSecciones(); // 🆕 Cargar secciones primero
    this.cargarNoticias();
    this.cargarEventos();
    this.cargarPartidos();
  }

  private cargarSecciones(): void {
    this.cargandoSecciones = true;
    
    console.log('🏷️ Cargando secciones activas...');
    
    this.seccionesService.obtenerSeccionesActivasConContenido()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (seccionesConContenido) => {
          console.log('✅ Secciones con contenido cargadas:', seccionesConContenido);
          
          this.seccionesConContenido = seccionesConContenido;
          this.organizarSeccionesPorTipo(seccionesConContenido);
          this.cargandoSecciones = false;
        },
        error: (error) => {
          console.error('❌ Error cargando secciones:', error);
          this.cargandoSecciones = false;
          // Cargar secciones predeterminadas como fallback
          this.cargarSeccionesFallback();
        }
      });
  }

  private organizarSeccionesPorTipo(secciones: SeccionConContenidoResponse[]): void {
    // Reiniciar agrupación
    this.seccionesPorTipo = {
      'NOTICIAS': [],
      'EVENTOS': [],
      'PARTIDOS': []
    };

    // Agrupar secciones por tipo
    secciones.forEach(seccionConContenido => {
      const tipo = seccionConContenido.seccion.tipo;
      if (this.seccionesPorTipo[tipo]) {
        this.seccionesPorTipo[tipo].push(seccionConContenido);
      }
    });

    console.log('🗂️ Secciones organizadas por tipo:', this.seccionesPorTipo);
  }

  private cargarSeccionesFallback(): void {
    console.log('🔄 Cargando secciones predeterminadas como fallback...');
    
    // Crear secciones básicas como fallback
    this.seccionesPorTipo = {
      'NOTICIAS': [{
        seccion: {
          id: 1,
          titulo: 'Noticias Principales',
          tipo: 'NOTICIAS',
          orden: 1,
          activa: true,
          visible: true
        },
        contenido: []
      }],
      'EVENTOS': [{
        seccion: {
          id: 2,
          titulo: 'Eventos Deportivos',
          tipo: 'EVENTOS',
          orden: 2,
          activa: true,
          visible: true
        },
        contenido: []
      }],
      'PARTIDOS': [{
        seccion: {
          id: 3,
          titulo: 'Partidos',
          tipo: 'PARTIDOS',
          orden: 3,
          activa: true,
          visible: true
        },
        contenido: []
      }]
    };
  }

  private cargarNoticias(): void {
    this.cargandoNoticias = true;
    
    if (this.estaAutenticado) {
      // Usuario autenticado: acceso completo
      console.log('🔓 Usuario autenticado - Cargando todas las noticias');
      this.noticiasService.listarTodasAutenticado(1, 50)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ Noticias autenticadas cargadas:', response);
            this.procesarNoticiasCompletas(response.noticias || []);
            this.cargandoNoticias = false;
          },
          error: (error) => {
            console.error('❌ Error cargando noticias autenticadas:', error);
            this.cargarNoticiasPublicas(); // Fallback
          }
        });
    } else {
      // Usuario no autenticado: contenido limitado
      console.log('🔒 Usuario no autenticado - Cargando 10 noticias públicas');
      this.cargarNoticiasPublicas();
    }
  }

  private cargarNoticiasPublicas(): void {
    // Usar endpoint público con límite de 10 noticias
    this.noticiasService.listarNoticiasPublicas(this.LIMITE_NOTICIAS)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Noticias públicas cargadas:', response);
          
          let noticias = [];
          if (response?.noticias) {
            noticias = response.noticias;
          } else if (Array.isArray(response)) {
            noticias = response;
          }
          
          console.log(`📰 Procesando ${noticias.length} noticias públicas (límite: ${this.LIMITE_NOTICIAS})`);
          
          // Solo cargar noticia destacada si NO está autenticado
          if (!this.estaAutenticado) {
            this.cargarNoticiaDestacada();
          }
          
          // Procesar noticias limitadas
          this.procesarNoticiasLimitadas(noticias);
          this.mostrarAvisoLimiteNoticias = !this.estaAutenticado && noticias.length >= this.LIMITE_NOTICIAS;
          this.cargandoNoticias = false;
        },
        error: (error) => {
          console.error('❌ Error cargando noticias públicas:', error);
          this.cargarNoticiasFallback();
        }
      });
  }

  private cargarNoticiaDestacada(): void {
    if (!this.estaAutenticado) {
      this.noticiasService.obtenerDestacadas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (destacadas) => {
            if (destacadas && destacadas.length > 0) {
              this.noticiasDestacadas = destacadas.map(noticia => ({
                id: noticia.id,
                titulo: noticia.titulo,
                resumen: this.limitarTexto((noticia.resumen || noticia.contenidoHtml || ''), 150),
                fechaPublicacion: noticia.fechaPublicacion,
                seccion: 'Destacada',
                imagenUrl: noticia.imagenDestacada,
                bloqueada: false,
                autorNombre: noticia.autorNombre || 'TiempoAdicional'
              }));
              

              
              // Inicializar carousel
              if (this.noticiasDestacadas.length > 0) {
                this.indiceNoticiaActual = 0;
                this.noticiaDestacadaActual = this.noticiasDestacadas[0];
                this.iniciarCarousel();
                console.log('✨ Carousel inicializado con', this.noticiasDestacadas.length, 'noticias destacadas reales (sin duplicados)');
              }
              
              console.log('✨ Noticias destacadas públicas configuradas (solo reales):', this.noticiasDestacadas.length);
            }
          },
          error: (error) => {
            console.warn('⚠️ No se pudieron cargar noticias destacadas:', error);
          }
        });
    }
  }

  private procesarNoticiasCompletas(noticias: any[]): void {
    console.log('📰 Procesando noticias completas para usuario autenticado:', noticias.length);
    
    // Para usuarios autenticados: buscar todas las noticias destacadas
    const noticiasDestacadasRaw = noticias.filter((n: any) => n.destacada === true);
    
    if (noticiasDestacadasRaw.length > 0) {
      console.log('✨ Noticias destacadas encontradas:', noticiasDestacadasRaw.length);
      
      this.noticiasDestacadas = noticiasDestacadasRaw.map(noticiaRaw => {
        const autorNombre = noticiaRaw.creadorNombre || 
                           noticiaRaw.autorNombre || 
                           noticiaRaw.autor_nombre || 
                           'TiempoAdicional';
        
        return {
          id: noticiaRaw.id,
          titulo: noticiaRaw.titulo,
          resumen: noticiaRaw.resumen || this.limitarTexto((noticiaRaw.contenidoHtml || ''), 150),
          fechaPublicacion: noticiaRaw.fechaPublicacion,
          seccion: 'Destacada',
          imagenUrl: noticiaRaw.imagenDestacada,
          bloqueada: false,
          autorNombre: autorNombre,
          creadorId: noticiaRaw.autorId || noticiaRaw.creador_id
        };
      });
      

      
      // Inicializar carousel
      if (this.noticiasDestacadas.length > 0) {
        this.indiceNoticiaActual = 0;
        this.noticiaDestacadaActual = this.noticiasDestacadas[0];
        this.iniciarCarousel();
        console.log('✨ Carousel inicializado con', this.noticiasDestacadas.length, 'noticias destacadas reales (sin duplicados)');
      }
      
      console.log('✅ Noticias destacadas configuradas (solo reales):', this.noticiasDestacadas.length);
    } else {
      console.log('⚠️ No hay noticias destacadas en las noticias autenticadas');
    }
    
    // Filtrar noticias para grid (excluir destacadas)
    const noticiasParaGrid = noticias.filter((n: any) => !n.destacada);
    
    console.log(`📋 Procesando ${noticiasParaGrid.length} noticias para el grid (excluyendo destacadas)`);
    this.procesarListaNoticias(noticiasParaGrid, false);
  }

  private procesarNoticiasLimitadas(noticias: any[]): void {
    // Para usuarios no autenticados: contenido limitado
    const noticiasLimitadas = noticias.slice(0, this.LIMITE_NOTICIAS);
    this.procesarListaNoticias(noticiasLimitadas, true);
  }

  private procesarListaNoticias(noticias: any[], esLimitado: boolean): void {
    Promise.all(
      noticias.map(async (noticia: any) => {
        // Priorizar creadorNombre (igual que en noticia-detalle), luego autorNombre
        let autorNombre = noticia.creadorNombre || noticia.autorNombre || noticia.autor_nombre;
        
        // Log para diagnosticar qué campo se está usando
        console.log(`📰 Noticia ${noticia.id} - creadorNombre: ${noticia.creadorNombre}, autorNombre: ${noticia.autorNombre}, autor_nombre: ${noticia.autor_nombre}`);
        
        // Solo buscar por ID si no tenemos ningún nombre disponible
        if (!autorNombre) {
          autorNombre = await this.obtenerNombreUsuario(noticia.autorId || noticia.creador_id);
        }
        
        return {
          id: noticia.id,
          titulo: noticia.titulo,
          resumen: this.limitarTexto((noticia.resumen || noticia.contenidoHtml || ''), 120),
          fechaPublicacion: noticia.fechaPublicacion,
          seccion: this.determinarSeccion(noticia),
          imagenUrl: noticia.imagenDestacada || '/assets/logo-tiempo.png',
          bloqueada: false, // ✅ Permitir ver contenido, solo limitar cantidad
          autorNombre: autorNombre,
          creadorId: noticia.autorId || noticia.creador_id
        } as NoticiaLimitada;
      })
    ).then(noticiasLimitadas => {
      this.noticiasLimitadas = noticiasLimitadas;
      console.log(`✅ ${noticiasLimitadas.length} noticias procesadas para el grid`);
    }).catch(error => {
      console.error('❌ Error procesando noticias:', error);
      this.cargarNoticiasFallback();
    });
  }

  private cargarNoticiasFallback(): void {
    console.log('🔄 Cargando noticias con datos de fallback...');
    this.noticiasLimitadas = [];
    this.noticiasDestacadas = [];
    this.noticiaDestacadaActual = null;
    this.pararCarousel();
    this.cargandoNoticias = false;
    this.backendDisponible = false;
    this.mensajeConexion = 'Error loading content';
    
    this.snackBar.open(
      'No se pudieron cargar las noticias. Verifique su conexión.',
      'Cerrar',
      { duration: 5000 }
    );
  }

  private cargarEventos(): void {
    this.cargandoEventos = true;
    
    if (this.estaAutenticado) {
      // Usuario autenticado: acceso completo
      console.log('🔓 Usuario autenticado - Cargando todos los eventos');
      this.eventosService.listarTodos()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ Eventos autenticados cargados:', response);
            this.procesarEventosCompletos(response);
            this.cargandoEventos = false;
          },
          error: (error) => {
            console.error('❌ Error cargando eventos autenticados:', error);
            this.cargarEventosPublicos(); // Fallback
          }
        });
    } else {
      // Usuario no autenticado: contenido limitado
      console.log('🔒 Usuario no autenticado - Cargando 8 eventos públicos');
      this.cargarEventosPublicos();
    }
  }

  private cargarEventosPublicos(): void {
    // Usar endpoint público con límite de 8 eventos
    this.eventosService.listarEventosPublicos(this.LIMITE_EVENTOS)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Eventos públicos cargados:', response);
          
          let eventos = [];
          if (response?.eventos) {
            eventos = response.eventos;
          } else if (Array.isArray(response)) {
            eventos = response;
          }
          
          console.log(`📅 Procesando ${eventos.length} eventos públicos (límite: ${this.LIMITE_EVENTOS})`);
          
          this.procesarEventosLimitados(eventos);
          this.mostrarAvisoLimiteEventos = !this.estaAutenticado && eventos.length >= this.LIMITE_EVENTOS;
          this.cargandoEventos = false;
        },
        error: (error) => {
          console.error('❌ Error cargando eventos públicos:', error);
          this.cargarEventosFallback();
        }
      });
  }

  private procesarEventosCompletos(response: any): void {
    // Para usuarios autenticados: acceso completo
    let eventosArray = [];
    if (response && response.eventos) {
      eventosArray = response.eventos;
    } else if (Array.isArray(response)) {
      eventosArray = response;
    }
    
    this.procesarListaEventos(eventosArray, false);
  }

  private procesarEventosLimitados(eventos: any[]): void {
    // Para usuarios no autenticados: contenido limitado
    const eventosLimitados = eventos.slice(0, this.LIMITE_EVENTOS);
    this.procesarListaEventos(eventosLimitados, true);
  }

  private procesarListaEventos(eventos: any[], esLimitado: boolean): void {
    Promise.all(
      eventos.map(async (evento: any) => {
        // Priorizar creadorNombre (igual que en evento-detalle), luego autorNombre
        let autorNombre = evento.creadorNombre || evento.autorNombre || evento.autor_nombre;
        
        // Log para diagnosticar qué campo se está usando
        console.log(`📅 Evento ${evento.id} - creadorNombre: ${evento.creadorNombre}, autorNombre: ${evento.autorNombre}, autor_nombre: ${evento.autor_nombre}`);
        
        // Solo buscar por ID si no tenemos ningún nombre disponible
        if (!autorNombre) {
          autorNombre = await this.obtenerNombreUsuario(evento.creadorId || evento.creador_id);
        }
        
        return {
          id: evento.id || 0,
          titulo: evento.nombre || evento.titulo,
          fecha: evento.fecha,
          ubicacion: evento.lugar || evento.ubicacion || 'Ubicación por confirmar',
          competicion: evento.descripcion || evento.competicion || 'Evento',
          bloqueado: false, // ✅ Permitir ver contenido, solo limitar cantidad
          autorNombre: autorNombre,
          creadorId: evento.creadorId || evento.creador_id
        } as EventoLimitado;
      })
    ).then(eventosLimitados => {
      this.eventosLimitados = eventosLimitados;
      console.log(`✅ ${eventosLimitados.length} eventos procesados para el grid`);
    }).catch(error => {
      console.error('❌ Error procesando eventos:', error);
      this.cargarEventosFallback();
    });
  }

  private cargarEventosFallback(): void {
    console.log('🔄 Cargando eventos con datos de fallback...');
    this.eventosLimitados = [];
    this.cargandoEventos = false;
    
    this.snackBar.open(
      'No se pudieron cargar los eventos. Verifique su conexión.',
      'Cerrar',
      { duration: 5000 }
    );
  }

  private cargarPartidos(): void {
    this.cargandoPartidos = true;
    
    if (this.estaAutenticado) {
      // Usuario autenticado: acceso completo - cargar todos los tipos de partidos
      console.log('🔓 Usuario autenticado - Cargando partidos completos de Liga Colombiana');
      this.cargarPartidosAutenticado();
    } else {
      // Usuario no autenticado: contenido limitado - solo partidos en vivo y próximos
      console.log('🔒 Usuario no autenticado - Cargando partidos limitados de Liga Colombiana');
      this.cargarPartidosPublicos();
    }
  }

  private cargarPartidosAutenticado(): void {
    // Para usuarios autenticados: cargar una mezcla de partidos en vivo, próximos y resultados
    this.partidosService.obtenerPartidosEnVivo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidosEnVivo) => {
          console.log('✅ Partidos en vivo cargados:', partidosEnVivo.length);
          
          // Si hay partidos en vivo, mostrar esos principalmente
          if (partidosEnVivo.length > 0) {
            this.procesarPartidosCompletos(partidosEnVivo.slice(0, 6));
            this.cargandoPartidos = false;
          } else {
            // Si no hay partidos en vivo, cargar próximos partidos
            this.cargarProximosPartidosAutenticado();
          }
        },
        error: (error) => {
          console.error('❌ Error cargando partidos en vivo:', error);
          this.cargarProximosPartidosAutenticado(); // Fallback
        }
      });
  }

  private cargarProximosPartidosAutenticado(): void {
    this.partidosService.obtenerProximosPartidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proximosPartidos) => {
          console.log('✅ Próximos partidos cargados:', proximosPartidos.length);
          this.procesarPartidosCompletos(proximosPartidos.slice(0, 6));
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error cargando próximos partidos:', error);
          this.cargarPartidosFallback();
        }
      });
  }

  private cargarPartidosPublicos(): void {
    // Para usuarios no autenticados: cargar una mezcla de partidos en vivo y próximos
    this.partidosService.obtenerPartidosEnVivo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidosEnVivo) => {
          console.log('✅ Partidos en vivo públicos cargados:', partidosEnVivo.length);
          
          // Si hay partidos en vivo, mostrar esos principalmente
          if (partidosEnVivo.length >= this.LIMITE_PARTIDOS) {
            this.procesarPartidosLimitados(partidosEnVivo.slice(0, this.LIMITE_PARTIDOS));
            this.cargandoPartidos = false;
          } else {
            // Complementar con próximos partidos
            this.completarConProximosPartidos(partidosEnVivo);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando partidos en vivo públicos:', error);
          this.cargarSoloProximosPartidos();
        }
      });
  }

  private completarConProximosPartidos(partidosEnVivo: any[]): void {
    const partidosRestantes = this.LIMITE_PARTIDOS - partidosEnVivo.length;
    
    this.partidosService.obtenerProximosPartidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proximosPartidos) => {
          console.log(`✅ Próximos partidos cargados para completar: ${proximosPartidos.length}`);
          
          // Combinar partidos en vivo con próximos partidos
          const partidosCombinados = [
            ...partidosEnVivo,
            ...proximosPartidos.slice(0, partidosRestantes)
          ];
          
          console.log(`⚽ Combinando ${partidosEnVivo.length} en vivo + ${partidosRestantes} próximos = ${partidosCombinados.length} total`);
          
          this.procesarPartidosLimitados(partidosCombinados);
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error cargando próximos partidos:', error);
          // Si falla, mostrar solo los partidos en vivo que tenemos
          this.procesarPartidosLimitados(partidosEnVivo);
          this.cargandoPartidos = false;
        }
      });
  }

  private cargarSoloProximosPartidos(): void {
    this.partidosService.obtenerProximosPartidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proximosPartidos) => {
          console.log('✅ Solo próximos partidos cargados:', proximosPartidos.length);
          this.procesarPartidosLimitados(proximosPartidos.slice(0, this.LIMITE_PARTIDOS));
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error cargando próximos partidos:', error);
          this.cargarPartidosFallback();
        }
      });
  }

  private procesarPartidosCompletos(response: any): void {
    // Para usuarios autenticados: acceso completo
    let partidosArray = [];
    if (response && response.partidos) {
      partidosArray = response.partidos;
    } else if (Array.isArray(response)) {
      partidosArray = response;
    }
    
    this.procesarListaPartidos(partidosArray, false);
  }

  private procesarPartidosLimitados(partidos: any[]): void {
    // Para usuarios no autenticados: contenido limitado
    const partidosLimitados = partidos.slice(0, this.LIMITE_PARTIDOS);
    this.procesarListaPartidos(partidosLimitados, true);
  }

  private procesarListaPartidos(partidos: any[], esLimitado: boolean): void {
    this.partidosLimitados = partidos.map((partido: any) => ({
      codigoApi: partido.codigoApi || `temp-${Date.now()}`,
      nombreEquipoLocal: partido.nombreEquipoLocal || 'Equipo Local',
      nombreEquipoVisitante: partido.nombreEquipoVisitante || 'Equipo Visitante',
      escudoEquipoLocal: partido.escudoEquipoLocal || '',
      escudoEquipoVisitante: partido.escudoEquipoVisitante || '',
      fecha: partido.fecha || '',
      estado: this.partidosService.obtenerEstadoLegible(partido.estado) || 'Por definir',
      golesLocal: partido.golesLocal || 0,
      golesVisitante: partido.golesVisitante || 0,
      estadio: partido.estadio || 'Por definir',
      minutoActual: partido.minutoActual || 0,
      bloqueado: false // ✅ Permitir ver contenido, solo limitar cantidad
    }));
    
    console.log(`✅ ${this.partidosLimitados.length} partidos procesados para el grid`);
  }

  private cargarPartidosFallback(): void {
    console.log('🔄 Cargando partidos con datos de fallback...');
    this.partidosLimitados = [];
    this.cargandoPartidos = false;
    
    this.snackBar.open(
      'No se pudieron cargar los partidos. Verifique su conexión.',
      'Cerrar',
      { duration: 5000 }
    );
  }

  scrollToSection(section: string): void {
    setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Highlight the section temporarily
        element.classList.add('highlight-section');
        setTimeout(() => {
          element.classList.remove('highlight-section');
        }, 2000);
      }
    }, 100);
  }

  // Métodos de navegación y acciones
  verNoticia(noticia: NoticiaLimitada): void {
    // ✅ Permitir navegación a todos los usuarios - contenido público disponible
    this.router.navigate(['/noticia', noticia.id]);
  }

  verEvento(evento: EventoLimitado): void {
    // ✅ Permitir navegación a todos los usuarios - contenido público disponible
    this.router.navigate(['/evento', evento.id]);
  }

  verPartido(partido: PartidoLimitado): void {
    // ✅ Permitir navegación a todos los usuarios - contenido público disponible
    this.router.navigate(['/partidos'], { fragment: `partido-${partido.codigoApi}` });
  }

  // Método utilitario para manejar errores de imágenes de escudos
  onImagenEscudoError(event: any): void {
    console.warn('🖼️ Error cargando imagen de escudo:', event.target.src);
    event.target.src = 'assets/logo-tiempo.png';
    event.target.alt = 'Escudo no disponible';
  }

  private mostrarMensajeRegistro(tipo: string): void {
    this.snackBar.open(
      `¡Regístrate para acceder a ${tipo}!`, 
      'Registrarse',
      {
        duration: 8000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['registro-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/register']);
    });
  }

  irARegistro(): void {
    this.router.navigate(['/register']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Getters para el template
  get noticiasRestantes(): number {
    return Math.max(0, this.LIMITE_NOTICIAS - this.noticiasLimitadas.length);
  }

  get eventosRestantes(): number {
    return Math.max(0, this.LIMITE_EVENTOS - this.eventosLimitados.length);
  }

  get partidosRestantes(): number {
    return Math.max(0, this.LIMITE_PARTIDOS - this.partidosLimitados.length);
  }

  // ===============================
  // 🎠 MÉTODOS DEL CAROUSEL
  // ===============================
  
  private iniciarCarousel(): void {
    console.log('🎠 Iniciando carousel con', this.noticiasDestacadas.length, 'noticias');
    if (this.noticiasDestacadas.length === 0) return;
    
    this.pararCarousel();
    
    // Solo iniciar animación automática si hay más de 1 noticia
    if (this.noticiasDestacadas.length > 1) {
      console.log('🔄 Iniciando animación automática del carousel');
      // Inicializar progress
      this.progressValue = 0;
      this.iniciarProgress();
      
      // Configurar cambio automático
      this.carouselInterval = setInterval(() => {
        this.siguienteNoticia();
      }, this.CAROUSEL_DURATION);
    } else {
      console.log('⏸️ Solo hay 1 noticia, carousel estático');
    }
  }
  
  private pararCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  private iniciarProgress(): void {
    this.progressValue = 0;
    const incremento = 100 / (this.CAROUSEL_DURATION / 50); // Actualizar cada 50ms
    
    this.progressInterval = setInterval(() => {
      this.progressValue += incremento;
      if (this.progressValue >= 100) {
        this.progressValue = 100;
        clearInterval(this.progressInterval);
      }
    }, 50);
  }
  
  siguienteNoticia(): void {
    if (this.noticiasDestacadas.length === 0) return;
    
    const indiceAnterior = this.indiceNoticiaActual;
    this.indiceNoticiaActual = (this.indiceNoticiaActual + 1) % this.noticiasDestacadas.length;
    this.noticiaDestacadaActual = this.noticiasDestacadas[this.indiceNoticiaActual];
    console.log(`🎠 Cambio de noticia: ${indiceAnterior} -> ${this.indiceNoticiaActual}`);
    console.log('📰 Nueva noticia:', this.noticiaDestacadaActual.titulo);
    this.iniciarProgress();
  }
  
  anteriorNoticia(): void {
    if (this.noticiasDestacadas.length === 0) return;
    
    this.indiceNoticiaActual = this.indiceNoticiaActual === 0 
      ? this.noticiasDestacadas.length - 1 
      : this.indiceNoticiaActual - 1;
    this.noticiaDestacadaActual = this.noticiasDestacadas[this.indiceNoticiaActual];
    this.pararCarousel();
    this.iniciarCarousel();
  }
  
  irANoticia(indice: number): void {
    if (indice >= 0 && indice < this.noticiasDestacadas.length) {
      this.indiceNoticiaActual = indice;
      this.noticiaDestacadaActual = this.noticiasDestacadas[indice];
      this.pararCarousel();
      this.iniciarCarousel();
    }
  }
  
  pausarCarousel(): void {
    this.pararCarousel();
  }
  
  reanudarCarousel(): void {
    this.iniciarCarousel();
  }
  
  // ===============================
  // 🔧 MÉTODOS AUXILIARES
  // ===============================

  private manejarFiltros(params: any): void {
    // Manejar parámetros de consulta para filtros específicos
    console.log('🔍 Manejando filtros:', params);
  }

  private limitarTexto(texto: string, limite: number): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  private async obtenerNombreUsuario(userId: number): Promise<string> {
    if (this.usuariosCache.has(userId)) {
      return this.usuariosCache.get(userId)!;
    }

    try {
      const usuario = await this.usuariosService.obtenerPorId(userId).toPromise();
      const nombre = usuario?.nombre || 'Usuario Anónimo';
      this.usuariosCache.set(userId, nombre);
      return nombre;
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el nombre del usuario:', userId, error);
      return 'Redacción';
    }
  }

  private determinarSeccion(noticia: any): string {
    // Buscar en las secciones dinámicas primero
    if (noticia.seccion_id) {
      const seccionEncontrada = this.seccionesConContenido.find(s => s.seccion.id === noticia.seccion_id);
      if (seccionEncontrada) {
        return seccionEncontrada.seccion.titulo;
      }
    }

    // Fallback a secciones predeterminadas
    if (noticia.seccion) return noticia.seccion;
    if (noticia.tags && noticia.tags.length > 0) return noticia.tags[0];
    return 'General';
  }

  // ===============================
  // 🔧 MÉTODOS PÚBLICOS PARA SECCIONES DINÁMICAS
  // ===============================

  // Obtener secciones de noticias activas
  obtenerSeccionesNoticias(): SeccionConContenidoResponse[] {
    return this.seccionesPorTipo['NOTICIAS'] || [];
  }

  // Obtener secciones de eventos activas
  obtenerSeccionesEventos(): SeccionConContenidoResponse[] {
    return this.seccionesPorTipo['EVENTOS'] || [];
  }

  // Obtener secciones de partidos activas
  obtenerSeccionesPartidos(): SeccionConContenidoResponse[] {
    return this.seccionesPorTipo['PARTIDOS'] || [];
  }

  // Obtener todas las secciones activas ordenadas
  obtenerTodasLasSecciones(): SeccionConContenidoResponse[] {
    return this.seccionesConContenido.sort((a, b) => a.seccion.orden - b.seccion.orden);
  }

  // Verificar si una sección específica está activa
  estaSeccionActiva(titulo: string): boolean {
    return this.seccionesConContenido.some(s => 
      s.seccion.titulo.toLowerCase().includes(titulo.toLowerCase()) && s.seccion.activa
    );
  }

  // Obtener sección específica por título
  obtenerSeccionPorTitulo(titulo: string): SeccionConContenidoResponse | null {
    return this.seccionesConContenido.find(s => 
      s.seccion.titulo.toLowerCase().includes(titulo.toLowerCase())
    ) || null;
  }

  // Navegar a una sección específica
  navegarASeccion(seccionId: number, tipo: string): void {
    switch (tipo) {
      case 'NOTICIAS':
        this.router.navigate(['/noticias'], { queryParams: { seccion: seccionId } });
        break;
      case 'EVENTOS':
        this.router.navigate(['/eventos'], { queryParams: { seccion: seccionId } });
        break;
      case 'PARTIDOS':
        this.router.navigate(['/partidos'], { queryParams: { seccion: seccionId } });
        break;
      default:
        console.warn('Tipo de sección no reconocido:', tipo);
    }
  }

  // Obtener icono para el tipo de sección
  obtenerIconoSeccion(tipo: string): string {
    switch (tipo) {
      case 'NOTICIAS': return 'article';
      case 'EVENTOS': return 'event';
      case 'PARTIDOS': return 'sports_soccer';
      default: return 'info';
    }
  }

  // Obtener color para el tipo de sección
  obtenerColorSeccion(tipo: string): string {
    switch (tipo) {
      case 'NOTICIAS': return 'var(--verde-selva)';
      case 'EVENTOS': return 'var(--purpura-real)';
      case 'PARTIDOS': return 'var(--azul-profundo)';
      default: return 'var(--gris-carbon)';
    }
  }

  // ===============================
  // 🔧 TRACKBY FUNCTIONS
  // ===============================

  trackBySeccionId(index: number, item: SeccionConContenidoResponse): number {
    return item.seccion.id;
  }
}
