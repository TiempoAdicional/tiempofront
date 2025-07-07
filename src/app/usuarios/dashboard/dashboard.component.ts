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
  id: number;
  equipoLocal: string;
  equipoVisitante: string;
  fecha: string;
  liga: string;
  estado: string;
  golesLocal: number | null;
  golesVisitante: number | null;
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
  
  // Datos limitados para usuarios no registrados
  noticiasLimitadas: NoticiaLimitada[] = [];
  eventosLimitados: EventoLimitado[] = [];
  partidosLimitados: PartidoLimitado[] = [];
  
  // Noticia destacada para hero section
  noticiaDestacada: NoticiaLimitada | null = null;
  
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.cargarContenido();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  private cargarContenido(): void {
    this.cargarNoticias();
    this.cargarEventos();
    this.cargarPartidos();
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
              const noticiaDestacadaRaw = destacadas[0];
              this.noticiaDestacada = {
                id: noticiaDestacadaRaw.id,
                titulo: noticiaDestacadaRaw.titulo,
                resumen: this.limitarTexto(noticiaDestacadaRaw.resumen || noticiaDestacadaRaw.contenidoHtml, 150),
                fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
                seccion: 'Destacada',
                imagenUrl: noticiaDestacadaRaw.imagenDestacada,
                bloqueada: false,
                autorNombre: noticiaDestacadaRaw.autorNombre || 'TiempoAdicional'
              };
              console.log('✨ Noticia destacada pública configurada:', this.noticiaDestacada);
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
    
    // Para usuarios autenticados: acceso completo
    const noticiaDestacadaRaw = noticias.find((n: any) => n.destacada === true);
    
    if (noticiaDestacadaRaw) {
      console.log('✨ Noticia destacada encontrada:', noticiaDestacadaRaw.titulo);
      
      // Priorizar creadorNombre (igual que en noticia-detalle), luego autorNombre
      const autorNombre = noticiaDestacadaRaw.creadorNombre || 
                         noticiaDestacadaRaw.autorNombre || 
                         noticiaDestacadaRaw.autor_nombre;
      
      if (autorNombre) {
        this.noticiaDestacada = {
          id: noticiaDestacadaRaw.id,
          titulo: noticiaDestacadaRaw.titulo,
          resumen: noticiaDestacadaRaw.resumen || this.limitarTexto(noticiaDestacadaRaw.contenidoHtml, 150),
          fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
          seccion: 'Destacada',
          imagenUrl: noticiaDestacadaRaw.imagenDestacada,
          bloqueada: false,
          autorNombre: autorNombre,
          creadorId: noticiaDestacadaRaw.autorId || noticiaDestacadaRaw.creador_id
        };
        console.log('✅ Noticia destacada configurada con autorNombre:', autorNombre);
      } else {
        // Fallback a obtener nombre por ID si no está disponible
        this.obtenerNombreUsuario(noticiaDestacadaRaw.autorId || noticiaDestacadaRaw.creador_id).then(autorNombre => {
          this.noticiaDestacada = {
            id: noticiaDestacadaRaw.id,
            titulo: noticiaDestacadaRaw.titulo,
            resumen: noticiaDestacadaRaw.resumen || this.limitarTexto(noticiaDestacadaRaw.contenidoHtml, 150),
            fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
            seccion: 'Destacada',
            imagenUrl: noticiaDestacadaRaw.imagenDestacada,
            bloqueada: false,
            autorNombre: autorNombre,
            creadorId: noticiaDestacadaRaw.autorId || noticiaDestacadaRaw.creador_id
          };
          console.log('✅ Noticia destacada configurada con autorNombre por ID:', autorNombre);
        });
      }
    } else {
      console.log('⚠️ No hay noticia destacada en las noticias autenticadas');
    }
    
    // Filtrar noticias para grid (excluir destacada)
    const noticiasParaGrid = noticiaDestacadaRaw 
      ? noticias.filter((n: any) => n.id !== noticiaDestacadaRaw.id)
      : noticias;
    
    console.log(`📋 Procesando ${noticiasParaGrid.length} noticias para el grid (excluyendo destacada)`);
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
          resumen: this.limitarTexto(noticia.resumen || noticia.contenidoHtml, 120),
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
    this.noticiaDestacada = null;
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
      // Usuario autenticado: acceso completo
      console.log('🔓 Usuario autenticado - Cargando todos los partidos');
      this.partidosService.listarTodos()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ Partidos autenticados cargados:', response);
            this.procesarPartidosCompletos(response);
            this.cargandoPartidos = false;
          },
          error: (error) => {
            console.error('❌ Error cargando partidos autenticados:', error);
            this.cargarPartidosPublicos(); // Fallback
          }
        });
    } else {
      // Usuario no autenticado: contenido limitado
      console.log('🔒 Usuario no autenticado - Cargando 6 partidos públicos');
      this.cargarPartidosPublicos();
    }
  }

  private cargarPartidosPublicos(): void {
    // Usar endpoint público con límite de 6 partidos
    this.partidosService.obtenerPartidosPublicos(this.LIMITE_PARTIDOS)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Partidos públicos cargados:', response);
          
          let partidos = [];
          if (response?.partidos) {
            partidos = response.partidos;
          } else if (Array.isArray(response)) {
            partidos = response;
          }
          
          console.log(`⚽ Procesando ${partidos.length} partidos públicos (límite: ${this.LIMITE_PARTIDOS})`);
          
          this.procesarPartidosLimitados(partidos);
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error cargando partidos públicos:', error);
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
      id: partido.id || 0,
      equipoLocal: partido.equipoLocal,
      equipoVisitante: partido.equipoVisitante,
      fecha: partido.fecha,
      liga: partido.liga || partido.competencia || 'Liga',
      estado: partido.estado || 'Programado',
      golesLocal: partido.golesLocal,
      golesVisitante: partido.golesVisitante,
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

  private scrollToSection(section: string): void {
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
    this.router.navigate(['/partidos'], { fragment: `partido-${partido.id}` });
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

  // === MÉTODOS AUXILIARES ===
  
  private async obtenerNombreUsuario(creadorId: number | undefined): Promise<string> {
    if (!creadorId) return 'Anónimo';
    
    // Verificar cache primero
    if (this.usuariosCache.has(creadorId)) {
      return this.usuariosCache.get(creadorId)!;
    }
    
    try {
      const usuario = await this.usuariosService.obtenerPorId(creadorId).toPromise();
      const nombre = usuario?.nombre || 'Usuario';
      this.usuariosCache.set(creadorId, nombre);
      return nombre;
    } catch (error: any) {
      console.warn(`⚠️ No se pudo obtener usuario con ID ${creadorId}:`, error);
      
      // Si es un error 403, el usuario no tiene permisos para ver otros usuarios
      if (error.status === 403) {
        console.log('🔒 Error 403 - Sin permisos para obtener información de usuarios');
        this.usuariosCache.set(creadorId, 'Redactor');
        return 'Redactor';
      }
      
      // Para otros errores, usar "Usuario" como fallback
      this.usuariosCache.set(creadorId, 'Usuario');
      return 'Usuario';
    }
  }

  // === MÉTODOS AUXILIARES ===
  
  private limitarTexto(texto: string | undefined, limite: number): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  private determinarSeccion(noticia: any): string {
    if (noticia.seccion) return noticia.seccion;
    if (noticia.seccion_id) return `Sección ${noticia.seccion_id}`;
    if (noticia.tags && noticia.tags.length > 0) return noticia.tags[0];
    return 'Noticias';
  }
}
