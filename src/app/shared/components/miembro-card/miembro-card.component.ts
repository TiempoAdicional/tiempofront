import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

import { MiembroEquipo } from '../../../core/services/equipo.service';

@Component({
  selector: 'app-miembro-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './miembro-card.component.html',
  styleUrls: ['./miembro-card.component.scss']
})
export class MiembroCardComponent {
  @Input() miembro!: MiembroEquipo;
  @Input() mostrarEstadisticas: boolean = true;
  @Input() mostrarAcciones: boolean = false;
  @Input() esAdmin: boolean = false;
  @Input() vista: 'card' | 'list' = 'card';

  @Output() editar = new EventEmitter<number>();
  @Output() cambiarEstado = new EventEmitter<{id: number, activo: boolean}>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() verEstadisticas = new EventEmitter<number>();

  get nombreCompleto(): string {
    return `${this.miembro.nombre} ${this.miembro.apellido}`;
  }

  get totalPublicaciones(): number {
    return (this.miembro.totalNoticias || 0) + (this.miembro.totalEventos || 0);
  }

  get imagenFallback(): string {
    return '/assets/user.png';
  }

  onImagenError(event: any): void {
    event.target.src = this.imagenFallback;
  }

  onEditar(): void {
    this.editar.emit(this.miembro.id);
  }

  onCambiarEstado(): void {
    this.cambiarEstado.emit({
      id: this.miembro.id,
      activo: !this.miembro.activo
    });
  }

  onEliminar(): void {
    if (confirm(`¿Estás seguro de eliminar a ${this.nombreCompleto}?`)) {
      this.eliminar.emit(this.miembro.id);
    }
  }

  onVerEstadisticas(): void {
    this.verEstadisticas.emit(this.miembro.id);
  }
}
