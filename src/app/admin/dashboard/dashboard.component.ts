import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  nombreEditor: string = '';
  noticiasExpandido: boolean = false;
  eventosExpandido: boolean = false;
  seccionesExpandido: boolean = false;

  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    try {
      const nombre = this.authService.obtenerNombre();
      if (nombre) {
        this.nombreEditor = nombre;
      } else {
        this.nombreEditor = 'Administrador';
      }
    } catch (err) {
      this.error = 'Error al obtener el nombre del editor.';
    } finally {
      setTimeout(() => {
        this.isLoading = false;
      }, 800); // Simulación de carga
    }
  }

  toggleNoticias(): void {
    this.noticiasExpandido = !this.noticiasExpandido;
    if (this.eventosExpandido) this.eventosExpandido = false;
  }

  toggleEventos(): void {
    this.eventosExpandido = !this.eventosExpandido;
    if (this.noticiasExpandido) this.noticiasExpandido = false;
  }


  toggleSecciones():void {
    this.seccionesExpandido = !this.seccionesExpandido;
    if (this.seccionesExpandido) this.seccionesExpandido = false;
  }


  navegar(ruta: string): void {
    this.router.navigate([ruta]);
  }

  cerrarSesion(): void {
    const confirmado = window.confirm('¿Estás seguro de cerrar sesión?');
    if (confirmado) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
