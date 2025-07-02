import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { SuperAdminGuard } from './core/guards/super-admin.guard';
import { UsuarioGuard } from './core/guards/usuario.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ===============================
  // 📰 USUARIO ROUTES (Public/Registered Users)
  // ===============================
  {
    path: 'usuarios',
    canActivate: [UsuarioGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./usuarios/dashboard/dashboard.component').then(m => m.UsuarioDashboardComponent)
      },
      {
        path: 'noticia/:id',
        loadComponent: () =>
          import('./usuarios/noticia-detalle/noticia-detalle.component').then(m => m.NoticiaDetalleComponent)
      },
      {
        path: 'evento/:id',
        loadComponent: () =>
          import('./usuarios/evento-detalle/evento-detalle.component').then(m => m.EventoDetalleComponent)
      },
      {
        path: 'partidos',
        loadComponent: () =>
          import('./admin/eventos/partidos/partidos-hoy.component').then(m => m.PartidosHoyComponent)
      }
    ]
  },

  // ===============================
  // 🔧 ADMIN ROUTES
  // ===============================
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'noticias/crear',
        loadComponent: () =>
          import('./admin/noticias/crear/crear.component').then(m => m.CrearNoticiaComponent)
      },
      {
        path: 'noticias/editar/:id',
        loadComponent: () => import('./admin/noticias/editar/editar.component').then(m => m.EditarNoticiaComponent)
      },
      {
        path: 'noticias/listar',
        loadComponent: () =>
          import('./admin/noticias/listar/listar.component').then(m => m.ListarComponent)
      },
      {
        path: 'noticias/detalle/:id',
        loadComponent: () =>
          import('./admin/noticias/detalle/detalle.component').then(m => m.DetalleComponent)
      },

      // EVENTOS
      {
        path: 'eventos/crear',
        loadComponent: () =>
          import('./admin/eventos/crear/crear.component').then(m => m.CrearEventoComponent)
      },
      {
        path: 'eventos/listar',
        loadComponent: () =>
          import('./admin/eventos/listar/listar.component').then(m => m.ListarComponent)
      },
      {
        path: 'eventos/editar',
        loadComponent: () =>
          import('./admin/eventos/editar/editar.component').then(m => m.EditarComponent)
      },

      {
        path: 'eventos/editar/:id',
        loadComponent: () =>
          import('./admin/eventos/editar/editar.component').then(m => m.EditarComponent)
      },

      // PARTIDOS (dentro de eventos)
      {
        path: 'eventos/partidos',
        loadComponent: () =>
          import('./admin/eventos/partidos/partidos-hoy.component').then(m => m.PartidosHoyComponent)
      },
      {
        path: 'eventos/gestionar-partidos',
        loadComponent: () =>
          import('./admin/eventos/gestionar-partidos/gestionar-partidos.component').then(m => m.GestionarPartidosComponent)
      },
      // SECCIONES
      {
        path: 'secciones/crear',
        loadComponent: () =>
          import('./admin/secciones/crear/crear-editar/crear-editar.component').then(m => m.CrearEditarComponent)
      },
      {
        path: 'secciones/listar',
        loadComponent: () =>
          import('./admin/secciones/listar/listar/listar.component').then(m => m.ListarComponent)
      },
      {
        path: 'secciones/editar/:id',
        loadComponent: () =>
          import('./admin/secciones/crear/crear-editar/crear-editar.component').then(m => m.CrearEditarComponent)
      },
      {
        path: 'secciones/vista-previa',
        loadComponent: () =>
          import('./admin/secciones/vista-previa/vista-previa.component').then(m => m.VistaPreviaComponent)
      },
    ]
  },

  // ===============================
  // 🔐 SUPER ADMIN ROUTES
  // ===============================
  {
    path: 'super-admin',
    canActivate: [SuperAdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./super-admin/dashboard/dashboard.component').then(m => m.SuperAdminDashboardComponent)
      }
    ]
  },

  // ruta para la pagina de acceso no autorizado
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // fallback
  { path: '**', redirectTo: 'login' }
];