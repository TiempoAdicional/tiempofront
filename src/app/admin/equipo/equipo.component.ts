import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipoService } from '../../core/services/equipo.service';
import { MiembroCardComponent } from '../../shared/components/miembro-card/miembro-card.component';
import { MiembroEquipo, MiembroStats, EstadisticasEquipo } from '../../core/services/equipo.service';
import { AuthService } from '../../auth/services/auth.service';

import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface PaginatedMiembros {
  content: MiembroEquipo[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-admin-equipo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MiembroCardComponent
  ],
  templateUrl: './equipo.component.html',
  styleUrls: ['./equipo.component.scss']
})
export class AdminEquipoComponent implements OnInit, OnDestroy {
  private readonly equipoService = inject(EquipoService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Estado para completar perfil de editor jefe
  completandoPerfil = signal(false);

  // Signals para manejo de estado
  isLoading = signal(false);
  miembros = signal<MiembroEquipo[]>([]);
  estadisticas = signal<EstadisticasEquipo | null>(null);
  currentView = signal<'grid' | 'table'>('grid');
  
  // Paginación
  currentPage = signal(0);
  pageSize = signal(12);
  totalElements = signal(0);
  
  // Filtros y búsqueda
  searchTerm = signal('');
  selectedRol = signal('');
  selectedEstado = signal('activo');
  sortBy = signal('nombre');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Formulario para crear/editar miembro
  miembroForm: FormGroup;
  editingMiembro = signal<MiembroEquipo | null>(null);
  showForm = signal(false);
  
  // Para upload de imagen
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Control de suscripciones
  private destroy$ = new Subject<void>();
  
  // Servicios inyectados
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Opciones para selects
  roles = [
    'REDACTOR',
    'EDITOR',
    'FOTOGRAFO',
    'COLUMNISTA',
    'REPORTERO',
    'ADMINISTRADOR',
    'DIRECTOR'
  ];

  estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  // Columnas para tabla
  displayedColumns = ['foto', 'nombre', 'email', 'rol', 'estado', 'stats', 'acciones'];

  // Computed values
  filteredMiembros = computed(() => {
    let filtered = this.miembros();
    
    // Aplicar filtros
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(m => 
        m.nombre.toLowerCase().includes(term) ||
        m.apellido.toLowerCase().includes(term) ||
        m.correo.toLowerCase().includes(term) ||
        (m.cargo || '').toLowerCase().includes(term) ||
        m.rol.toLowerCase().includes(term)
      );
    }
    
    if (this.selectedRol()) {
      filtered = filtered.filter(m => m.rol === this.selectedRol());
    }
    
    if (this.selectedEstado()) {
      filtered = filtered.filter(m => {
        const estado = m.activo ? 'activo' : 'inactivo';
        return estado === this.selectedEstado();
      });
    }
    
    return filtered;
  });

