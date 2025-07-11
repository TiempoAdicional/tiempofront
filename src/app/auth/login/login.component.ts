import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule,MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  mostrarContrasena = false;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required]
    });
  }

  irARegistro(): void {
    this.router.navigate(['/register']);
  }

  toggleMostrar(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.cargando = true; // Activar spinner

      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.authService.guardarToken(res.token);
          this.authService.guardarUsuario(res.nombre, res.rol, res.id);
          this.cargando = false;

          // Redirigir según el rol del usuario
          if (res.rol === 'SUPER_ADMIN') {
            this.router.navigate(['/super-admin']);
          } else if (res.rol === 'ADMIN' || res.rol === 'EDITOR_JEFE') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/usuarios']); // Redirigir al dashboard del usuario
          }
        },
        error: (err) => {
          this.cargando = false;
          console.error('❌ Error al iniciar sesión:', err);
          alert('❌ Credenciales incorrectas o error del servidor.');
        }
      });
    }
  }
}


