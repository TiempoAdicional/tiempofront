import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { NoticiasService, Noticia, FiltrosNoticia } from '../../../core/services/noticias.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

// RxJS imports
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Material Design
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-listar-noticias',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatToolbarModule,
    MatDividerModule
  ],
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit, AfterViewInit {
  private noticiasService = inject(NoticiasService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos
  dataSource = new MatTableDataSource<Noticia>();
  displayedColumns: string[] = ['seleccionar', 'imagen', 'titulo', 'estado', 'visitas', 'fecha', 'acciones'];
  
  // Formularios y filtros
  filtrosForm: FormGroup;
  busquedaRapida = '';
  
  // Estados
  cargando = false;
  error: string | null = null;
  noticiasSeleccionadas: Noticia[] = [];
  
  // Estadísticas
  totalNoticias = 0;
  noticiasPublicas = 0;
  noticiasBorradores = 0;
  visitasTotales = 0;

  constructor() {
    this.filtrosForm = this.fb.group({
      titulo: [''],
      esPublica: [''],
      destacada: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    this.inicializarFiltros();
    this.cargarNoticias();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Inicializa los filtros del formulario
   */
  private inicializarFiltros(): void {
    this.filtrosForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  /**
   * Carga todas las noticias del autor actual con métodos robustos
   */
  cargarNoticias(): void {
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      this.mostrarError('No se pudo obtener el ID del usuario');
      return;
    }

    this.cargando = true;
    this.error = null;

    // Usar el método actualizado
    this.noticiasService.obtenerPorAutor(autorId).subscribe({
      next: (noticias) => {
        console.log('✅ Noticias cargadas exitosamente:', noticias.length);
        this.dataSource.data = noticias;
        this.calcularEstadisticas(noticias);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al listar noticias del autor:', err);
        
        // Fallback: intentar listar todas las noticias y filtrar por autor
        this.intentarFallbackListarTodas(autorId);
      }
    });
  }

  /**
   * Carga estadísticas generales
   */
  private cargarEstadisticas(): void {
    this.noticiasService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        this.totalNoticias = stats.totalNoticias;
        this.noticiasPublicas = stats.publicadas || stats.noticiasPublicas || 0;
        this.visitasTotales = stats.visitasTotales || 0;
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  /**
   * Calcula estadísticas locales de las noticias cargadas
   */
  private calcularEstadisticas(noticias: Noticia[]): void {
    this.totalNoticias = noticias.length;
    this.noticiasPublicas = noticias.filter(n => n.esPublica).length;
    this.noticiasBorradores = noticias.filter(n => !n.esPublica).length;
    this.visitasTotales = noticias.reduce((total, n) => total + n.visitas, 0);
  }

  /**
   * Aplica filtros de búsqueda
   */
  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    let datosFiltrados = this.dataSource.data;

    // Filtro por búsqueda rápida
    if (this.busquedaRapida.trim()) {
      const busqueda = this.busquedaRapida.toLowerCase();
      datosFiltrados = datosFiltrados.filter(noticia =>
        noticia.titulo.toLowerCase().includes(busqueda) ||
        noticia.resumen.toLowerCase().includes(busqueda) ||
        noticia.autorNombre.toLowerCase().includes(busqueda)
      );
    }

    // Aplicar filtros del formulario
    if (filtros.titulo) {
      datosFiltrados = datosFiltrados.filter(n => 
        n.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())
      );
    }

    if (filtros.esPublica !== '') {
      datosFiltrados = datosFiltrados.filter(n => n.esPublica === filtros.esPublica);
    }

    if (filtros.destacada !== '') {
      datosFiltrados = datosFiltrados.filter(n => n.destacada === filtros.destacada);
    }

    this.dataSource.filteredData = datosFiltrados;
  }

  /**
   * Maneja la selección de filas
   */
  toggleSeleccion(noticia: Noticia): void {
    const index = this.noticiasSeleccionadas.findIndex(n => n.id === noticia.id);
    if (index > -1) {
      this.noticiasSeleccionadas.splice(index, 1);
    } else {
      this.noticiasSeleccionadas.push(noticia);
    }
  }

  /**
   * Verifica si una noticia está seleccionada
   */
  estaSeleccionada(noticia: Noticia): boolean {
    return this.noticiasSeleccionadas.some(n => n.id === noticia.id);
  }

  /**
   * Selecciona/deselecciona todas las noticias
   */
  toggleSeleccionTodo(): void {
    if (this.todasSeleccionadas()) {
      this.noticiasSeleccionadas = [];
    } else {
      this.noticiasSeleccionadas = [...this.dataSource.filteredData];
    }
  }

  /**
   * Verifica si todas las noticias están seleccionadas
   */
  todasSeleccionadas(): boolean {
    return this.dataSource.filteredData.length > 0 && 
           this.noticiasSeleccionadas.length === this.dataSource.filteredData.length;
  }

  /**
   * Navega a editar noticia
   */
  editarNoticia(id: number): void {
    this.router.navigate(['/admin/noticias/editar', id]);
  }

  /**
   * Navega a ver detalle de noticia
   */
  verDetalle(id: number): void {
    this.router.navigate(['/admin/noticias/detalle', id]);
  }

  /**
   * Duplica una noticia
   */
  duplicarNoticia(noticia: Noticia): void {
    this.cargando = true;
    this.noticiasService.duplicarNoticia(noticia.id).subscribe({
      next: (nuevaNoticia) => {
        this.mostrarExito(`Noticia "${noticia.titulo}" duplicada exitosamente`);
        this.cargarNoticias();
      },
      error: (err) => {
        this.mostrarError('Error al duplicar la noticia');
        this.cargando = false;
      }
    });
  }

  /**
   * Cambia el estado de publicación de una noticia
   */
  togglePublicacion(noticia: Noticia): void {
    const nuevoEstado = !noticia.esPublica;
    this.noticiasService.cambiarEstadoPublicacion(noticia.id, nuevoEstado).subscribe({
      next: (noticiaActualizada: Noticia) => {
        noticia.esPublica = nuevoEstado;
        this.mostrarExito(`Noticia ${nuevoEstado ? 'publicada' : 'despublicada'} correctamente`);
        this.calcularEstadisticas(this.dataSource.data);
      },
      error: (err: any) => {
        this.mostrarError('Error al cambiar estado de publicación');
      }
    });
  }

  /**
   * Cambia el estado destacado de una noticia
   */
  toggleDestacada(noticia: Noticia): void {
    const autorId = this.authService.obtenerIdUsuario()!;
    const nuevoEstado = !noticia.destacada;
    
    this.noticiasService.cambiarDestacada(noticia.id, autorId, nuevoEstado).subscribe({
      next: (noticiaActualizada: Noticia) => {
        noticia.destacada = nuevoEstado;
        this.mostrarExito(`Noticia ${nuevoEstado ? 'marcada como destacada' : 'desmarcada'}`);
      },
      error: (err: any) => {
        this.mostrarError('Error al cambiar estado destacado');
      }
    });
  }

  /**
   * 🔥 MEJORADO: Elimina noticias seleccionadas con mejor manejo de errores
   */
  eliminarSeleccionadas(): void {
    if (this.noticiasSeleccionadas.length === 0) {
      this.mostrarError('No hay noticias seleccionadas');
      return;
    }

    const mensaje = `¿Está seguro de eliminar ${this.noticiasSeleccionadas.length} noticia(s) seleccionada(s)? Esta acción no se puede deshacer.`;
    
    if (confirm(mensaje)) {
      this.cargando = true;
      let eliminacionesExitosas = 0;
      let eliminacionesFallidas = 0;
      const totalEliminaciones = this.noticiasSeleccionadas.length;

      // Crear observables para cada eliminación
      const eliminaciones$ = this.noticiasSeleccionadas.map(noticia => 
        this.noticiasService.eliminarNoticia(noticia.id).pipe(
          map(() => ({ success: true, noticia })),
          catchError((error) => of({ success: false, noticia, error }))
        )
      );

      // Ejecutar todas las eliminaciones en paralelo
      forkJoin(eliminaciones$).subscribe({
        next: (resultados: any[]) => {
          // Contar éxitos y fallos
          resultados.forEach((resultado: any) => {
            if (resultado.success) {
              eliminacionesExitosas++;
            } else {
              eliminacionesFallidas++;
              console.error(`Error al eliminar noticia "${resultado.noticia.titulo}":`, resultado.error);
            }
          });

          // Mostrar resultado
          if (eliminacionesFallidas === 0) {
            this.mostrarExito(`${eliminacionesExitosas} noticia(s) eliminada(s) correctamente`);
          } else if (eliminacionesExitosas === 0) {
            this.mostrarError(`Error: No se pudo eliminar ninguna noticia`);
          } else {
            this.mostrarError(`Eliminadas: ${eliminacionesExitosas}, Fallidas: ${eliminacionesFallidas}`);
          }

          // Limpiar selección y recargar lista
          this.noticiasSeleccionadas = [];
          this.cargarNoticias();
        },
        error: (error) => {
          console.error('Error inesperado en eliminación masiva:', error);
          this.mostrarError('Error inesperado al eliminar noticias');
          this.cargando = false;
        }
      });
    }
  }

  /**
   * 🔥 MEJORADO: Exporta noticias con mejor manejo de errores
   */
  exportar(formato: 'csv' | 'pdf' | 'excel'): void {
    if (this.dataSource.data.length === 0) {
      this.mostrarError('No hay noticias para exportar');
      return;
    }

    this.cargando = true;
    const fechaActual = new Date().toISOString().split('T')[0];
    
    this.noticiasService.exportarNoticias(formato).subscribe({
      next: (blob: Blob) => {
        try {
          // Verificar que el blob tiene contenido
          if (blob.size === 0) {
            this.mostrarError('El archivo exportado está vacío');
            this.cargando = false;
            return;
          }

          // Crear y descargar el archivo
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `noticias_${fechaActual}.${formato}`;
          link.style.display = 'none';
          
          // Agregar al DOM, hacer clic y limpiar
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Limpiar la URL del objeto
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
          
          this.mostrarExito(`Exportación completada: noticias_${fechaActual}.${formato}`);
          this.cargando = false;
        } catch (error) {
          console.error('Error al procesar el archivo exportado:', error);
          this.mostrarError('Error al procesar el archivo descargado');
          this.cargando = false;
        }
      },
      error: (err: any) => {
        console.error('Error al exportar noticias:', err);
        let mensajeError = 'Error al exportar noticias';
        
        // Mensajes de error más específicos
        if (err.status === 404) {
          mensajeError = 'El servicio de exportación no está disponible';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor durante la exportación';
        } else if (err.status === 0) {
          mensajeError = 'Error de conexión. Verifica tu conexión a internet';
        }
        
        this.mostrarError(mensajeError);
        this.cargando = false;
      }
    });
  }

  /**
   * Vuelve al dashboard
   */
  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Navega a crear nueva noticia
   */
  crearNuevaNoticia(): void {
    this.router.navigate(['/admin/noticias/crear']);
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Limpia filtros
   */
  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.busquedaRapida = '';
    this.aplicarFiltros();
  }

  /**
   * Método fallback para cargar noticias cuando falla el método principal
   */
  private intentarFallbackListarTodas(autorId: number): void {
    console.log('🔄 Intentando fallback: listar todas las noticias...');
    
    this.noticiasService.listarTodas().subscribe({
      next: (response) => {
        const todasLasNoticias = response.noticias || response || [];
        // Filtrar solo las noticias del autor actual
        const noticiasFiltradas = todasLasNoticias.filter((n: Noticia) => n.autorId === autorId);
        console.log(`✅ Fallback exitoso: ${noticiasFiltradas.length} noticias del autor`);
        
        this.dataSource.data = noticiasFiltradas;
        this.calcularEstadisticas(noticiasFiltradas);
        this.cargando = false;
        
        // Mostrar mensaje informativo si se usó fallback
        this.snackBar.open('Noticias cargadas usando método alternativo', 'OK', {
          duration: 3000,
          panelClass: ['snack-info']
        });
      },
      error: (err: any) => {
        console.error('❌ Error en fallback también:', err);
        this.mostrarError('Error al cargar las noticias. Por favor, intente más tarde.');
        this.cargando = false;
        
        // Como último recurso, mostrar datos vacíos
        this.dataSource.data = [];
        this.calcularEstadisticas([]);
      }
    });
  }
}
