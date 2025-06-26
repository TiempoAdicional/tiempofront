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
    console.log(`Sub navigation clicked: ${item}`);
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
