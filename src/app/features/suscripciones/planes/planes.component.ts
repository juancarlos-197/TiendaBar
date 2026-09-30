import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { SubscriptionPlan } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-12 pb-16 max-w-6xl mx-auto">
      
      <!-- Header -->
      <div class="text-center space-y-3 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <span class="material-icons text-sm">stars</span>
          Nocturna Clubber Membership
        </div>
        <h1 class="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Pase VIP & Membresías Exclusivas
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Disfruta de entrada preferencial sin fila en todos los bares afiliados, covers gratuitos cada mes, descuentos en botellas y acceso a backstage con DJs.
        </p>

        @if (subService.currentSubscription(); as cur) {
          <div class="pt-2">
            <span class="text-xs text-zinc-400">
              Actualmente tienes el plan: <strong class="text-fuchsia-400">{{ cur.planName }}</strong> ({{ cur.status }})
            </span>
            <a routerLink="/suscripciones/mi-suscripcion" class="text-xs font-bold text-amber-400 hover:underline ml-2">
              Ver mi Carnet Digital VIP →
            </a>
          </div>
        }
      </div>

      <!-- Pricing Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        @for (plan of subService.plans(); track plan.id) {
          <div
            class="relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl"
            [ngClass]="{
              'bg-gradient-to-b from-fuchsia-950/40 via-zinc-900 to-zinc-900 border-2 border-fuchsia-500/60 -translate-y-2': plan.popular,
              'bg-zinc-900/80 border border-zinc-800': !plan.popular
            }"
          >
            <!-- Popular Badge -->
            @if (plan.popular) {
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-lg shadow-fuchsia-600/30">
                {{ plan.badge }}
              </div>
            }

            <div>
              <div class="mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {{ plan.name }}
                </span>
                <div class="mt-2 flex items-baseline gap-1">
                  <span class="text-3xl sm:text-4xl font-extrabold text-white">
                    {{ plan.price === 0 ? 'Gratis' : (plan.price | copCurrency) }}
                  </span>
                  @if (plan.price > 0) {
                    <span class="text-xs text-zinc-400">/ mes</span>
                  }
                </div>
              </div>

              <!-- Features checklist -->
              <ul class="space-y-3 my-6 text-xs text-zinc-300">
                @for (feat of plan.features; track feat) {
                  <li class="flex items-start gap-2.5">
                    <span class="material-icons text-base text-emerald-400 shrink-0 mt-0.5">check_circle</span>
                    <span>{{ feat }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Action Button -->
            <div class="pt-6 border-t border-zinc-800/80">
              <button
                (click)="onSubscribe(plan)"
                class="w-full py-3 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                [ngClass]="{
                  'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white shadow-fuchsia-600/30': plan.popular,
                  'bg-amber-500 hover:bg-amber-400 text-black': plan.id === 'plan-black',
                  'bg-zinc-800 hover:bg-zinc-700 text-zinc-200': plan.id === 'plan-basic'
                }"
              >
                <span class="material-icons text-sm">verified</span>
                {{ plan.price === 0 ? 'Continuar con Plan Gratuito' : 'Activar Membresía VIP' }}
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class PlanesComponent {
  public subService = inject(SubscriptionService);
  public auth = inject(AuthService);
  private router = inject(Router);

  async onSubscribe(plan: SubscriptionPlan) {
    await this.subService.subscribeToPlan(plan);
    this.router.navigate(['/suscripciones/mi-suscripcion']);
  }
}
