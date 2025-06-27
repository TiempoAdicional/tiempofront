import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartidoService, Partido } from '../partido.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-partidos-hoy',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './partidos-hoy.component.html',
  styleUrls: ['./partidos-hoy.component.scss']
})
export class PartidosHoyComponent implements OnInit {
  partidos: Partido[] = [];
  cargando = true;
  nombre: string = '';

  constructor(private partidoService: PartidoService) {}

  ngOnInit(): void {
    this.obtenerPartidos();
  }

  obtenerPartidos(): void {
    this.cargando = true;
    this.partidoService.obtenerPartidosHoy().subscribe(partidos => {
      this.partidos = partidos;
      this.cargando = false;
    });
  }

  buscarPorNombre(): void {
    if (!this.nombre.trim()) {
      this.obtenerPartidos();
      return;
    }

    this.cargando = true;
    this.partidoService.buscarPorNombre(this.nombre).subscribe(partidos => {
      this.partidos = partidos;
      this.cargando = false;
    });
  }

  esGanador(partido: Partido, tipo: 'local' | 'visitante'): boolean {
    const gLocal = partido.golesLocal ?? -1;
    const gVisitante = partido.golesVisitante ?? -1;

    if (gLocal === -1 || gVisitante === -1 || gLocal === gVisitante) {
      return false;
    }

    return tipo === 'local' ? gLocal > gVisitante : gVisitante > gLocal;
  }
}
