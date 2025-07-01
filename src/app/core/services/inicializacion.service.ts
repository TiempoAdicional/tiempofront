import { Injectable } from '@angular/core';
import { AsignacionSeccionService } from './asignacion-seccion.service';

@Injectable({
  providedIn: 'root'
})
export class InicializacionService {

  constructor(private asignacionSeccionService: AsignacionSeccionService) {}

  /**
   * Inicializa las secciones por defecto del sistema
   * Se llama una vez al iniciar la aplicación
   */
  inicializarSistemaSecciones(): void {
    console.log('🚀 Inicializando sistema de secciones...');
    
    this.asignacionSeccionService.crearSeccionesPorDefecto().subscribe({
      next: (result: boolean) => {
        if (result) {
          console.log('✅ Sistema de secciones inicializado correctamente');
        } else {
          console.log('⚠️ Problema al inicializar secciones');
        }
      },
      error: (error: any) => {
        console.error('❌ Error al inicializar sistema de secciones:', error);
      }
    });
  }
}
