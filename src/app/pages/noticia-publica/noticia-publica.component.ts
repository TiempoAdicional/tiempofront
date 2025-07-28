import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { NoticiasService, Noticia } from '../../core/services/noticias.service';
import { DomSanitizer, SafeHtml, Meta, Title } from '@angular/platform-browser';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-noticia-publica',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './noticia-publica.component.html',
  styleUrls: ['./noticia-publica.component.scss']
})
export class NoticiaPublicaComponent implements OnInit {

  noticia: Noticia | null = null;
  cargando = true;
  error: string | null = null;
  contenidoSanitizado: SafeHtml | null = null;
  urlCompartir: string = '';
  showScrollTop = false;

  // Exponer window para el template
  window = window;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noticiasService: NoticiasService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private meta: Meta,
    private title: Title,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Obtener el ID de la ruta
    const id = this.route.snapshot.params['id'];
    // Si el usuario está autenticado, redirigir a la ruta de usuarios/noticia/:id
    if (this.authService.estaAutenticado() && id) {
      this.router.navigate(['/usuarios/noticia', id]);
      return;
    }
    if (id && !isNaN(Number(id))) {
      this.cargarNoticia(Number(id));
    } else {
      this.error = 'ID de noticia inválido';
      this.cargando = false;
    }

    // Configurar listener para el scroll
    this.configurarScrollListener();
  }

  private configurarScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.showScrollTop = window.pageYOffset > 300;
    });
  }

  private cargarNoticia(id: number): void {
    this.cargando = true;
    this.error = null;

    // Usar el método para obtener la noticia por ID
    this.noticiasService.obtenerPorId(id).subscribe({
      next: (noticia: any) => {
        console.log('🔍 Noticia cargada completa:', noticia);
        console.log('📄 Contenido HTML disponible:', !!noticia.contenidoHtml);
        console.log('📝 Contenido HTML:', noticia.contenidoHtml?.substring(0, 100));
        console.log('🔗 URL de contenido:', noticia.contenidoUrl);

        this.noticia = noticia;

        // Prioridad 1: contenidoHtml directo
        if (noticia.contenidoHtml && noticia.contenidoHtml.trim() !== '') {
          console.log('✅ Usando contenidoHtml directo');
          this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(noticia.contenidoHtml);
          this.finalizarCarga(noticia);
        }
        // Prioridad 2: cargar desde contenidoUrl
        else if (noticia.contenidoUrl) {
          console.log('🔄 Cargando contenido desde URL:', noticia.contenidoUrl);
          this.cargarContenidoDesdeUrl(noticia.contenidoUrl, noticia);
        }
        // Prioridad 3: usar resumen como contenido
        else {
          console.warn('⚠️ No hay contenido disponible, usando resumen');
          this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(
            `<div class="contenido-resumen">
              <p><strong>Resumen:</strong></p>
              <p>${noticia.resumen || 'Contenido no disponible'}</p>
              <p><em>El contenido completo no está disponible en este momento.</em></p>
            </div>`
          );
          this.finalizarCarga(noticia);
        }
      },
      error: (err: any) => {
        console.error('Error cargando noticia:', err);

        if (err.status === 404) {
          this.error = 'Noticia no encontrada';
        } else if (err.status === 403) {
          this.error = 'Esta noticia no está disponible públicamente';
        } else {
          this.error = 'Error al cargar la noticia';
        }

        this.cargando = false;
      }
    });
  }

  private cargarContenidoDesdeUrl(url: string, noticia: any): void {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(contenidoHtml => {
        console.log('✅ Contenido cargado desde URL:', contenidoHtml.substring(0, 100));
        if (contenidoHtml && contenidoHtml.trim() !== '') {
          this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(contenidoHtml);
        } else {
          // Si el contenido está vacío, usar resumen
          this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(
            `<div class="contenido-resumen">
              <p><strong>Resumen:</strong></p>
              <p>${noticia.resumen || 'Contenido no disponible'}</p>
            </div>`
          );
        }
        this.finalizarCarga(noticia);
      })
      .catch(error => {
        console.error('❌ Error cargando contenido desde URL:', error);
        // Fallback: usar resumen
        this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(
          `<div class="contenido-resumen">
            <p><strong>Resumen:</strong></p>
            <p>${noticia.resumen || 'Contenido no disponible'}</p>
            <p><em>No se pudo cargar el contenido completo.</em></p>
          </div>`
        );
        this.finalizarCarga(noticia);
      });
  }

  private finalizarCarga(noticia: any): void {
    // Generar URL simple para compartir
    this.urlCompartir = `${window.location.origin}/noticia/${noticia.id}`;

    // Configurar SEO
    this.configurarSEO(noticia);

    this.cargando = false;
  }

  private configurarSEO(noticia: Noticia): void {
    // Configurar título de la página
    this.title.setTitle(`${noticia.titulo} - Tiempo Adicional`);

    // Configurar meta tags
    this.meta.updateTag({ name: 'description', content: noticia.resumen });
    this.meta.updateTag({ name: 'keywords', content: noticia.tags?.join(', ') || '' });

    // Open Graph meta tags para redes sociales
    this.meta.updateTag({ property: 'og:title', content: noticia.titulo });
    this.meta.updateTag({ property: 'og:description', content: noticia.resumen });
    this.meta.updateTag({ property: 'og:image', content: noticia.imagenDestacada });
    this.meta.updateTag({ property: 'og:url', content: this.urlCompartir });
    this.meta.updateTag({ property: 'og:type', content: 'article' });

    // Twitter Card meta tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: noticia.titulo });
    this.meta.updateTag({ name: 'twitter:description', content: noticia.resumen });
    this.meta.updateTag({ name: 'twitter:image', content: noticia.imagenDestacada });
  }

  compartirNoticia(): void {
    if (!this.noticia) return;

    if (navigator.share) {
      // API nativa de compartir (móviles)
      navigator.share({
        title: this.noticia.titulo,
        text: this.noticia.resumen,
        url: this.urlCompartir
      }).catch(err => console.log('Error compartiendo:', err));
    } else {
      // Fallback: copiar al portapapeles
      this.copiarEnlace();
    }
  }

  copiarEnlace(): void {
    if (!this.urlCompartir) return;

    navigator.clipboard.writeText(this.urlCompartir).then(() => {
      this.mostrarNotificacion('✅ Enlace copiado al portapapeles');
    }).catch(() => {
      this.mostrarNotificacion('❌ Error al copiar enlace');
    });
  }

  compartirEnRedSocial(plataforma: string): void {
    if (!this.noticia) return;

    const titulo = encodeURIComponent(this.noticia.titulo);
    const texto = encodeURIComponent(this.noticia.resumen);
    const url = encodeURIComponent(this.urlCompartir);

    let shareUrl: string;

    switch (plataforma) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${titulo}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${titulo} ${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${titulo}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private mostrarNotificacion(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  
}
