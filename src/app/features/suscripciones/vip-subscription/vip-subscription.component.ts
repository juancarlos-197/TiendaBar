import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseService, OperationType } from '../../../core/services/firebase.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

export interface VIPTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  badge: string;
  tagline: string;
  accentColor: string;
  perks: string[];
  popular?: boolean;
}

export interface ExclusiveEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venueName: string;
  minTierRequired: 'plan-silver' | 'plan-black';
  badgeText: string;
  description: string;
  imageUrl: string;
  spotsLeft: number;
  perksIncluded: string[];
}

@Component({
  selector: 'app-vip-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, CopCurrencyPipe],
  template: `
    <div class="space-y-12 pb-20 max-w-6xl mx-auto">
      
      <!-- 1. Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-amber-950/30 to-zinc-950 border border-amber-500/30 p-8 sm:p-12 shadow-2xl">
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-lg">
            <span class="material-icons text-sm text-amber-400">workspace_premium</span>
            Membresía Exclusiva VIP • Nocturna Pass
          </div>

          <h1 class="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Desbloquea Fiestas Secretas & Acceso VIP en Discotecas
          </h1>

          <p class="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Mejora tu cuenta al estatus VIP en tiempo real con Cloud Firestore. Entra sin filas a los mejores clubes, disfruta de barra libre de cortesía y accede a fiestas clandestinas reservadas solo para miembros.
          </p>

          <!-- Current status chip -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            @if (isVip()) {
              <div class="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 border border-amber-500/50 flex items-center gap-2 text-xs font-bold text-amber-300 shadow-md">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Membresía Activa: <strong>{{ currentTierName() }}</strong></span>
                <span class="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[10px] ml-1">VIP DESBLOQUEADO</span>
              </div>
            } @else {
              <div class="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <span class="material-icons text-sm text-zinc-500">lock</span>
                <span>Nivel Actual: <strong>Clubber Básico (Gratis)</strong> — Los eventos exclusivos están bloqueados.</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 2. Interactive VIP Tier Upgrades -->
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Planes de Membresía</span>
          <h2 class="font-heading text-2xl sm:text-3xl font-black text-white">
            Elige tu Nivel de Experiencia Nocturna
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Sube de nivel para desbloquear entradas express, consumos de autor y las fiestas más codiciadas de la ciudad.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          @for (tier of tiers; track tier.id) {
            <div
              class="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl"
              [ngClass]="{
                'bg-gradient-to-b from-fuchsia-950/40 via-zinc-900 to-zinc-950 border-2 border-fuchsia-500/80 -translate-y-2 shadow-fuchsia-500/10': tier.popular,
                'bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-950 border-2 border-amber-500/60': tier.id === 'plan-black',
                'bg-zinc-900/80 border border-zinc-800': tier.id === 'plan-basic'
              }"
            >
              <!-- Popular Badge -->
              @if (tier.popular) {
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg">
                  {{ tier.badge }}
                </div>
              } @else if (tier.id === 'plan-black') {
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                  {{ tier.badge }}
                </div>
              }

              <div class="space-y-4">
                <div>
                  <h3 class="font-heading text-xl font-extrabold text-white">{{ tier.name }}</h3>
                  <p class="text-xs text-zinc-400 mt-1">{{ tier.tagline }}</p>
                </div>

                <!-- Price display -->
                <div class="pt-2 pb-4 border-b border-zinc-800">
                  @if (tier.price === 0) {
                    <div class="flex items-baseline gap-1">
                      <span class="font-heading text-4xl font-extrabold text-white">Gratis</span>
                      <span class="text-xs text-zinc-500">para siempre</span>
                    </div>
                  } @else {
                    <div class="flex items-baseline gap-1">
                      <span class="font-heading text-3xl sm:text-4xl font-black text-white">
                        {{ tier.price | copCurrency }}
                      </span>
                      <span class="text-xs text-zinc-400">/ {{ tier.interval }}</span>
                    </div>
                  }
                </div>

                <!-- Perks checklist -->
                <ul class="space-y-2.5 text-xs">
                  @for (perk of tier.perks; track perk) {
                    <li class="flex items-start gap-2 text-zinc-300">
                      <span class="material-icons text-sm text-emerald-400 shrink-0 mt-0.5">check_circle</span>
                      <span>{{ perk }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Action button -->
              <div class="pt-8">
                @if (currentTierId() === tier.id) {
                  <button
                    disabled
                    class="w-full py-3 px-4 rounded-xl font-bold text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <span class="material-icons text-sm text-emerald-400">verified</span>
                    Plan Actual Activo
                  </button>
                } @else {
                  <button
                    (click)="openUpgradeModal(tier)"
                    class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                    [ngClass]="{
                      'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-fuchsia-600/30': tier.popular,
                      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-amber-500/20': tier.id === 'plan-black',
                      'bg-zinc-800 hover:bg-zinc-700 text-zinc-200': tier.id === 'plan-basic'
                    }"
                  >
                    <span class="material-icons text-sm">
                      {{ tier.id === 'plan-basic' ? 'keyboard_return' : 'arrow_upward' }}
                    </span>
                    {{ tier.id === 'plan-basic' ? 'Regresar a Básico' : 'Mejorar a ' + tier.name }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- 3. Exclusive Events Showcase (Unlocked for VIPs, Locked for Non-VIPs) -->
      <div class="space-y-6 pt-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div class="space-y-1">
            <span class="text-xs font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-1">
              <span class="material-icons text-sm">lock_open</span>
              Cartelera Exclusiva
            </span>
            <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Fiestas Privadas & Secret Underground Sets
            </h2>
            <p class="text-xs text-zinc-400">
              Eventos con cupos ultralimitados que solo los miembros con suscripción VIP activa en Firestore pueden ver y reservar.
            </p>
          </div>

          @if (!isVip()) {
            <button
              (click)="openUpgradeModal(tiers[1])"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:opacity-90 flex items-center gap-2 shadow-lg shrink-0"
            >
              <span class="material-icons text-sm">key</span>
              Desbloquear Todos los Eventos
            </button>
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (ev of exclusiveEvents; track ev.id) {
            <div class="relative bg-zinc-900/90 border rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group transition-all"
              [ngClass]="canAccessEvent(ev) ? 'border-amber-500/40 hover:border-amber-400' : 'border-zinc-800 opacity-95'"
            >
              <!-- Image Banner with Lock Overlay -->
              <div class="relative h-56 bg-zinc-950 overflow-hidden">
                <img
                  [src]="ev.imageUrl"
                  [alt]="ev.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  [ngClass]="!canAccessEvent(ev) ? 'blur-sm grayscale-[40%]' : ''"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

                <!-- Floating top indicators -->
                <div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-lg"
                    [ngClass]="canAccessEvent(ev) 
                      ? 'bg-amber-400 text-zinc-950 border-amber-300' 
                      : 'bg-zinc-950/80 text-zinc-400 border-zinc-700'"
                  >
                    {{ ev.badgeText }}
                  </span>

                  <!-- Status Lock/Unlock Badge -->
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-bold"
                    [ngClass]="canAccessEvent(ev)
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'"
                  >
                    <span class="material-icons text-xs">
                      {{ canAccessEvent(ev) ? 'lock_open' : 'lock' }}
                    </span>
                    <span>{{ canAccessEvent(ev) ? 'DESBLOQUEADO' : 'EXCLUSIVO VIP' }}</span>
                  </div>
                </div>

                <!-- Bottom Title Overlay -->
                <div class="absolute bottom-3 left-4 right-4">
                  <span class="text-[10px] font-bold text-amber-300 block uppercase tracking-wider">{{ ev.venueName }}</span>
                  <h3 class="font-heading text-base font-bold text-white line-clamp-1">{{ ev.title }}</h3>
                </div>

                <!-- Locked Watermark Overlay when NOT authorized -->
                @if (!canAccessEvent(ev)) {
                  <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div class="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                      <span class="material-icons text-2xl">lock</span>
                    </div>
                    <span class="text-xs font-extrabold text-white">Requiere Membresía VIP</span>
                    <button
                      (click)="openUpgradeModal(tiers[1])"
                      class="px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-transform active:scale-95"
                    >
                      Mejorar a VIP →
                    </button>
                  </div>
                }
              </div>

              <!-- Card Body -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-2.5 text-xs">
                  <div class="flex items-center justify-between text-zinc-400">
                    <span class="flex items-center gap-1">
                      <span class="material-icons text-xs text-fuchsia-400">calendar_today</span>
                      {{ ev.date }} • {{ ev.time }}
                    </span>
                    <span class="text-amber-400 font-semibold">{{ ev.spotsLeft }} pases restantes</span>
                  </div>

                  <p class="text-zinc-300 text-xs line-clamp-2 leading-relaxed">
                    {{ ev.description }}
                  </p>

                  <!-- VIP Benefits for this event -->
                  <div class="space-y-1.5 pt-2 border-t border-zinc-800">
                    <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Beneficios en este evento:</span>
                    @for (bp of ev.perksIncluded; track bp) {
                      <div class="flex items-center gap-1.5 text-[11px] text-zinc-300">
                        <span class="material-icons text-xs text-amber-400">stars</span>
                        <span>{{ bp }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-3 border-t border-zinc-800">
                  @if (canAccessEvent(ev)) {
                    <button
                      (click)="rsvpVipEvent(ev)"
                      class="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <span class="material-icons text-sm">confirmation_number</span>
                      Obtener Pase de Acceso Gratuito
                    </button>
                  } @else {
                    <button
                      (click)="openUpgradeModal(ev.minTierRequired === 'plan-black' ? tiers[2] : tiers[1])"
                      class="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span class="material-icons text-sm text-amber-400">lock</span>
                      Desbloquear con VIP Pass
                    </button>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      </div>

      <!-- 4. Interactive Upgrade Modal with Firestore persistence -->
      @if (showUpgradeModal && targetTier) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              (click)="showUpgradeModal = false"
              class="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <span class="material-icons">close</span>
            </button>

            @if (!upgradeSuccess) {
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <span class="material-icons text-2xl">workspace_premium</span>
                  </div>
                  <div>
                    <h3 class="font-heading text-lg font-bold text-white">Confirmar Nivel VIP</h3>
                    <p class="text-xs text-zinc-400">Actualización en tiempo real en Cloud Firestore</p>
                  </div>
                </div>

                <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Nivel Seleccionado:</span>
                    <strong class="text-white">{{ targetTier.name }}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Tarifa Mensual:</span>
                    <strong class="text-amber-400 font-mono text-sm">{{ targetTier.price | copCurrency }}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Acceso a Fiestas Secretas:</span>
                    <span class="text-emerald-400 font-bold">100% Desbloqueado</span>
                  </div>
                </div>

                <!-- Payment simulation selection -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-zinc-300">Método de Activación:</label>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      (click)="selectedMethod = 'PSE'"
                      class="p-2.5 rounded-xl border flex items-center gap-2 transition-all"
                      [ngClass]="selectedMethod === 'PSE' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                    >
                      <span class="material-icons text-base text-fuchsia-400">account_balance</span>
                      PSE / Nequi / Daviplata
                    </button>

                    <button
                      type="button"
                      (click)="selectedMethod = 'CARD'"
                      class="p-2.5 rounded-xl border flex items-center gap-2 transition-all"
                      [ngClass]="selectedMethod === 'CARD' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                    >
                      <span class="material-icons text-base text-amber-400">credit_card</span>
                      Tarjeta de Crédito
                    </button>
                  </div>
                </div>

                <div class="pt-2">
                  <button
                    (click)="confirmUpgrade()"
                    [disabled]="isProcessing"
                    class="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 via-fuchsia-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 shadow-xl shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    @if (isProcessing) {
                      <span class="material-icons text-base animate-spin">refresh</span>
                      Guardando en Cloud Firestore...
                    } @else {
                      <span class="material-icons text-base">check_circle</span>
                      Activar Membresía VIP Inmediata
                    }
                  </button>
                </div>
              </div>
            } @else {
              <!-- Success Confirmation Card -->
              <div class="text-center py-3 space-y-4">
                <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl animate-bounce">
                  <span class="material-icons text-3xl">verified</span>
                </div>

                <div class="space-y-1">
                  <h3 class="font-heading text-xl font-black text-white">¡Bienvenido a la Élite VIP!</h3>
                  <p class="text-xs text-zinc-400">
                    Tu estatus VIP ha sido persistido en Firestore. Todos los eventos exclusivos y filas express están ahora activos.
                  </p>
                </div>

                <!-- Digital Pass Voucher -->
                <div class="p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 text-left space-y-2 text-xs">
                  <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span class="text-zinc-400">Pase Digital No:</span>
                    <span class="font-mono font-bold text-amber-400">{{ generatedVipCode }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Titular:</span>
                    <span class="font-bold text-white">{{ userEmail() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Nivel:</span>
                    <span class="font-bold text-fuchsia-400">{{ targetTier.name }}</span>
                  </div>
                </div>

                <button
                  (click)="showUpgradeModal = false"
                  class="w-full py-3 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                >
                  Explorar Mis Beneficios Desbloqueados
                </button>
              </div>
            }

          </div>
        </div>
      }

    </div>
  `
})
export class VIPSubscriptionComponent implements OnInit {
  private fb = inject(FirebaseService);
  public auth = inject(AuthService);
  private notify = inject(NotificationService);

