import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventosService, Evento } from '../../../core/services/eventos.service';
import { AuthService } from '../../../auth/services/auth.service'; 
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-listar-eventos',
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class ListarComponent implements OnInit {
  private eventosService = inject(EventosService);
  private snackBar = inject(MatSnackBar);
  eventos: Evento[] = [];
  cargando = false;

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.eventosService.listarTodos().subscribe({
      next: (data) => {
        this.eventos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar eventos', err);
        this.snackBar.open('Error al cargar eventos', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  eliminarEvento(id: number): void {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
      this.eventosService.eliminar(id).subscribe({
        next: () => {
          this.eventos = this.eventos.filter(e => e.id !== id);
          this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error al eliminar evento', err);
          this.snackBar.open('No se pudo eliminar el evento', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}

