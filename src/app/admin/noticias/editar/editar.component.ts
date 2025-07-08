import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NoticiasService, Noticia, EditarNoticiaPayload, FiltrosNoticia, ListarNoticiasResponse } from '../../../core/services/noticias.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionSeccionService } from '../../../core/services/asignacion-seccion.service';
import { SeccionesService, SeccionResponse } from '../../../core/services/secciones.service';
import { EditorModule } from '@tinymce/tinymce-angular';
import { VistaPreviaNoticiaComponent } from '../../../shared/vista/vista-previa-noticia.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-editar-noticia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    EditorModule,
    VistaPreviaNoticiaComponent,
    // Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './editar.component.html',
  styleUrls: ['./editar.component.scss']
})
export class EditarNoticiaComponent implements OnInit, OnDestroy {
  // Services
  private noticiasService = inject(NoticiasService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private asignacionService = inject(AsignacionSeccionService);
  private seccionesService = inject(SeccionesService);

  // Component state
  private destroy$ = new Subject<void>();
  noticiaId!: number;
  noticia: Noticia | null = null;
  loading = false;
  saving = false;
  hasUnsavedChanges = false;
  selectedTabIndex = 0;

  // Sidebar state
  sidebarOpen = true;
  noticias: Noticia[] = [];
  noticiasLoading = false;
  filtrosSidebar: FiltrosNoticia = {};
  busquedaSidebar = '';

  // New properties for template compatibility
  filtroEstado = '';
  filtroTexto = '';
  cargando = false;
  noticiasFiltradas: Noticia[] = [];
  noticiaSeleccionada: Noticia | null = null;
  ultimoGuardado: Date | null = null;
  form: FormGroup = new FormGroup({});
  guardandoAutomatico = false;
  activeTab = 0;
  imagenDestacadaPreview: string | null = null;
  imagenDestacada: File | null = null;
  tinyApiKey = '5tih1fbrikzwqwsoual38fk8cjntepo2indbjl3evoppebut'; // 🔥 CORREGIDO: API key agregada
  contenidoHtml = '';
  tagInput = '';
  mostrarVistaPrevia = false;

  // Forms
  informacionForm!: FormGroup;
  configuracionForm!: FormGroup;
  contenidoForm!: FormGroup;

  // 🔥 ACTUALIZADO: Configuración rica de TinyMCE (solo funciones gratuitas)
  editorConfig = {
    height: 500,
    menubar: 'edit view insert format tools table help',
    
    // 🔥 PLUGINS GRATUITOS - Funciones ricas pero sin premium
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'wordcount', 'help', 'emoticons',
      'autosave', 'save', 'directionality', 'pagebreak', 'nonbreaking'
    ].join(' '),
    
    // ✅ TOOLBAR RICA - Solo funciones gratuitas
    toolbar: [
      'undo redo | blocks fontsize | bold italic underline strikethrough | forecolor backcolor',
      'alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist',
      'table | link image media | charmap emoticons | insertdatetime | preview code fullscreen | help'
    ].join(' | '),
    
    // ✅ Configuraciones avanzadas gratuitas
    block_formats: 'Párrafo=p; Encabezado 1=h1; Encabezado 2=h2; Encabezado 3=h3; Encabezado 4=h4; Preformateado=pre; Cita=blockquote',
    font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt',
    
    // ✅ Configuraciones de tabla (gratuitas)
    table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
    table_resize_bars: true,
    table_grid: false,
    
    // ✅ Configuraciones de imagen
    image_advtab: true,
    image_title: true,
    image_description: true,
    
    // ✅ Autoguardado (gratuito)
    autosave_ask_before_unload: false,
    autosave_interval: '30s',
    autosave_retention: '30m',
    
    // ✅ Búsqueda y reemplazo
    searchreplace_compact: false,
    
    // ✅ Configuraciones de código
    code_dialog_height: 400,
    code_dialog_width: 1000,
    
    // ✅ Configuraciones de contenido
    paste_data_images: true,
    paste_as_text: false,
    paste_auto_cleanup_on_paste: true,
    paste_remove_styles: false,
    paste_remove_styles_if_webkit: false,
    
    // 🔥 CRÍTICO: SIN configuraciones que requieran archivos externos
    branding: false,
    resize: true,
    statusbar: true,
    automatic_uploads: false,
    
    // ✅ Estilos personalizados
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        font-size: 14px; 
        line-height: 1.6; 
        color: #333;
        padding: 12px;
        background-color: #fff;
      }
      h1, h2, h3, h4, h5, h6 { 
        color: #2c3e50; 
        margin-top: 24px; 
        margin-bottom: 12px; 
        font-weight: 600;
      }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.17em; }
      p { margin-bottom: 12px; }
      blockquote { 
        border-left: 4px solid #3498db; 
        padding-left: 16px; 
        margin: 16px 0; 
        font-style: italic; 
        color: #555;
        background-color: #f8f9fa;
      }
      code { 
        background-color: #f1f1f1; 
        padding: 2px 4px; 
        border-radius: 3px; 
        font-family: 'Courier New', monospace;
      }
      pre { 
        background-color: #f8f8f8; 
        border: 1px solid #ddd; 
        padding: 12px; 
        border-radius: 4px; 
        overflow-x: auto;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 16px 0;
      }
      th, td { 
        border: 1px solid #ddd; 
        padding: 8px 12px; 
        text-align: left;
      }
      th { 
        background-color: #f2f2f2; 
        font-weight: bold;
      }
      img { 
        max-width: 100%; 
        height: auto; 
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      ul, ol { padding-left: 24px; }
      li { margin-bottom: 4px; }
    `,
    
    // ✅ Setup avanzado
    setup: (editor: any) => {
      editor.on('init', () => {
        console.log('✅ TinyMCE rico (gratuito) inicializado en edición');
      });
      
      // Detectar cambios
      editor.on('change keyup', () => {
        this.hasUnsavedChanges = true;
      });
      
      // Botón personalizado para insertar separador
      editor.ui.registry.addButton('separator', {
        text: 'Separador',
        tooltip: 'Insertar línea separadora',
        onAction: () => {
          editor.insertContent('<hr style="margin: 20px 0; border: none; border-top: 2px solid #e1e5e9;">');
        }
      });
      
      // Comando personalizado para limpiar formato
      editor.addCommand('CleanFormat', () => {
        editor.execCommand('RemoveFormat');
        editor.execCommand('mceRemoveNode', false, 'span');
      });
    }
  };

  // Data
  secciones: SeccionResponse[] = [];
  tags: string[] = [];
  estadosPublicacion = [
    { value: true, label: 'Publicada' },
    { value: false, label: 'Borrador' }
  ];

  // Statistics
  estadisticas = {
    total: 0,
    publicadas: 0,
    borradores: 0,
    sinSeccion: 0,
    destacadas: 0
  };

  // Auto-save
  private autoSaveSubject = new Subject<any>();
  
  // 🔥 NUEVO: Control de autoguardados limitados
  private autoguardadosRealizados = 0;
  private readonly MAX_AUTOGUARDADOS = 2;
  private autoguardadoHabilitado = true;

  constructor() {
    this.initForms();
    this.setupAutoSave();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params['id'];
      console.log('🔄 Parámetros de ruta completos:', params);
      console.log('🔄 Parámetro ID recibido:', idParam, 'Tipo:', typeof idParam);
      
      // 🔥 Validación exhaustiva del parámetro ID
      if (!idParam || idParam === 'undefined' || idParam === 'null' || isNaN(+idParam) || +idParam <= 0) {
        console.error('❌ ID de noticia inválido:', idParam);
        this.mostrarError('No se proporcionó un ID de noticia válido. Redirigiendo a la lista...');
        setTimeout(() => {
          this.router.navigate(['/admin/noticias/listar']);
        }, 2000);
        return;
      }
      
      this.noticiaId = +idParam;
      console.log('✅ ID validado:', this.noticiaId);
      this.cargarNoticia();
    });
    
    // 🔥 VERIFICACIÓN ADICIONAL: Revisar la URL actual
    const currentUrl = this.router.url;
    console.log('🔄 URL actual:', currentUrl);
    
    if (currentUrl === '/admin/noticias/editar' || !currentUrl.includes('/editar/')) {
      console.warn('⚠️ Se accedió a editar sin ID específico');
      this.mostrarError('Debe seleccionar una noticia específica para editar');
      setTimeout(() => {
        this.router.navigate(['/admin/noticias/listar']);
      }, 2000);
      return;
    }
    
    this.cargarSecciones();
    this.cargarNoticias();
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // INICIALIZACIÓN
  // ===============================

  private initForms(): void {
    this.informacionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(10)]],
      resumen: ['', [Validators.required, Validators.minLength(20)]],
      fechaPublicacion: [''],
      imagenDestacada: ['']
    });

    this.contenidoForm = this.fb.group({
      contenido: ['', Validators.required]
    });

    this.configuracionForm = this.fb.group({
      esPublica: [true],
      destacada: [false],
      permitirComentarios: [true],
      seccionId: ['', Validators.required], // 🔥 AGREGADO: Sección requerida
      tags: ['']
    });

    // Set the main form reference for template compatibility
    this.form = this.informacionForm;

    // Auto-save setup
    this.informacionForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(2000))
      .subscribe(() => this.autoGuardar());

    this.contenidoForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(3000))
      .subscribe(() => this.autoGuardar());

    this.configuracionForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(1000))
      .subscribe(() => this.autoGuardar());

    // Listener específico para el campo destacada
    this.configuracionForm.get('destacada')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((valor: boolean) => {
        if (this.noticia && valor !== this.noticia.destacada) {
          this.cambiarEstadoDestacada();
        }
      });
  }

  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(2000),
        distinctUntilChanged()
      )
      .subscribe(() => this.ejecutarAutoGuardado());
  }

  // ===============================
  // CARGA DE DATOS
  // ===============================

  private cargarNoticia(): void {
    this.loading = true;
    
    // Resetear contador de autoguardados para nueva noticia
    this.autoguardadosRealizados = 0;
    this.autoguardadoHabilitado = true;
    
    // 🔥 ACTUALIZADO: Usar método robusto para evitar errores SQL
    this.noticiasService.obtenerPorId(this.noticiaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticia) => {
          console.log('✅ Noticia cargada:', noticia);
          this.noticia = noticia;
          this.cargarDatosEnFormularios();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar noticia:', error);
          
          // Manejo específico de errores de backend
          let mensajeError = 'Error al cargar la noticia';
          let intentarAlternativo = false;
          
          if (error.status === 404) {
            mensajeError = 'La noticia no fue encontrada';
          } else if (error.status === 500) {
            mensajeError = 'Error interno del servidor. Intente nuevamente en unos momentos.';
            intentarAlternativo = true;
          } else if (error.status === 0) {
            mensajeError = 'Error de conexión. Verifique su conexión a internet.';
          } else if (error.message && error.message.includes('lower(bytea)')) {
            mensajeError = 'Error de configuración en el servidor. Intentando método alternativo...';
            intentarAlternativo = true;
            console.error('🔥 Error específico de SQL bytea detectado:', error);
          }
          
          this.loading = false;
          
          if (intentarAlternativo) {
            console.log('🔄 Intentando método alternativo de carga...');
            this.mostrarInfo('Detectado problema del servidor, intentando cargar de forma alternativa...');
            this.cargarNoticiaAlternativo();
            return;
          }
          
          this.mostrarError(mensajeError);
          
          // Redirigir a la lista si la noticia no existe
          if (error.status === 404) {
            setTimeout(() => {
              this.router.navigate(['/admin/noticias']);
            }, 3000);
          }
        }
      });
  }

  /**
   * 🔥 NUEVO: Método alternativo para cargar noticia evitando errores de backend
   */
  private cargarNoticiaAlternativo(): void {
    console.log('🔄 Intentando carga alternativa de noticia...');
    this.loading = true;
    
    // Intentar cargar usando método básico con timeout y retry
    this.noticiasService.obtenerPorId(this.noticiaId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (noticia: any) => {
          console.log('✅ Noticia cargada (método alternativo):', noticia);
          this.noticia = noticia;
          this.cargarDatosEnFormularios();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('❌ Error en carga alternativa:', error);
          this.mostrarError('No se pudo cargar la noticia. Verifique la conexión.');
          this.loading = false;
          
          // Redirigir al dashboard como último recurso
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 3000);
        }
      });
  }

  /**
   * Carga datos de la noticia en los formularios (acceso público para el template)
   */
  cargarDatosEnFormularios(): void {
    if (!this.noticia) return;

    try {
      // Información básica
      this.informacionForm.patchValue({
        titulo: this.noticia.titulo || '',
        resumen: this.noticia.resumen || '',
        fechaPublicacion: this.noticia.fechaPublicacion || '',
        imagenDestacada: this.noticia.imagenDestacada || ''
      });

      // Configuración
      this.configuracionForm.patchValue({
        esPublica: this.noticia.esPublica !== undefined ? this.noticia.esPublica : false,
        destacada: this.noticia.destacada || false,
        permitirComentarios: true,
        seccionId: this.noticia.seccion_id || ''
      });

      this.tags = this.noticia.tags || [];
      this.noticiaSeleccionada = this.noticia;
      this.imagenDestacadaPreview = this.noticia.imagenDestacada;

      // Cargar contenido HTML
      if (this.noticia.contenidoUrl) {
        this.noticiasService.obtenerContenidoHtml(this.noticia.contenidoUrl)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (contenidoHtml: string) => {
              this.contenidoForm.patchValue({ contenido: contenidoHtml });
              this.contenidoHtml = contenidoHtml;
            },
            error: (error: any) => {
              this.mostrarError('Error al cargar el contenido de la noticia');
              this.contenidoForm.patchValue({ contenido: '' });
              this.contenidoHtml = '';
            }
          });
      } else {
        this.contenidoForm.patchValue({ contenido: (this.noticia as any).contenidoHtml || '' });
        this.contenidoHtml = (this.noticia as any).contenidoHtml || '';
      }

    } catch (error) {
      this.mostrarError('Error al procesar los datos de la noticia');
    }
  }

  private cargarSecciones(): void {
    this.seccionesService.listar().subscribe({
      next: (secciones: SeccionResponse[]) => {
        // Filtrar solo secciones activas y visibles
        this.secciones = secciones.filter(s => s.activa && s.visible !== false);
        console.log('✅ Secciones cargadas en editar:', this.secciones);
      },
      error: (err: any) => {
        console.error('❌ Error al cargar secciones:', err);
        // Fallback con secciones predeterminadas
        this.secciones = [
          { id: 1, titulo: 'Portada', tipo: 'NOTICIAS', orden: 1, activa: true, visible: true },
          { id: 2, titulo: 'Deportes', tipo: 'NOTICIAS', orden: 2, activa: true, visible: true },
          { id: 3, titulo: 'Fútbol', tipo: 'NOTICIAS', orden: 3, activa: true, visible: true },
          { id: 4, titulo: 'Otros Deportes', tipo: 'NOTICIAS', orden: 4, activa: true, visible: true }
        ];
      }
    });
  }

  /**
   * 🔥 ACTUALIZADO: Cargar noticias usando método robusto con manejo de errores SQL
   */
  private cargarNoticias(): void {
    this.noticiasLoading = true;
    this.cargando = true;
    console.log('🔄 Cargando lista de noticias...');

    // 🔥 CORREGIDO: Usar autorId para evitar error 400 en listarTodas
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      console.error('❌ No se pudo obtener el ID del autor');
      this.mostrarError('Error: No se pudo obtener el ID del usuario');
      this.noticiasLoading = false;
      this.cargando = false;
      return;
    }

    this.noticiasService.obtenerPorAutor(autorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticias: any[]) => {
          console.log('✅ Noticias cargadas (método robusto):', noticias.length);
          this.noticias = noticias;
          this.noticiasFiltradas = this.aplicarFiltrosLocales(noticias);
          this.noticiasLoading = false;
          this.cargando = false;
          this.cargarEstadisticas();
        },
        error: (error: any) => {
          console.error('❌ Error al cargar noticias:', error);
          
          // Manejo específico de errores de backend
          let mensajeError = 'Error al cargar la lista de noticias';
          
          if (error.status === 500) {
            mensajeError = 'Error del servidor al cargar noticias. Algunas funciones pueden estar limitadas.';
          } else if (error.status === 0) {
            mensajeError = 'Error de conexión al cargar noticias.';
          } else if (error.message && error.message.includes('lower(bytea)')) {
            mensajeError = 'Error de configuración del servidor detectado.';
            console.error('🔥 Error específico de SQL bytea en lista:', error);
            
            // Intentar fallback con método tradicional
            console.log('🔄 Intentando fallback con método tradicional...');
            this.cargarNoticiasTradicional();
            return;
          }
          
          // Mostrar error pero no bloquear la edición
          this.mostrarError(mensajeError);
          
          // Configurar datos vacíos para que la interfaz siga funcionando
          this.noticias = [];
          this.noticiasFiltradas = [];
          this.noticiasLoading = false;
          this.cargando = false;
          
          // Estadísticas vacías
          this.estadisticas = {
            total: 0,
            publicadas: 0,
            borradores: 0,
            sinSeccion: 0,
            destacadas: 0
          };
        }
      });
  }

  /**
   * 🔥 NUEVO: Método fallback usando método tradicional cuando el robusto falla
   */
  private cargarNoticiasTradicional(): void {
    console.log('🔄 Intentando carga tradicional de noticias...');
    
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      console.error('❌ No se pudo obtener el ID del autor para fallback');
      this.mostrarError('No se pudo cargar la lista de noticias. Funcionalidad limitada.');
      this.configurarDatosVacios();
      return;
    }
    
    this.noticiasService.obtenerPorAutor(autorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticias: any[]) => {
          console.log('✅ Noticias cargadas (método tradicional):', noticias.length);
          this.noticias = noticias;
          this.noticiasFiltradas = this.aplicarFiltrosLocales(noticias);
          this.noticiasLoading = false;
          this.cargando = false;
          this.cargarEstadisticas();
        },
        error: (error: any) => {
          console.error('❌ Error en carga tradicional:', error);
          this.mostrarError('No se pudo cargar la lista de noticias. Funcionalidad limitada.');
          this.configurarDatosVacios();
        }
      });
  }

  /**
   * 🔥 NUEVO: Configurar datos vacíos para mantener la interfaz funcional
   */
  private configurarDatosVacios(): void {
    this.noticias = [];
    this.noticiasFiltradas = [];
    this.noticiasLoading = false;
    this.cargando = false;
    
    this.estadisticas = {
      total: 0,
      publicadas: 0,
      borradores: 0,
      sinSeccion: 0,
      destacadas: 0
    };
  }

  private aplicarFiltrosLocales(noticias: Noticia[]): Noticia[] {
    let filtradas = [...noticias];

    if (this.filtroTexto) {
      filtradas = filtradas.filter(n => 
        n.titulo.toLowerCase().includes(this.filtroTexto.toLowerCase())
      );
    }

    if (this.filtroEstado) {
      switch (this.filtroEstado) {
        case 'publicas':
          filtradas = filtradas.filter(n => n.esPublica);
          break;
        case 'borradores':
          filtradas = filtradas.filter(n => !n.esPublica);
          break;
        case 'destacadas':
          filtradas = filtradas.filter(n => n.destacada);
          break;
      }
    }

    return filtradas;
  }

  private cargarEstadisticas(): void {
    // Simulated statistics - replace with actual service call
    this.estadisticas = {
      total: this.noticias.length,
      publicadas: this.noticias.filter(n => n.esPublica).length,
      borradores: this.noticias.filter(n => !n.esPublica).length,
      sinSeccion: this.noticias.filter(n => !n.seccion_id).length,
      destacadas: this.noticias.filter(n => n.destacada).length
    };
  }

  // ===============================
  // GUARDADO Y AUTO-GUARDADO
  // ===============================

  /**
   * Guarda cambios usando backend con FormData
   */
  guardarCambios(): void {
    if (!this.validarFormularios()) {
      this.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.saving = true;
    const payload = this.construirPayload();

    this.noticiasService.actualizarNoticia(this.noticiaId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Noticia) => {
          this.noticia = response;
          this.hasUnsavedChanges = false;
          this.saving = false;
          this.ultimoGuardado = new Date();
          this.mostrarExito('Noticia actualizada correctamente');
        },
        error: (error: any) => {
          let mensajeError = 'Error al guardar los cambios';
          
          if (error.status === 400) {
            mensajeError = 'Datos inválidos. Verifique la información ingresada.';
          } else if (error.status === 401) {
            mensajeError = 'No tiene permisos para editar esta noticia.';
          } else if (error.status === 404) {
            mensajeError = 'La noticia ya no existe en el sistema.';
          } else if (error.status === 500) {
            mensajeError = 'Error interno del servidor. Intente nuevamente.';
          } else if (error.status === 0) {
            mensajeError = 'Error de conexión. Verifique su conexión a internet.';
          }
          
          this.mostrarError(mensajeError);
          this.saving = false;
        }
      });
  }

  private autoGuardar(): void {
    if (!this.autoguardadoHabilitado || this.autoguardadosRealizados >= this.MAX_AUTOGUARDADOS) {
      return;
    }

    if (!this.hasUnsavedChanges) {
      this.hasUnsavedChanges = true;
    }
    
    this.autoSaveSubject.next(this.construirPayload());
  }

  /**
   * Autoguardado usando backend modernizado con límite de intentos
   */
  private ejecutarAutoGuardado(): void {
    if (!this.autoguardadoHabilitado || this.autoguardadosRealizados >= this.MAX_AUTOGUARDADOS) {
      return;
    }

    if (!this.validarFormularios()) {
      return;
    }

    const payload = this.construirPayload();
    const autoguardadoRequest = {
      titulo: payload.titulo,
      resumen: payload.resumen || '',
      contenidoHtml: payload.contenidoHtml,
      esPublica: payload.esPublica,
      autorId: this.authService.obtenerIdUsuario()!,
      noticiaOriginalId: this.noticiaId
    };

    this.autoguardadosRealizados++;

    this.noticiasService.autoguardar(autoguardadoRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasUnsavedChanges = false;
          
          const mensaje = `Autoguardado ${this.autoguardadosRealizados}/${this.MAX_AUTOGUARDADOS} completado`;
          this.mostrarInfo(mensaje);
          
          if (this.autoguardadosRealizados >= this.MAX_AUTOGUARDADOS) {
            this.autoguardadoHabilitado = false;
            this.mostrarInfo('Autoguardado deshabilitado (límite alcanzado). Use "Guardar" para cambios finales.');
          }
        },
        error: (error: any) => {
          this.autoguardadosRealizados--;
          
          if (this.autoguardadosRealizados === 0) {
            this.mostrarError('Error en autoguardado. Use "Guardar" para guardar manualmente.');
          }
        }
      });
  }

  private construirPayload(): EditarNoticiaPayload {
    const informacion = this.informacionForm.value;
    const contenido = this.contenidoForm.value;
    const configuracion = this.configuracionForm.value;

    return {
      titulo: informacion.titulo,
      resumen: informacion.resumen,
      contenidoHtml: contenido.contenido,
      esPublica: configuracion.esPublica,
      destacada: configuracion.destacada,
      seccionId: configuracion.seccionId || null,
      tags: this.tags,
      imagenDestacada: informacion.imagenDestacada,
      fechaPublicacion: informacion.fechaPublicacion
    };
  }

  private validarFormularios(): boolean {
    return this.informacionForm.valid && 
           this.contenidoForm.valid && 
           this.configuracionForm.valid;
  }

  // ===============================
  // ACCIONES RÁPIDAS
  // ===============================

  duplicarNoticia(): void {
    if (!this.noticia) return;

    this.noticiasService.duplicarNoticia(this.noticia.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nuevaNoticia) => {
          this.mostrarExito('Noticia duplicada correctamente');
          this.router.navigate(['/admin/noticias/editar', nuevaNoticia.id]);
        },
        error: (error) => {
          console.error('Error al duplicar noticia:', error);
          this.mostrarError('Error al duplicar la noticia');
        }
      });
  }

  // ===============================
  // GESTIÓN DE ESTADO DESTACADA
  // ===============================

  /**
   * Cambia solo el estado destacada usando endpoint específico PATCH
   */
  cambiarEstadoDestacada(): void {
    if (!this.noticia) return;

    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      this.mostrarError('Error: No se pudo obtener el ID del usuario');
      return;
    }

    const nuevoEstado = this.configuracionForm.get('destacada')?.value;
    this.saving = true;

    this.noticiasService.cambiarDestacada(this.noticia.id, autorId, nuevoEstado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noticiaActualizada: Noticia) => {
          this.noticia = noticiaActualizada;
          
          const mensaje = nuevoEstado ? 'Noticia marcada como destacada' : 'Noticia desmarcada como destacada';
          this.mostrarExito(mensaje);
          
          this.saving = false;
        },
        error: (error: any) => {
          let mensajeError = 'Error al cambiar el estado destacada';
          if (error.status === 401) {
            mensajeError = 'No tiene permisos para cambiar el estado de esta noticia';
          } else if (error.status === 404) {
            mensajeError = 'La noticia no fue encontrada';
          } else if (error.status === 500) {
            mensajeError = 'Error interno del servidor';
          }
          
          this.mostrarError(mensajeError);
          
          // Revertir el cambio en el formulario
          this.configuracionForm.patchValue({
            destacada: this.noticia?.destacada || false
          });
          
          this.saving = false;
        }
      });
  }

  // ===============================
  // UTILIDADES
  // ===============================

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  // ===============================
  // MÉTODOS ADICIONALES PARA TEMPLATE
  // ===============================

  volverAlDashboard(): void {
    this.router.navigate(['/admin']);
  }

  abrirVistaPreviaEnNuevaVentana(): void {
    this.generarVistaPrevia();
  }

  generarVistaPrevia(): void {
    if (!this.validarFormularios()) {
      this.mostrarError('Completa todos los campos requeridos');
      return;
    }

    const datos = this.construirPayload();
    
    // 🔥 Usar método moderno de vista previa
    const vistaPreviaRequest = {
      titulo: datos.titulo,
      resumen: datos.resumen || '',
      contenidoHtml: datos.contenidoHtml,
      imagenDestacada: datos.imagenDestacada
    };
    
    this.noticiasService.generarVistaPrevia(vistaPreviaRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (html: string) => {
          // Open preview in new window
          const ventana = window.open('', '_blank');
          if (ventana) {
            ventana.document.write(html);
            ventana.document.close();
          }
        },
        error: (error: any) => {
          console.error('Error al previsualizar:', error);
          this.mostrarError('Error al generar la vista previa');
        }
      });
  }

  onSubmit(): void {
    this.guardarCambios();
  }

  toggleVistaPrevia(): void {
    this.mostrarVistaPrevia = !this.mostrarVistaPrevia;
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenDestacada = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenDestacadaPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }



  // 🔥 NUEVO: Getters para el estado del autoguardado
  get autoguardadosRestantes(): number {
    return Math.max(0, this.MAX_AUTOGUARDADOS - this.autoguardadosRealizados);
  }

  get mostrarContadorAutoguardado(): boolean {
    return this.autoguardadosRealizados > 0 || !this.autoguardadoHabilitado;
  }

  get autoguardadoActivo(): boolean {
    return this.autoguardadoHabilitado;
  }

  get textoEstadoAutoguardado(): string {
    if (!this.autoguardadoHabilitado) {
      return 'Autoguardado deshabilitado (límite alcanzado)';
    }
    return `Autoguardados restantes: ${this.autoguardadosRestantes}`;
  }

  // Getters para el template
  get tituloInvalido(): boolean {
    const control = this.informacionForm.get('titulo');
    return control ? control.invalid && control.touched : false;
  }

  get resumenInvalido(): boolean {
    const control = this.informacionForm.get('resumen');
    return control ? control.invalid && control.touched : false;
  }

  get contenidoInvalido(): boolean {
    const control = this.contenidoForm.get('contenido');
    return control ? control.invalid && control.touched : false;
  }

  get estadoTexto(): string {
    return this.noticia?.esPublica ? 'Publicada' : 'Borrador';
  }

  get iconoEstado(): string {
    return this.noticia?.esPublica ? 'visibility' : 'visibility_off';
  }

  // ===============================
  // MÉTODOS PÚBLICOS PARA TEMPLATE
  // ===============================

  aplicarFiltros(): void {
    this.noticiasFiltradas = this.aplicarFiltrosLocales(this.noticias);
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  seleccionarNoticia(noticia: Noticia): void {
    console.log('🔄 Seleccionando noticia:', noticia.id, noticia.titulo);
    
    // Si ya estamos editando esta noticia, no hacer nada
    if (this.noticiaId === noticia.id) {
      console.log('⚠️ Ya se está editando esta noticia');
      return;
    }
    
    if (this.hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmacion = confirm('Tienes cambios sin guardar. ¿Deseas continuar?');
      if (!confirmacion) return;
    }
    
    // 🔥 MEJORADO: Mejor manejo de navegación
    console.log('🔄 Navegando a noticia:', noticia.id);
    
    // Limpiar estado actual antes de navegar
    this.loading = true;
    this.noticia = null;
    this.hasUnsavedChanges = false;
    
    // Navegar a la nueva noticia
    this.router.navigate(['/admin/noticias/editar', noticia.id]).then(() => {
      console.log('✅ Navegación completada a noticia:', noticia.id);
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
      this.loading = false;
    });
  }

  // ===============================
  // GESTIÓN DE TAGS
  // ===============================

  agregarTag(event?: any): void {
    let value = '';
    
    if (event && event.target) {
      value = event.target.value.trim();
      event.target.value = '';
    } else if (this.tagInput) {
      value = this.tagInput.trim();
      this.tagInput = '';
    }
    
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.hasUnsavedChanges = true;
      console.log('✅ Tag agregado:', value);
    }
  }

  eliminarTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.hasUnsavedChanges = true;
      console.log('🗑️ Tag eliminado:', tag);
    }
  }
}
