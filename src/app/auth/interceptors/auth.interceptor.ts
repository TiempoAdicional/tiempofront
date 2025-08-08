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
    '/api/auth/register',
    '/api/equipo/publico'
  ];

  // Verificar si la URL actual es pública
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Logging para debugging en producción
  console.log('🔐 AuthInterceptor:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    isPublicUrl,
    tokenLength: token ? token.length : 0
  });

  // Solo agregar token si no es una URL pública y el token existe
  if (token && !isPublicUrl) {
    // Verificar que el token no esté vacío o malformado
    if (token.trim() === '' || token === 'null' || token === 'undefined') {
      console.warn('⚠️ Token inválido detectado:', token);
      return next(req);
    }

    // Preparar headers para la petición autenticada
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`
    };

    // Solo agregar Content-Type si no es FormData
    // FormData establece automáticamente multipart/form-data con boundary
    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    const authReq = req.clone({
      setHeaders: headers
    });

    console.log('✅ Token agregado a la petición:', {
      url: req.url,
      tokenPreview: token.substring(0, 20) + '...',
      isFormData: req.body instanceof FormData,
      contentType: authReq.headers.get('Content-Type')
    });

    return next(authReq);
  }

  // Para URLs públicas, no agregar token
  if (isPublicUrl) {
    console.log('🌐 URL pública - sin token:', req.url);
  } else if (!token) {
    console.warn('⚠️ Petición sin token para URL protegida:', req.url);
  }

  return next(req);
};