  public tiers: VIPTier[] = [
    {
      id: 'plan-basic',
      name: 'Clubber Básico',
      price: 0,
      interval: 'mes',
      badge: 'GRATUITO',
      tagline: 'Ideal para salidas casuales',
      accentColor: 'zinc',
      perks: [
        'Acceso al catálogo de bares y discotecas',
        'Playlist y música pública de DJs',
        'Pedidos directos a la mesa con QR',
        'Notificaciones de fiestas públicas'
      ]
    },
    {
      id: 'plan-silver',
      name: 'VIP Silver Night',
      price: 39000,
      interval: 'mes',
      badge: 'MÁS POPULAR',
      tagline: 'Fila express y acceso a fiestas VIP',
      accentColor: 'fuchsia',
      popular: true,
      perks: [
        'Fila Express sin esperas en todos los clubes aliados',
        '2 Covers gratuitos cada mes (ahorra hasta $50.000 COP)',
        'Acceso desbloqueado a eventos exclusivos VIP',
        '15% de descuento en botellas seleccionadas',
        'Trago de cortesía en el mes de tu cumpleaños'
      ]
    },
    {
      id: 'plan-black',
      name: 'Black Diamond Clubber',
      price: 89000,
      interval: 'mes',
      badge: 'EXPERIENCIA ULTRA VIP',
      tagline: 'Acceso total e invitaciones clandestinas',
      accentColor: 'amber',
      perks: [
        'Entrada ilimitada sin pagar cover en cualquier local asociado',
        'Acceso a fiestas clandestinas secretas con DJs internacionales',
        'Pase libre a Backstage y Palcos VIP',
        '25% de descuento en licores premium y botellas con bengala',
        'Reserva de mesa garantizada sin consumo mínimo previo',
        'Conserje nocturno exclusivo vía WhatsApp'
      ]
    }
  ];

