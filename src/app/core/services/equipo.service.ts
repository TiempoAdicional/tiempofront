import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// Interfaces - Actualizada para coincidir exactamente con MiembroEquipoDTO del backend
export interface MiembroEquipo {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  imagenUrl?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  biografia?: string;
  telefono?: string;
  cargo?: string;
  ordenVisualizacion: number;

  // ========== ESTADÍSTICAS DE PUBLICACIONES ==========
  totalNoticias?: number;
  totalEventos?: number;
  noticiasDestacadas?: number;
  fechaUltimaPublicacion?: string;

  // Campos calculados
  nombreCompleto?: string;
}

export interface MiembroStats {
  totalNoticias: number;
  totalEventos: number;
  noticiasDestacadas: number;
  fechaUltimaPublicacion?: string;
}

export interface CrearMiembroDTO {
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  cargo?: string;
  biografia?: string;
  telefono?: string;
  ordenVisualizacion?: number;
  activo?: boolean;
  // 🚫 NO incluir fechaCreacion ni fechaActualizacion
  // Estas fechas las asigna automáticamente el backend
}

export interface EstadisticasMiembro {
  miembroId: number;
  nombreCompleto: string;
  rol: string;
  totalNoticias: number;
  totalEventos: number;
  noticiasDestacadas: number;
  totalPublicaciones: number;
  fechaUltimaPublicacion?: string;
  activo: boolean;
}

