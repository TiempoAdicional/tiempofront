import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor(private router: Router) {}

  /**
   * Genera un slug SEO-friendly a partir de un título
   */
  generarSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/[\s_-]+/g, '-') // Reemplazar espacios por guiones
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
  }

  /**
   * Genera la URL completa para una noticia
   */
  generarUrlNoticia(id: number, titulo: string): string {
    const slug = this.generarSlug(titulo);
    return `/noticia/${id}/${slug}`;
  }

  /**
   * Genera la URL completa para compartir una noticia
   */
  generarUrlCompartir(id: number, titulo: string): string {
    const slug = this.generarSlug(titulo);
    const baseUrl = window.location.origin;
    return `${baseUrl}/noticia/${id}/${slug}`;
  }

  /**
   * Navega a la URL de una noticia
   */
  navegarANoticia(id: number, titulo: string): void {
    const url = this.generarUrlNoticia(id, titulo);
    this.router.navigate([url]);
  }

  /**
   * Verifica si una URL de noticia es válida
   */
  validarUrlNoticia(id: string, slug?: string): boolean {
    return !isNaN(Number(id)) && Number(id) > 0;
  }
}
