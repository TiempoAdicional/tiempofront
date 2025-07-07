import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { ComentariosService, ComentarioDTO, CrearComentarioDTO, InfoComentariosDTO, ApiResponseDTO } from '../../core/services/comentarios.service';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './comentarios.component.html',
  styleUrls: ['./comentarios.component.scss'],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ transform: 'scale(1)' }),
        animate('1s ease-in-out', style({ transform: 'scale(1.05)' })),
        animate('1s ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ComentariosComponent implements OnInit, OnChanges {
  @Input() noticiaId!: number;
  @Input() cargando = false;
  @Input() permitirComentarios = true;
  @Input() esAdmin = false;
  
  @Output() comentarioCreado = new EventEmitter<ComentarioDTO>();
  @Output() comentarioAprobado = new EventEmitter<ComentarioDTO>();
  @Output() comentarioEliminado = new EventEmitter<number>();

  private fb = inject(FormBuilder);
  private comentariosService = inject(ComentariosService);
  private snackBar = inject(MatSnackBar);

  // 🆕 Propiedades para manejar la nueva lógica de comentarios
  infoComentarios: InfoComentariosDTO = {
    comentarios: [],
    totalComentarios: 0,
    comentariosAprobados: 0,
    puedeComentary: false,
    limite: 5,
    restantes: 0
  };

  comentarioForm!: FormGroup;
  enviando = false;
  cargandoComentarios = false;

  ngOnInit(): void {
    this.initForm();
    this.cargarComentarios();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['noticiaId'] && this.noticiaId) {
      this.cargarComentarios();
    }
  }

  private initForm(): void {
    this.comentarioForm = this.fb.group({
      autor: ['', [Validators.required, Validators.minLength(2)]],
      contenido: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      email: ['', [Validators.email]] // Campo opcional
    });
  }

  /**
   * 🆕 Cargar comentarios usando el nuevo endpoint /info
   */
  cargarComentarios(): void {
    if (!this.noticiaId) return;

    this.cargandoComentarios = true;
    
    this.comentariosService.obtenerInfoComentarios(this.noticiaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.infoComentarios = response.data;
          console.log('✅ Información de comentarios cargada:', this.infoComentarios);
        } else {
          console.error('❌ Error al cargar información de comentarios:', response.message);
        }
        this.cargandoComentarios = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar comentarios:', error);
        this.cargandoComentarios = false;
      }
    });
  }

  enviarComentario(): void {
    if (this.comentarioForm.invalid) return;

    // 🆕 Verificar si puede comentar antes de enviar
    if (!this.infoComentarios.puedeComentary) {
      this.snackBar.open('Esta noticia ya tiene el máximo de comentarios permitidos (5)', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.enviando = true;
    const formValue = this.comentarioForm.value;
    
    const request: CrearComentarioDTO = {
      noticiaId: this.noticiaId,
      contenido: formValue.contenido
    };

    this.comentariosService.crearComentario(request).subscribe({
      next: (response) => {
        console.log('✅ Comentario creado:', response);
        
        if (response.success) {
          this.comentarioForm.reset();
          this.comentarioCreado.emit(response.data);
          
          // Recargar comentarios para actualizar el contador
          this.cargarComentarios();
          
          // Mensaje diferente para admin vs usuario
          const mensaje = this.esAdmin 
            ? '¡Comentario enviado exitosamente!'
            : '¡Comentario enviado! Será visible una vez que el editor lo apruebe.';
            
          this.snackBar.open(mensaje, 'Cerrar', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open(response.message || 'Error al enviar el comentario.', 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
        
        this.enviando = false;
      },
      error: (error) => {
        console.error('❌ Error al crear comentario:', error);
        this.enviando = false;
        this.snackBar.open('Error al enviar el comentario. Inténtalo nuevamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  aprobar(comentario: ComentarioDTO): void {
    if (this.esAdmin && comentario.id) {
      this.comentariosService.aprobarComentario(comentario.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.comentarioAprobado.emit(response.data);
            // Recargar comentarios para actualizar el estado
            this.cargarComentarios();
            this.snackBar.open('Comentario aprobado exitosamente.', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al aprobar comentario:', error);
          this.snackBar.open('Error al aprobar el comentario.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  eliminar(comentario: ComentarioDTO): void {
    if (this.esAdmin && comentario.id) {
      this.comentariosService.eliminarComentario(comentario.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.comentarioEliminado.emit(comentario.id);
            // Recargar comentarios para actualizar el contador
            this.cargarComentarios();
            this.snackBar.open('Comentario eliminado exitosamente.', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al eliminar comentario:', error);
          this.snackBar.open('Error al eliminar el comentario.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  /**
   * 🆕 Métodos de utilidad para la nueva UI
   */
  get comentarios(): ComentarioDTO[] {
    return this.infoComentarios.comentarios || [];
  }

  get puedeComentary(): boolean {
    return this.infoComentarios.puedeComentary && this.permitirComentarios;
  }

  get mensajeLimite(): string {
    if (this.infoComentarios.restantes === 0) {
      return 'Esta noticia ya tiene el máximo de comentarios permitidos';
    }
    return `Quedan ${this.infoComentarios.restantes} comentarios disponibles`;
  }

  get porcentajeLimite(): number {
    return (this.infoComentarios.totalComentarios / this.infoComentarios.limite) * 100;
  }

  /**
   * Métodos de utilidad para la vista
   */
  formatearFecha(fechaString: string): string {
    return this.comentariosService.formatearFecha(fechaString);
  }

  getClaseEstado(comentario: ComentarioDTO): string {
    if (comentario.aprobado) return 'estado-aprobado';
    return 'estado-pendiente';
  }

  getIconoEstado(comentario: ComentarioDTO): string {
    if (comentario.aprobado) return 'check_circle';
    return 'pending';
  }

  getTextoEstado(comentario: ComentarioDTO): string {
    if (comentario.aprobado) return 'Aprobado';
    return 'Pendiente';
  }

  trackByComentario(index: number, comentario: ComentarioDTO): any {
    return comentario.id || index;
  }
}
