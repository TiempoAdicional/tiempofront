import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

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
        path: 'noticias/editar',
        loadComponent: () =>
          import('./admin/noticias/editar/editar.component').then(m => m.EditarComponent)
      },
      {
        path: 'noticias/listar',
        loadComponent: () =>
          import('./admin/noticias/listar/listar.component').then(m => m.ListarComponent)
      },
      {
        path: 'noticias/editar/:id',
        loadComponent: () => import('./admin/noticias/editar/editar.component').then(m => m.EditarComponent)
      },
      {
        path: 'noticias/detalle/:id',
        loadComponent: () => import('./admin/noticias/detalle/detalle.component').then(m => m.DetalleComponent)
      },
      {
        path: 'eventos/crear',
        loadComponent: () => import('./admin/eventos/crear/crear.component').then(m => m.CrearEventoComponent)
      },
      {
        path: 'eventos/listar',
        loadComponent: () => import('./admin/eventos/listar/listar.component').then(m => m.ListarComponent)
      },
      {
        path: 'eventos/editar/:id',
        loadComponent: () => import('./admin/eventos/editar/editar.component').then(m => m.EditarComponent)
      }
    ]
  },

  // 404 fallback
  { path: '**', redirectTo: 'login' }
];
