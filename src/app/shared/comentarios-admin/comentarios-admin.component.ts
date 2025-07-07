import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ComentariosService, ComentarioDTO } from '../../core/services/comentarios.service';

@Component({
  selector: 'app-comentarios-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="comentarios-admin-container">
      <!-- LISTA DE COMENTARIOS -->
      <div class="comentarios-lista" *ngIf="comentarios.length > 0">
        <div 
          *ngFor="let comentario of comentarios; trackBy: trackByComentario"
          class="comentario-item"
          [@slideInUp]
          [class.comentario-pendiente]="!comentario.aprobado"
          [class.comentario-aprobado]="comentario.aprobado">
          
          <!-- HEADER DEL COMENTARIO -->
          <div class="comentario-header">
            <div class="comentario-autor">
              <mat-icon>person</mat-icon>
              <span class="autor-nombre">{{ comentario.autor }}</span>
              <mat-chip 
                [color]="comentario.aprobado ? 'primary' : 'warn'"
                [highlighted]="true">
                <mat-icon>{{ comentario.aprobado ? 'check_circle' : 'pending' }}</mat-icon>
                {{ comentario.aprobado ? 'Aprobado' : 'Pendiente' }}
              </mat-chip>
            </div>
            
            <!-- ACCIONES DE ADMIN -->
            <div class="comentario-acciones">
              <button 
                mat-icon-button
                *ngIf="!comentario.aprobado"
                (click)="aprobar(comentario)"
                matTooltip="Aprobar comentario"
                color="primary">
                <mat-icon>check</mat-icon>
              </button>
              
              <button 
                mat-icon-button
                (click)="eliminar(comentario)"
                matTooltip="Eliminar comentario"
                color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <!-- CONTENIDO DEL COMENTARIO -->
          <div class="comentario-contenido">
            <p class="comentario-mensaje">{{ comentario.contenido }}</p>
            
            <!-- METADATA -->
            <div class="comentario-metadata">
              <span class="comentario-fecha">
                <mat-icon>schedule</mat-icon>
                {{ formatearFecha(comentario.fechaCreacion) }}
              </span>
              <span class="comentario-id">
                <mat-icon>fingerprint</mat-icon>
                ID: {{ comentario.id }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- MENSAJE CUANDO NO HAY COMENTARIOS -->
      <div class="sin-comentarios" *ngIf="comentarios.length === 0">
        <mat-icon>comment_bank</mat-icon>
        <p>No hay comentarios para mostrar</p>
        <p class="sub-text">Los comentarios aparecerán aquí una vez que se creen</p>
      </div>
    </div>
  `,
  styleUrls: ['./comentarios-admin.component.scss'],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ComentariosAdminComponent {
  @Input() comentarios: ComentarioDTO[] = [];
  @Input() cargando = false;
  
  @Output() comentarioAprobado = new EventEmitter<ComentarioDTO>();
  @Output() comentarioEliminado = new EventEmitter<number>();

  private comentariosService = inject(ComentariosService);
  private snackBar = inject(MatSnackBar);

  aprobar(comentario: ComentarioDTO): void {
    if (comentario.id) {
      this.comentariosService.aprobarComentario(comentario.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.comentarioAprobado.emit(response.data);
            this.snackBar.open('Comentario aprobado exitosamente.', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al aprobar comentario:', error);
          this.snackBar.open('Error al aprobar el comentario.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  eliminar(comentario: ComentarioDTO): void {
    if (comentario.id) {
      this.comentariosService.eliminarComentario(comentario.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.comentarioEliminado.emit(comentario.id);
            this.snackBar.open('Comentario eliminado exitosamente.', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al eliminar comentario:', error);
          this.snackBar.open('Error al eliminar el comentario.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  formatearFecha(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  }

  trackByComentario(index: number, comentario: ComentarioDTO): any {
    return comentario.id || index;
  }
}
