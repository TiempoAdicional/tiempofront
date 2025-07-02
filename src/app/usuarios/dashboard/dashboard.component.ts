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

interface NoticiaLimitada {
  id: number;
  titulo: string;
  resumen: string;
  fechaPublicacion: string;
  seccion: string;
  imagenUrl?: string;
  bloqueada?: boolean;
}

interface EventoLimitado {
  id: number;
  titulo: string;
  fecha: string;
  ubicacion: string;
  competicion: string;
  bloqueado?: boolean;
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private noticiasService: NoticiasService,
    private eventosService: EventosService,
    private partidosService: PartidosService,
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
    
    // Usar método específico según autenticación del usuario
    const noticiasObservable = this.estaAutenticado 
      ? this.noticiasService.listarTodas(1, 20) // Usuarios autenticados: más contenido
      : this.noticiasService.listarNoticiasPublicas2(15); // Públicos: traer 15 para detectar si hay más de 10
    
    noticiasObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Noticias cargadas exitosamente:', response);
          
          // Verificar la estructura de la respuesta
          const noticias = response?.noticias || response || [];
          
          // Buscar noticia destacada (que tenga destacada: true)
          const noticiaDestacadaRaw = noticias.find((n: any) => n.destacada === true);
          
          // Si hay noticia destacada, configurarla
          if (noticiaDestacadaRaw) {
            this.noticiaDestacada = {
              id: noticiaDestacadaRaw.id,
              titulo: noticiaDestacadaRaw.titulo,
              resumen: noticiaDestacadaRaw.resumen || noticiaDestacadaRaw.contenidoHtml?.substring(0, 150) + '...',
              fechaPublicacion: noticiaDestacadaRaw.fechaPublicacion,
              seccion: 'Destacada',
              imagenUrl: noticiaDestacadaRaw.imagenDestacada,
              bloqueada: false
            };
          }
          
          // Filtrar noticias para el grid (excluir la destacada si existe)
          const noticiasParaGrid = noticiaDestacadaRaw 
            ? noticias.filter((n: any) => n.id !== noticiaDestacadaRaw.id)
            : noticias;
          
          // Para usuarios no autenticados, mostrar solo las primeras 10 del grid
          const noticiasParaMostrar = this.estaAutenticado 
            ? noticiasParaGrid 
            : noticiasParaGrid.slice(0, this.LIMITE_NOTICIAS);
          
          // Mapear noticias - TODAS las noticias mostradas son navegables
          this.noticiasLimitadas = noticiasParaMostrar.map((noticia: any) => ({
            id: noticia.id,
            titulo: noticia.titulo,
            resumen: noticia.resumen || noticia.contenidoHtml?.substring(0, 150) + '...',
            fechaPublicacion: noticia.fechaPublicacion,
            seccion: 'General',
            imagenUrl: noticia.imagenDestacada,
            bloqueada: false // Todas las noticias mostradas son navegables
          }));
          
          // Mostrar aviso si hay más noticias disponibles
          if (!this.estaAutenticado && noticiasParaGrid.length > this.LIMITE_NOTICIAS) {
            this.mostrarAvisoLimiteNoticias = true;
          }
          
          this.cargandoNoticias = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar noticias:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoNoticias = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Backend no disponible';
          
          // Mostrar mensaje de error al usuario
          this.snackBar.open(
            `Backend no disponible. Verifica que el servidor esté funcionando.`,
            'Cerrar',
            { duration: 8000 }
          );
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
        next: (eventos) => {
          console.log('✅ Eventos cargados exitosamente:', eventos);
          
          // Verificar si eventos es un array o tiene una propiedad específica
          const eventosArray = Array.isArray(eventos) ? eventos : (eventos as any)?.eventos || [];
          
          // Para usuarios no autenticados, mostrar solo los primeros 8 pero permitir navegación
          const eventosParaMostrar = this.estaAutenticado 
            ? eventosArray 
            : eventosArray.slice(0, this.LIMITE_EVENTOS);
            
          this.eventosLimitados = eventosParaMostrar.map((evento: any) => ({
            id: evento.id || 0,
            titulo: evento.nombre || evento.titulo,
            fecha: evento.fecha,
            ubicacion: evento.lugar || evento.ubicacion,
            competicion: evento.descripcion || evento.competicion || 'Evento',
            bloqueado: false // Todos los eventos mostrados son navegables
          }));
          
          // Mostrar aviso si hay más eventos disponibles
          if (!this.estaAutenticado && eventosArray.length > this.LIMITE_EVENTOS) {
            this.mostrarAvisoLimiteEventos = true;
          }
          
          this.cargandoEventos = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar eventos:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoEventos = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Backend no disponible';
          
          // Mostrar mensaje de error al usuario
          this.snackBar.open(
            `Backend no disponible. Verifica que el servidor esté funcionando.`,
            'Cerrar',
            { duration: 8000 }
          );
        }
      });
  }

  private cargarPartidos(): void {
    this.cargandoPartidos = true;
    
    // Usar método específico según autenticación del usuario
    const partidosObservable = this.estaAutenticado 
      ? this.partidosService.obtenerPartidosHoy() // Usuarios autenticados: partidos de hoy
      : this.partidosService.obtenerPartidosPublicos(this.LIMITE_PARTIDOS); // Públicos: usar endpoint /public/partidos/limitados
    
    partidosObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partidos) => {
          console.log('✅ Partidos cargados exitosamente:', partidos);
          
          // Verificar si partidos es un array o tiene una propiedad específica
          const partidosArray = Array.isArray(partidos) ? partidos : (partidos as any)?.partidos || [];
          
          // Mapear partidos y aplicar límites visuales para usuarios no autenticados
          this.partidosLimitados = partidosArray.map((partido: any, index: number) => ({
            id: partido.id || 0,
            equipoLocal: partido.equipoLocal,
            equipoVisitante: partido.equipoVisitante,
            fecha: partido.fecha,
            liga: partido.liga || partido.competencia || 'Liga',
            estado: partido.estado || 'Programado',
            golesLocal: partido.golesLocal,
            golesVisitante: partido.golesVisitante,
            bloqueado: !this.estaAutenticado && index >= this.LIMITE_PARTIDOS
          }));
          
          this.cargandoPartidos = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar partidos:', error);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          console.error('Headers:', error.headers);
          
          this.cargandoPartidos = false;
          this.backendDisponible = false;
          this.mensajeConexion = 'Backend no disponible';
          
          // Mostrar mensaje de error al usuario
          this.snackBar.open(
            `Backend no disponible. Verifica que el servidor esté funcionando.`,
            'Cerrar',
            { duration: 8000 }
          );
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
    // Todas las noticias mostradas son navegables
    this.router.navigate(['/usuarios/noticia', noticia.id]);
  }

  verEvento(evento: EventoLimitado): void {
    // Todos los eventos mostrados son navegables
    this.router.navigate(['/usuarios/evento', evento.id]);
  }

  verPartido(partido: PartidoLimitado): void {
    if (partido.bloqueado) {
      this.mostrarMensajeRegistro('partidos');
      return;
    }
    
    this.router.navigate(['/usuarios/partido', partido.id]);
  }

  private mostrarMensajeRegistro(tipo: string): void {
    this.snackBar.open(
      `¡Regístrate para ver más ${tipo}!`, 
      'Registrarse',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['registro-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/auth/register']);
    });
  }

  irARegistro(): void {
    this.router.navigate(['/auth/register']);
  }

  irALogin(): void {
    this.router.navigate(['/auth/login']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
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
}
