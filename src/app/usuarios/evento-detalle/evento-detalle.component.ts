import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml, Meta, Title } from '@angular/platform-browser';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Servicios
import { EventosService, Evento } from '../../core/services/eventos.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-evento-detalle',
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
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './evento-detalle.component.html',
  styleUrls: ['./evento-detalle.component.scss']
})
export class EventoDetalleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  evento: Evento | null = null;
  cargando = true;
  estaAutenticado = false;
  urlCompartir: string = '';
  descripcionSanitizada: SafeHtml | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventosService: EventosService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.estaAutenticado = this.authService.estaAutenticado();
    this.urlCompartir = window.location.href;
    this.cargarEvento();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarEvento(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.cargando = false;
      return;
    }

    // Usar método según estado de autenticación
    const observable = this.estaAutenticado 
      ? this.eventosService.obtenerPorId(Number(id))
      : this.eventosService.obtenerDetallePublico(Number(id));

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (evento) => {
          console.log('📅 Evento cargado completo:', evento);
          console.log('� Todos los campos disponibles:', Object.keys(evento));
          console.log('📅 Fecha raw:', evento.fecha);
          console.log('📅 Fecha parseada:', new Date(evento.fecha));
          console.log('�📝 Descripción disponible:', !!evento.descripcion);
          console.log('🖼️ Imagen disponible:', !!evento.imagenEvento);
          console.log('📹 Video disponible:', !!evento.videoUrl);
          console.log('🏟️ Lugar:', evento.lugar);
          console.log('� ¿Hay equipos?:', (evento as any).equipoLocal || (evento as any).equipoVisitante);
          
          this.evento = evento;
          this.cargando = false;
          
          // Sanitizar contenido HTML si existe
          if (evento.descripcion) {
            this.descripcionSanitizada = this.sanitizer.bypassSecurityTrustHtml(evento.descripcion);
          }
          
          // Configurar SEO para redes sociales
          this.configurarSEO(evento);
          
          console.log('✅ Evento cargado correctamente para usuario', this.estaAutenticado ? 'autenticado' : 'público');
        },
        error: (error) => {
          console.error('Error al cargar evento:', error);
          this.cargando = false;
          
          // ✅ Mensaje genérico - no mencionar registro
          this.snackBar.open('Error al cargar el evento', 'Cerrar', { duration: 5000 });
          
          // Redirigir al dashboard si hay error
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 2000);
        }
      });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/usuarios']);
  }

  // ========== MÉTODOS DE SEO Y COMPARTIR ==========

  private configurarSEO(evento: Evento): void {
    // Configurar título de la página
    this.title.setTitle(`${evento.nombre} - Tiempo Adicional`);
    
    // Configurar meta tags
    this.meta.updateTag({ name: 'description', content: evento.descripcion || '' });
    
    // Open Graph meta tags para redes sociales
    this.meta.updateTag({ property: 'og:title', content: evento.nombre });
    this.meta.updateTag({ property: 'og:description', content: evento.descripcion || '' });
    this.meta.updateTag({ property: 'og:image', content: evento.imagenEvento || '/assets/logo-tiempo.png' });
    this.meta.updateTag({ property: 'og:url', content: this.urlCompartir });
    this.meta.updateTag({ property: 'og:type', content: 'event' });
    
    // Twitter Card meta tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: evento.nombre });
    this.meta.updateTag({ name: 'twitter:description', content: evento.descripcion || '' });
    this.meta.updateTag({ name: 'twitter:image', content: evento.imagenEvento || '/assets/logo-tiempo.png' });
  }

  compartirEvento(): void {
    if (!this.evento) return;
    
    if (navigator.share) {
      // API nativa de compartir (móviles)
      navigator.share({
        title: this.evento.nombre,
        text: this.evento.descripcion || '',
        url: this.urlCompartir
      }).catch(err => console.log('Error compartiendo:', err));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(this.urlCompartir).then(() => {
        this.mostrarNotificacion('✅ Enlace copiado al portapapeles');
      }).catch(() => {
        this.mostrarNotificacion('❌ Error al copiar enlace');
      });
    }
  }

  compartirEnRedSocial(plataforma: string): void {
    if (!this.evento) return;

    const titulo = encodeURIComponent(this.evento.nombre);
    const texto = encodeURIComponent(this.evento.descripcion || '');
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

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Extrae la hora del campo hora o fecha cuando viene en formato datetime
   */
  extraerHora(fechaDateTime: string, hora?: string): string {
    // Si tenemos el campo hora separado (formato HH:mm:ss), usarlo directamente
    if (hora) {
      try {
        // Extraer solo HH:mm de HH:mm:ss
        return hora.substring(0, 5);
      } catch (error) {
        console.error('Error al procesar hora:', error);
      }
    }
    
    if (!fechaDateTime) return 'Hora no especificada';
    
    try {
      // Si la fecha viene en formato ISO completo (YYYY-MM-DD HH:mm:ss)
      if (fechaDateTime.includes(' ')) {
        const partes = fechaDateTime.split(' ');
        if (partes.length > 1) {
          const horaCompleta = partes[1];
          // Extraer solo HH:mm de HH:mm:ss
          return horaCompleta.substring(0, 5);
        }
      }
      
      // Si viene en formato ISO con T (YYYY-MM-DDTHH:mm:ss)
      if (fechaDateTime.includes('T')) {
        // Extraer la hora directamente sin conversión de zona horaria
        const horaIso = fechaDateTime.split('T')[1];
        if (horaIso) {
          return horaIso.substring(0, 5); // Solo HH:mm
        }
      }
      
      return 'Hora no disponible';
    } catch (error) {
      console.error('Error al extraer hora:', error);
      return 'Error en hora';
    }
  }

  /**
   * Obtiene solo la fecha sin hora
   */
  extraerFecha(fechaDateTime: string): string {
    if (!fechaDateTime) return '';
    
    try {
      // Si la fecha viene en formato ISO completo (YYYY-MM-DD HH:mm:ss)
      if (fechaDateTime.includes(' ')) {
        const partes = fechaDateTime.split(' ');
        return partes[0];
      }
      
      // Si viene en formato ISO con T
      if (fechaDateTime.includes('T')) {
        return fechaDateTime.split('T')[0];
      }
      
      return fechaDateTime;
    } catch (error) {
      console.error('Error al extraer fecha:', error);
      return fechaDateTime;
    }
  }

  private mostrarNotificacion(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
