import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(private router: Router, private authService: AuthService) { }

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
    if (this.estaAutenticado) {
      this.router.navigate(['/usuarios']);
    } else {
      this.router.navigate(['/dashboard']);
    }

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
      case 'nuestra-historia':
        this.router.navigate(['/historia']);
        break;
      case 'noticias':
      case 'todas-noticias':
      case 'ultimas-noticias':
        this.irATodasLasNoticias();
        break;
      case 'eventos':
      case 'proximos-eventos':
      case 'calendario':
        this.router.navigate(['/usuarios/dashboard'], { fragment: 'eventos' });
        break;
      case 'partidos':

        this.router.navigate(['/partidos']);
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
    console.log('🔄 [HEADER] irANoticias() llamado');
    this.irATodasLasNoticias();
  }

  irAEventos(): void {
    console.log('🔄 [HEADER] irAEventos() llamado');
    this.router.navigate(['/usuarios/dashboard'], { fragment: 'eventos' });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irAPartidos(): void {
    console.log('🔄 Navegando a /partidos/hoy (autenticado o no)');
    this.router.navigate(['/partidos']);
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

  // ===============================
  // 📰 MÉTODOS ESPECÍFICOS PARA NOTICIAS
  // ===============================

  irANoticiasRecientes(): void {
    console.log('🔄 Navegando a noticias recientes...');
    console.log('🔍 Estado autenticado:', this.estaAutenticado);

    // Por ahora, siempre usar la ruta pública para debuggear
    const rutaBase = '/noticias';
    console.log('🛣️ Navegando a ruta:', rutaBase, 'con queryParams:', { tipo: 'recientes', limite: 10 });

    this.router.navigate([rutaBase], {
      queryParams: {
        tipo: 'recientes',
        limite: 10
      }
    }).then(success => {
      console.log('✅ Navegación exitosa:', success);
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irANoticiasDestacadas(): void {
    console.log('🔄 Navegando a noticias destacadas...');
    console.log('🔍 Estado autenticado:', this.estaAutenticado);

    // Por ahora, siempre usar la ruta pública para debuggear
    const rutaBase = '/noticias';
    console.log('🛣️ Navegando a ruta:', rutaBase, 'con queryParams:', { tipo: 'destacadas' });

    this.router.navigate([rutaBase], {
      queryParams: {
        tipo: 'destacadas'
      }
    }).then(success => {
      console.log('✅ Navegación exitosa:', success);
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  irATodasLasNoticias(): void {
    console.log('🔄 Navegando a todas las noticias...');
    console.log('🔍 Estado autenticado:', this.estaAutenticado);

    // Por ahora, siempre usar la ruta pública para debuggear
    const rutaBase = '/noticias';
    console.log('🛣️ Navegando a ruta:', rutaBase, 'con queryParams:', { tipo: 'todas', limite: 20 });

    this.router.navigate([rutaBase], {
      queryParams: {
        tipo: 'todas',
        limite: 20
      }
    }).then(success => {
      console.log('✅ Navegación exitosa:', success);
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
    this.activeDropdown = null;
    this.closeMobileMenu();
  }

  // ===============================
  // 🏆 MÉTODOS ESPECÍFICOS PARA EVENTOS
  // ===============================

  irAEventosProximos(): void {
    console.log('🔄 Navegando a eventos próximos...');
    this.router.navigate(['/usuarios/dashboard'], {
      queryParams: {
        seccion: 'eventos',
        filtro: 'proximos',
        limite: 10
      }
    });
    this.activeDropdown = null;
    this.closeMobileMenu();
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
