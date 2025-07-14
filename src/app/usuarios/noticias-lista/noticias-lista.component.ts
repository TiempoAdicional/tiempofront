import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';

// Servicios
import { NoticiasService } from '../../core/services/noticias.service';
import { AuthService } from '../../auth/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';

interface NoticiaCompleta {
  id: number;
  titulo: string;
  resumen: string;
  contenidoHtml: string;
  fechaPublicacion: string;
  autorNombre: string;
  seccion: string;
  imagenDestacada?: string;
  tags?: string[];
  destacada?: boolean;
  creadorId?: number;
}

@Component({
  selector: 'app-noticias-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatToolbarModule
  ],
  templateUrl: './noticias-lista.component.html',
  styleUrls: ['./noticias-lista.component.scss']
})
export class NoticiasListaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  noticias: NoticiaCompleta[] = [];
  cargando = true;
  estaAutenticado = false;
  
  // Filtros
  tipoLista: string = 'todas'; // 'todas', 'recientes', 'destacadas'
  tituloSeccion: string = 'Todas las Noticias';
  limite: number = 20;
  
  // Cache para usuarios
  private usuariosCache = new Map<number, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noticiasService: NoticiasService,
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar
  ) {
    console.log('🏗️ [NOTICIAS-LISTA] Constructor ejecutado');
  }

  ngOnInit(): void {
    console.log('🚀 NoticiasListaComponent inicializado');
    this.estaAutenticado = this.authService.estaAutenticado();
    console.log('🔍 Estado autenticado en noticias-lista:', this.estaAutenticado);
    
    // Leer parámetros de la URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('📋 Parámetros recibidos:', params);
        this.configurarFiltros(params);
        this.cargarNoticias();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarFiltros(params: any): void {
    this.tipoLista = params['tipo'] || 'todas';
    this.limite = params['limite'] ? parseInt(params['limite']) : 20;
    
    switch (this.tipoLista) {
      case 'recientes':
        this.tituloSeccion = 'Noticias Recientes';
        break;
      case 'destacadas':
        this.tituloSeccion = 'Noticias Destacadas';
        break;
      case 'todas':
      default:
        this.tituloSeccion = 'Todas las Noticias';
        break;
    }
    
    console.log('🔍 Configuración de lista:', {
      tipo: this.tipoLista,
      limite: this.limite,
      titulo: this.tituloSeccion
    });
  }

  private cargarNoticias(): void {
    this.cargando = true;
    this.noticias = [];
    
    switch (this.tipoLista) {
      case 'recientes':
        this.cargarNoticiasRecientes();
        break;
      case 'destacadas':
        this.cargarNoticiasDestacadas();
        break;
      case 'todas':
      default:
        this.cargarTodasLasNoticias();
        break;
    }
  }

  private cargarTodasLasNoticias(): void {
    console.log(`📰 Cargando todas las noticias (límite: ${this.limite})...`);
    
    if (this.estaAutenticado) {
      this.noticiasService.listarTodasAutenticado(1, this.limite)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const noticias = response.noticias || [];
            this.procesarNoticias(noticias);
          },
          error: (error) => {
            console.error('❌ Error cargando noticias autenticadas:', error);
            this.cargarNoticiasPublicas();
          }
        });
    } else {
      this.cargarNoticiasPublicas();
    }
  }

  private cargarNoticiasRecientes(): void {
    console.log(`🕒 Cargando noticias recientes (límite: ${this.limite})...`);
    
    if (this.estaAutenticado) {
      this.noticiasService.listarTodasAutenticado(1, this.limite)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const noticias = response.noticias || [];
            // Ordenar por fecha más reciente
            const noticiasOrdenadas = noticias.sort((a: any, b: any) => 
              new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()
            );
            this.procesarNoticias(noticiasOrdenadas);
          },
          error: (error) => {
            console.error('❌ Error cargando noticias recientes:', error);
            this.cargarNoticiasPublicas();
          }
        });
    } else {
      this.cargarNoticiasPublicas();
    }
  }

  private cargarNoticiasDestacadas(): void {
    console.log('⭐ Cargando noticias destacadas...');
    
    if (this.estaAutenticado) {
      this.noticiasService.listarTodasAutenticado(1, 50)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const noticias = response.noticias || [];
            // Filtrar solo las destacadas
            const destacadas = noticias.filter((n: any) => n.destacada === true);
            this.procesarNoticias(destacadas);
          },
          error: (error) => {
            console.error('❌ Error cargando noticias destacadas:', error);
            this.cargarNoticiasPublicas();
          }
        });
    } else {
      this.cargarNoticiasPublicas();
    }
  }

  private cargarNoticiasPublicas(): void {
    this.noticiasService.listarNoticiasPublicas(this.limite)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let noticias = [];
          if (response?.noticias) {
            noticias = response.noticias;
          } else if (Array.isArray(response)) {
            noticias = response;
          }
          
          // Aplicar filtros específicos para usuarios no autenticados
          if (this.tipoLista === 'destacadas') {
            noticias = noticias.filter((n: any) => n.destacada === true);
          } else if (this.tipoLista === 'recientes') {
            noticias.sort((a: any, b: any) => 
              new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()
            );
          }
          
          this.procesarNoticias(noticias);
        },
        error: (error) => {
          console.error('❌ Error cargando noticias públicas:', error);
          this.mostrarError('No se pudieron cargar las noticias');
        }
      });
  }

  private async procesarNoticias(noticiasRaw: any[]): Promise<void> {
    console.log(`🔄 Procesando ${noticiasRaw.length} noticias...`);
    
    try {
      const noticiasPromises = noticiasRaw.map(async (noticia: any) => {
        // Obtener nombre del autor
        let autorNombre = noticia.creadorNombre || noticia.autorNombre || noticia.autor_nombre;
        
        if (!autorNombre) {
          autorNombre = await this.obtenerNombreUsuario(noticia.autorId || noticia.creador_id);
        }
        
        return {
          id: noticia.id,
          titulo: noticia.titulo,
          resumen: noticia.resumen || this.extraerResumen(noticia.contenidoHtml),
          contenidoHtml: noticia.contenidoHtml,
          fechaPublicacion: noticia.fechaPublicacion,
          autorNombre: autorNombre,
          seccion: this.determinarSeccion(noticia),
          imagenDestacada: noticia.imagenDestacada,
          tags: noticia.tags || [],
          destacada: noticia.destacada || false,
          creadorId: noticia.autorId || noticia.creador_id
        } as NoticiaCompleta;
      });
      
      this.noticias = await Promise.all(noticiasPromises);
      console.log(`✅ ${this.noticias.length} noticias procesadas correctamente`);
      
    } catch (error) {
      console.error('❌ Error procesando noticias:', error);
      this.mostrarError('Error al procesar las noticias');
    } finally {
      this.cargando = false;
    }
  }

  private async obtenerNombreUsuario(creadorId: number | undefined): Promise<string> {
    if (!creadorId) return 'Redacción';
    
    // Verificar cache primero
    if (this.usuariosCache.has(creadorId)) {
      return this.usuariosCache.get(creadorId)!;
    }
    
    try {
      const usuario = await this.usuariosService.obtenerPorId(creadorId).toPromise();
      const nombre = usuario?.nombre || 'Redacción';
      this.usuariosCache.set(creadorId, nombre);
      return nombre;
    } catch (error: any) {
      if (error.status === 403) {
        this.usuariosCache.set(creadorId, 'Redacción');
        return 'Redacción';
      }
      
      this.usuariosCache.set(creadorId, 'Redacción');
      return 'Redacción';
    }
  }

  private extraerResumen(contenidoHtml: string): string {
    if (!contenidoHtml) return '';
    
    // Remover tags HTML y extraer texto plano
    const textoPlano = contenidoHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Limitar a 200 caracteres
    return textoPlano.length > 200 ? textoPlano.substring(0, 200) + '...' : textoPlano;
  }

  private determinarSeccion(noticia: any): string {
    if (noticia.seccion) return noticia.seccion;
    if (noticia.seccionNombre) return noticia.seccionNombre;
    if (noticia.seccion_id) return `Sección ${noticia.seccion_id}`;
    if (noticia.tags && noticia.tags.length > 0) return noticia.tags[0];
    return 'Noticias';
  }

  private mostrarError(mensaje: string): void {
    this.cargando = false;
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // Métodos de navegación
  verNoticia(noticia: NoticiaCompleta): void {
    this.router.navigate(['/noticia', noticia.id]);
  }

  // Método trackBy para optimizar el rendimiento de ngFor
  trackByNoticiaId(index: number, noticia: NoticiaCompleta): number {
    return noticia.id;
  }

  volverAlDashboard(): void {
    if (this.estaAutenticado) {
      this.router.navigate(['/usuarios/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
