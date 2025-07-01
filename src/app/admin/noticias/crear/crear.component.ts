import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NoticiasService, CrearNoticiaPayload } from '../../../core/services/noticias.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionSeccionService } from '../../../core/services/asignacion-seccion.service';
import { SeccionesService, SeccionResponse } from '../../../core/services/secciones.service';
import { EditorModule } from '@tinymce/tinymce-angular';
import { VistaPreviaNoticiaComponent } from '../../../shared/vista/vista-previa-noticia.component';
import { environment } from '../../../../environment/environment';

// Material Design
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-crear-noticia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    EditorModule,
    VistaPreviaNoticiaComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatToolbarModule,
    MatStepperModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatAutocompleteModule
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearNoticiaComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  // Formularios
  informacionForm!: FormGroup;
  contenidoForm!: FormGroup;
  configuracionForm!: FormGroup;
  
  // Formulario unificado para el template
  form!: FormGroup;

  // Estados
  cargando = false;
  guardandoBorrador = false;
  
  // 🔥 NUEVO: Control de autoguardado optimizado
  private ultimoAutoguardado: Date | null = null;
  private autoguardadoInterval: any = null;
  private contenidoPrevioAutoguardado = '';
  private tituloLongitudMinima = 10; // Mínimo de caracteres para autoguardar
  
  // Datos
  imagenDestacada: File | null = null;
  imagenDestacadaPreview: string | null = null;
  contenidoHtml: string = '';
  mostrarVistaPrevia: boolean = false;
  
  // Tags
  tags: string[] = [];
  tagsDisponibles: string[] = ['Deportes', 'Política', 'Economía', 'Cultura', 'Tecnología', 'Salud'];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Secciones
  secciones: any[] = [];

  // 🔥 ACTUALIZADO: Configuración rica de TinyMCE (solo funciones gratuitas)
  public editorConfig: any = {
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
    resize: 'both',
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
        console.log('✅ TinyMCE rico (gratuito) inicializado');
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

  private fb = inject(FormBuilder);
  private noticiasService = inject(NoticiasService);
  private authService = inject(AuthService);
  private asignacionSeccionService = inject(AsignacionSeccionService);
  private seccionesService = inject(SeccionesService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  public tinyApiKey = environment.tinyApiKey;

  constructor() {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.cargarSecciones();
    this.configurarAutoguardado();
  }

  /**
   * Inicializa todos los formularios del stepper
   */
  private inicializarFormularios(): void {
    // Formulario unificado para compatibilidad con el template
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      resumen: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      contenidoHtml: ['', [Validators.required, Validators.minLength(50)]],
      esPublica: [false, Validators.required],
      imagen: [null],
      seccionId: ['', Validators.required], // 🔥 AGREGADO: Campo de sección requerido
      destacada: [false],
      tags: [[]]
    });

    // Formulario de información básica
    this.informacionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      resumen: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      imagen: [null]
    });

    // Formulario de contenido
    this.contenidoForm = this.fb.group({
      contenidoHtml: ['', [Validators.required, Validators.minLength(50)]]
    });

    // Formulario de configuración
    this.configuracionForm = this.fb.group({
      esPublica: [false, Validators.required],
      destacada: [false],
      seccionId: ['', Validators.required], // 🔥 CORREGIDO: Sección requerida
      tags: [[]]
    });

    // Suscripción a cambios en el contenido
    this.contenidoForm.get('contenidoHtml')?.valueChanges.subscribe(value => {
      this.contenidoHtml = value;
    });
    
    // Sincronizar formulario unificado con cambios
    this.form.get('contenidoHtml')?.valueChanges.subscribe(value => {
      this.contenidoHtml = value;
    });
  }

  /**
   * Carga las secciones disponibles
   */
  private cargarSecciones(): void {
    this.seccionesService.listar().subscribe({
      next: (secciones: SeccionResponse[]) => {
        // Filtrar solo secciones activas y visibles
        this.secciones = secciones.filter(s => s.activa && s.visible !== false);
        console.log('✅ Secciones cargadas:', this.secciones);
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
   * 🔥 OPTIMIZADO: Configura el autoguardado inteligente
   */
  private configurarAutoguardado(): void {
    // Limpiar cualquier interval anterior
    if (this.autoguardadoInterval) {
      clearInterval(this.autoguardadoInterval);
    }

    // Configurar autoguardado cada 2 minutos (120 segundos) en lugar de 30
    this.autoguardadoInterval = setInterval(() => {
      this.verificarYAutoguardar();
    }, 120000); // 2 minutos
  }

  /**
   * 🔥 NUEVO: Verifica si debe autoguardar de forma inteligente
   */
  private verificarYAutoguardar(): void {
    // No autoguardar si está cargando o guardando
    if (this.cargando || this.guardandoBorrador) {
      return;
    }

    // Verificar si hay contenido mínimo para autoguardar
    if (!this.hayContenidoSignificativo()) {
      return;
    }

    // Verificar si ha pasado suficiente tiempo desde el último autoguardado (mínimo 1 minuto)
    if (this.ultimoAutoguardado) {
      const tiempoTranscurrido = Date.now() - this.ultimoAutoguardado.getTime();
      const unMinuto = 60 * 1000;
      if (tiempoTranscurrido < unMinuto) {
        return;
      }
    }

    // Verificar si el contenido ha cambiado significativamente
    const contenidoActual = this.obtenerContenidoParaComparar();
    if (contenidoActual === this.contenidoPrevioAutoguardado) {
      return; // No hay cambios, no autoguardar
    }

    // Ejecutar autoguardado
    this.ejecutarAutoguardadoInteligente();
  }

  /**
   * 🔥 NUEVO: Verifica si hay contenido significativo para autoguardar
   */
  private hayContenidoSignificativo(): boolean {
    const titulo = this.form.get('titulo')?.value?.trim() || '';
    const contenido = this.form.get('contenidoHtml')?.value?.trim() || '';
    
    // Solo autoguardar si hay al menos un título mínimo Y algún contenido
    return titulo.length >= this.tituloLongitudMinima && contenido.length >= 20;
  }

  /**
   * 🔥 NUEVO: Obtiene contenido para comparar cambios
   */
  private obtenerContenidoParaComparar(): string {
    const titulo = this.form.get('titulo')?.value?.trim() || '';
    const resumen = this.form.get('resumen')?.value?.trim() || '';
    const contenido = this.form.get('contenidoHtml')?.value?.trim() || '';
    
    return `${titulo}|${resumen}|${contenido}`;
  }

  /**
   * 🔥 NUEVO: Ejecuta autoguardado de forma inteligente
   */
  private ejecutarAutoguardadoInteligente(): void {
    console.log('🔄 Ejecutando autoguardado inteligente...');
    
    this.guardandoBorrador = true;
    
    const autoguardadoRequest = {
      titulo: this.form.get('titulo')?.value?.trim() || '',
      resumen: this.form.get('resumen')?.value?.trim() || '',
      contenidoHtml: this.form.get('contenidoHtml')?.value?.trim() || '',
      esPublica: false,
      autorId: this.authService.obtenerIdUsuario()!
    };

    this.noticiasService.autoguardarModerno(autoguardadoRequest).subscribe({
      next: (response) => {
        console.log('✅ Autoguardado completado:', response);
        
        // Actualizar controles de autoguardado
        this.ultimoAutoguardado = new Date();
        this.contenidoPrevioAutoguardado = this.obtenerContenidoParaComparar();
        
        // Mostrar notificación discreta
        this.mostrarInfo('📄 Borrador guardado automáticamente');
        this.guardandoBorrador = false;
      },
      error: (err) => {
        console.error('❌ Error en autoguardado:', err);
        this.guardandoBorrador = false;
        // No mostrar error al usuario para autoguardado fallido
      }
    });
  }

  /**
   * Verifica si hay datos para guardar
   */
  private hayDatosParaGuardar(): boolean {
    const titulo = this.form.get('titulo')?.value;
    const contenido = this.form.get('contenidoHtml')?.value;
    return titulo?.trim() || contenido?.trim();
  }

  /**
   * 🔥 REMOVIDO: imagePickerCallback para evitar errores de Node
   * Las imágenes se suben a través del campo de imagen destacada
   */

  /**
   * Maneja la selección de imagen destacada
   */
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarError('La imagen no puede superar los 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.mostrarError('Solo se permiten archivos de imagen');
        return;
      }

      this.imagenDestacada = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenDestacadaPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      this.informacionForm.patchValue({ imagen: file });
      this.form.patchValue({ imagen: file });
    }
  }

  /**
   * Alias para onImagenSeleccionada (compatibilidad con template)
   */
  onArchivoSeleccionado(event: any): void {
    this.onImagenSeleccionada(event);
  }

  /**
   * Maneja el envío del formulario principal
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.publicarNoticia();
    } else {
      this.mostrarError('Por favor complete todos los campos requeridos');
      this.form.markAllAsTouched();
    }
  }

  /**
   * Elimina la imagen destacada seleccionada
   */
  eliminarImagenDestacada(): void {
    this.imagenDestacada = null;
    this.imagenDestacadaPreview = null;
    this.informacionForm.patchValue({ imagen: null });
  }

  /**
   * Agrega un tag
   */
  agregarTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.form.patchValue({ tags: this.tags });
      this.configuracionForm.patchValue({ tags: this.tags });
    }

    event.chipInput!.clear();
  }

  /**
   * Elimina un tag
   */
  eliminarTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.form.patchValue({ tags: this.tags });
      this.configuracionForm.patchValue({ tags: this.tags });
    }
  }

  /**
   * Selecciona un tag de la lista predefinida
   */
  seleccionarTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.form.patchValue({ tags: this.tags });
      this.configuracionForm.patchValue({ tags: this.tags });
    }
  }

  /**
   * Agrega un tag desde input de texto
   */
  agregarTagDesdeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.form.patchValue({ tags: this.tags });
      this.configuracionForm.patchValue({ tags: this.tags });
      input.value = ''; // Limpiar input
    }
  }

  /**
   * Guarda como borrador usando el nuevo backend
   * 🔥 ACTUALIZADO: Usa autoguardado moderno con Cloudinary
   */
  guardarBorrador(): void {
    if (!this.hayDatosParaGuardar()) {
      this.mostrarError('No hay datos para guardar');
      return;
    }

    this.guardandoBorrador = true;
    
    // 🔥 Usar nuevo método de autoguardado moderno
    const autoguardadoRequest = {
      titulo: this.form.get('titulo')?.value || '',
      resumen: this.form.get('resumen')?.value || '',
      contenidoHtml: this.form.get('contenidoHtml')?.value || '',
      esPublica: false, // Borrador = no público
      autorId: this.authService.obtenerIdUsuario()!
    };

    this.noticiasService.autoguardarModerno(autoguardadoRequest).subscribe({
      next: (response) => {
        this.mostrarExito('Borrador guardado automáticamente');
        this.guardandoBorrador = false;
      },
      error: (err) => {
        console.error('Error al guardar borrador:', err);
        this.guardandoBorrador = false;
      }
    });
  }

  /**
   * Previsualiza la noticia usando el nuevo backend
   * 🔥 ACTUALIZADO: Usa vista previa moderna sin guardar en BD
   */
  previsualizarNoticia(): void {
    if (!this.form.get('contenidoHtml')?.valid) {
      this.mostrarError('El contenido es requerido para la vista previa');
      return;
    }

    // 🔥 Usar nuevo método de vista previa moderno
    const vistaPreviaRequest = {
      titulo: this.form.get('titulo')?.value || 'Vista Previa',
      resumen: this.form.get('resumen')?.value || '',
      contenidoHtml: this.form.get('contenidoHtml')?.value || '',
      imagenDestacada: this.imagenDestacadaPreview || undefined
    };
    
    this.noticiasService.vistaPreviaModerno(vistaPreviaRequest).subscribe({
      next: (html: string) => {
        // Abrir en nueva ventana o modal
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana?.document.write(html);
        ventana?.document.close();
      },
      error: (err: any) => {
        this.mostrarError('Error al generar vista previa');
        console.error('Error vista previa:', err);
      }
    });
  }

  /**
   * 🔥 MEJORADO: Publica la noticia con validación completa
   */
  publicarNoticia(): void {
    // Validación completa antes de proceder
    const validacion = this.validarCamposRequeridos();
    
    if (!validacion.valido) {
      // Mostrar todos los errores
      const mensajeErrores = validacion.errores.join('\n• ');
      this.mostrarError(`Por favor corrija los siguientes errores:\n• ${mensajeErrores}`);
      this.marcarFormulariosComoTocados();
      return;
    }

    // Verificar que no esté ya procesando
    if (this.cargando) {
      this.mostrarError('Ya se está procesando una operación. Por favor espere.');
      return;
    }

    this.cargando = true;
    
    // 🔥 Usar nuevo método moderno
    const payload = {
      titulo: this.form.get('titulo')?.value?.trim() || '',
      resumen: this.form.get('resumen')?.value?.trim() || '',
      contenidoHtml: this.form.get('contenidoHtml')?.value?.trim() || '',
      esPublica: true, // Publicar = true
      destacada: this.form.get('destacada')?.value || false,
      seccionId: this.form.get('seccionId')?.value || undefined,
      tags: this.form.get('tags')?.value || this.tags || [],
      imagen: this.imagenDestacada || undefined
    };
    
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      this.mostrarError('Error: No se pudo obtener el ID del usuario');
      this.cargando = false;
      return;
    }

    console.log('📤 Enviando noticia al backend:', { ...payload, imagen: payload.imagen ? 'FILE_SELECTED' : 'NO_IMAGE' });

    this.noticiasService.crearNoticiaModerno(payload, autorId).subscribe({
      next: (response) => {
        console.log('✅ Noticia creada exitosamente:', response);
        this.mostrarExito('Noticia publicada exitosamente');
        this.cargando = false;
        
        // Limpiar formularios después del éxito
        this.limpiarFormularios();
        
        // 🔥 CORREGIDO: Navegar al dashboard en lugar de lista
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Error al publicar noticia:', err);
        
        // Mensaje de error más específico
        let mensajeError = 'Error al publicar la noticia';
        if (err.status === 400) {
          mensajeError = 'Datos inválidos. Verifique la información ingresada.';
        } else if (err.status === 401) {
          mensajeError = 'No tiene permisos para realizar esta acción.';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor. Intente nuevamente.';
        } else if (err.status === 0) {
          mensajeError = 'Error de conexión. Verifique su conexión a internet.';
        }
        
        this.mostrarError(mensajeError);
        this.cargando = false;
      }
    });
  }

  /**
   * 🔥 MEJORADO: Guarda como borrador con validación mejorada
   */
  guardarSinPublicar(): void {
    // Validación básica para borrador (menos estricta)
    const titulo = this.form.get('titulo')?.value?.trim();
    const contenido = this.form.get('contenidoHtml')?.value?.trim();
    
    if (!titulo || titulo.length < 5) {
      this.mostrarError('El título es requerido y debe tener al menos 5 caracteres');
      this.form.get('titulo')?.markAsTouched();
      return;
    }
    
    if (!contenido || contenido.length < 20) {
      this.mostrarError('El contenido debe tener al menos 20 caracteres para guardarlo como borrador');
      this.form.get('contenidoHtml')?.markAsTouched();
      return;
    }

    if (this.cargando) {
      this.mostrarError('Ya se está procesando una operación. Por favor espere.');
      return;
    }

    this.cargando = true;
    
    const payload = {
      titulo: titulo,
      resumen: this.form.get('resumen')?.value?.trim() || '',
      contenidoHtml: contenido,
      esPublica: false, // Borrador = no público
      destacada: this.configuracionForm.get('destacada')?.value || false,
      seccionId: this.configuracionForm.get('seccionId')?.value || undefined,
      tags: this.tags.length > 0 ? this.tags : undefined,
      imagen: this.imagenDestacada || undefined
    };
    
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      this.mostrarError('Error: No se pudo obtener el ID del usuario');
      this.cargando = false;
      return;
    }

    console.log('📄 Guardando borrador:', { ...payload, imagen: payload.imagen ? 'FILE_SELECTED' : 'NO_IMAGE' });

    this.noticiasService.crearNoticiaModerno(payload, autorId).subscribe({
      next: (response) => {
        console.log('✅ Borrador guardado exitosamente:', response);
        this.mostrarExito('Noticia guardada como borrador');
        this.cargando = false;
        
        // Limpiar formularios después del éxito
        this.limpiarFormularios();
        
        // Navegar a la lista
        setTimeout(() => {
          this.router.navigate(['/admin/noticias/listar']);
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Error al guardar borrador:', err);
        
        let mensajeError = 'Error al guardar el borrador';
        if (err.status === 400) {
          mensajeError = 'Datos inválidos. Verifique la información ingresada.';
        } else if (err.status === 401) {
          mensajeError = 'No tiene permisos para realizar esta acción.';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor. Intente nuevamente.';
        }
        
        this.mostrarError(mensajeError);
        this.cargando = false;
      }
    });
  }

  /**
   * Construye el FormData para enviar al servidor modernizado
   * 🔥 ACTUALIZADO: Compatible con backend que sube contenido a Cloudinary
   */
  private construirFormData(esPublica: boolean): FormData {
    const formData = new FormData();
    
    // Datos básicos del formulario unificado
    formData.append('titulo', this.form.get('titulo')?.value || '');
    formData.append('resumen', this.form.get('resumen')?.value || '');
    formData.append('contenidoHtml', this.form.get('contenidoHtml')?.value || ''); // 🔥 Backend lo procesará y subirá a Cloudinary
    formData.append('esPublica', this.form.get('esPublica')?.value?.toString() || esPublica.toString());
    
    // Configuración adicional
    formData.append('destacada', this.configuracionForm.get('destacada')?.value?.toString() || 'false');
    
    const seccionId = this.configuracionForm.get('seccionId')?.value;
    if (seccionId) {
      formData.append('seccionId', seccionId.toString());
    }
    
    // Tags
    if (this.tags.length > 0) {
      formData.append('tags', JSON.stringify(this.tags));
    }
    
    // Imagen destacada (el backend la subirá a Cloudinary)
    if (this.imagenDestacada) {
      formData.append('imagen', this.imagenDestacada);
    }
    
    return formData;
  }

  /**
   * Obtiene los datos de todos los formularios
   */
  private obtenerDatosFormulario(): any {
    return {
      ...this.informacionForm.value,
      ...this.contenidoForm.value,
      ...this.configuracionForm.value,
      tags: this.tags
    };
  }

  /**
   * 🔥 MEJORADO: Verifica si todos los formularios son válidos
   */
  private todosLosFormulariosValidos(): boolean {
    const informacionValida = this.informacionForm.valid;
    const contenidoValido = this.contenidoForm.valid;
    const configuracionValida = this.configuracionForm.valid;
    
    // Log para debugging
    if (!informacionValida) {
      console.warn('Formulario de información inválido:', this.informacionForm.errors);
    }
    if (!contenidoValido) {
      console.warn('Formulario de contenido inválido:', this.contenidoForm.errors);
    }
    if (!configuracionValida) {
      console.warn('Formulario de configuración inválido:', this.configuracionForm.errors);
    }
    
    return informacionValida && contenidoValido && configuracionValida;
  }

  /**
   * 🔥 NUEVO: Valida campos específicos antes de guardar
   */
  private validarCamposRequeridos(): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    // Validar título
    const titulo = this.form.get('titulo')?.value?.trim();
    if (!titulo || titulo.length < 5) {
      errores.push('El título es requerido y debe tener al menos 5 caracteres');
    }
    
    // Validar resumen
    const resumen = this.form.get('resumen')?.value?.trim();
    if (!resumen || resumen.length < 10) {
      errores.push('El resumen es requerido y debe tener al menos 10 caracteres');
    }
    
    // Validar contenido
    const contenido = this.form.get('contenidoHtml')?.value?.trim();
    if (!contenido || contenido.length < 50) {
      errores.push('El contenido es requerido y debe tener al menos 50 caracteres');
    }
    
    // Validar sección (REQUERIDA)
    const seccionId = this.form.get('seccionId')?.value;
    if (!seccionId) {
      errores.push('La sección es requerida para clasificar la noticia');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Marca todos los formularios como tocados para mostrar errores
   */
  private marcarFormulariosComoTocados(): void {
    this.form.markAllAsTouched(); // 🔥 AGREGADO: Marcar formulario principal
    this.informacionForm.markAllAsTouched();
    this.contenidoForm.markAllAsTouched();
    this.configuracionForm.markAllAsTouched();
  }

  /**
   * Navega al paso anterior del stepper
   */
  pasoAnterior(): void {
    this.stepper.previous();
  }

  /**
   * Navega al paso siguiente del stepper
   */
  pasoSiguiente(): void {
    this.stepper.next();
  }

  /**
   * Vuelve al dashboard
   */
  volverAlDashboard(): void {
    if (this.hayDatosParaGuardar()) {
      const confirmacion = confirm('Tienes cambios sin guardar. ¿Deseas guardar antes de salir?');
      if (confirmacion) {
        this.guardarBorrador();
      }
    }
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Vuelve a la lista de noticias
   */
  volverALista(): void {
    this.router.navigate(['/admin/noticias/listar']);
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
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Muestra mensaje informativo
   */
  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  obtenerMensajeError(form: FormGroup, campo: string): string {
    const control = form.get(campo);
    if (control?.hasError('required')) {
      return `${campo} es requerido`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${campo} debe tener al menos ${minLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `${campo} no puede superar ${maxLength} caracteres`;
    }
    return '';
  }

  /**
   * 🔥 NUEVO: Limpia todos los formularios después de guardar exitosamente
   */
  private limpiarFormularios(): void {
    this.form.reset();
    this.informacionForm.reset();
    this.contenidoForm.reset();
    this.configuracionForm.reset();
    
    // Limpiar datos adicionales
    this.tags = [];
    this.imagenDestacada = null;
    this.imagenDestacadaPreview = null;
    this.contenidoHtml = '';
    
    // Resetear estados
    this.cargando = false;
    this.guardandoBorrador = false;
  }

  /**
   * 🔥 NUEVO: Limpia recursos al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.autoguardadoInterval) {
      clearInterval(this.autoguardadoInterval);
    }
  }
}
