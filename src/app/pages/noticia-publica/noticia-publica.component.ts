import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
    private title: Title
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la ruta
    const id = this.route.snapshot.params['id'];
    
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
        this.noticia = noticia;
        this.contenidoSanitizado = this.sanitizer.bypassSecurityTrustHtml(noticia.contenidoHtml);
        
        // Generar URL simple para compartir
        this.urlCompartir = `${window.location.origin}/noticia/${noticia.id}`;
        
        // Configurar SEO
        this.configurarSEO(noticia);
        
        this.cargando = false;
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

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
