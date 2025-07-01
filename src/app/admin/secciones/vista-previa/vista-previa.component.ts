import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeccionesService, VistaPreviaPeriodicoResponse, SeccionConContenidoResponse } from '../../../core/services/secciones.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-vista-previa',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './vista-previa.component.html',
  styleUrls: ['./vista-previa.component.scss']
})
export class VistaPreviaComponent implements OnInit {
  
  vistaPreviaData: VistaPreviaPeriodicoResponse | null = null;
  cargando = true;
  error: string | null = null;

  constructor(private seccionesService: SeccionesService) {}

  ngOnInit(): void {
    this.cargarVistaPreviaCompleta();
  }

  cargarVistaPreviaCompleta(): void {
    this.cargando = true;
    this.error = null;

    this.seccionesService.obtenerVistaPreviaPeriodicoCompleto().subscribe({
      next: (data: VistaPreviaPeriodicoResponse) => {
        this.vistaPreviaData = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar vista previa:', err);
        this.error = 'Error al cargar la vista previa del periódico';
        this.cargando = false;
      }
    });
  }

  getIconoTipoContenido(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIA': return 'article';
      case 'EVENTO': return 'event';
      case 'PARTIDO': return 'sports_soccer';
      default: return 'help_outline';
    }
  }

  getColorTipoContenido(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIA': return 'primary';
      case 'EVENTO': return 'accent';
      case 'PARTIDO': return 'warn';
      default: return '';
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  recargarVista(): void {
    this.cargarVistaPreviaCompleta();
  }

  // Métodos auxiliares para el template
  getTotalContenido(): number {
    if (!this.vistaPreviaData) return 0;
    return this.vistaPreviaData.secciones.reduce((total: number, seccion: SeccionConContenidoResponse) => 
      total + seccion.contenido.length, 0
    );
  }

  getIconoTipoSeccion(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIAS': return 'article';
      case 'EVENTOS': return 'event';
      case 'PARTIDOS': return 'sports_soccer';
      default: return 'view_module';
    }
  }

  getColorTipoSeccion(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIAS': return 'primary';
      case 'EVENTOS': return 'accent';
      case 'PARTIDOS': return 'warn';
      default: return '';
    }
  }

  getTipoContenidoNombre(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIAS': return 'Noticia';
      case 'EVENTOS': return 'Evento';
      case 'PARTIDOS': return 'Partido';
      default: return 'Contenido';
    }
  }

  getCrearLink(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NOTICIAS': return '/admin/noticias/crear';
      case 'EVENTOS': return '/admin/eventos/crear';
      case 'PARTIDOS': return '/admin/eventos/partidos'; // Asumiendo que hay creación de partidos aquí
      default: return '/admin';
    }
  }

  // TrackBy functions para mejor rendimiento
  trackBySeccionId(index: number, seccion: SeccionConContenidoResponse): number {
    return seccion.seccion.id;
  }

  trackByContenidoId(index: number, contenido: any): number {
    return contenido.id;
  }
}