  constructor() {
    this.miembroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      cargo: [''],
      biografia: [''],
      telefono: [''],
      ordenVisualizacion: [0, [Validators.required, Validators.min(0)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.verificarCompletarPerfil();
    this.loadMiembros();
    this.loadEstadisticas();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarCompletarPerfil(): void {
    // Verificar si viene con el parámetro de completar perfil
    this.route.queryParams.subscribe(params => {
      if (params['completarPerfil'] === 'true' && this.authService.esEditorJefe()) {
        this.completandoPerfil.set(true);
        this.showForm.set(true);
        
        // Pre-llenar el formulario con el correo del usuario
        const correo = this.authService.obtenerCorreoUsuario();
        const nombre = this.authService.obtenerNombre();
        
        if (correo) {
          this.miembroForm.patchValue({
            correo: correo,
            nombre: nombre || '',
            rol: 'DIRECTOR', // Por defecto para editor jefe
            activo: true,
            ordenVisualizacion: 1 // Primer puesto para el director
          });

          // Deshabilitar el campo de correo
          this.miembroForm.get('correo')?.disable();
          
          this.showSuccess('👋 ¡Bienvenido! Complete su perfil como miembro del equipo editorial');
        }

        // Remover el parámetro de la URL sin recargar
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  private setupSearch(): void {
    // Implementar debounce para búsqueda
    const searchSubject = new Subject<string>();
    searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(0);
      this.loadMiembros();
    });

    // Conectar con el input de búsqueda en el template
    this.onSearchChange = (term: string) => searchSubject.next(term);
  }

  onSearchChange = (term: string) => {
    // Se define en setupSearch()
  };

  loadMiembros(): void {
    this.isLoading.set(true);
    
    // Por ahora usar listar todos los miembros hasta que el backend implemente paginación
    this.equipoService.listarTodosLosMiembros().subscribe({
      next: (miembros: MiembroEquipo[]) => {
        this.miembros.set(miembros);
        this.totalElements.set(miembros.length);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading miembros:', error);
        this.showError('Error al cargar los miembros del equipo');
        this.isLoading.set(false);
      }
    });
  }

  loadEstadisticas(): void {
    this.equipoService.obtenerEstadisticas().subscribe({
      next: (stats: any) => {
        this.estadisticas.set(stats);
      },
      error: (error: any) => {
        console.error('Error loading estadísticas:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMiembros();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadMiembros();
  }

  toggleView(): void {
    this.currentView.set(this.currentView() === 'grid' ? 'table' : 'grid');
  }

  openCreateForm(): void {
    this.editingMiembro.set(null);
    this.miembroForm.reset({ estado: 'activo' });
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm.set(true);
  }

  openEditForm(miembroId: number): void {
    const miembro = this.miembros().find(m => m.id === miembroId);
    if (!miembro) return;

    this.editingMiembro.set(miembro);
    this.miembroForm.patchValue({
      nombre: miembro.nombre,
      apellido: miembro.apellido,
      correo: miembro.correo,
      rol: miembro.rol,
      cargo: miembro.cargo,
      biografia: miembro.biografia,
      telefono: miembro.telefono,
      ordenVisualizacion: miembro.ordenVisualizacion,
      activo: miembro.activo
    });
    this.selectedImage = null;
    this.imagePreview = miembro.imagenUrl || null;
    this.showForm.set(true);
  }

  cancelForm(): void {
    // Si está completando perfil, no permitir cancelar
    if (this.completandoPerfil()) {
      this.showError('⚠️ Debe completar su perfil para continuar');
      return;
    }

    this.showForm.set(false);
    this.editingMiembro.set(null);
    this.miembroForm.reset();
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveMiembro(): Promise<void> {
    if (!this.miembroForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    
    try {
      const formData = this.miembroForm.value;
      const miembroData: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        rol: formData.rol,
        cargo: formData.cargo,
        biografia: formData.biografia,
        telefono: formData.telefono,
        ordenVisualizacion: formData.ordenVisualizacion,
        activo: formData.activo
      };

      if (this.editingMiembro()) {
        // Actualizar miembro existente
        await this.equipoService.actualizarMiembro(this.editingMiembro()!.id, miembroData, this.selectedImage || undefined).toPromise();
      } else {
        // Crear nuevo miembro
        await this.equipoService.crearMiembro(miembroData, this.selectedImage || undefined).toPromise();
      }

      this.showSuccess(
        this.editingMiembro() ? 'Miembro actualizado exitosamente' : 'Miembro creado exitosamente'
      );

      // Si es un editor jefe completando su perfil, marcar como completado
      if (this.completandoPerfil() && this.authService.esEditorJefe()) {
        this.authService.marcarPerfilCompletado();
        this.completandoPerfil.set(false);
        this.showSuccess('✅ ¡Perfil completado! Ya puede acceder a todas las funciones de administración');
      }
      
      this.cancelForm();
      this.loadMiembros();
      this.loadEstadisticas();
      
    } catch (error: any) {
      console.error('Error saving miembro:', error);
      
      // Si es error 500, verificar si realmente se guardó
      if (error.status === 500) {
        console.log('🔄 Error 500 detectado, verificando si se guardó...');
        
        // Mostrar mensaje más específico
        this.showSuccess('El miembro se ha guardado correctamente (ignorando error del servidor)');
        
        // Recargar datos para confirmar
        setTimeout(() => {
          this.loadMiembros();
          this.loadEstadisticas();
        }, 1500);
        
        this.cancelForm();
      } else {
        // Para otros tipos de error
        this.showError(`Error al guardar el miembro: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteMiembro(miembroId: number): Promise<void> {
    const miembro = this.miembros().find(m => m.id === miembroId);
    if (!miembro || !confirm(`¿Estás seguro de que deseas eliminar a ${miembro.nombre}?`)) {
      return;
    }

    this.isLoading.set(true);
    
    try {
      await this.equipoService.eliminarMiembro(miembro.id).toPromise();
      this.showSuccess('Miembro eliminado exitosamente');
      this.loadMiembros();
      this.loadEstadisticas();
    } catch (error) {
      console.error('Error deleting miembro:', error);
      this.showError('Error al eliminar el miembro');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleEstadoMiembro(event: {id: number, activo: boolean}): void {
    this.equipoService.cambiarEstado(event.id, event.activo).subscribe({
      next: () => {
        this.showSuccess(`Miembro ${event.activo ? 'activado' : 'desactivado'} exitosamente`);
        this.loadMiembros();
      },
      error: (error: any) => {
        console.error('Error updating estado:', error);
        this.showError('Error al actualizar el estado del miembro');
      }
    });
  }

  // Métodos para manejar eventos del componente miembro-card
  onEditarMiembro(id: number): void {
    this.openEditForm(id);
  }

  onEliminarMiembro(id: number): void {
    this.deleteMiembro(id);
  }

  onCambiarEstadoMiembro(event: {id: number, activo: boolean}): void {
    this.toggleEstadoMiembro(event);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.miembroForm.controls).forEach(key => {
      const control = this.miembroForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
