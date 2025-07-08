import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Servicios
import { UsuariosService, UsuarioDTO, EstadisticasUsuarios } from '../../core/services/usuarios.service';
import { AuthService } from '../../auth/services/auth.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material UI
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule
  ]
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  // ===============================
  // 📊 PROPIEDADES DE ESTADO
  // ===============================
  searchForm: FormGroup;
  usuarioEncontrado: UsuarioDTO | null = null;
  usuariosBusqueda: UsuarioDTO[] = [];
  estadisticas: EstadisticasUsuarios | null = null;

  // Estados de carga
  buscandoUsuario = false;
  cambiandoRol = false;
  cargandoEstadisticas = false;

  // Usuario actual
  nombreSuperAdmin = '';

  // Control de suscripciones
  private destroy$ = new Subject<void>();

  // Opciones de roles
  readonly rolesDisponibles = [
    { value: 'USUARIO', label: 'Usuario', descripcion: 'Solo mirar el contenido', icon: 'person', color: '#17a2b8' },
    { value: 'ADMIN', label: 'Administrador', descripcion: 'Editor de todo el periódico', icon: 'admin_panel_settings', color: '#ffc107' },
    { value: 'EDITOR_JEFE', label: 'Editor Jefe', descripcion: 'Editor en jefe con gestión de equipo', icon: 'star', color: '#28a745' },
    { value: 'SUPER_ADMIN', label: 'Super Administrador', descripcion: 'Control total del sistema', icon: 'security', color: '#dc3545' }
  ];

  // Roles que pueden ser asignados (excluye SUPER_ADMIN)
  get rolesDisponiblesParaCambio() {
    return this.rolesDisponibles.filter(rol => rol.value !== 'SUPER_ADMIN');
  }



  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.searchForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      nuevoRol: ['', Validators.required]
    });

  }

  ngOnInit(): void {
    this.inicializarComponente();
    this.configurarBusquedaReactiva();
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // 🚀 INICIALIZACIÓN
  // ===============================

  private inicializarComponente(): void {
    // Verificar que el usuario sea Super Admin
    if (!this.authService.esSuperAdmin()) {
      this.mostrarToast('❌ Acceso denegado: Solo Super Administradores');
      this.router.navigate(['/admin']);
      return;
    }

    // Obtener información del usuario actual
    this.nombreSuperAdmin = this.authService.obtenerNombreUsuario() || 'Super Admin';

    // Limpiar cache anterior
    this.usuariosService.limpiarCache();
  }

  private configurarBusquedaReactiva(): void {
    // Búsqueda reactiva por correo
    this.searchForm.get('correo')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(correo => {
        if (correo && this.searchForm.get('correo')?.valid) {
          this.buscarUsuarioAutomatico(correo);
        } else {
          this.usuarioEncontrado = null;
          this.usuariosBusqueda = [];
        }
      });
  }

  // ===============================
  // 🔍 MÉTODOS DE BÚSQUEDA
  // ===============================

  buscarUsuario(): void {
    if (this.searchForm.invalid) {
      this.mostrarToast('⚠️ Por favor ingrese un correo válido');
      return;
    }

    const correo = this.searchForm.get('correo')?.value;
    this.buscarUsuarioAutomatico(correo);
  }

  private buscarUsuarioAutomatico(correo: string): void {
    this.buscandoUsuario = true;
    this.usuarioEncontrado = null;

    this.usuariosService.buscarPorCorreo(correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.usuarioEncontrado = usuario;
          this.searchForm.patchValue({ nuevoRol: usuario.rol });
          this.buscandoUsuario = false;

          // Agregar a la lista de búsquedas recientes
          this.agregarABusquedaReciente(usuario);
        },
        error: (error) => {
          this.buscandoUsuario = false;
          if (error.status === 404) {
            this.mostrarToast('👤 Usuario no encontrado');
          } else {
            this.mostrarToast('❌ Error al buscar usuario: ' + (error.error?.message || 'Error desconocido'));
          }
          console.error('Error búsqueda usuario:', error);
        }
      });
  }

  private agregarABusquedaReciente(usuario: UsuarioDTO): void {
    // Evitar duplicados
    const existe = this.usuariosBusqueda.find(u => u.id === usuario.id);
    if (!existe) {
      this.usuariosBusqueda.unshift(usuario);
      // Mantener solo los últimos 5
      if (this.usuariosBusqueda.length > 5) {
        this.usuariosBusqueda = this.usuariosBusqueda.slice(0, 5);
      }
    }
  }

  // ===============================
  // ⚙️ GESTIÓN DE ROLES
  // ===============================

  cambiarRolUsuario(): void {
    if (!this.usuarioEncontrado || this.searchForm.invalid) {
      this.mostrarToast('⚠️ Seleccione un usuario y un rol válido');
      return;
    }

    const nuevoRol = this.searchForm.get('nuevoRol')?.value;
    const usuario = this.usuarioEncontrado;

    if (nuevoRol === 'SUPER_ADMIN') {
      this.mostrarToast('❌ No se puede asignar el rol de Super Administrador');
      return;
    }

    if (usuario.rol === nuevoRol) {
      this.mostrarToast('ℹ️ El usuario ya tiene ese rol asignado');
      return;
    }

    // Validación especial para EDITOR_JEFE
    if (nuevoRol === 'EDITOR_JEFE') {
      const confirmacion = confirm(
        `¿Está seguro de asignar el rol de Editor Jefe a ${usuario.nombre}?\n\n` +
        'El Editor Jefe tendrá acceso completo al panel de administración y gestión exclusiva del equipo del periódico.'
      );
      if (!confirmacion) return;
    }

    this.cambiandoRol = true;

    this.usuariosService.cambiarRol(usuario.id, nuevoRol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.usuarioEncontrado!.rol = nuevoRol;
          this.cambiandoRol = false;
          
          let mensaje = `✅ Rol actualizado a ${this.obtenerLabelRol(nuevoRol)}`;
          if (nuevoRol === 'EDITOR_JEFE') {
            mensaje += ' 🌟 ¡Nuevo Editor Jefe asignado!';
          }
          this.mostrarToast(mensaje);

          // Actualizar búsquedas recientes
          this.actualizarBusquedaReciente(usuario.id, { rol: nuevoRol });

          // Recargar estadísticas
          this.cargarEstadisticas();
        },
        error: (error) => {
          this.cambiandoRol = false;
          this.mostrarToast('❌ Error al cambiar rol: ' + (error.error?.message || 'Error desconocido'));
          console.error('Error cambiar rol:', error);
        }
      });
  }

  private actualizarBusquedaReciente(usuarioId: number, cambios: Partial<UsuarioDTO>): void {
    const index = this.usuariosBusqueda.findIndex(u => u.id === usuarioId);
    if (index !== -1) {
      this.usuariosBusqueda[index] = { ...this.usuariosBusqueda[index], ...cambios };
    }
  }

  // ===============================
  // 📊 ESTADÍSTICAS
  // ===============================

  private cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;

    this.usuariosService.listarTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.estadisticas = this.usuariosService.obtenerEstadisticas();
          this.cargandoEstadisticas = false;
        },
        error: (error) => {
          this.cargandoEstadisticas = false;
          console.error('Error cargar estadísticas:', error);
        }
      });
  }

  // ===============================
  // 🎨 MÉTODOS DE UTILIDAD
  // ===============================

  obtenerColorRol(rol: string): string {
    return UsuariosService.obtenerColorRol(rol);
  }

  obtenerIconoRol(rol: string): string {
    return UsuariosService.obtenerIconoRol(rol);
  }

  obtenerLabelRol(rol: string): string {
    const rolData = this.rolesDisponibles.find(r => r.value === rol);
    return rolData?.label || rol;
  }

  obtenerDescripcionRol(rol: string): string {
    const rolData = this.rolesDisponibles.find(r => r.value === rol);
    return rolData?.descripcion || '';
  }

  formatearFecha(fecha: string): string {
    return UsuariosService.formatearFecha(fecha);
  }

  // ===============================
  // 🔄 ACCIONES ADICIONALES
  // ===============================

  limpiarBusqueda(): void {
    this.searchForm.reset();
    this.usuarioEncontrado = null;
  }

  seleccionarUsuarioBusqueda(usuario: UsuarioDTO): void {
    this.searchForm.patchValue({
      correo: usuario.correo,
      nuevoRol: usuario.rol
    });
    this.usuarioEncontrado = usuario;
  }

  refrescarEstadisticas(): void {
    this.usuariosService.limpiarCache();
    this.cargarEstadisticas();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // ===============================
  // 💬 NOTIFICACIONES
  // ===============================

  private mostrarToast(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-toast']
    });
  }

  // ===============================
  // 🎯 GETTERS PARA TEMPLATE
  // ===============================

  get correoControl() {
    return this.searchForm.get('correo');
  }

  get nuevoRolControl() {
    return this.searchForm.get('nuevoRol');
  }

  get puedeRealizarCambio(): boolean {
    return this.usuarioEncontrado !== null &&
      this.searchForm.valid &&
      !this.cambiandoRol &&
      this.usuarioEncontrado.rol !== this.searchForm.get('nuevoRol')?.value;
  }
}
