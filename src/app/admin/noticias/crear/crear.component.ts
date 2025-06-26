import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NoticiaService } from '../noticia.service';
import { Router,RouterModule } from '@angular/router'; //
import { AuthService } from '../../../auth/services/auth.service';
import { EditorModule } from '@tinymce/tinymce-angular';
import { VistaPreviaNoticiaComponent } from '../../../shared/vista/vista-previa-noticia.component';
import { environment } from '../../../../environment/environment';
@Component({
  selector: 'app-crear-noticia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EditorModule,
    VistaPreviaNoticiaComponent,RouterModule
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearNoticiaComponent {
  form!: FormGroup;
  imagenDestacada: File | null = null;
  imagenDestacadaPreview: string | null = null;
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
  private noticiaService = inject(NoticiaService);
  private authService = inject(AuthService);
  public tinyApiKey = environment.tinyApiKey;
   private router = inject(Router); 


  constructor() {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      resumen: ['', Validators.required],
      contenidoHtml: ['', Validators.required],
      esPublica: [false, Validators.required],
      imagen: [null]
    });

    this.form.get('contenidoHtml')?.valueChanges.subscribe(value => {
      this.contenidoHtml = value;
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
    } else {
      this.imagenDestacada = null;
      this.imagenDestacadaPreview = null;
    }
  }

  onSubmit() {
    const autorId = this.authService.obtenerIdUsuario();

    if (this.form.valid && autorId !== null) {
      const formValue = this.form.value;
      const formData = new FormData();

      formData.append('titulo', formValue.titulo);
      formData.append('resumen', formValue.resumen);
      formData.append('contenidoHtml', formValue.contenidoHtml);
      formData.append('esPublica', String(formValue.esPublica));
      formData.append('autorId', autorId.toString());

      if (this.imagenDestacada) {
        formData.append('imagen', this.imagenDestacada);
      }

      this.noticiaService.crearNoticia(formData, autorId!).subscribe({
        next: () => {
          alert('✅ Noticia creada correctamente.');
          this.form.reset();
          this.imagenDestacada = null;
          this.imagenDestacadaPreview = null;
        },
        error: (err) => {
          console.error('❌ Error al crear noticia:', err);
          alert('❌ Error al crear la noticia.');
        }
      });
    } else {
      alert('❗Formulario inválido o autor no autenticado.');
    }
  }
}
