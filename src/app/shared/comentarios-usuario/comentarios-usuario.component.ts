import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { ComentarioDTO } from '../../core/services/comentarios.service';

@Component({
  selector: 'app-comentarios-usuario',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="comentarios-usuario-container">
      <h3 class="comentarios-titulo" *ngIf="comentariosAprobados.length > 0">
        <mat-icon>comment</mat-icon>
        Comentarios ({{ comentariosAprobados.length }})
      </h3>
      
      <!-- LISTA DE COMENTARIOS APROBADOS -->
      <div class="comentarios-lista" *ngIf="comentariosAprobados.length > 0">
        <div 
          *ngFor="let comentario of comentariosAprobados; trackBy: trackByComentario"
          class="comentario-item"
          [@slideInUp]>
          
          <!-- HEADER DEL COMENTARIO -->
          <div class="comentario-header">
            <div class="comentario-autor">
              <mat-icon>person</mat-icon>
              <span class="autor-nombre">{{ comentario.autor }}</span>
              <mat-chip color="primary" [highlighted]="true">
                <mat-icon>check_circle</mat-icon>
                Verificado
              </mat-chip>
            </div>
            
            <div class="comentario-fecha">
              <mat-icon>schedule</mat-icon>
              {{ formatearFecha(comentario.fechaCreacion) }}
            </div>
          </div>
          
          <!-- CONTENIDO DEL COMENTARIO -->
          <div class="comentario-contenido">
            <p class="comentario-mensaje">{{ comentario.contenido }}</p>
          </div>
          
          <mat-divider *ngIf="!isLast(comentario)"></mat-divider>
        </div>
      </div>

      <!-- MENSAJE CUANDO NO HAY COMENTARIOS -->
      <div class="sin-comentarios" *ngIf="comentariosAprobados.length === 0">
        <mat-icon>comment_bank</mat-icon>
        <p>No hay comentarios para mostrar</p>
        <p class="sub-text">¡Sé el primero en comentar!</p>
      </div>
    </div>
  `,
  styleUrls: ['./comentarios-usuario.component.scss'],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ComentariosUsuarioComponent {
  @Input() comentarios: ComentarioDTO[] = [];

  get comentariosAprobados(): ComentarioDTO[] {
    return this.comentarios.filter(c => c.aprobado === true);
  }

  formatearFecha(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return fechaString;
    }
  }

  trackByComentario(index: number, comentario: ComentarioDTO): any {
    return comentario.id || index;
  }

  isLast(comentario: ComentarioDTO): boolean {
    const index = this.comentariosAprobados.findIndex(c => c.id === comentario.id);
    return index === this.comentariosAprobados.length - 1;
  }
}
