import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Bar, BarEvent } from '../../../core/models/bar.model';

@Component({
  selector: 'app-detalle-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, CopCurrencyPipe],
  template: `
    @if (bar(); as item) {
      <div class="space-y-8 pb-16">
        
        <!-- Hero Header -->
        <div class="relative h-80 sm:h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          <img
            [src]="item.imageUrl"
            [alt]="item.name"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

          <div class="absolute top-6 left-6">
            <a
              routerLink="/bares"
              class="px-4 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 backdrop-blur-md border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <span class="material-icons text-sm">arrow_back</span>
              Volver a Bares
            </a>
          </div>

          <div class="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="px-3 py-1 rounded-full bg-violet-600/80 backdrop-blur-md text-xs font-bold text-white">
                  {{ item.musicGenre }}
                </span>
                <span class="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md text-xs font-bold text-black flex items-center gap-1">
                  <span class="material-icons text-sm">star</span>
                  {{ item.rating }} Calificación
                </span>
              </div>
              <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white">
                {{ item.name }}
              </h1>
              <p class="text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                <span class="material-icons text-sm text-fuchsia-400">location_on</span>
                {{ item.address }}, {{ item.city }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <a
                routerLink="/tienda"
                class="px-5 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-transform active:scale-95"
              >
                <span class="material-icons text-base">liquor</span>
                Pedir Bebidas en este Bar
              </a>
            </div>
          </div>
        </div>

        <!-- Venue info grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left details & features (2 cols) -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2">
                <span class="material-icons text-violet-400">info</span>
                Acerca del Establecimiento
              </h2>
              <p class="text-sm text-zinc-300 leading-relaxed">
                {{ item.description }}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
                <div class="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <span class="text-xs text-zinc-500 block">Horario Habitual</span>
                  <span class="text-xs font-bold text-zinc-200 mt-1 block">{{ item.openingHours }}</span>
                </div>
                <div class="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <span class="text-xs text-zinc-500 block">Capacidad Aforo</span>
                  <span class="text-xs font-bold text-zinc-200 mt-1 block">{{ item.capacity }} personas</span>
                </div>
                <div class="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <span class="text-xs text-zinc-500 block">Reservas & Info</span>
                  <span class="text-xs font-bold text-zinc-200 mt-1 block">{{ item.phone }}</span>
                </div>
              </div>

              @if (item.features && item.features.length) {
                <div class="pt-2">
                  <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Comodidades y Servicios</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (f of item.features; track f) {
                      <span class="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5">
                        <span class="material-icons text-sm text-emerald-400">check_circle</span>
                        {{ f }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Events at this bar -->
            <div class="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2">
                <span class="material-icons text-fuchsia-400">confirmation_number</span>
                Próximos Eventos en {{ item.name }}
              </h2>

              @if (barEvents().length > 0) {
                <div class="space-y-3">
                  @for (ev of barEvents(); track ev.id) {
                    <div class="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div class="flex items-center gap-4">
                        <img [src]="ev.imageUrl" [alt]="ev.title" class="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <div class="text-xs text-violet-400 font-semibold">{{ ev.date }} • {{ ev.time }}</div>
                          <h4 class="text-sm font-bold text-zinc-100">{{ ev.title }}</h4>
                          <p class="text-xs text-zinc-400">{{ ev.description }}</p>
                        </div>
                      </div>

                      <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <span class="font-extrabold text-sm text-fuchsia-400">{{ ev.coverPrice | copCurrency }}</span>
                        <button
                          (click)="barService.buyTicket(ev.id!)"
                          class="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 shadow-md transition-colors"
                        >
                          Reservar Cover
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-xs text-zinc-500 py-4 text-center">
                  No hay eventos programados en este momento. ¡Vuelve pronto!
                </p>
              }
            </div>
          </div>

          <!-- Right Sidebar (Location, Reservation, Bar Owner actions) -->
          <div class="space-y-6">
            <div class="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h3 class="font-heading text-base font-bold text-white flex items-center gap-2">
                <span class="material-icons text-emerald-400">table_restaurant</span>
                Reserva de Mesa Directa
              </h3>
              <p class="text-xs text-zinc-400">
                Garantiza tu mesa o palco para este fin de semana sin filas en la puerta.
              </p>

              <div class="space-y-2">
                <a
                  href="https://wa.me/573124567890?text=Hola,%20deseo%20reservar%20una%20mesa%20en%20Nocturna"
                  target="_blank"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <span class="material-icons text-base">chat</span>
                  Reservar por WhatsApp
                </a>

                <a
                  routerLink="/suscripciones"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <span class="material-icons text-base">star</span>
                  Entrada VIP Sin Fila con Clubber Pass
                </a>
              </div>
            </div>

            <!-- Map placeholder / Nightlife zone -->
            <div class="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <h3 class="font-heading text-base font-bold text-white flex items-center gap-2">
                <span class="material-icons text-rose-400">near_me</span>
                Ubicación
              </h3>
              <div class="h-36 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                <span class="material-icons text-3xl text-fuchsia-500 mb-1">pin_drop</span>
                <span class="text-xs font-bold text-zinc-200">{{ item.address }}</span>
                <span class="text-[11px] text-zinc-500">{{ item.city }}, Colombia</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    } @else {
      <div class="text-center py-24 space-y-4">
        <span class="material-icons text-5xl text-zinc-600">storefront</span>
        <h2 class="text-xl font-bold text-white">Bar no encontrado</h2>
        <a routerLink="/bares" class="inline-block text-xs font-bold text-violet-400 hover:underline">
          Volver a la lista de bares
        </a>
      </div>
    }
  `
})
export class DetalleBarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public barService = inject(BarService);
  public auth = inject(AuthService);

  public bar = signal<Bar | undefined>(undefined);
  public barEvents = signal<BarEvent[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const found = this.barService.getBarById(id);
        this.bar.set(found);
        this.barEvents.set(this.barService.events().filter(e => e.barId === id));
      }
    });
  }
}
