import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { SuperAdminGuard } from './core/guards/super-admin.guard';
import { UsuarioGuard } from './core/guards/usuario.guard';
import { EditorJefeGuard } from './core/guards/editor-jefe.guard';
import { noticiaPublicaGuard } from './core/guards/noticia-publica.guard';
import { perfilEquipoGuard } from './core/guards/perfil-equipo.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Public dashboard route (for non-authenticated users)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./usuarios/dashboard/dashboard.component').then(m => m.UsuarioDashboardComponent)
  },
  
  // Public detail routes - URLs para compartir noticias y contenido público
  {
    path: 'noticia/:id',
    canActivate: [noticiaPublicaGuard],
    loadComponent: () =>
      import('./pages/noticia-publica/noticia-publica.component').then(m => m.NoticiaPublicaComponent)
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./usuarios/evento-detalle/evento-detalle.component').then(m => m.EventoDetalleComponent)
  },
  {
    path: 'equipo',
    loadComponent: () =>
      import('./pages/equipo-publico/equipo-publico.component').then(m => m.EquipoPublicoComponent)
  },
  
  // Rutas públicas de partidos - accesibles para todos los usuarios
  {
    path: 'partidos',
    loadComponent: () =>
      import('./pages/partidos/partidos-hoy.component').then(m => m.PartidosHoyComponent)
  },
  {
    path: 'partidos/tabla',
    loadComponent: () =>
      import('./pages/partidos/partidos-hoy.component').then(m => m.PartidosHoyComponent)
  },
  {
    path: 'partidos/hoy',
    loadComponent: () =>
      import('./pages/partidos/partidos-hoy.component').then(m => m.PartidosHoyComponent)
  },
  
  {
    path: 'noticias',
    loadComponent: () =>
      import('./usuarios/noticias-lista/noticias-lista.component').then(m => m.NoticiasListaComponent)
  },
   {
    path: 'historia',
    loadComponent: () =>
      import('./pages/historia/historia.component').then(m => m.HistoriaComponent)
  },


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
        path: 'noticias',
        loadComponent: () =>
          import('./usuarios/noticias-lista/noticias-lista.component').then(m => m.NoticiasListaComponent)
      }
    ]
  },

  // ===============================
  // 🔧 ADMIN ROUTES
  // ===============================
  {
    path: 'admin',
    canActivate: [AdminGuard, perfilEquipoGuard],
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

      // PARTIDOS (Gestión administrativa solamente)
      {
        path: 'eventos/gestionar-partidos',
        loadComponent: () =>
          import('./pages/gestionar-partidos/gestionar-partidos.component').then(m => m.GestionarPartidosComponent)
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

      // EQUIPO - Solo para EDITOR_JEFE
      {
        path: 'equipo',
        canActivate: [EditorJefeGuard],
        loadComponent: () =>
          import('./admin/equipo/equipo.component').then(m => m.AdminEquipoComponent)
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