import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NoticiasService } from '../services/noticias.service';

/**
 * Guard simple para verificar que una noticia sea pública y accesible
 */
export const noticiaPublicaGuard: CanActivateFn = (route): Observable<boolean> => {
  const noticiasService = inject(NoticiasService);
  const router = inject(Router);

  const id = route.params['id'];
  
  // Verificar que el ID sea válido
  if (!id || isNaN(Number(id))) {
    console.warn('🚫 ID de noticia inválido:', id);
    router.navigate(['/']);
    return of(false);
  }

  // Verificar que la noticia exista y sea pública
  return noticiasService.obtenerPorId(Number(id)).pipe(
    map(noticia => {
      // Si la noticia no es pública, redirigir al inicio
      if (!noticia.esPublica) {
        console.warn('🚫 Noticia no es pública:', noticia.id);
        router.navigate(['/']);
        return false;
      }
      
      console.log('✅ Noticia pública accesible:', noticia.titulo);
      return true;
    }),
    catchError(error => {
      console.error('❌ Error verificando noticia:', error);
      router.navigate(['/']);
      return of(false);
    })
  );
};
