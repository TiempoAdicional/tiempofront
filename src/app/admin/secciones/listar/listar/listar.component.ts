import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { SeccionesService, SeccionResponse } from '../../services/secciones.service';

@Component({
  selector: 'app-listar-secciones',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit {
  private seccionesService = inject(SeccionesService);
  private snackBar = inject(MatSnackBar);

  secciones: SeccionResponse[] = [];
  cargando = false;

  ngOnInit(): void {
    this.cargarSecciones();
  }

  cargarSecciones(): void {
    this.cargando = true;
    this.seccionesService.listar().subscribe({
      next: (secciones) => {
        this.secciones = secciones.sort((a, b) => a.orden - b.orden);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar secciones:', error);
        this.snackBar.open('Error al cargar las secciones', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  onDrop(event: CdkDragDrop<SeccionResponse[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.secciones, event.previousIndex, event.currentIndex);
      
      // Actualizar el orden de todas las secciones
      const seccionesReordenadas = this.secciones.map((seccion, index) => ({
        id: seccion.id,
        orden: index + 1
      }));

      this.seccionesService.reordenar(seccionesReordenadas).subscribe({
        next: () => {
          this.snackBar.open('Orden actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarSecciones(); // Recargar para sincronizar
        },
        error: (error) => {
          console.error('Error al reordenar:', error);
          this.snackBar.open('Error al actualizar el orden', 'Cerrar', { duration: 3000 });
          this.cargarSecciones(); // Revertir cambios
        }
      });
    }
  }

  cambiarEstadoSeccion(seccion: SeccionResponse): void {
    this.seccionesService.cambiarEstado(seccion.id, !seccion.activa).subscribe({
      next: (seccionActualizada) => {
        const index = this.secciones.findIndex(s => s.id === seccion.id);
        if (index !== -1) {
          this.secciones[index] = seccionActualizada;
        }
        const estado = seccionActualizada.activa ? 'activada' : 'desactivada';
        this.snackBar.open(`Sección ${estado} correctamente`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.snackBar.open('Error al cambiar el estado de la sección', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarSeccion(seccion: SeccionResponse): void {
    if (confirm(`¿Estás seguro de eliminar la sección "${seccion.titulo}"?`)) {
      this.seccionesService.eliminar(seccion.id).subscribe({
        next: () => {
          this.secciones = this.secciones.filter(s => s.id !== seccion.id);
          this.snackBar.open('Sección eliminada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.snackBar.open('Error al eliminar la sección', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'NOTICIAS': return 'article';
      case 'EVENTOS': return 'event';
      case 'PARTIDOS': return 'sports_soccer';
      default: return 'info';
    }
  }

  getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'NOTICIAS': return 'primary';
      case 'EVENTOS': return 'accent';
      case 'PARTIDOS': return 'warn';
      default: return 'primary';
    }
  }

  trackBySeccionId(index: number, seccion: SeccionResponse): number {
    return seccion.id;
  }
}
