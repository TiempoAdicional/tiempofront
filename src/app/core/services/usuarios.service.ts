import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';

// ===============================
// 📋 INTERFACES Y TIPOS
// ===============================
export interface UsuarioDTO {
  id: number;
  nombre: string;
  correo: string;
  rol: 'USUARIO' | 'ADMIN' | 'SUPER_ADMIN';
  fechaCreacion: string;
  fechaUltimoAcceso?: string;
  activo: boolean;
}

export interface CambiarRolRequest {
  rol: 'USUARIO' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface EstadisticasUsuarios {
  totalUsuarios: number;
  editores: number;
  administradores: number;
  superAdmins: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}

// ===============================
// 🔧 SERVICIO DE USUARIOS
// ===============================
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/usuarios`;
  
  // Subjects para estado reactivo
  private usuariosSubject = new BehaviorSubject<UsuarioDTO[]>([]);
  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private estadisticasSubject = new BehaviorSubject<EstadisticasUsuarios | null>(null);

  // Observables públicos
  public usuarios$ = this.usuariosSubject.asObservable();
  public cargando$ = this.cargandoSubject.asObservable();
  public estadisticas$ = this.estadisticasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===============================
  // 📊 MÉTODOS DE CONSULTA
  // ===============================

  /**
   * Listar todos los usuarios (solo SUPER_ADMIN)
   */
  listarTodos(): Observable<UsuarioDTO[]> {
    this.cargandoSubject.next(true);
    
    return new Observable<UsuarioDTO[]>(observer => {
      this.http.get<UsuarioDTO[]>(this.API_URL).subscribe({
        next: (usuarios) => {
          this.usuariosSubject.next(usuarios);
          this.calcularEstadisticas(usuarios);
          this.cargandoSubject.next(false);
          observer.next(usuarios);
          observer.complete();
        },
        error: (error) => {
          this.cargandoSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Buscar usuario por correo electrónico
   */
  buscarPorCorreo(correo: string): Observable<UsuarioDTO> {
    this.cargandoSubject.next(true);
    
    const params = new HttpParams().set('correo', correo);
    
    return new Observable<UsuarioDTO>(observer => {
      this.http.get<UsuarioDTO>(`${this.API_URL}/buscar`, { params }).subscribe({
        next: (usuario) => {
          this.cargandoSubject.next(false);
          observer.next(usuario);
          observer.complete();
        },
        error: (error) => {
          this.cargandoSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtener usuario por ID
   */
  obtenerPorId(id: number): Observable<UsuarioDTO> {
    this.cargandoSubject.next(true);
    
    return new Observable<UsuarioDTO>(observer => {
      this.http.get<UsuarioDTO>(`${this.API_URL}/${id}`).subscribe({
        next: (usuario) => {
          this.cargandoSubject.next(false);
          observer.next(usuario);
          observer.complete();
        },
        error: (error) => {
          this.cargandoSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  // ===============================
  // ⚙️ MÉTODOS DE MODIFICACIÓN
  // ===============================

  /**
   * Cambiar rol de un usuario (solo SUPER_ADMIN)
   */
  cambiarRol(id: number, nuevoRol: 'USUARIO' | 'ADMIN' | 'SUPER_ADMIN'): Observable<string> {
    this.cargandoSubject.next(true);
    
    const body: CambiarRolRequest = { rol: nuevoRol };
    
    return new Observable<string>(observer => {
      this.http.patch(`${this.API_URL}/${id}/rol`, body, { responseType: 'text' }).subscribe({
        next: (response) => {
          this.cargandoSubject.next(false);
          // Actualizar la lista local si está cargada
          this.actualizarUsuarioLocal(id, { rol: nuevoRol });
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.cargandoSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Eliminar usuario (solo SUPER_ADMIN)
   */
  eliminarUsuario(id: number): Observable<string> {
    this.cargandoSubject.next(true);
    
    return new Observable<string>(observer => {
      this.http.delete<string>(`${this.API_URL}/${id}`).subscribe({
        next: (response) => {
          this.cargandoSubject.next(false);
          // Remover de la lista local
          this.removerUsuarioLocal(id);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.cargandoSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  // ===============================
  // 📈 MÉTODOS DE ESTADÍSTICAS
  // ===============================

  /**
   * Calcular estadísticas de usuarios
   */
  private calcularEstadisticas(usuarios: UsuarioDTO[]): void {
    const estadisticas: EstadisticasUsuarios = {
      totalUsuarios: usuarios.length,
      editores: usuarios.filter(u => u.rol === 'USUARIO').length,
      administradores: usuarios.filter(u => u.rol === 'ADMIN').length,
      superAdmins: usuarios.filter(u => u.rol === 'SUPER_ADMIN').length,
      usuariosActivos: usuarios.filter(u => u.activo).length,
      usuariosInactivos: usuarios.filter(u => !u.activo).length
    };
    
    this.estadisticasSubject.next(estadisticas);
  }

  /**
   * Obtener estadísticas actuales
   */
  obtenerEstadisticas(): EstadisticasUsuarios | null {
    return this.estadisticasSubject.value;
  }

  // ===============================
  // 🔄 MÉTODOS AUXILIARES
  // ===============================

  /**
   * Actualizar usuario en la lista local
   */
  private actualizarUsuarioLocal(id: number, cambios: Partial<UsuarioDTO>): void {
    const usuariosActuales = this.usuariosSubject.value;
    const usuarioIndex = usuariosActuales.findIndex(u => u.id === id);
    
    if (usuarioIndex !== -1) {
      const usuariosActualizados = [...usuariosActuales];
      usuariosActualizados[usuarioIndex] = { 
        ...usuariosActualizados[usuarioIndex], 
        ...cambios 
      };
      
      this.usuariosSubject.next(usuariosActualizados);
      this.calcularEstadisticas(usuariosActualizados);
    }
  }

  /**
   * Remover usuario de la lista local
   */
  private removerUsuarioLocal(id: number): void {
    const usuariosActuales = this.usuariosSubject.value;
    const usuariosFiltrados = usuariosActuales.filter(u => u.id !== id);
    
    this.usuariosSubject.next(usuariosFiltrados);
    this.calcularEstadisticas(usuariosFiltrados);
  }

  /**
   * Obtener lista actual de usuarios
   */
  obtenerUsuarios(): UsuarioDTO[] {
    return this.usuariosSubject.value;
  }

  /**
   * Limpiar cache de usuarios
   */
  limpiarCache(): void {
    this.usuariosSubject.next([]);
    this.estadisticasSubject.next(null);
    this.cargandoSubject.next(false);
  }

  /**
   * Verificar si está cargando
   */
  estaCargando(): boolean {
    return this.cargandoSubject.value;
  }

  // ===============================
  // 🎯 MÉTODOS DE UTILIDAD
  // ===============================

  /**
   * Obtener color según el rol
   */
  static obtenerColorRol(rol: string): string {
    const colores = {
      'USUARIO': '#17a2b8',        // Cian
      'ADMIN': '#ffc107',         // Amarillo
      'SUPER_ADMIN': '#dc3545'    // Rojo
    };
    return colores[rol as keyof typeof colores] || '#6c757d';
  }

  /**
   * Obtener icono según el rol
   */
  static obtenerIconoRol(rol: string): string {
    const iconos = {
      'USUARIO': 'edit',
      'ADMIN': 'admin_panel_settings',
      'SUPER_ADMIN': 'security'
    };
    return iconos[rol as keyof typeof iconos] || 'person';
  }

  /**
   * Formatear fecha legible
   */
  static formatearFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }
}
