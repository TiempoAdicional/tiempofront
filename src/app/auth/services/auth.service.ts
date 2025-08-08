import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { jwtDecode } from 'jwt-decode';

export interface LoginPayload {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  rol: string;
  nombre: string;
  id: number;
}

export interface RegisterPayload {
  nombre: string;
  correo: string;
  contrasena: string;
}

interface DecodedToken {
  exp: number;
  sub: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl;

  private autenticadoSubject = new BehaviorSubject<boolean>(this.estaAutenticado());
  private nombreSubject = new BehaviorSubject<string>(this.obtenerNombre() || '');

  autenticado$ = this.autenticadoSubject.asObservable();
  nombre$ = this.nombreSubject.asObservable();

  constructor(private http: HttpClient) { }

  // === LOGIN / REGISTER ===
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload);
  }

  register(payload: RegisterPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload, { responseType: 'text' });
  }

  // === GUARDADO DE TOKEN Y USUARIO ===
  guardarToken(token: string): void {
    // 🆕 VALIDACIÓN: Verificar que el token no esté vacío o malformado
    if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
      console.error('❌ Token inválido recibido:', token);
      return;
    }

    console.log('🔐 Guardando token:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('jwt', token);
    this.autenticadoSubject.next(this.estaAutenticado());
  }

  guardarUsuario(nombre: string, rol: string, id: number): void {
    console.log('👤 Guardando datos de usuario:', { nombre, rol, id });

    localStorage.setItem('nombre', nombre);
    localStorage.setItem('rol', rol);
    localStorage.setItem('id', id.toString());
    this.nombreSubject.next(nombre);
  }

  obtenerCorreoUsuario(): string | null {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.sub; // El sub del token generalmente contiene el correo
    } catch (error) {
      return null;
    }
  }

  obtenerToken(): string | null {
    return localStorage.getItem('jwt');
  }

  obtenerRol(): string | null {
    return localStorage.getItem('rol');
  }

  obtenerNombre(): string {
    return localStorage.getItem('nombre') || '';
  }

  cerrarSesion(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    localStorage.removeItem('perfil_equipo_completado'); // Limpiar estado de perfil
    this.autenticadoSubject.next(false);
    this.nombreSubject.next('');
  }

  // === AUTENTICACIÓN Y ROLES ===
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) {
      console.log('🔍 No hay token almacenado');
      return false;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const ahora = Math.floor(Date.now() / 1000);
      const esValido = decoded.exp > ahora;

      console.log('🔍 Verificando token:', {
        exp: decoded.exp,
        ahora,
        esValido,
        tiempoRestante: decoded.exp - ahora
      });

      return esValido;
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
      return false;
    }
  }

  esAdmin(): boolean {
    return this.obtenerRol() === 'ADMIN';
  }

  esEditorJefe(): boolean {
    return this.obtenerRol() === 'EDITOR_JEFE';
  }

  esAdminOEditorJefe(): boolean {
    const rol = this.obtenerRol();
    return rol === 'ADMIN' || rol === 'EDITOR_JEFE';
  }

  puedeGestionarEquipo(): boolean {
    return this.esEditorJefe();
  }

  // Método para verificar si el editor jefe ya completó su perfil
  necesitaCompletarPerfil(): boolean {
    return localStorage.getItem('perfil_equipo_completado') !== 'true';
  }

  marcarPerfilCompletado(): void {
    localStorage.setItem('perfil_equipo_completado', 'true');
  }

  esUsuario(): boolean {
    return this.obtenerRol() === 'USUARIO';
  }

  esEmpresa(): boolean {
    return this.obtenerRol() === 'SUPER_ADMIN';
  }

  esSuperAdmin(): boolean {
    return this.obtenerRol() === 'SUPER_ADMIN';
  }

  obtenerNombreUsuario(): string {
    return this.obtenerNombre();
  }

  logout(): void {
    this.cerrarSesion();
  }

  // === Headers para Interceptor (opcional) ===
  obtenerHeadersAutenticados(): { [header: string]: string } {
    const token = this.obtenerToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  obtenerIdUsuario(): number | null {
    const id = localStorage.getItem('id');
    return id ? Number(id) : null;
  }
  obtenerUsuario(): { id: number; nombre: string; rol: string } | null {
    const id = this.obtenerIdUsuario();
    const nombre = this.obtenerNombre();
    const rol = this.obtenerRol();

    if (id !== null && nombre && rol) {
      return { id, nombre, rol };
    }

    return null;
  }

}
