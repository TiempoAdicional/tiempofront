import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { EquipoService } from '../services/equipo.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const perfilEquipoGuard = () => {
  const authService = inject(AuthService);
  const equipoService = inject(EquipoService);
  const router = inject(Router);

  // Si no es editor jefe, permitir acceso
  if (!authService.esEditorJefe()) {
    return true;
  }

  // Si ya marcó como completado, permitir acceso
  if (!authService.necesitaCompletarPerfil()) {
    return true;
  }

  // Verificar si ya existe en el equipo
  const correo = authService.obtenerCorreoUsuario();
  if (!correo) {
    console.error('No se pudo obtener el correo del usuario');
    return true;
  }

  return equipoService.verificarMiembroPorCorreo(correo).pipe(
    map(existeEnEquipo => {
      if (existeEnEquipo) {
        // Si ya existe en el equipo, marcar como completado y permitir acceso
        authService.marcarPerfilCompletado();
        return true;
      } else {
        // Si no existe, redirigir a crear perfil
        router.navigate(['/admin/equipo'], { 
          queryParams: { completarPerfil: 'true' } 
        });
        return false;
      }
    }),
    catchError(error => {
      console.error('Error verificando perfil de equipo:', error);
      return of(true); // En caso de error, permitir acceso
    })
  );
};
