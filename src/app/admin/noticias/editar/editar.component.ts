import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router,RouterModule,ActivatedRoute } from '@angular/router'; //
import { NoticiaService } from '../noticia.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { EditorModule } from '@tinymce/tinymce-angular';
import { VistaPreviaNoticiaComponent } from '../../../shared/vista/vista-previa-noticia.component';
import { environment } from '../../../../environment/environment';
@Component({
  selector: 'app-editar-noticia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EditorModule, VistaPreviaNoticiaComponent,RouterModule],
  templateUrl: './editar.component.html',
  styleUrls: ['./editar.component.scss']
})
export class EditarComponent implements OnInit {
  form!: FormGroup;
  imagenDestacada: File | null = null;
  imagenDestacadaPreview: string | null = null;
  noticias: any[] = [];
  filtro: string = '';
  noticiasFiltradas: any[] = [];
  noticiaSeleccionadaId: number | null = null;
  cargando = false;
  imagenDestacadaUrl: string | null = null;
  contenidoHtml: string = '';
  mostrarVistaPrevia: boolean = true;

  public editorConfig: any = {
  height: 500,
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount','imagetools', 'imagecaption'
  ],
  toolbar:
    'undo redo | formatselect | bold italic backcolor | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist outdent indent | removeformat | help | image media',
  image_title: true,
  automatic_uploads: true,
  file_picker_types: 'image',
  file_picker_callback: (cb: any) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.onchange = function () {
      const file = (this as HTMLInputElement).files![0];
      const reader = new FileReader();
      reader.onload = () => {
        const id = 'blobid' + new Date().getTime();
        const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result!.toString().split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);
        cb(blobInfo.blobUri(), { title: file.name });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  },
  style_formats: [
    {
      title: '📷 Imagen a la izquierda',
      selector: 'img',
      styles: {
        float: 'left',
        margin: '0 15px 15px 0',
        width: '45%'
      }
    },
    {
      title: '📷 Imagen a la derecha',
      selector: 'img',
      styles: {
        float: 'right',
        margin: '0 0 15px 15px',
        width: '45%'
      }
    },
    {
      title: '📷 Imagen centrada',
      selector: 'img',
      styles: {
        display: 'block',
        margin: '0 auto',
        width: '60%'
      }
    }
  ],
  ai_request: (_request: any, respondWith: any) =>
    respondWith.string(() => Promise.reject('AI Assistant deshabilitado'))
};

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private noticiaService = inject(NoticiaService);
  private authService = inject(AuthService);
  public tinyApiKey = environment.tinyApiKey;
  private route = inject(ActivatedRoute);

  

  ngOnInit(): void {
  this.form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: ['', Validators.required],
    contenidoHtml: ['', Validators.required],
    esPublica: [false]
  });

  this.form.get('contenidoHtml')?.valueChanges.subscribe(value => {
    this.contenidoHtml = value;
  });

  // ✅ Si viene ID desde ruta, carga esa noticia
  const noticiaId = Number(this.route.snapshot.paramMap.get('id'));
  if (noticiaId) {
    this.noticiaSeleccionadaId = noticiaId;
    this.cargarNoticiaDesdeId(noticiaId);
  } else {
    this.listarNoticiasDelAutor();
  }
}

cargarNoticiaDesdeId(id: number): void {
  this.cargando = true;
  this.noticiaService.obtenerPorId(id).subscribe({
    next: (noticia) => {
      this.imagenDestacadaPreview = noticia.imagenDestacada || null;

      fetch(noticia.contenidoUrl)
        .then(resp => resp.text())
        .then(htmlContent => {
          this.form.patchValue({
            titulo: noticia.titulo,
            resumen: noticia.resumen,
            contenidoHtml: htmlContent,
            esPublica: noticia.esPublica
          });

          this.contenidoHtml = htmlContent;
          this.cargando = false;
        })
        .catch(err => {
          console.error('❌ Error al cargar contenido externo:', err);
          this.cargando = false;
        });
    },
    error: (err) => {
      console.error('❌ Error al obtener noticia por ID:', err);
      this.cargando = false;
    }
  });
}

  filtrarNoticias(): void {
    const texto = this.filtro.toLowerCase();
    this.noticiasFiltradas = this.noticias.filter(n =>
      n.titulo.toLowerCase().includes(texto)
    );
  }

  listarNoticiasDelAutor(): void {
    const autorId = this.authService.obtenerIdUsuario();
    if (autorId === null) return;

    this.cargando = true;
    this.noticiaService.listarPorAutor(autorId).subscribe({
      next: noticias => {
        this.noticias = noticias;
        this.noticiasFiltradas = noticias;
        this.cargando = false;
      },
      error: err => {
        console.error('❌ Error al cargar noticias del autor:', err);
        this.cargando = false;
      }
    });
  }

  seleccionarNoticia(noticia: any): void {
    this.noticiaSeleccionadaId = noticia.id;
    this.imagenDestacadaPreview = noticia.imagenDestacada || null;

    fetch(noticia.contenidoUrl)
      .then(resp => resp.text())
      .then(htmlContent => {
        this.form.patchValue({
          titulo: noticia.titulo,
          resumen: noticia.resumen,
          contenidoHtml: htmlContent,
          esPublica: noticia.esPublica
        });

        setTimeout(() => {
          document.getElementById('formulario-edicion')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      })
      .catch(err => {
        console.error('❌ Error al cargar el HTML externo:', err);
        alert('Error al cargar el contenido de la noticia.');
      });
  }

  onArchivoSeleccionado(event: Event) {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (archivo) {
      this.imagenDestacada = archivo;

      const lector = new FileReader();
      lector.onload = (e: any) => {
        this.imagenDestacadaPreview = e.target.result;
      };
      lector.readAsDataURL(archivo);
    }
  }

  onSubmit() {
    if (this.form.invalid || this.noticiaSeleccionadaId === null) {
      alert('❌ Selecciona una noticia válida antes de actualizar.');
      return;
    }

    const formValue = this.form.value;
    const formData = new FormData();

    formData.append('titulo', formValue.titulo);
    formData.append('resumen', formValue.resumen);
    formData.append('contenidoHtml', String(formValue.contenidoHtml));
    formData.append('esPublica', String(formValue.esPublica));

    if (this.imagenDestacada) {
      formData.append('imagen', this.imagenDestacada);
    }

    this.noticiaService.actualizarNoticia(this.noticiaSeleccionadaId, formData).subscribe({
      next: () => {
        alert('✅ Noticia actualizada correctamente.');
        this.form.reset();
        this.noticiaSeleccionadaId = null;
        this.imagenDestacada = null;
        this.imagenDestacadaPreview = null;
        this.listarNoticiasDelAutor();
      },
      error: err => {
        console.error('❌ Error al actualizar noticia:', err);
        alert('❌ Error al actualizar la noticia.');
      }
    });
  }
}
