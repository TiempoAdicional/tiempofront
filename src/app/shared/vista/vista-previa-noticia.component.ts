import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vista-previa-noticia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vista-previa-noticia.component.html',
  styleUrls: ['./vista-previa-noticia.component.scss']
})
export class VistaPreviaNoticiaComponent implements OnChanges {
  @Input() titulo: string = '';
  @Input() resumen: string = '';
  @Input() contenidoHtml: string = '';
  @Input() imagenDestacadaUrl: string | null = null;
  @Input() mostrarImagen: boolean = true;

  @Output() cerrar = new EventEmitter<void>();

  mostrar: boolean = true;
  expandida: boolean = false;

  modoDispositivo: 'movil' | 'tablet' | 'portatil' | 'escritorio' = 'escritorio';

  dispositivos: Array<'movil' | 'tablet' | 'portatil' | 'escritorio'> = [
    'movil',
    'tablet',
    'portatil',
    'escritorio'
  ];

  contenidoSeguro: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contenidoHtml']) {
      this.contenidoSeguro = this.sanitizer.bypassSecurityTrustHtml(this.contenidoHtml || '');
    }
  }

  toggleVista(): void {
    this.mostrar = false;
    this.cerrar.emit(); // 🔔 Notifica al padre que fue cerrada
  }

  toggleExpandir(): void {
    this.expandida = !this.expandida;
  }

  obtenerContenidoSeguro(): SafeHtml {
    return this.contenidoSeguro;
  }
}
