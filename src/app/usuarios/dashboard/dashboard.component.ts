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
  }

  private cargarContenido(): void {
    this.cargarNoticias();
    this.cargarEventos();
    this.cargarPartidos();
  }

  private cargarNoticias(): void {
    this.cargandoNoticias = true;
    
    // Use different strategy based on authentication status
    const noticiasObservable = this.estaAutenticado 
      ? this.noticiasService.listarNoticiasPublicas(20) // Temporalmente usar endpoint público hasta arreglar paginación
      : this.noticiasService.listarNoticiasPublicas(15); // Public users: limited access
    
    noticiasObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Noticias cargadas exitosamente:', response);
          
          // Handle different response structures
          let noticias = [];
          if (response?.noticias) {
            noticias = response.noticias;
          } else if (Array.isArray(response)) {
            noticias = response;
          } else if (response?.content) {
            // Handle paginated response from listarTodas
            noticias = response.content;
          }
          
          console.log('📰 Noticias procesadas:', noticias.length, 'noticias');
          
          // First, try to get featured news from dedicated endpoint for better results
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
                      resumen: noticiaDestacadaRaw.resumen || noticiaDestacadaRaw.contenidoHtml?.substring(0, 150) + '...',
                      fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
                      seccion: 'Destacada',
                      imagenUrl: noticiaDestacadaRaw.imagenDestacada,
                      bloqueada: false
                    };
                    console.log('✨ Noticia destacada configurada:', this.noticiaDestacada);
                  }
                },
                error: (error) => {
                  console.warn('⚠️ No se pudieron cargar noticias destacadas:', error);
                }
              });
          }
          
          // Find featured news in the main response (destacada: true) if authenticated
          const noticiaDestacadaRaw = this.estaAutenticado 
            ? noticias.find((n: any) => n.destacada === true)
            : null;
          
          // Configure featured news if exists and user is authenticated
          if (noticiaDestacadaRaw) {
            this.obtenerNombreUsuario(noticiaDestacadaRaw.creador_id).then(autorNombre => {
              this.noticiaDestacada = {
                id: noticiaDestacadaRaw.id,
                titulo: noticiaDestacadaRaw.titulo,
                resumen: noticiaDestacadaRaw.resumen || noticiaDestacadaRaw.contenidoHtml?.substring(0, 150) + '...',
                fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
                seccion: 'Destacada',
                imagenUrl: noticiaDestacadaRaw.imagenDestacada,
                bloqueada: false,
                autorNombre: autorNombre,
                creadorId: noticiaDestacadaRaw.creador_id
              };
              console.log('✨ Noticia destacada configurada (auth):', this.noticiaDestacada);
            });
          }
          
          // Filter news for grid (exclude featured if exists)
          const noticiasParaGrid = noticiaDestacadaRaw 
            ? noticias.filter((n: any) => n.id !== noticiaDestacadaRaw.id)
            : noticias;
          
          // For non-authenticated users, show only first 10 in grid
          const noticiasParaMostrar = this.estaAutenticado 
            ? noticiasParaGrid 
            : noticiasParaGrid.slice(0, this.LIMITE_NOTICIAS);
          
          // Map news - ALL displayed news are navigable, with author names
          Promise.all(
            noticiasParaMostrar.map(async (noticia: any) => ({
              id: noticia.id,
              titulo: noticia.titulo,
              resumen: noticia.resumen || noticia.contenidoHtml?.substring(0, 150) + '...',
              fechaPublicacion: noticia.fechaPublicacion,
              seccion: 'General',
              imagenUrl: noticia.imagenDestacada,
              bloqueada: false, // Todas las noticias mostradas son navegables
              autorNombre: await this.obtenerNombreUsuario(noticia.creador_id),
              creadorId: noticia.creador_id
            }))
          ).then(noticiasConAutores => {
            this.noticiasLimitadas = noticiasConAutores;
          });
          
          // Mostrar aviso si hay más noticias disponibles
          if (!this.estaAutenticado && noticiasParaGrid.length > this.LIMITE_NOTICIAS) {
            this.mostrarAvisoLimiteNoticias = true;
          }
          
          console.log('📰 Noticias para mostrar:', this.noticiasLimitadas.length);
          console.log('✨ Noticia destacada:', this.noticiaDestacada ? 'SÍ' : 'NO');
          
          this.cargandoNoticias = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar noticias:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoNoticias = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Error loading content';
          
          // Show user-friendly error message
          this.snackBar.open(
            `Unable to load news. Please check your connection and try again.`,
            'Close',
            { duration: 5000 }
          );
          
          // Set empty arrays to maintain UI functionality
          this.noticiasLimitadas = [];
          this.noticiaDestacada = null;
        }
      });
  }

  private cargarEventos(): void {
    this.cargandoEventos = true;
    
    // Usar método específico según autenticación del usuario
    const eventosObservable = this.estaAutenticado 
      ? this.eventosService.listarTodos() // Usuarios autenticados: todos los eventos
      : this.eventosService.listarEventosPublicos(12); // Públicos: traer 12 para detectar si hay más de 8
    
    eventosObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Eventos cargados exitosamente:', response);
          
          // Handle different response formats
          let eventosArray = [];
          if (response && response.eventos) {
            eventosArray = response.eventos;
          } else if (Array.isArray(response)) {
            eventosArray = response;
          }
          
          console.log('📅 Eventos procesados:', eventosArray.length, 'eventos');
          
          // Para usuarios no autenticados, mostrar solo los primeros 8 pero permitir navegación
          const eventosParaMostrar = this.estaAutenticado 
            ? eventosArray 
            : eventosArray.slice(0, this.LIMITE_EVENTOS);
            
          // Map events with author names
          Promise.all(
            eventosParaMostrar.map(async (evento: any) => ({
              id: evento.id || 0,
              titulo: evento.nombre || evento.titulo,
              fecha: evento.fecha,
              ubicacion: evento.lugar || evento.ubicacion,
              competicion: evento.descripcion || evento.competicion || 'Evento',
              bloqueado: false, // Todos los eventos mostrados son navegables
              autorNombre: await this.obtenerNombreUsuario(evento.creador_id),
              creadorId: evento.creador_id
            }))
          ).then(eventosConAutores => {
            this.eventosLimitados = eventosConAutores;
          });
          
          // Mostrar aviso si hay más eventos disponibles
          if (!this.estaAutenticado && eventosArray.length > this.LIMITE_EVENTOS) {
            this.mostrarAvisoLimiteEventos = true;
          }
          
          console.log('📅 Eventos para mostrar:', this.eventosLimitados.length);
          
          this.cargandoEventos = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar eventos:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoEventos = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Error loading events';
          
          // Show user-friendly error message
          this.snackBar.open(
            `Unable to load events. Please check your connection.`,
            'Close',
            { duration: 5000 }
          );
          
          // Set empty array to maintain UI functionality
          this.eventosLimitados = [];
        }
      });
  }

  private cargarPartidos(): void {
    this.cargandoPartidos = true;
    
    // Use different strategy based on authentication status
    const partidosObservable = this.estaAutenticado 
      ? this.partidosService.obtenerPartidosPublicos(10) // Temporalmente usar endpoint público hasta arreglar backend
      : this.partidosService.obtenerPartidosPublicos(this.LIMITE_PARTIDOS); // Public users: limited access
    
    partidosObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Partidos cargados exitosamente:', response);
          
          // Handle different response formats
          let partidosArray = [];
          if (response && response.partidos) {
            partidosArray = response.partidos;
          } else if (Array.isArray(response)) {
            partidosArray = response;
          }
          
          console.log('⚽ Partidos procesados:', partidosArray.length, 'partidos');
          
          // Para usuarios no autenticados, mostrar SOLO los limitados (no más)
          const partidosParaMostrar = this.estaAutenticado 
            ? partidosArray 
            : partidosArray.slice(0, this.LIMITE_PARTIDOS); // Solo mostrar los primeros 6
          
          // Mapear partidos - para usuarios no auth, todos los mostrados son navegables
          this.partidosLimitados = partidosParaMostrar.map((partido: any) => ({
            id: partido.id || 0,
            equipoLocal: partido.equipoLocal,
            equipoVisitante: partido.equipoVisitante,
            fecha: partido.fecha,
            liga: partido.liga || partido.competencia || 'Liga',
            estado: partido.estado || 'Programado',
            golesLocal: partido.golesLocal,
            golesVisitante: partido.golesVisitante,
            bloqueado: false // Todos los partidos mostrados son navegables para evitar confusión
          }));
          
          console.log('⚽ Partidos para mostrar:', this.partidosLimitados.length);
          
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar partidos:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoPartidos = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Error loading matches';
          
          // Show user-friendly error message
          this.snackBar.open(
            `Unable to load matches. Please check your connection.`,
            'Close',
            { duration: 5000 }
          );
          
          // Set empty array to maintain UI functionality
          this.partidosLimitados = [];
        }
      });
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
    // Permitir navegación - el componente de detalle manejará la restricción
    this.router.navigate(['/noticia', noticia.id]);
  }

  verEvento(evento: EventoLimitado): void {
    // Permitir navegación - el componente de detalle manejará la restricción
    this.router.navigate(['/evento', evento.id]);
  }

  verPartido(partido: PartidoLimitado): void {
    // Permitir navegación - mostrar información básica y pedir registro para más detalles
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
    } catch (error) {
      console.warn(`⚠️ No se pudo obtener usuario con ID ${creadorId}:`, error);
      this.usuariosCache.set(creadorId, 'Usuario');
      return 'Usuario';
    }
  }

  // === MÉTODOS AUXILIARES ===
}
