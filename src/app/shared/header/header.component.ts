import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  activeDropdown: string | null = null;
  activeMobileSection: string | null = null;
  mobileMenuOpen = false;

  estaAutenticado = false;
  nombreUsuario = '';
  private subs: Subscription[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.subs.push(
      this.authService.autenticado$.subscribe(valor => {
        this.estaAutenticado = valor;
      }),
      this.authService.nombre$.subscribe(nombre => {
        this.nombreUsuario = nombre;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  onHoverNav(section: string): void {
    this.activeDropdown = section;
  }

  onLeaveNav(): void {
    this.activeDropdown = null;
  }

  onLogoClick(): void {
    this.router.navigate(['/']);
  }

  onNavClick(section: string, event: Event): void {
    event.preventDefault();
    this.activeDropdown = this.activeDropdown === section ? null : section;
  }

  onSubNavClick(item: string, event: Event): void {
    event.preventDefault();
    this.activeDropdown = null;
    this.closeMobileMenu();
    
    // Navegación específica para cada sección
    switch (item) {
      case 'noticias':
      case 'todas-noticias':
      case 'ultimas-noticias':
        this.router.navigate(['/usuarios/dashboard'], { fragment: 'noticias' });
        break;
      case 'eventos':
      case 'proximos-eventos':
      case 'calendario':
        this.router.navigate(['/usuarios/dashboard'], { fragment: 'eventos' });
        break;
      case 'partidos':
      case 'resultados':
      case 'fixtures':
        this.router.navigate(['/usuarios/dashboard'], { fragment: 'partidos' });
        break;
      case 'liga-colombiana':
      case 'torneo':
        this.router.navigate(['/usuarios/dashboard'], { fragment: 'liga' });
        break;
      case 'equipo':
        this.router.navigate(['/equipo']);
        break;
      default:
        console.log(`Sub navigation clicked: ${item}`);
        break;
    }
  }

  // Métodos específicos para navegación de usuarios
  irANoticias(): void {
    this.router.navigate(['/usuarios/dashboard'], { fragment: 'noticias' });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irAEventos(): void {
    this.router.navigate(['/usuarios/dashboard'], { fragment: 'eventos' });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irAPartidos(): void {
    this.router.navigate(['/usuarios/dashboard'], { fragment: 'partidos' });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irALigaColombiana(): void {
    this.router.navigate(['/usuarios/dashboard'], { fragment: 'liga' });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irAEquipo(): void {
    console.log('🔄 Navegando a página de equipo...');
    this.activeDropdown = null;
    this.closeMobileMenu();
    this.router.navigate(['/equipo']).then(success => {
      if (success) {
        console.log('✅ Navegación a /equipo exitosa');
      } else {
        console.error('❌ Error en navegación a /equipo');
      }
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.activeMobileSection = null;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.activeMobileSection = null;
  }

  toggleMobileSection(section: string): void {
    this.activeMobileSection = this.activeMobileSection === section ? null : section;
  }

  navigateTo(ruta: string, event?: Event): void {
    if (event) event.preventDefault();
    this.router.navigate([`/${ruta}`]);
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.cerrarSesion();
    this.closeMobileMenu();
    this.router.navigate(['/']);
  }
}