  public exclusiveEvents: ExclusiveEvent[] = [
    {
      id: 'vip-ev-1',
      title: 'Secret Boiler Room • Popayán Underground',
      date: '2026-10-09',
      time: '11:00 PM',
      location: 'Locación oculta revelada vía SMS a miembros VIP',
      venueName: 'Club Underground Clandestino',
      minTierRequired: 'plan-silver',
      badgeText: 'BOILER ROOM PRIVADO',
      description: 'Sesión íntima de música electrónica en tornamesas analógicas con aforo limitado a solo 80 personas.',
      imageUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=1200&q=80',
      spotsLeft: 12,
      perksIncluded: ['Acceso sin cover', '1 Cóctel de bienvenida', 'Visuales inmersivos']
    },
    {
      id: 'vip-ev-2',
      title: 'Sunset Champagne Tasting & Molecular Tapas',
      date: '2026-10-17',
      time: '5:30 PM',
      location: 'Terraza Sky Lounge 360 • Piso 5',
      venueName: 'Sky Lounge 360',
      minTierRequired: 'plan-silver',
      badgeText: 'CATA & SUNSET VIBES',
      description: 'Atardecer panorámico con barra de champaña y mixología molecular con vista sobre los techos coloniales.',
      imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
      spotsLeft: 6,
      perksIncluded: ['Degustación de 3 cócteles moleculares', 'Mesa preferencial con vista', 'DJ Set en vivo']
    },
    {
      id: 'vip-ev-3',
      title: 'Backstage Pass & Afterparty con DJs Internacionales',
      date: '2026-10-24',
      time: '1:00 AM',
      location: 'Zona Backstage y Camerinos • La Clandestina Club',
      venueName: 'La Clandestina Club',
      minTierRequired: 'plan-black',
      badgeText: 'SOLO BLACK DIAMOND',
      description: 'Experiencia exclusiva dentro del backstage: barra privada de artistas, fotos oficiales y afterparty hasta el amanecer.',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
      spotsLeft: 4,
      perksIncluded: ['Pase de backstage con gafete laminado', 'Barra abierta de licores premium', 'Meet & Greet']
    }
  ];

