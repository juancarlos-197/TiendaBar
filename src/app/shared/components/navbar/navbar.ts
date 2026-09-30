import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StoreService } from '../../../core/services/store.service';
import { UserRole } from '../../../core/models/user.model';
import { QuickSearchComponent } from '../quick-search/quick-search.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, QuickSearchComponent],
  template: `
    <header class="sticky top-0 z-30 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-xl">
      <!-- Top banner for Role Demonstration -->
      <div class="bg-gradient-to-r from-violet-950/70 via-fuchsia-950/50 to-zinc-950 border-b border-violet-800/20 px-4 py-1.5 text-xs text-zinc-300">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
              [ngClass]="{
                'bg-rose-500/20 text-rose-400 border border-rose-500/30': auth.userRole() === 'ADMIN',
                'bg-amber-500/20 text-amber-400 border border-amber-500/30': auth.userRole() === 'BAR_OWNER',
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': auth.userRole() === 'USER'
              }"
            >
              Rol Activo: {{ auth.userRole() }}
            </span>
            <span class="text-zinc-400 hidden sm:inline">•</span>
            <span class="text-zinc-400 text-[11px] hidden sm:inline">
              Simula permisos y guards cambiando de perfil:
            </span>
          </div>

          <!-- Quick switcher buttons -->
          <div class="flex items-center gap-1.5">
            <button
              (click)="switchRole('ADMIN')"
              class="px-2 py-0.5 rounded text-[11px] transition-colors"
              [ngClass]="auth.userRole() === 'ADMIN' ? 'bg-rose-600 text-white font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'"
            >
              👑 Admin
            </button>
            <button
              (click)="switchRole('BAR_OWNER')"
              class="px-2 py-0.5 rounded text-[11px] transition-colors"
              [ngClass]="auth.userRole() === 'BAR_OWNER' ? 'bg-amber-600 text-white font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'"
            >
              🍹 Dueño Bar
            </button>
            <button
              (click)="switchRole('USER')"
              class="px-2 py-0.5 rounded text-[11px] transition-colors"
              [ngClass]="auth.userRole() === 'USER' ? 'bg-emerald-600 text-white font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'"
            >
              👤 Cliente
            </button>
          </div>
        </div>
      </div>

      <!-- Main Navigation Bar -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Brand Logo -->
          <div class="flex items-center gap-8">
            <a routerLink="/dashboard" class="flex items-center gap-2.5 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
                <span class="material-icons text-white text-xl">nightlife</span>
              </div>
              <div>
                <span class="font-heading font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-violet-300">
                  NOCTURNA
                </span>
                <span class="block text-[10px] tracking-widest text-zinc-400 font-medium uppercase -mt-1">
                  Bares & Clubes
                </span>
              </div>
            </a>

            <!-- Desktop Links -->
            <nav class="hidden lg:flex items-center gap-1 text-sm font-medium">
              <a
                routerLink="/dashboard"
                routerLinkActive="bg-zinc-800/80 text-fuchsia-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg">dashboard</span>
                Dashboard
              </a>

              <a
                routerLink="/bares"
                routerLinkActive="bg-zinc-800/80 text-fuchsia-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg">local_bar</span>
                Bares & Eventos
              </a>

              <a
                routerLink="/reservas"
                routerLinkActive="bg-zinc-800/80 text-fuchsia-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg text-fuchsia-400">event_seat</span>
                Reservas
              </a>

              <a
                routerLink="/musica"
                routerLinkActive="bg-zinc-800/80 text-fuchsia-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg">queue_music</span>
                Música & Sets
              </a>

              <a
                routerLink="/tienda"
                routerLinkActive="bg-zinc-800/80 text-fuchsia-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg">liquor</span>
                Bebidas & Tienda
              </a>

              <a
                routerLink="/suscripciones"
                routerLinkActive="bg-zinc-800/80 text-amber-400 shadow-sm"
                class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
              >
                <span class="material-icons text-lg text-amber-400">verified</span>
                VIP Pass
              </a>

              @if (auth.isAdmin()) {
                <a
                  routerLink="/usuarios"
                  routerLinkActive="bg-zinc-800/80 text-rose-400 shadow-sm"
                  class="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-2"
                >
                  <span class="material-icons text-lg text-rose-400">group</span>
                  Usuarios
                </a>
              }
            </nav>
          </div>

          <!-- Right side actions -->
          <div class="flex items-center gap-2.5 sm:gap-3">
            
            <!-- Desktop Quick Search Component directly connected to Firestore -->
            <div class="hidden md:block">
              <app-quick-search></app-quick-search>
            </div>

            <!-- Cart Link with Badge -->
            <a
              routerLink="/tienda/carrito"
              class="relative p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
              title="Carrito de compras"
            >
              <span class="material-icons text-xl">shopping_bag</span>
              @if (store.cartCount() > 0) {
                <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center animate-bounce">
                  {{ store.cartCount() }}
                </span>
              }
            </a>

            <!-- User Auth state / Profile -->
            @if (auth.isAuthenticated()) {
              <div class="flex items-center gap-3 pl-2 border-l border-zinc-800">
                <div class="hidden md:flex flex-col text-right">
                  <span class="text-xs font-semibold text-zinc-200 truncate max-w-[140px]">
                    {{ auth.userProfile()?.name }}
                  </span>
                  <span class="text-[10px] text-zinc-400 truncate max-w-[140px]">
                    {{ auth.userProfile()?.email }}
                  </span>
                </div>

                <div class="relative group">
                  <button class="w-10 h-10 rounded-xl overflow-hidden border border-violet-500/40 focus:outline-none ring-2 ring-violet-500/20">
                    <img
                      [src]="auth.userProfile()?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'"
                      alt="Avatar"
                      class="w-full h-full object-cover"
                    />
                  </button>

                  <!-- Hover Dropdown Menu -->
                  <div class="absolute right-0 mt-2 w-48 py-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div class="px-4 py-2 border-b border-zinc-800 text-xs">
                      <p class="text-zinc-400">Conectado como:</p>
                      <p class="font-bold text-fuchsia-400">{{ auth.userRole() }}</p>
                    </div>

                    <a routerLink="/dashboard" class="flex items-center gap-2 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                      <span class="material-icons text-sm">dashboard</span> Mi Panel
                    </a>

                    <a routerLink="/tienda/pedidos" class="flex items-center gap-2 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                      <span class="material-icons text-sm">receipt_long</span> Mis Pedidos
                    </a>

                    <a routerLink="/suscripciones/mi-suscripcion" class="flex items-center gap-2 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                      <span class="material-icons text-sm">badge</span> Mi Suscripción
                    </a>

                    <div class="border-t border-zinc-800 mt-1 pt-1">
                      <button
                        (click)="auth.logout()"
                        class="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30"
                      >
                        <span class="material-icons text-sm">logout</span> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="flex items-center gap-2">
                <a
                  routerLink="/auth/login"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  Ingresar
                </a>
                <a
                  routerLink="/auth/registro"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-600/30 transition-transform active:scale-95"
                >
                  Registrarse
                </a>
              </div>
            }

            <!-- Mobile menu button -->
            <button
              (click)="mobileMenuOpen = !mobileMenuOpen"
              class="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              <span class="material-icons">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
            </button>

          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        @if (mobileMenuOpen) {
          <div class="lg:hidden py-4 border-t border-zinc-800 flex flex-col gap-3">
            
            <!-- Mobile Quick Search -->
            <div class="px-1 pb-1">
              <app-quick-search></app-quick-search>
            </div>

            <a
              (click)="mobileMenuOpen = false"
              routerLink="/dashboard"
              class="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base">dashboard</span> Dashboard
            </a>
            <a
              (click)="mobileMenuOpen = false"
              routerLink="/bares"
              class="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base">local_bar</span> Bares & Eventos
            </a>
            <a
              (click)="mobileMenuOpen = false"
              routerLink="/reservas"
              class="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base text-fuchsia-400">event_seat</span> Reservas
            </a>
            <a
              (click)="mobileMenuOpen = false"
              routerLink="/musica"
              class="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base">queue_music</span> Música
            </a>
            <a
              (click)="mobileMenuOpen = false"
              routerLink="/tienda"
              class="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base">liquor</span> Tienda & Bebidas
            </a>
            <a
              (click)="mobileMenuOpen = false"
              routerLink="/suscripciones"
              class="px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-zinc-900 flex items-center gap-2"
            >
              <span class="material-icons text-base">verified</span> VIP Pass
            </a>
            @if (auth.isAdmin()) {
              <a
                (click)="mobileMenuOpen = false"
                routerLink="/usuarios"
                class="px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-zinc-900 flex items-center gap-2"
              >
                <span class="material-icons text-base">group</span> Usuarios
              </a>
            }
          </div>
        }
      </div>
    </header>
  `
})
export class NavbarComponent {
  public auth = inject(AuthService);
  public store = inject(StoreService);
  public mobileMenuOpen = false;

  switchRole(role: UserRole) {
    this.auth.switchRole(role);
  }
}
