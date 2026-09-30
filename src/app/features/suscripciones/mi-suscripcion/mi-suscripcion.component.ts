import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-mi-suscripcion',
  standalone: true,
  imports: [CommonModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16 max-w-3xl mx-auto">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-amber-400 text-3xl">badge</span>
            Mi Pase VIP Digital
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Presenta esta credencial en la puerta de los clubes para ingresar por Fila Express
          </p>
        </div>

        <a
          routerLink="/suscripciones"
          class="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          Cambiar de Plan
        </a>
      </div>

      @if (subService.currentSubscription(); as sub) {
        <!-- VIP Card Holographic Design -->
        <div class="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-violet-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 text-white">
          
          <!-- Gloss shimmer background effects -->
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none"></div>

          <!-- Card Top Bar -->
          <div class="flex items-center justify-between relative z-10 mb-8">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-fuchsia-600 flex items-center justify-center font-bold text-black shadow-lg">
                <span class="material-icons text-xl text-white">nightlife</span>
              </div>
              <div>
                <span class="font-heading text-base font-extrabold tracking-wider block">NOCTURNA CLUB</span>
                <span class="text-[9px] text-amber-300 uppercase tracking-widest font-semibold">Membresía Oficial VIP</span>
              </div>
            </div>

            <span
              class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
              [ngClass]="sub.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'"
            >
              ● {{ sub.status === 'ACTIVE' ? 'Activo' : sub.status }}
            </span>
          </div>

          <!-- Card Body: QR & User Details -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 my-6">
            <div class="space-y-3 text-center sm:text-left">
              <div>
                <span class="text-[11px] text-zinc-400 uppercase tracking-wider block">Titular del Pase</span>
                <h2 class="font-heading text-2xl font-black text-white">
                  {{ auth.userProfile()?.name || 'Clubber Nocturna' }}
                </h2>
                <span class="text-xs text-zinc-400">{{ sub.userEmail }}</span>
              </div>

              <div class="flex flex-wrap gap-4 pt-2">
                <div>
                  <span class="text-[10px] text-zinc-500 uppercase block">Categoría</span>
                  <span class="text-sm font-bold text-amber-400">{{ sub.planName }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-zinc-500 uppercase block">Válido Hasta</span>
                  <span class="text-sm font-bold text-zinc-200">{{ sub.nextBillingDate }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-zinc-500 uppercase block">Cuota Mensual</span>
                  <span class="text-sm font-bold text-zinc-200">{{ sub.price | copCurrency }}</span>
                </div>
              </div>
            </div>

            <!-- Digital QR Pass -->
            <div class="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
              <span class="material-icons text-6xl text-zinc-950">qr_code_2</span>
              <span class="text-[8px] font-mono text-zinc-700 font-bold uppercase mt-0.5">
                VIP-{{ sub.planId }}-PASS
              </span>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 relative z-10">
            <span>Presenta este código con tu documento de identidad</span>
            <span class="font-mono text-amber-400">ID: {{ sub.userId }}</span>
          </div>

        </div>

        <!-- Perks breakdown -->
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 class="font-heading text-base font-bold text-white flex items-center gap-2">
            <span class="material-icons text-emerald-400">verified</span>
            Beneficios Incluidos en tu Membresía
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
            @for (perk of sub.perks; track perk) {
              <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                <span class="material-icons text-emerald-400 text-sm">check_circle</span>
                <span>{{ perk }}</span>
              </div>
            }
          </div>

          @if (sub.status === 'ACTIVE') {
            <div class="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                (click)="subService.cancelSubscription()"
                class="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Cancelar membresía para el próximo ciclo
              </button>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class MiSuscripcionComponent {
  public subService = inject(SubscriptionService);
  public auth = inject(AuthService);
}
