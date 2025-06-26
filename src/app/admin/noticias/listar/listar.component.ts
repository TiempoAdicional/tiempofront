import { Component, OnInit, inject } from '@angular/core';
import { NoticiaService, Noticia } from '../noticia.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router ,RouterModule  } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.scss']
})
export class ListarComponent implements OnInit {
  private noticiaService = inject(NoticiaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  noticias: Noticia[] = [];
  noticiasFiltradas: Noticia[] = [];
  filtro: string = '';
  cargando = false;
  error: string | null = null;

  noticiaSeleccionada: Noticia | null = null;
  mostrarConfirmacion = false;

  ngOnInit(): void {
    this.cargarNoticiasDelAutor();
  }

  cargarNoticiasDelAutor(): void {
    const autorId = this.authService.obtenerIdUsuario();
    if (!autorId) {
      this.error = 'No se pudo obtener el ID del usuario';
      return;
    }

    this.cargando = true;
    this.noticiaService.listarPorAutor(autorId).subscribe({
      next: (data) => {
        this.noticias = data;
        this.noticiasFiltradas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al listar noticias del autor:', err);
        this.error = 'Error al cargar las noticias del autor';
        this.cargando = false;
      }
    });
  }

  filtrar(): void {
    const texto = this.filtro.toLowerCase();
    this.noticiasFiltradas = this.noticias.filter(n =>
      n.titulo.toLowerCase().includes(texto)
    );
  }

  verDetalle(noticiaId: number): void {
    this.router.navigate(['/admin/noticias/detalle', noticiaId]);
  }

  editarNoticia(noticiaId: number): void {
    this.router.navigate(['/admin/noticias/editar', noticiaId]);
    console.log('ID a editar:', noticiaId);
  }

  confirmarEliminacion(noticia: Noticia): void {
    this.noticiaSeleccionada = noticia;
    this.mostrarConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.noticiaSeleccionada = null;
    this.mostrarConfirmacion = false;
  }

  eliminarNoticiaConfirmada(): void {
    if (!this.noticiaSeleccionada) return;

    this.noticiaService.eliminarNoticia(this.noticiaSeleccionada.id).subscribe({
      next: () => {
        alert('✅ Noticia eliminada correctamente.');
        this.noticias = this.noticias.filter(n => n.id !== this.noticiaSeleccionada!.id);
        this.noticiasFiltradas = this.noticiasFiltradas.filter(n => n.id !== this.noticiaSeleccionada!.id);
        this.cancelarEliminacion();
      },
      error: (err) => {
        console.error('❌ Error al eliminar la noticia:', err);
        alert('❌ No se pudo eliminar la noticia.');
        this.cancelarEliminacion();
      }
    });
  }
}
