import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SeccionRequest } from '../../services/secciones.service';

@Component({
  selector: 'app-crear-editar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './crear-editar.component.html',
  styleUrl: './crear-editar.component.scss'
})
export class CrearEditarComponent {
  seccion: SeccionRequest = {
    titulo: '',
    tipo: 'NOTICIAS',
    orden: 1
  };

  seccionesPreview: SeccionRequest[] = [];

  tipos = [
    { value: 'NOTICIAS', label: '📰 Noticias' },
    { value: 'EVENTOS', label: '🎉 Eventos' },
    { value: 'PARTIDOS', label: '⚽ Partidos' }
  ];

  crearSeccion() {
    // Simula la creación de una sección y actualiza la vista previa
    this.seccionesPreview.push({ ...this.seccion });
    this.seccionesPreview.sort((a, b) => a.orden - b.orden);

    // Limpiar el formulario
    this.seccion = {
      titulo: '',
      tipo: 'NOTICIAS',
      orden: this.seccionesPreview.length + 1
    };
  }
} 
