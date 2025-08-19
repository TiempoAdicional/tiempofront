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

    let authReq;

    // Manejar FormData de forma especial
    if (req.body instanceof FormData) {
      console.log('📦 FormData detectado - solo agregando Authorization header');

      // Para FormData, SOLO agregar Authorization, NO tocar Content-Type
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ FormData - Token agregado sin Content-Type:', {
        url: req.url,
        tokenPreview: token.substring(0, 20) + '...',
        isFormData: true,
        hasContentType: authReq.headers.has('Content-Type'),
        allHeaders: authReq.headers.keys()
      });
    } else {
      console.log('📄 JSON detectado - agregando Authorization y Content-Type');

      // Para JSON, agregar tanto Authorization como Content-Type
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': req.headers.get('Content-Type') || 'application/json'
        }
      });

      console.log('✅ JSON - Token y Content-Type agregados:', {
        url: req.url,
        tokenPreview: token.substring(0, 20) + '...',
        isFormData: false,
        contentType: authReq.headers.get('Content-Type')
      });
    }

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
