import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';

// Servicios y componentes
import { EquipoService, MiembroEquipo } from '../../core/services/equipo.service';
import { MiembroCardComponent } from '../../shared/components/miembro-card/miembro-card.component';

@Component({
  selector: 'app-equipo-publico',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatBadgeModule,
    MiembroCardComponent
  ],
  templateUrl: './equipo-publico.component.html',
  styleUrls: ['./equipo-publico.component.scss']
})
export class EquipoPublicoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  miembros: MiembroEquipo[] = [];
  miembrosFiltrados: MiembroEquipo[] = [];
  rolesDisponibles: string[] = [];
  
  // Estados de la UI
  cargando = true;
  error = false;
  
  // Filtros
  textoBusqueda = '';
  rolSeleccionado = '';
  
  // Vista
  mostrarEstadisticas = true;

  constructor(private equipoService: EquipoService) {}

  ngOnInit(): void {
    this.cargarMiembros();
    this.cargarRoles();
    this.configurarBusqueda();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarMiembros(): void {
    this.cargando = true;
    this.error = false;
    
    // 🆕 Usar método con respaldo para debugging
    this.equipoService.listarMiembrosActivosConRespaldo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (miembros) => {
          console.log('✅ Miembros cargados:', miembros);
          this.miembros = miembros;
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error cargando miembros:', error);
          this.error = true;
          this.cargando = false;
        }
      });
  }

  private cargarRoles(): void {
    this.equipoService.obtenerRolesDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.rolesDisponibles = roles;
          console.log('✅ Roles disponibles:', roles);
        },
        error: (error) => {
          console.warn('⚠️ Error cargando roles:', error);
        }
      });
  }

  private configurarBusqueda(): void {
    // Búsqueda con debounce para optimizar
    const busquedaSubject = new Subject<string>();
    
    busquedaSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(texto => {
        this.realizarBusqueda(texto);
      });
  }

  onBusquedaChange(texto: string): void {
    this.textoBusqueda = texto;
    this.realizarBusqueda(texto);
  }

  private realizarBusqueda(texto: string): void {
    if (!texto.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.cargando = true;
    
    this.equipoService.buscarMiembros(texto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (miembros) => {
          this.miembros = miembros;
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error en búsqueda:', error);
          this.cargando = false;
        }
      });
  }

  onRolChange(): void {
    if (!this.rolSeleccionado) {
      this.cargarMiembros();
      return;
    }

    this.cargando = true;
    
    this.equipoService.filtrarPorRol(this.rolSeleccionado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (miembros) => {
          this.miembros = miembros;
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error filtrando por rol:', error);
          this.cargando = false;
        }
      });
  }

  private aplicarFiltros(): void {
    let miembrosFiltrados = [...this.miembros];

    // Filtrar por rol si está seleccionado
    if (this.rolSeleccionado && this.textoBusqueda) {
      miembrosFiltrados = miembrosFiltrados.filter(m => 
        m.rol.toLowerCase().includes(this.rolSeleccionado.toLowerCase())
      );
    }

    // Ordenar por orden de visualización y luego por nombre
    miembrosFiltrados.sort((a, b) => {
      const ordenA = a.ordenVisualizacion || 999;
      const ordenB = b.ordenVisualizacion || 999;
      
      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }
      
      return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
    });

    this.miembrosFiltrados = miembrosFiltrados;
    console.log(`📋 Mostrando ${this.miembrosFiltrados.length} miembros`);
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.rolSeleccionado = '';
    this.cargarMiembros();
  }

  recargar(): void {
    this.cargarMiembros();
  }

  // Getters para el template
  get totalMiembros(): number {
    return this.miembros.length;
  }

  get totalPublicaciones(): number {
    return this.miembros.reduce((total, miembro) => {
      return total + (miembro.totalNoticias || 0) + (miembro.totalEventos || 0);
    }, 0);
  }

  get miembroMasProductivo(): MiembroEquipo | null {
    if (this.miembros.length === 0) return null;
    
    return this.miembros.reduce((max, miembro) => {
      const publicacionesMiembro = (miembro.totalNoticias || 0) + (miembro.totalEventos || 0);
      const publicacionesMax = (max.totalNoticias || 0) + (max.totalEventos || 0);
      
      return publicacionesMiembro > publicacionesMax ? miembro : max;
    });
  }

  // Track by function para optimizar el renderizado
  trackByMiembro(index: number, miembro: MiembroEquipo): number {
    return miembro.id;
  }
}
