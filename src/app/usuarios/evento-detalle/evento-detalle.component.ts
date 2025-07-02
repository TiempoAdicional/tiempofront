import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Servicios
import { EventosService, Evento } from '../../core/services/eventos.service';

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
    MatSnackBarModule
  ],
  templateUrl: './evento-detalle.component.html',
  styleUrls: ['./evento-detalle.component.scss']
})
export class EventoDetalleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  evento: Evento | null = null;
  cargando = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventosService: EventosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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

    this.eventosService.obtenerPorId(Number(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (evento) => {
          this.evento = evento;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar evento:', error);
          this.cargando = false;
          this.snackBar.open('Error al cargar el evento', 'Cerrar', { duration: 3000 });
        }
      });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/usuarios']);
  }
}