  public currentTierId = signal<string>('plan-basic');
  public isVip = computed(() => this.currentTierId() !== 'plan-basic');
  public currentTierName = computed(() => {
    const t = this.tiers.find(item => item.id === this.currentTierId());
    return t ? t.name : 'Clubber Básico';
  });

  public userEmail = computed(() => {
    return this.auth.userProfile()?.email || 'clubber@nocturna.club';
  });

  public showUpgradeModal = false;
  public targetTier: VIPTier | null = null;
  public selectedMethod = 'PSE';
  public isProcessing = false;
  public upgradeSuccess = false;
  public generatedVipCode = '';

  ngOnInit() {
    this.syncSubscriptionFromFirestore();
  }

  private syncSubscriptionFromFirestore() {
    const user = this.auth.userProfile();
    const userId = user?.uid || 'user-active';

    if (!this.fb.firestore) return;

    try {
      const docRef = doc(this.fb.firestore, 'subscriptions', userId);
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data['status'] === 'ACTIVE' && data['planId']) {
            this.currentTierId.set(data['planId']);
          } else {
            this.currentTierId.set('plan-basic');
          }
        } else {
          this.currentTierId.set('plan-basic');
        }
      }, (err) => {
        this.fb.handleError(err, OperationType.GET, `subscriptions/${userId}`);
      });
    } catch (e) {
      console.warn('Realtime subscription listener:', e);
    }
  }

  public canAccessEvent(ev: ExclusiveEvent): boolean {
    const cur = this.currentTierId();
    if (cur === 'plan-black') return true;
    if (cur === 'plan-silver' && ev.minTierRequired === 'plan-silver') return true;
    return false;
  }

  public openUpgradeModal(tier: VIPTier) {
    this.targetTier = tier;
    this.upgradeSuccess = false;
    this.showUpgradeModal = true;
  }

  public async confirmUpgrade() {
    if (!this.targetTier) return;
    this.isProcessing = true;

    const user = this.auth.userProfile();
    const userId = user?.uid || 'user-active';
    const email = user?.email || 'clubber@nocturna.club';
    this.generatedVipCode = 'VIP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const subscriptionData = {
      userId,
      userEmail: email,
      planId: this.targetTier.id,
      planName: this.targetTier.name,
      status: this.targetTier.id === 'plan-basic' ? 'CANCELLED' : 'ACTIVE',
      price: this.targetTier.price,
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: nextBilling.toISOString().split('T')[0],
      vipCode: this.generatedVipCode,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.fb.firestore) {
        // Save to subscriptions collection
        const subDoc = doc(this.fb.firestore, 'subscriptions', userId);
        await setDoc(subDoc, subscriptionData, { merge: true });

        // Update users collection if present
        try {
          const userDoc = doc(this.fb.firestore, 'users', userId);
          await updateDoc(userDoc, {
            isVip: this.targetTier.id !== 'plan-basic',
            vipTier: this.targetTier.id,
            vipCode: this.generatedVipCode
          });
        } catch {
          // non-critical if users doc is absent
        }
      }

      this.currentTierId.set(this.targetTier.id);
      this.upgradeSuccess = true;
      this.notify.success(`¡Suscripción actualizada a ${this.targetTier.name}!`, 'Pase VIP Activado');
    } catch (err) {
      this.notify.error('No se pudo guardar la suscripción en Firestore');
      this.fb.handleError(err, OperationType.WRITE, `subscriptions/${userId}`);
    } finally {
      this.isProcessing = false;
    }
  }

  public rsvpVipEvent(ev: ExclusiveEvent) {
    this.notify.success(`¡Pase confirmado para "${ev.title}"! Recibirás los accesos privados por SMS y correo.`);
  }
}
