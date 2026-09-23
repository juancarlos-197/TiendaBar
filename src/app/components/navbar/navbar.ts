import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3 cursor-pointer" (click)="selectTab('dashboard')">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30">
              <span class="material-icons text-2xl text-slate-950 font-bold">local_bar</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-400 bg-clip-text text-transparent">
                  Tienda & Bar
                </span>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Control
                </span>
              </div>
              <p class="text-xs text-slate-400 font-medium hidden sm:block">
                Inventario, Préstamos y Trazabilidad
              </p>
            </div>
          </div>

          <!-- Navigation Links (Desktop) -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner">
            <button
              (click)="selectTab('dashboard')"
              [class]="activeTab() === 'dashboard' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-lg">dashboard</span>
              Dashboard
            </button>

            <button
              (click)="selectTab('inventory')"
              [class]="activeTab() === 'inventory' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-lg">inventory_2</span>
              Inventario
            </button>

            <button
              (click)="selectTab('loans')"
              [class]="activeTab() === 'loans' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 relative">
              <span class="material-icons text-lg">assignment</span>
              Préstamos
              @if (overdueCount() > 0) {
                <span class="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-rose-600/50">
                  {{ overdueCount() }}
                </span>
              }
            </button>

            <button
              (click)="selectTab('history')"
              [class]="activeTab() === 'history' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-lg">history</span>
              Historial
            </button>

            <button
              (click)="selectTab('users')"
              [class]="activeTab() === 'users' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-lg">group</span>
              Usuarios
            </button>

            <button
              (click)="selectTab('subscriptions')"
              [class]="activeTab() === 'subscriptions' 
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'"
              class="px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-lg">card_membership</span>
              Suscripciones
            </button>
          </nav>

          <!-- User Section & Auth Controls -->
          <div class="flex items-center gap-3">
            @if (firebaseService.currentUser(); as user) {
              <div class="flex items-center gap-3 bg-slate-800/80 pl-3 pr-2 py-1.5 rounded-2xl border border-slate-700/60">
                <div class="text-right hidden lg:block">
                  <div class="text-xs font-semibold text-slate-100 flex items-center justify-end gap-1.5">
                    <span>{{ user.displayName || user.email }}</span>
                  </div>
                  <div class="flex items-center justify-end gap-1">
                    <span 
                      class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded"
                      [ngClass]="{
                        'bg-amber-500/20 text-amber-300': firebaseService.currentUserProfile()?.role === 'admin',
                        'bg-blue-500/20 text-blue-300': firebaseService.currentUserProfile()?.role === 'operador',
                        'bg-emerald-500/20 text-emerald-300': firebaseService.currentUserProfile()?.role === 'cliente'
                      }">
                      {{ firebaseService.currentUserProfile()?.role || 'operador' }}
                    </span>
                  </div>
                </div>

                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold flex items-center justify-center text-sm shadow ring-2 ring-amber-400/20 overflow-hidden">
                  @if (user.photoURL) {
                    <img [src]="user.photoURL" [alt]="user.displayName || 'Avatar'" class="w-full h-full object-cover">
                  } @else {
                    <span>{{ (user.displayName || user.email || 'U')[0].toUpperCase() }}</span>
                  }
                </div>

                <button
                  (click)="handleLogout()"
                  title="Cerrar Sesión"
                  class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                  <span class="material-icons text-lg">logout</span>
                </button>
              </div>
            } @else {
              <button
                (click)="openAuth.emit()"
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
                <span class="material-icons text-lg">login</span>
                <span>Acceder</span>
              </button>
            }
          </div>

        </div>

        <!-- Mobile Navigation Bar -->
        <div class="flex md:hidden items-center justify-around py-2.5 border-t border-slate-800 gap-1 overflow-x-auto">
          <button
            (click)="selectTab('dashboard')"
            [class]="activeTab() === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2">
            <span class="material-icons text-xl">dashboard</span>
            <span>Inicio</span>
          </button>
          <button
            (click)="selectTab('inventory')"
            [class]="activeTab() === 'inventory' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2">
            <span class="material-icons text-xl">inventory_2</span>
            <span>Inventario</span>
          </button>
          <button
            (click)="selectTab('loans')"
            [class]="activeTab() === 'loans' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2 relative">
            <span class="material-icons text-xl">assignment</span>
            <span>Préstamos</span>
            @if (overdueCount() > 0) {
              <span class="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
            }
          </button>
          <button
            (click)="selectTab('history')"
            [class]="activeTab() === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2">
            <span class="material-icons text-xl">history</span>
            <span>Historial</span>
          </button>
          <button
            (click)="selectTab('users')"
            [class]="activeTab() === 'users' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2">
            <span class="material-icons text-xl">group</span>
            <span>Usuarios</span>
          </button>
          <button
            (click)="selectTab('subscriptions')"
            [class]="activeTab() === 'subscriptions' ? 'text-amber-400 font-bold' : 'text-slate-400'"
            class="flex flex-col items-center text-xs py-1 px-2">
            <span class="material-icons text-xl">card_membership</span>
            <span>Suscripción</span>
          </button>
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public activeTab = input.required<string>();
  public overdueCount = input<number>(0);

  public tabChange = output<string>();
  public openAuth = output<void>();

  public selectTab(tab: string) {
    this.tabChange.emit(tab);
  }

  public async handleLogout() {
    try {
      await this.firebaseService.logout();
      this.toastService.info('Sesión cerrada', 'Has cerrado sesión exitosamente.');
    } catch (err) {
      console.error(err);
    }
  }
}