export interface EstadisticasEquipo {
  total: number;
  activos: number;
  inactivos: number;
  totalNoticias: number;
  totalEventos: number;
  miembroMasProductivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/equipo`;
  private readonly miembrosSubject = new BehaviorSubject<MiembroEquipo[]>([]);
  private readonly estadisticasSubject = new BehaviorSubject<EstadisticasEquipo | null>(null);

  readonly miembros$ = this.miembrosSubject.asObservable();
  readonly estadisticas$ = this.estadisticasSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ===== VERIFICACIÓN DE MIEMBRO =====

  /**
   * Verifica si un correo ya está registrado como miembro del equipo
   */
  verificarMiembroPorCorreo(correo: string): Observable<boolean> {
    return this.http.get<MiembroEquipo[]>(`${this.apiUrl}`)
      .pipe(
        map(miembros => miembros.some(miembro => miembro.correo === correo)),
        catchError(error => {
          console.error('Error verificando miembro por correo:', error);
          return of(false);
        })
      );
  }

  // ===== MÉTODOS PÚBLICOS (Sin autenticación) =====

  /**
   * Obtiene todos los miembros activos del equipo (acceso público)
   */
  listarMiembrosActivos(): Observable<MiembroEquipo[]> {
    console.log('🔄 Obteniendo miembros activos del equipo...');

    return this.http.get<any>(`${this.apiUrl}/publico`)
      .pipe(
        map(response => {
          console.log('✅ Miembros activos obtenidos:', response);

          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          // Ordenar por ordenVisualizacion
          miembros.sort((a: any, b: any) => (a.ordenVisualizacion || 0) - (b.ordenVisualizacion || 0));

          this.miembrosSubject.next(miembros);
          return miembros;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo miembros activos:', error);
          return this.handleError<MiembroEquipo[]>('listarMiembrosActivos', [])(error);
        })
      );
  }

  /**
   * Busca miembros activos por texto (nombre, apellido, rol)
   */
  buscarMiembros(texto: string): Observable<MiembroEquipo[]> {
    if (!texto.trim()) {
      return this.listarMiembrosActivos();
    }

    const params = new HttpParams().set('texto', texto.trim());

    return this.http.get<any>(`${this.apiUrl}/publico/buscar`, { params })
      .pipe(
        map(response => {
          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          console.log(`🔍 Búsqueda "${texto}": ${miembros.length} resultados`);
          return miembros;
        }),
        catchError(this.handleError<MiembroEquipo[]>('buscarMiembros', []))
      );
  }

  /**
   * Filtra miembros activos por rol específico
   */
  filtrarPorRol(rol: string): Observable<MiembroEquipo[]> {
    console.log(`🔄 Filtrando miembros por rol: ${rol}`);

    return this.http.get<any>(`${this.apiUrl}/publico/rol/${encodeURIComponent(rol)}`)
      .pipe(
        map(response => {
          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          console.log(`✅ Miembros con rol "${rol}": ${miembros.length}`);
          return miembros;
        }),
        catchError(this.handleError<MiembroEquipo[]>('filtrarPorRol', []))
      );
  }

  /**
   * Obtiene información de un miembro específico (acceso público)
   */
  obtenerMiembroPorId(id: number): Observable<MiembroEquipo> {
    return this.http.get<any>(`${this.apiUrl}/publico/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(miembro => console.log(`✅ Miembro obtenido id=${id}:`, miembro)),
        catchError(this.handleError<MiembroEquipo>(`obtenerMiembroPorId id=${id}`))
      );
  }

  /**
   * Obtiene lista de roles únicos disponibles
   */
  obtenerRolesDisponibles(): Observable<string[]> {
    return this.listarMiembrosActivos().pipe(
      map(miembros => {
        const roles = [...new Set(miembros.map(m => m.rol))];
        return roles.sort();
      })
    );
  }

  // ===== MÉTODOS ADMINISTRATIVOS (Solo ADMIN) =====

  /**
   * Obtiene todos los miembros incluyendo inactivos (admin)
   */
  listarTodosLosMiembros(): Observable<MiembroEquipo[]> {
    console.log('🔄 Obteniendo todos los miembros (admin)...');

    return this.http.get<any>(`${this.apiUrl}/admin`)
      .pipe(
        map(response => {
          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          console.log(`✅ Total miembros (admin): ${miembros.length}`);
          this.miembrosSubject.next(miembros);
          return miembros;
        }),
        catchError(this.handleError<MiembroEquipo[]>('listarTodosLosMiembros', []))
      );
  }

  /**
   * Obtiene miembros con paginación para administración
   */
  getMiembrosAdmin(params: any): Observable<any> {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/admin/paginated`, { params: httpParams })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        catchError(this.handleError<any>('getMiembrosAdmin'))
      );
  }

  /**
   * Obtiene estadísticas generales del equipo
   */
  getEstadisticasEquipo(): Observable<EstadisticasEquipo> {
    return this.obtenerEstadisticas();
  }

  /**
   * Crea un nuevo miembro
   */
  createMiembro(miembroData: any): Observable<MiembroEquipo> {
    // Mapear campos del componente al DTO esperado
    const dto: CrearMiembroDTO = {
      nombre: miembroData.nombre,
      apellido: miembroData.apellido || '',
      correo: miembroData.email || miembroData.correo,
      rol: miembroData.rol,
      cargo: miembroData.especialidad,
      biografia: miembroData.biografia,
      telefono: miembroData.telefono,
      activo: miembroData.estado === 'activo'
    };

    return this.crearMiembro(dto);
  }

  /**
   * Actualiza un miembro existente
   */
  updateMiembro(id: number, miembroData: any): Observable<MiembroEquipo> {
    const dto: Partial<CrearMiembroDTO> = {
      nombre: miembroData.nombre,
      apellido: miembroData.apellido || '',
      correo: miembroData.email || miembroData.correo,
      rol: miembroData.rol,
      cargo: miembroData.especialidad,
      biografia: miembroData.biografia,
      telefono: miembroData.telefono,
      activo: miembroData.estado === 'activo'
    };

    return this.actualizarMiembro(id, dto);
  }

  /**
   * Elimina un miembro
   */
  deleteMiembro(id: number): Observable<any> {
    return this.eliminarMiembro(id);
  }

  /**
   * Sube una foto para un miembro específico
   */
  uploadFotoMiembro(id: number, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', imagen);

    return this.http.post<any>(`${this.apiUrl}/admin/${id}/foto`, formData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(() => console.log(`✅ Foto actualizada para miembro id=${id}`)),
        catchError(error => {
          console.error(`❌ Error al subir foto para miembro id=${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crea un nuevo miembro del equipo con imagen
   * 
   * ⚠️ IMPORTANTE: Las fechas (fechaCreacion, fechaActualizacion) NO se envían
   * desde el frontend. El backend debe asignarlas automáticamente usando:
   * - @PrePersist para fechaCreacion
   * - @PreUpdate para fechaActualizacion
   * - O anotaciones como @CreationTimestamp y @UpdateTimestamp
   */
  crearMiembro(miembroData: CrearMiembroDTO, imagen?: File): Observable<MiembroEquipo> {
    console.log('📤 Creando miembro del equipo...', miembroData);

    // 🆕 Asegurar que el miembro sea activo por defecto y corregir mapeo
    // 🚫 NO incluir fechaCreacion ni fechaActualizacion - las asigna el backend
    const miembroConDefaults = {
      nombre: miembroData.nombre,
      apellido: miembroData.apellido || '',
      correo: miembroData.correo,
      rol: miembroData.rol,
      cargo: miembroData.cargo || '',
      biografia: miembroData.biografia || '',
      telefono: miembroData.telefono || '',
      ordenVisualizacion: miembroData.ordenVisualizacion || 0,
      activo: miembroData.activo !== undefined ? miembroData.activo : true
    };

    console.log('📋 Datos procesados para envío:', miembroConDefaults);

    const formData = new FormData();

    // 🆕 CORREGIR: Enviar los datos del miembro como Blob JSON para que tenga el Content-Type correcto
    const miembroJSON = JSON.stringify(miembroConDefaults);
    const miembroBlob = new Blob([miembroJSON], { type: 'application/json' });
    formData.append('miembro', miembroBlob);
    console.log('📋 Datos JSON del miembro:', miembroJSON);

    if (imagen) {
      formData.append('imagen', imagen, imagen.name);
      console.log('📷 Imagen adjunta para subir a Cloudinary:', imagen.name);
    }

    // 🆕 MEJORAR: Headers más específicos para debugging
    const headers: any = {
      // No establecer Content-Type aquí, Angular lo hará automáticamente para FormData
    };

    console.log('🌐 URL del endpoint:', `${this.apiUrl}/admin`);
    console.log('🔐 Headers de la petición:', headers);
    console.log('📦 FormData contenido:', {
      hasMiembro: formData.has('miembro'),
      hasImagen: formData.has('imagen'),
      miembroSize: miembroJSON.length
    });

    return this.http.post<any>(`${this.apiUrl}/admin`, formData, { headers })
      .pipe(
        map(response => {
          console.log('📥 Respuesta del backend al crear miembro:', response);

          // Si la respuesta tiene formato {success: true, data: {...}}
          if (response && response.success && response.data) {
            return response.data;
          }

          // Si viene un miembro directamente (formato anterior)
          if (response && response.id) {
            return response;
          }

          // Si es string (mensaje de éxito pero sin datos)
          if (typeof response === 'string') {
            console.log('✅ Miembro creado (respuesta texto):', response);
            // Recargar la lista para obtener el nuevo miembro
            setTimeout(() => {
              this.refrescarListaMiembros();
            }, 1000);
            return { message: response };
          }

          return response;
        }),
        tap(miembro => {
          console.log('✅ Miembro procesado exitosamente:', miembro);
          if (miembro && miembro.id) {
            this.actualizarCacheMiembro(miembro);
          }
        }),
        catchError(error => {
          console.error('❌ Error al crear miembro:', error);

          // 🆕 MEJORAR: Logging más detallado para debugging en producción
          console.error('🔍 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });

          // Si es error 400, mostrar información específica
          if (error.status === 400) {
            console.error('🚨 Error 400 - Posibles causas:');
            console.error('   - Token inválido o expirado');
            console.error('   - Datos malformados');
            console.error('   - Validación del backend falló');
            console.error('   - Headers incorrectos');

            if (error.error && error.error.message) {
              console.error('📝 Mensaje del backend:', error.error.message);
            }
          }

          // Si es error de Content-Type, el problema está en el formato de datos
          if (error.error && error.error.message && error.error.message.includes('Content-Type')) {
            console.error('🔴 Error de Content-Type - Revisar formato de FormData');
          }

          // Si es error de autenticación
          if (error.status === 401 || error.status === 403) {
            console.error('🔐 Error de autenticación - Verificar token');
          }

          return throwError(() => error);
        })
      );
  }

  /**
   * Actualiza un miembro existente
   */
  actualizarMiembro(id: number, miembroData: Partial<CrearMiembroDTO>, imagen?: File): Observable<MiembroEquipo> {
    console.log(`📤 Actualizando miembro id=${id}...`, miembroData);

    const formData = new FormData();

    // 🆕 CORREGIR: Enviar los datos del miembro como Blob JSON para que tenga el Content-Type correcto
    const miembroJSON = JSON.stringify(miembroData);
    const miembroBlob = new Blob([miembroJSON], { type: 'application/json' });
    formData.append('miembro', miembroBlob);
    console.log('📋 Datos JSON del miembro para actualizar:', miembroJSON);

    if (imagen) {
      formData.append('imagen', imagen, imagen.name);
      console.log('📷 Nueva imagen adjunta para actualizar:', imagen.name);
    }

    // 🆕 MEJORAR: Logging más detallado para debugging
    console.log('🌐 URL del endpoint PUT:', `${this.apiUrl}/admin/${id}`);
    console.log('📦 FormData contenido para actualizar:', {
      hasMiembro: formData.has('miembro'),
      hasImagen: formData.has('imagen'),
      miembroSize: miembroJSON.length,
      id: id
    });

    return this.http.put<any>(`${this.apiUrl}/admin/${id}`, formData)
      .pipe(
        map(response => {
          console.log(`📥 Respuesta del backend al actualizar miembro id=${id}:`, response);

          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(miembro => {
          console.log(`✅ Miembro actualizado id=${id}:`, miembro);
          this.actualizarCacheMiembro(miembro);
        }),
        catchError(error => {
          console.error(`❌ Error al actualizar miembro id=${id}:`, error);

          // 🆕 MEJORAR: Logging más detallado para debugging en producción
          console.error('🔍 Detalles del error PUT:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            method: 'PUT',
            message: error.message,
            error: error.error,
            id: id
          });

          // Si es error 400, mostrar información específica
          if (error.status === 400) {
            console.error('🚨 Error 400 en PUT - Posibles causas:');
            console.error('   - Datos malformados o incompletos');
            console.error('   - Validación del backend falló');
            console.error('   - ID del miembro no existe');
            console.error('   - Campos requeridos faltantes');
            console.error('   - Formato de datos incorrecto');

            if (error.error && error.error.message) {
              console.error('📝 Mensaje del backend:', error.error.message);
            }

            // 🆕 Mostrar los datos que se están enviando
            console.error('📤 Datos enviados que causaron error:', miembroData);
          }

          // Si es error de autenticación
          if (error.status === 401 || error.status === 403) {
            console.error('🔐 Error de autenticación en PUT - Verificar token');
          }

          return throwError(() => error);
        })
      );
  }

  /**
   * Cambia el estado de un miembro (activar/desactivar)
   */
  cambiarEstado(id: number, activo: boolean): Observable<MiembroEquipo> {
    console.log(`🔄 Cambiando estado miembro id=${id} a ${activo ? 'activo' : 'inactivo'}`);

    const params = new HttpParams().set('activo', activo.toString());

    return this.http.patch<any>(`${this.apiUrl}/admin/${id}/estado`, {}, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(miembro => {
          console.log(`✅ Estado cambiado id=${id}:`, miembro);
          this.actualizarCacheMiembro(miembro);
        }),
        catchError(error => {
          console.error(`❌ Error al cambiar estado id=${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Elimina un miembro permanentemente
   */
  eliminarMiembro(id: number): Observable<any> {
    console.log(`🗑️ Eliminando miembro id=${id}...`);

    return this.http.delete<any>(`${this.apiUrl}/admin/${id}`)
      .pipe(
        tap(() => {
          console.log(`✅ Miembro eliminado id=${id}`);
          this.eliminarDelCache(id);
        }),
        catchError(error => {
          console.error(`❌ Error al eliminar miembro id=${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene estadísticas generales del equipo
   */
  obtenerEstadisticas(): Observable<EstadisticasEquipo> {
    console.log('📊 Obteniendo estadísticas del equipo...');

    return this.http.get<any>(`${this.apiUrl}/admin/estadisticas`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(stats => {
          console.log('✅ Estadísticas obtenidas:', stats);
          this.estadisticasSubject.next(stats);
        }),
        catchError(this.handleError<EstadisticasEquipo>('obtenerEstadisticas'))
      );
  }

  /**
   * Obtiene estadísticas detalladas de un miembro específico
   */
  obtenerEstadisticasMiembro(id: number): Observable<EstadisticasMiembro> {
    console.log(`📊 Obteniendo estadísticas del miembro id=${id}...`);

    return this.http.get<any>(`${this.apiUrl}/admin/${id}/estadisticas`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return response;
        }),
        tap(stats => console.log(`✅ Estadísticas miembro id=${id}:`, stats)),
        catchError(this.handleError<EstadisticasMiembro>(`obtenerEstadisticasMiembro id=${id}`))
      );
  }

  /**
   * Obtiene top miembros más productivos
   */
  obtenerTopProductivos(limite: number = 10): Observable<EstadisticasMiembro[]> {
    console.log(`🏆 Obteniendo top ${limite} miembros productivos...`);

    const params = new HttpParams().set('limite', limite.toString());

    return this.http.get<any>(`${this.apiUrl}/admin/top-productivos`, { params })
      .pipe(
        map(response => {
          let topMiembros = [];
          if (response.success && response.data) {
            topMiembros = response.data;
          } else if (Array.isArray(response)) {
            topMiembros = response;
          }

          console.log(`✅ Top ${topMiembros.length} miembros productivos:`, topMiembros);
          return topMiembros;
        }),
        catchError(this.handleError<EstadisticasMiembro[]>('obtenerTopProductivos', []))
      );
  }

  /**
   * Búsqueda avanzada para admin (incluye inactivos)
   */
  buscarMiembrosAdmin(texto: string, incluirInactivos: boolean = true): Observable<MiembroEquipo[]> {
    const params = new HttpParams()
      .set('texto', texto.trim())
      .set('incluirInactivos', incluirInactivos.toString());

    return this.http.get<any>(`${this.apiUrl}/admin/buscar`, { params })
      .pipe(
        map(response => {
          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          console.log(`🔍 Búsqueda admin "${texto}": ${miembros.length} resultados`);
          return miembros;
        }),
        catchError(this.handleError<MiembroEquipo[]>('buscarMiembrosAdmin', []))
      );
  }

  // ===== MÉTODOS DE INTEGRACIÓN CON ESTADÍSTICAS =====

  /**
   * Actualiza estadísticas de un miembro cuando crea/edita/elimina noticias
   */
  actualizarEstadisticasNoticia(autorId: number, accion: 'crear' | 'eliminar' | 'destacar' | 'no-destacar'): Observable<any> {
    if (!autorId) return of(null);

    console.log(`📊 Actualizando estadísticas de noticia para miembro ${autorId}: ${accion}`);

    const payload = { autorId, accion, tipo: 'noticia' };

    return this.http.post<any>(`${this.apiUrl}/admin/actualizar-estadisticas`, payload)
      .pipe(
        tap(() => console.log(`✅ Estadísticas de noticia actualizadas para miembro ${autorId}`)),
        catchError(error => {
          console.warn(`⚠️ Error actualizando estadísticas de noticia para miembro ${autorId}:`, error);
          return of(null); // No afectar operación principal
        })
      );
  }

  /**
   * Actualiza estadísticas de un miembro cuando crea/elimina eventos
   */
  actualizarEstadisticasEvento(creadorId: number, accion: 'crear' | 'eliminar'): Observable<any> {
    if (!creadorId) return of(null);

    console.log(`📊 Actualizando estadísticas de evento para miembro ${creadorId}: ${accion}`);

    const payload = { creadorId, accion, tipo: 'evento' };

    return this.http.post<any>(`${this.apiUrl}/admin/actualizar-estadisticas`, payload)
      .pipe(
        tap(() => console.log(`✅ Estadísticas de evento actualizadas para miembro ${creadorId}`)),
        catchError(error => {
          console.warn(`⚠️ Error actualizando estadísticas de evento para miembro ${creadorId}:`, error);
          return of(null); // No afectar operación principal
        })
      );
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Refresca la lista de miembros
   */
  refrescarListaMiembros(): void {
    console.log('🔄 Refrescando lista de miembros...');
    this.listarMiembrosActivosConRespaldo().subscribe({
      next: (miembros) => {
        console.log('✅ Lista de miembros refrescada:', miembros.length);
      },
      error: (error) => {
        console.warn('⚠️ Error al refrescar lista de miembros:', error);
      }
    });
  }

  private actualizarCacheMiembro(miembro: MiembroEquipo): void {
    const miembrosActuales = this.miembrosSubject.value;
    const index = miembrosActuales.findIndex(m => m.id === miembro.id);

    if (index !== -1) {
      miembrosActuales[index] = miembro;
    } else {
      miembrosActuales.push(miembro);
    }

    this.miembrosSubject.next([...miembrosActuales]);
  }

  private eliminarDelCache(id: number): void {
    const miembrosActuales = this.miembrosSubject.value;
    const miembrosFiltrados = miembrosActuales.filter(m => m.id !== id);
    this.miembrosSubject.next(miembrosFiltrados);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`❌ Error en ${operation}:`, error);

      // Log adicional del error
      if (error.status) {
        console.error(`Status: ${error.status}, URL: ${error.url}`);
      }

      // Devolver resultado seguro
      return of(result as T);
    };
  }

  /**
   * Método alternativo para obtener miembros activos (incluye consulta admin como respaldo)
   */
  listarMiembrosActivosConRespaldo(): Observable<MiembroEquipo[]> {
    console.log('🔄 Obteniendo miembros activos con respaldo...');

    return this.http.get<any>(`${this.apiUrl}/publico`)
      .pipe(
        map(response => {
          console.log('✅ Respuesta endpoint público:', response);

          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          // Si no hay miembros en público, intentar desde admin
          if (miembros.length === 0) {
            console.log('⚠️ No hay miembros en endpoint público, verificando en admin...');
            this.verificarMiembrosEnAdmin();
          }

          // Ordenar por ordenVisualizacion
          miembros.sort((a: any, b: any) => (a.ordenVisualizacion || 0) - (b.ordenVisualizacion || 0));

          this.miembrosSubject.next(miembros);
          return miembros;
        }),
        catchError(error => {
          console.warn('⚠️ Error en endpoint público, intentando admin:', error);
          return this.verificarMiembrosEnAdmin();
        })
      );
  }

  /**
   * Verifica si hay miembros en el endpoint admin (para debugging)
   */
  private verificarMiembrosEnAdmin(): Observable<MiembroEquipo[]> {
    console.log('🔍 Verificando miembros en endpoint admin...');

    return this.http.get<any>(`${this.apiUrl}/admin`)
      .pipe(
        map(response => {
          console.log('📋 Miembros en admin:', response);

          let miembros = [];
          if (response.success && response.data) {
            miembros = response.data;
          } else if (Array.isArray(response)) {
            miembros = response;
          }

          // Filtrar solo los activos para el público
          const miembrosActivos = miembros.filter((m: any) => m.activo === true);
          console.log(`🔍 De ${miembros.length} miembros total, ${miembrosActivos.length} están activos`);

          this.miembrosSubject.next(miembrosActivos);
          return miembrosActivos;
        }),
        catchError(error => {
          console.error('❌ Error también en endpoint admin:', error);
          return of([]);
        })
      );
  }
}
