import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'bares',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/bares/lista/lista-bares.component').then(m => m.ListaBaresComponent)
      },
      {
        path: 'explorar',
        loadComponent: () => import('./features/bares/venue-explorer/venue-explorer').then(m => m.VenueExplorer)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./features/bares/eventos/eventos.component').then(m => m.EventosComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/bares/venue-detail/venue-detail').then(m => m.VenueDetail)
      },
      {
        path: ':id/reservar',
        loadComponent: () => import('./features/reservas/booking-system/booking-system').then(m => m.BookingSystem)
      }
    ]
  },
  {
    path: 'reservas',
    loadComponent: () => import('./features/reservas/booking-system/booking-system').then(m => m.BookingSystem)
  },
  {
    path: 'musica',
    loadComponent: () => import('./features/musica/musica.component').then(m => m.MusicaComponent)
  },
  {
    path: 'tienda',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tienda/productos/productos.component').then(m => m.ProductosComponent)
      },
      {
        path: 'carrito',
        loadComponent: () => import('./features/tienda/carrito/carrito.component').then(m => m.CarritoComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/tienda/pedidos/pedidos.component').then(m => m.PedidosComponent),
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: 'suscripciones',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/suscripciones/vip-subscription/vip-subscription.component').then(m => m.VIPSubscriptionComponent)
      },
      {
        path: 'vip',
        loadComponent: () => import('./features/suscripciones/vip-subscription/vip-subscription.component').then(m => m.VIPSubscriptionComponent)
      },
      {
        path: 'planes',
        loadComponent: () => import('./features/suscripciones/planes/planes.component').then(m => m.PlanesComponent)
      },
      {
        path: 'mi-suscripcion',
        loadComponent: () => import('./features/suscripciones/mi-suscripcion/mi-suscripcion.component').then(m => m.MiSuscripcionComponent),
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
      },
      {
        path: 'recuperar-password',
        loadComponent: () => import('./features/auth/recuperar-password/recuperar-password.component').then(m => m.RecuperarPasswordComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
