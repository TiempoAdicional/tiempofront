import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
 nombreEditor = '';
  noticiasExpandido = false;
  eventosExpandido = false; // ✅ Agregado

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.nombreEditor = this.authService.obtenerNombre() || 'Admin';
  }

  toggleNoticias(): void {
    this.noticiasExpandido = !this.noticiasExpandido;
  }

  toggleEventos(): void {
    this.eventosExpandido = !this.eventosExpandido;
  }

  navegar(ruta: string): void {
    this.router.navigate([ruta]);
  }
}


