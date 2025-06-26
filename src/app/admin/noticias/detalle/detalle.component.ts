import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NoticiaService, NoticiaDetalleDTO } from '../noticia.service';

@Component({
  selector: 'app-detalle-noticia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss']
})
export class DetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private noticiaService = inject(NoticiaService);

  detalle: NoticiaDetalleDTO | null = null;
  contenidoHtml: string = '';
  cargando = true;
  error: string | null = null;

  ngOnInit(): void {
    const noticiaId = Number(this.route.snapshot.paramMap.get('id'));
    if (!noticiaId || isNaN(noticiaId)) {
      this.error = 'ID de noticia no válido';
      this.cargando = false;
      return;
    }

    this.noticiaService.verDetalleConComentarios(noticiaId).subscribe({
      next: (data) => {
        this.detalle = data;
        this.cargarContenidoHtml(data.noticia.contenidoUrl);
      },
      error: (err) => {
        console.error('❌ Error al cargar detalle de noticia:', err);
        this.error = 'No se pudo cargar la noticia.';
        this.cargando = false;
      }
    });
  }

  cargarContenidoHtml(url: string): void {
    fetch(url)
      .then(resp => resp.text())
      .then(html => {
        this.contenidoHtml = html;
        this.cargando = false;
      })
      .catch(err => {
        console.error('❌ Error al cargar el contenido HTML:', err);
        this.error = 'No se pudo cargar el contenido.';
        this.cargando = false;
      });
  }
}
