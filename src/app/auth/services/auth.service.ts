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
  id : number;
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

  constructor(private http: HttpClient) {}

  // === LOGIN / REGISTER ===
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload);
  }

  register(payload: RegisterPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload, { responseType: 'text' });
  }

  // === GUARDADO DE TOKEN Y USUARIO ===
  guardarToken(token: string): void {
    localStorage.setItem('jwt', token);
    this.autenticadoSubject.next(this.estaAutenticado());
  }

  guardarUsuario(nombre: string, rol: string, id: number): void {
  localStorage.setItem('nombre', nombre);
  localStorage.setItem('rol', rol);
  localStorage.setItem('id', id.toString());
  this.nombreSubject.next(nombre);
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
    this.autenticadoSubject.next(false);
    this.nombreSubject.next('');
  }

  // === AUTENTICACIÓN Y ROLES ===
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const ahora = Math.floor(Date.now() / 1000);
      return decoded.exp > ahora;
    } catch (error) {
      return false;
    }
  }

  esAdmin(): boolean {
    return this.obtenerRol() === 'ADMIN';
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
