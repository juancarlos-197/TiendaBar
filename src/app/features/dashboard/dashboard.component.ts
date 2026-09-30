import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BarService } from '../../core/services/bar.service';
import { MusicService } from '../../core/services/music.service';
import { StoreService } from '../../core/services/store.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Welcome Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-violet-950/60 to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <!-- Background Glows -->
        <div class="absolute -top-20 -right-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="space-y-2 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Plataforma Nocturna • Popayán & Rumba Viva
            </div>
            <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bienvenido, {{ auth.userProfile()?.name || 'Clubber' }}
            </h1>
            <p class="text-zinc-400 text-sm leading-relaxed">
              Explora la cartelera de bares y discotecas, escucha los sets de DJs residentes, ordena tragos a tu mesa y gestiona eventos con Firestore en tiempo real.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <a
              routerLink="/bares"
              class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30 transition-transform active:scale-95 flex items-center gap-2"
            >
              <span class="material-icons text-base">explore</span>
              Explorar Bares
            </a>
            <a
              routerLink="/tienda"
              class="px-4 py-2.5 rounded-xl font-semibold text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-2"
            >
              <span class="material-icons text-base">local_bar</span>
              Carta de Bebidas
            </a>
          </div>
        </div>
      </div>

      <!-- KPI Statistics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-violet-500/30 transition-all group">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-zinc-400">Bares & Discotecas</span>
            <div class="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons">nightlife</span>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-white">{{ barService.bars().length }}</div>
          <p class="text-[11px] text-zinc-500 mt-1">Locales y salas registradas</p>
        </div>

        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-fuchsia-500/30 transition-all group">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-zinc-400">Eventos Activos</span>
            <div class="w-10 h-10 rounded-xl bg-fuchsia-600/15 text-fuchsia-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons">event</span>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-white">{{ barService.events().length }}</div>
          <p class="text-[11px] text-zinc-500 mt-1">Conciertos y noches temáticas</p>
        </div>

        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-zinc-400">Tragos & Botellas</span>
            <div class="w-10 h-10 rounded-xl bg-amber-600/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons">liquor</span>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-white">{{ storeService.products().length }}</div>
          <p class="text-[11px] text-zinc-500 mt-1">En catálogo de bebidas</p>
        </div>

        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-zinc-400">Membresía VIP</span>
            <div class="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons">verified</span>
            </div>
          </div>
          <div class="text-2xl font-extrabold text-white truncate">
            {{ subService.currentSubscription()?.planName || 'Free Pass' }}
          </div>
          <p class="text-[11px] text-emerald-400 mt-1">Estado: {{ subService.currentSubscription()?.status || 'Inactivo' }}</p>
        </div>

      </div>

      <!-- Live Events Showcase -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2">
              <span class="material-icons text-fuchsia-400">local_fire_department</span>
              Eventos Destacados de la Semana
            </h2>
            <p class="text-xs text-zinc-400">Asegura tu cover y reserva tu entrada antes de agotar aforo</p>
          </div>
          <a routerLink="/bares/eventos" class="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1">
            Ver cartelera completa
            <span class="material-icons text-sm">arrow_forward</span>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (event of barService.events(); track event.id) {
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col group">
              <div class="relative h-44 overflow-hidden bg-zinc-800">
                <img
                  [src]="event.imageUrl"
                  [alt]="event.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-fuchsia-400">
                  {{ event.coverPrice | copCurrency }}
                </div>
                <div class="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-zinc-200">
                  📍 {{ event.barName }}
                </div>
              </div>

              <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 text-xs text-violet-400 font-semibold mb-1">
                    <span class="material-icons text-sm">calendar_today</span>
                    {{ event.date }} • {{ event.time }}
                  </div>
                  <h3 class="font-bold text-sm text-zinc-100 line-clamp-1 group-hover:text-fuchsia-400 transition-colors">
                    {{ event.title }}
                  </h3>
                  <p class="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {{ event.description }}
                  </p>
                </div>

                <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span class="text-[11px] text-zinc-500">
                    Quedan: <strong class="text-zinc-300">{{ event.ticketStock }}</strong> entradas
                  </span>
                  <button
                    (click)="barService.buyTicket(event.id!)"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-colors"
                  >
                    Comprar Cover
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Music Tracks & Playlists Row -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Trending Tracks (2 columns) -->
        <div class="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span class="material-icons text-violet-400">headphones</span>
                Tracks & Sets de la Noche
              </h2>
              <p class="text-xs text-zinc-400">Haz clic en reproducir para escuchar el ambiente del club</p>
            </div>
            <a routerLink="/musica" class="text-xs font-semibold text-violet-400 hover:underline">
              Ver catálogo
            </a>
          </div>

          <div class="divide-y divide-zinc-800/60">
            @for (song of musicService.songs(); track song.id) {
              <div class="py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/30 px-3 rounded-xl transition-colors group">
                <div class="flex items-center gap-3 min-w-0">
                  <button
                    (click)="musicService.playSong(song)"
                    class="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all"
                  >
                    <span class="material-icons text-xl">
                      {{ musicService.currentTrack()?.id === song.id && musicService.isPlaying() ? 'pause' : 'play_arrow' }}
                    </span>
                  </button>
                  <div class="min-w-0">
                    <h4 class="text-sm font-semibold text-zinc-200 truncate group-hover:text-violet-300">
                      {{ song.title }}
                    </h4>
                    <p class="text-xs text-zinc-500 truncate">{{ song.artistName }} • {{ song.album }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                  <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300">{{ song.genre }}</span>
                  <span>{{ song.duration }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Curated Playlists Preview -->
        <div class="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 class="font-heading text-lg font-bold text-white flex items-center gap-2 mb-1">
              <span class="material-icons text-amber-400">playlist_play</span>
              Playlists para la Rumba
            </h2>
            <p class="text-xs text-zinc-400 mb-4">Selecciones curadas para cada momento de la fiesta</p>

            <div class="space-y-3">
              @for (pl of musicService.playlists(); track pl.id) {
                <div
                  (click)="playFirstPlaylistSong(pl)"
                  class="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-fuchsia-500/40 cursor-pointer transition-all group"
                >
                  <img
                    [src]="pl.coverUrl"
                    [alt]="pl.title"
                    class="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <h4 class="text-xs font-bold text-zinc-200 truncate group-hover:text-fuchsia-400">
                      {{ pl.title }}
                    </h4>
                    <p class="text-[11px] text-zinc-500 truncate">{{ pl.genre }} • {{ pl.description }}</p>
                  </div>
                  <span class="material-icons text-zinc-600 group-hover:text-white transition-colors">
                    play_circle
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-zinc-800">
            <a
              routerLink="/suscripciones"
              class="w-full py-2.5 px-4 rounded-xl text-center block text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              👑 Desbloquea Playlists Exclusivas VIP
            </a>
          </div>
        </div>

      </section>

      <!-- Active Orders Status (Orders preview) -->
      @if (storeService.orders().length > 0) {
        <section class="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span class="material-icons text-emerald-400">receipt_long</span>
                Órdenes & Pedidos Recientes a la Barra
              </h2>
              <p class="text-xs text-zinc-400">Monitorea el estado de tus cócteles y botellas en tiempo real</p>
            </div>
            <a routerLink="/tienda/pedidos" class="text-xs font-semibold text-emerald-400 hover:underline">
              Ver todos los pedidos
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (order of storeService.orders().slice(0, 2); track order.id) {
              <div class="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-mono font-bold text-zinc-300">#{{ order.id }}</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30': order.status === 'PREPARING' || order.status === 'PENDING',
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': order.status === 'DELIVERED' || order.status === 'SERVED',
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30': order.status === 'CANCELLED'
                      }"
                    >
                      {{ order.status }}
                    </span>
                  </div>

                  <p class="text-xs font-semibold text-zinc-200">
                    Destino: <span class="text-fuchsia-400">{{ order.deliveryMethod }} - {{ order.tableNumber || 'Barra' }}</span>
                  </p>

                  <div class="mt-2 space-y-1">
                    @for (item of order.items; track item.product.id) {
                      <div class="text-xs text-zinc-400 flex justify-between">
                        <span>{{ item.quantity }}x {{ item.product.name }}</span>
                        <span>{{ (item.product.price * item.quantity) | copCurrency }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span class="text-zinc-500">Total:</span>
                  <span class="font-extrabold text-white text-sm">{{ order.total | copCurrency }}</span>
                </div>
              </div>
            }
          </div>
        </section>
      }

    </div>
  `
})
export class DashboardComponent {
  public auth = inject(AuthService);
  public barService = inject(BarService);
  public musicService = inject(MusicService);
  public storeService = inject(StoreService);
  public subService = inject(SubscriptionService);

  playFirstPlaylistSong(pl: any) {
    if (this.musicService.songs().length > 0) {
      this.musicService.playSong(this.musicService.songs()[0]);
    }
  }
}
