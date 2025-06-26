import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  mostrarContrasena = false;

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
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.authService.guardarToken(res.token);
        this.authService.guardarUsuario(res.nombre, res.rol, res.id);
        console.log("✅ Login exitoso:", res.nombre, res.rol);

        // Redirección por rol
        if (res.rol === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('❌ Error al iniciar sesión:', err);
        alert('❌ Credenciales incorrectas o error del servidor.');
      }
    });
  }
}

}
