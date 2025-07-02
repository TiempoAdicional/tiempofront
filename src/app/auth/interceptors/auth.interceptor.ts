import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  // URLs públicas que no requieren autenticación
  const publicUrls = [
    '/api/noticias/publicas',
    '/api/eventos/publicos',
    '/api/auth/login',
    '/api/auth/register'
  ];

  // Verificar si la URL actual es pública
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Solo agregar token si no es una URL pública y el token existe
  if (token && !isPublicUrl) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
