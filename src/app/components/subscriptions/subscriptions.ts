import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionHttpService } from '../../services/subscription-http.service';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { Subscription, SubscriptionStatus } from '../../models/types';

@Component({
  selector: 'app-subscriptions',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Top Title & Main Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Suscripciones y Membresías</span>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                {{ filteredSubscriptions().length }} activas
              </span>
            </h1>
            <!-- HTTP Status Indicator -->
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              HTTP Client Activo
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Gestión y suscripción a planes de club exclusivo de Tienda & Bar conectados mediante <code class="text-amber-300 font-mono">HttpClient</code> y API REST.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            (click)="reloadViaHttp()"
            [disabled]="httpService.isLoading()"
            class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
            <span class="material-icons text-sm" [class.animate-spin]="httpService.isLoading()">refresh</span>
            <span>Recargar vía HTTP</span>
          </button>

          <button
            type="button"
            (click)="showJsonModal.set(true)"
            class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-sm">
            <span class="material-icons text-sm">data_object</span>
            <span>Ver JSON HTTP</span>
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
            <span class="material-icons text-base">card_membership</span>
            <span>+ Nueva Suscripción (HTTP POST)</span>
          </button>
        </div>
      </div>

      <!-- HTTP Telemetry Bar -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span class="material-icons text-xl">http</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-200">Endpoint HTTP:</span>
                <span class="font-mono text-xs text-amber-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  GET /api/subscriptions
                </span>
                @if (httpService.lastHttpLog(); as log) {
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {{ log.status }} {{ log.statusText }} ({{ log.durationMs }} ms)
                  </span>
                }
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Provee la lista de miembros, cuotas, renovaciones y beneficios mapeada con Angular <code class="text-slate-300">HttpClient</code>.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- View Mode Switcher -->
            <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                (click)="viewMode.set('cards')"
                [class.bg-amber-500]="viewMode() === 'cards'"
                [class.text-slate-950]="viewMode() === 'cards'"
                [class.text-slate-400]="viewMode() !== 'cards'"
                class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5">
                <span class="material-icons text-xs">grid_view</span>
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                (click)="viewMode.set('table')"
                [class.bg-amber-500]="viewMode() === 'table'"
                [class.text-slate-950]="viewMode() === 'table'"
                [class.text-slate-400]="viewMode() !== 'table'"
                class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5">
                <span class="material-icons text-xs">table_chart</span>
                <span>Tabla</span>
              </button>
            </div>

            <!-- Reset to defaults button -->
            <button
              type="button"
              (click)="resetDefaults()"
              title="Restablecer suscripciones de prueba vía HTTP POST /api/subscriptions/reset"
              class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all">
              <span class="material-icons text-xs">restart_alt</span>
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PLANS SHOWCASE: 4 MEMBERSHIP TIERS -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span class="material-icons text-amber-400 text-base">stars</span>
              <span>Planes y Membresías de Tienda & Bar</span>
            </h2>
            <p class="text-xs text-slate-400">Cuotas mensuales con beneficios exclusivos de préstamos y descuentos</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (plan of httpService.plans(); track plan.id) {
            <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
              
              <!-- Plan Header -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span 
                    class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                    [class.bg-blue-500/20]="plan.tier === 'basico_bar'"
                    [class.text-blue-300]="plan.tier === 'basico_bar'"
                    [class.border-blue-500/30]="plan.tier === 'basico_bar'"
                    [class.bg-amber-500/20]="plan.tier === 'club_gourmet'"
                    [class.text-amber-300]="plan.tier === 'club_gourmet'"
                    [class.border-amber-500/30]="plan.tier === 'club_gourmet'"
                    [class.bg-purple-500/20]="plan.tier === 'vip_coleccionista'"
                    [class.text-purple-300]="plan.tier === 'vip_coleccionista'"
                    [class.border-purple-500/30]="plan.tier === 'vip_coleccionista'"
                    [class.bg-emerald-500/20]="plan.tier === 'sommelier_premium'"
                    [class.text-emerald-300]="plan.tier === 'sommelier_premium'"
                    [class.border-emerald-500/30]="plan.tier === 'sommelier_premium'">
                    {{ plan.name }}
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-400">
                    {{ getSubscriberCountForPlan(plan.id) }} suscritos
                  </span>
                </div>

                <div class="flex items-baseline gap-1 my-3">
                  <span class="text-2xl sm:text-3xl font-black text-white">{{ plan.priceMonthly }}€</span>
                  <span class="text-xs text-slate-400 font-medium">/mes</span>
                </div>

                <p class="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                  {{ plan.description }}
                </p>
              </div>

              <!-- Plan Perks -->
              <div class="space-y-2 pt-3 border-t border-slate-800 text-xs">
                <div class="flex items-center justify-between text-[11px] text-slate-300">
                  <span class="flex items-center gap-1.5">
                    <span class="material-icons text-amber-400 text-xs">percent</span>
                    <span>Descuento directo:</span>
                  </span>
                  <span class="font-bold text-amber-300">{{ plan.discountPercentage }}%</span>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-300">
                  <span class="flex items-center gap-1.5">
                    <span class="material-icons text-amber-400 text-xs">assignment</span>
                    <span>Préstamos simultáneos:</span>
                  </span>
                  <span class="font-bold text-white">{{ plan.maxActiveLoans === 99 ? 'Ilimitados' : plan.maxActiveLoans }}</span>
                </div>

                <ul class="space-y-1.5 pt-2 text-[11px] text-slate-400">
                  @for (feat of plan.features; track feat) {
                    <li class="flex items-start gap-1.5">
                      <span class="material-icons text-emerald-400 text-xs mt-0.5">check_circle</span>
                      <span>{{ feat }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Quick Action Button -->
              <div class="pt-2">
                <button
                  type="button"
                  (click)="openCreateModal(plan.id)"
                  class="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700">
                  <span class="material-icons text-sm">add</span>
                  <span>Suscribir a este Plan</span>
                </button>
              </div>

            </div>
          }
        </div>
      </div>

      <!-- FILTERS & SEARCH FOR SUBSCRIPTIONS -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:max-w-md">
          <span class="material-icons absolute left-3.5 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por usuario, correo o plan..."
            class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all">
        </div>

        <div class="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <span class="text-xs text-slate-400 font-medium">Estado:</span>
          <select
            [(ngModel)]="selectedStatusFilter"
            class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium">
            <option value="all">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
            <option value="cancelada">Cancelada</option>
            <option value="expirada">Expirada</option>
          </select>

          <span class="text-xs text-slate-400 font-medium ml-2">Plan:</span>
          <select
            [(ngModel)]="selectedPlanFilter"
            class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium">
            <option value="all">Todos los planes</option>
            <option value="plan_basico">Pase Amigo Bar</option>
            <option value="plan_gourmet">Club Gourmet</option>
            <option value="plan_vip">VIP Coleccionista</option>
            <option value="plan_sommelier">Membresía Sommelier</option>
          </select>
        </div>
      </div>

      <!-- ACTIVE SUBSCRIPTIONS: TABLE VIEW -->
      @if (viewMode() === 'table') {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th class="py-3.5 px-5">Socio / Usuario</th>
                  <th class="py-3.5 px-5">Plan Contratado</th>
                  <th class="py-3.5 px-5">Cuota Mensual</th>
                  <th class="py-3.5 px-5">Estado</th>
                  <th class="py-3.5 px-5 hidden md:table-cell">Renovación</th>
                  <th class="py-3.5 px-5 hidden lg:table-cell">Pago</th>
                  <th class="py-3.5 px-5 text-right">Acciones HTTP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80 text-xs">
                @if (filteredSubscriptions().length === 0) {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-500">
                      <span class="material-icons text-4xl text-slate-600 block mb-2">credit_card_off</span>
                      No se encontraron suscripciones con los filtros seleccionados.
                    </td>
                  </tr>
                } @else {
                  @for (sub of filteredSubscriptions(); track sub.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      
                      <!-- User / Socio -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shadow shrink-0">
                            {{ getInitial(sub.userDisplayName) }}
                          </div>
                          <div>
                            <div class="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{{ sub.userDisplayName }}</span>
                            </div>
                            <span class="text-[11px] text-slate-400 font-mono">{{ sub.userEmail }}</span>
                          </div>
                        </div>
                      </td>

                      <!-- Plan -->
                      <td class="py-3.5 px-5">
                        <span class="font-bold text-white">{{ sub.planName }}</span>
                        <div class="text-[10px] text-slate-400">ID: {{ sub.planId }}</div>
                      </td>

                      <!-- Price -->
                      <td class="py-3.5 px-5 font-mono font-bold text-amber-400 text-sm">
                        {{ sub.priceMonthly }}€ /mes
                      </td>

                      <!-- Status & inline HTTP PATCH switcher -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1"
                            [class.bg-emerald-500/20]="sub.status === 'activa'"
                            [class.text-emerald-300]="sub.status === 'activa'"
                            [class.border-emerald-500/30]="sub.status === 'activa'"
                            [class.bg-amber-500/20]="sub.status === 'pausada'"
                            [class.text-amber-300]="sub.status === 'pausada'"
                            [class.border-amber-500/30]="sub.status === 'pausada'"
                            [class.bg-rose-500/20]="sub.status === 'cancelada' || sub.status === 'expirada'"
                            [class.text-rose-300]="sub.status === 'cancelada' || sub.status === 'expirada'"
                            [class.border-rose-500/30]="sub.status === 'cancelada' || sub.status === 'expirada'">
                            <span class="w-1.5 h-1.5 rounded-full"
                              [class.bg-emerald-400]="sub.status === 'activa'"
                              [class.bg-amber-400]="sub.status === 'pausada'"
                              [class.bg-rose-400]="sub.status === 'cancelada' || sub.status === 'expirada'"></span>
                            {{ sub.status }}
                          </span>

                          <select
                            [ngModel]="sub.status"
                            (ngModelChange)="changeStatusViaHttp(sub, $event)"
                            title="Cambiar estado (HTTP PATCH)"
                            class="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer">
                            <option value="activa">activa</option>
                            <option value="pausada">pausada</option>
                            <option value="cancelada">cancelada</option>
                            <option value="expirada">expirada</option>
                          </select>
                        </div>
                      </td>

                      <!-- Renewal Date -->
                      <td class="py-3.5 px-5 hidden md:table-cell text-slate-300 font-mono text-[11px]">
                        <div class="flex items-center gap-1">
                          <span class="material-icons text-xs text-amber-400">calendar_today</span>
                          <span>{{ sub.renewalDate }}</span>
                        </div>
                      </td>

                      <!-- Payment Method -->
                      <td class="py-3.5 px-5 hidden lg:table-cell text-slate-400 uppercase text-[10px] font-bold">
                        <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {{ sub.paymentMethod }}
                        </span>
                      </td>

                      <!-- Actions -->
                      <td class="py-3.5 px-5 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            (click)="openEditModal(sub)"
                            title="Editar suscripción (HTTP PUT)"
                            class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                            <span class="material-icons text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            (click)="confirmDeleteViaHttp(sub)"
                            title="Cancelar/Eliminar suscripción (HTTP DELETE)"
                            class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <span class="material-icons text-sm">delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <!-- ACTIVE SUBSCRIPTIONS: CARDS VIEW -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @if (filteredSubscriptions().length === 0) {
            <div class="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
              <span class="material-icons text-5xl text-slate-600 mb-2">card_membership</span>
              <h3 class="text-base font-bold text-white mb-1">No hay suscripciones registradas</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                No se encontraron suscripciones con los filtros actuales.
              </p>
            </div>
          } @else {
            @for (sub of filteredSubscriptions(); track sub.id) {
              <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
                
                <div>
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                        {{ getInitial(sub.userDisplayName) }}
                      </div>
                      <div>
                        <h3 class="text-sm font-bold text-white">{{ sub.userDisplayName }}</h3>
                        <p class="text-xs text-slate-400 font-mono">{{ sub.userEmail }}</p>
                      </div>
                    </div>

                    <span
                      class="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border"
                      [class.bg-emerald-500/20]="sub.status === 'activa'"
                      [class.text-emerald-300]="sub.status === 'activa'"
                      [class.border-emerald-500/30]="sub.status === 'activa'"
                      [class.bg-amber-500/20]="sub.status === 'pausada'"
                      [class.text-amber-300]="sub.status === 'pausada'"
                      [class.border-amber-500/30]="sub.status === 'pausada'"
                      [class.bg-rose-500/20]="sub.status === 'cancelada' || sub.status === 'expirada'"
                      [class.text-rose-300]="sub.status === 'cancelada' || sub.status === 'expirada'"
                      [class.border-rose-500/30]="sub.status === 'cancelada' || sub.status === 'expirada'">
                      {{ sub.status }}
                    </span>
                  </div>

                  <div class="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">Plan:</span>
                      <span class="font-bold text-white">{{ sub.planName }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">Tarifa:</span>
                      <span class="font-mono font-bold text-amber-400">{{ sub.priceMonthly }}€ / mes</span>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-slate-400">Renovación:</span>
                      <span class="font-mono text-slate-300">{{ sub.renewalDate }}</span>
                    </div>
                    @if (sub.notes) {
                      <div class="pt-1 text-[11px] text-slate-400 italic">
                        "{{ sub.notes }}"
                      </div>
                    }
                  </div>
                </div>

                <!-- Footer & Actions via HTTP -->
                <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="text-slate-400 text-[11px]">Estado:</span>
                    <select
                      [ngModel]="sub.status"
                      (ngModelChange)="changeStatusViaHttp(sub, $event)"
                      class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-medium">
                      <option value="activa">activa</option>
                      <option value="pausada">pausada</option>
                      <option value="cancelada">cancelada</option>
                      <option value="expirada">expirada</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="openEditModal(sub)"
                      title="Editar suscripción (HTTP PUT)"
                      class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors">
                      <span class="material-icons text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      (click)="confirmDeleteViaHttp(sub)"
                      title="Eliminar suscripción (HTTP DELETE)"
                      class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <span class="material-icons text-base">delete_outline</span>
                    </button>
                  </div>
                </div>

              </div>
            }
          }
        </div>
      }

      <!-- MODAL: REGISTRAR O EDITAR SUSCRIPCIÓN (HTTP POST / PUT) -->
      @if (showFormModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            (click)="$event.stopPropagation()"
            class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-400">card_membership</span>
                <h3 class="text-lg font-bold text-white">
                  {{ isEditing() ? 'Editar Suscripción' : 'Nueva Suscripción' }}
                </h3>
              </div>
              <button
                type="button"
                (click)="closeFormModal()"
                class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                <span class="material-icons text-base">close</span>
              </button>
            </div>

            <!-- Endpoint Badge -->
            <div class="mb-4 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
              <span class="text-slate-400">Operación HTTP:</span>
              <span class="font-mono text-amber-400 font-bold">
                {{ isEditing() ? 'PUT /api/subscriptions/' + editingId() : 'POST /api/subscriptions' }}
              </span>
            </div>

            <form (ngSubmit)="handleSaveSubmit()" class="space-y-4">
              
              <!-- User selection from registered users or text -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Usuario o Socio *
                </label>
                @if (firebaseService.users().length > 0) {
                  <select
                    [(ngModel)]="selectedUserId"
                    (ngModelChange)="onUserSelected($event)"
                    name="selectedUserId"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 mb-2">
                    <option value="">-- Seleccionar de la lista de usuarios --</option>
                    @for (u of firebaseService.users(); track u.id) {
                      <option [value]="u.id">{{ u.displayName }} ({{ u.email }})</option>
                    }
                  </select>
                }

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    [(ngModel)]="formData.userDisplayName"
                    name="userDisplayName"
                    required
                    placeholder="Nombre del socio *"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500">
                  <input
                    type="email"
                    [(ngModel)]="formData.userEmail"
                    name="userEmail"
                    required
                    placeholder="Correo electrónico *"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono">
                </div>
              </div>

              <!-- Plan selection -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Plan de Membresía *
                </label>
                <select
                  [(ngModel)]="formData.planId"
                  name="planId"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                  @for (p of httpService.plans(); track p.id) {
                    <option [value]="p.id">{{ p.name }} - {{ p.priceMonthly }}€/mes ({{ p.discountPercentage }}% dto.)</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    [(ngModel)]="formData.paymentMethod"
                    name="paymentMethod"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="tarjeta">Tarjeta Bancaria</option>
                    <option value="bizum">Bizum</option>
                    <option value="domiciliacion">Domiciliación</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Renovación
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="formData.renewalDate"
                    name="renewalDate"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono">
                </div>
              </div>

              @if (isEditing()) {
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">
                    Estado de la Suscripción
                  </label>
                  <select
                    [(ngModel)]="formData.status"
                    name="status"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="activa">activa</option>
                    <option value="pausada">pausada</option>
                    <option value="cancelada">cancelada</option>
                    <option value="expirada">expirada</option>
                  </select>
                </div>
              }

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  [(ngModel)]="formData.notes"
                  name="notes"
                  rows="2"
                  placeholder="Instrucciones de entrega, beneficios asignados..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  (click)="closeFormModal()"
                  class="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="httpService.isLoading()"
                  class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50">
                  <span class="material-icons text-sm" [class.animate-spin]="httpService.isLoading()">send</span>
                  <span>{{ isEditing() ? 'Guardar Cambios (PUT)' : 'Crear Suscripción (POST)' }}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      }

      <!-- MODAL: VISOR DE JSON HTTP -->
      @if (showJsonModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            (click)="$event.stopPropagation()"
            class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative text-white flex flex-col max-h-[85vh]">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span class="material-icons text-base">code</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white">Respuesta HTTP REST (/api/subscriptions)</h3>
                  <p class="text-[11px] text-slate-400">Carga útil con estructura de membresías, precios y estados</p>
                </div>
              </div>
              <button
                type="button"
                (click)="showJsonModal.set(false)"
                class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                <span class="material-icons text-base">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-amber-300">
              <pre class="whitespace-pre-wrap">{{ httpService.rawJsonResponse() || jsonPlaceholder() }}</pre>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-800 mt-4 text-xs">
              <span class="text-slate-400">
                Petición: <span class="text-amber-400 font-mono">GET /api/subscriptions</span>
              </span>
              <button
                type="button"
                (click)="showJsonModal.set(false)"
                class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                Cerrar
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class SubscriptionsComponent implements OnInit {
  public httpService = inject(SubscriptionHttpService);
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public searchQuery = '';
  public selectedStatusFilter: 'all' | 'activa' | 'pausada' | 'cancelada' | 'expirada' = 'all';
  public selectedPlanFilter = 'all';
  public viewMode = signal<'table' | 'cards'>('cards');

  public showFormModal = signal<boolean>(false);
  public showJsonModal = signal<boolean>(false);
  public isEditing = signal<boolean>(false);
  public editingId = signal<string>('');

  public selectedUserId = '';
  public formData = {
    userId: '',
    userDisplayName: '',
    userEmail: '',
    planId: 'plan_gourmet',
    paymentMethod: 'tarjeta' as 'tarjeta' | 'bizum' | 'transferencia' | 'domiciliacion',
    notes: '',
    renewalDate: '',
    status: 'activa' as SubscriptionStatus,
  };

  ngOnInit() {
    this.httpService.loadInitialData();
  }

  public filteredSubscriptions = computed(() => {
    let list = this.httpService.subscriptions();
    const q = this.searchQuery.trim().toLowerCase();
    const statusF = this.selectedStatusFilter;
    const planF = this.selectedPlanFilter;

    if (statusF !== 'all') {
      list = list.filter((s) => s.status === statusF);
    }
    if (planF !== 'all') {
      list = list.filter((s) => s.planId === planF);
    }
    if (q) {
      list = list.filter(
        (s) =>
          s.userDisplayName?.toLowerCase().includes(q) ||
          s.userEmail?.toLowerCase().includes(q) ||
          s.planName?.toLowerCase().includes(q) ||
          s.status?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  public getSubscriberCountForPlan(planId: string): number {
    return this.httpService.subscriptions().filter((s) => s.planId === planId && s.status === 'activa').length;
  }

  public getInitial(name: string): string {
    return name && name.trim() ? name.trim()[0].toUpperCase() : 'S';
  }

  public jsonPlaceholder(): string {
    return JSON.stringify(
      {
        success: true,
        protocol: 'HTTP/REST',
        count: this.httpService.subscriptions().length,
        subscriptions: this.httpService.subscriptions(),
      },
      null,
      2
    );
  }

  public reloadViaHttp() {
    this.httpService.getSubscriptions().subscribe({
      next: (res) => {
        this.toastService.success(
          'HTTP GET 200 OK',
          `Se obtuvieron ${res.subscriptions.length} suscripciones vía HTTP.`
        );
      },
      error: (err) => {
        this.toastService.error('Error HTTP', err?.message);
      },
    });
  }

  public resetDefaults() {
    this.httpService.resetToDefaults().subscribe({
      next: () => {
        this.toastService.info('Restablecido', 'Suscripciones demo restablecidas vía HTTP POST.');
      },
      error: (err) => {
        this.toastService.error('Error al restablecer', err?.message);
      },
    });
  }

  public openCreateModal(preselectedPlanId?: string) {
    this.isEditing.set(false);
    this.editingId.set('');
    this.selectedUserId = '';

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    this.formData = {
      userId: '',
      userDisplayName: '',
      userEmail: '',
      planId: preselectedPlanId || (this.httpService.plans()[0]?.id || 'plan_gourmet'),
      paymentMethod: 'tarjeta',
      notes: '',
      renewalDate: nextMonth.toISOString().split('T')[0],
      status: 'activa',
    };
    this.showFormModal.set(true);
  }

  public openEditModal(sub: Subscription) {
    this.isEditing.set(true);
    this.editingId.set(sub.id);
    this.selectedUserId = sub.userId;

    this.formData = {
      userId: sub.userId,
      userDisplayName: sub.userDisplayName,
      userEmail: sub.userEmail,
      planId: sub.planId,
      paymentMethod: sub.paymentMethod,
      notes: sub.notes || '',
      renewalDate: sub.renewalDate,
      status: sub.status,
    };
    this.showFormModal.set(true);
  }

  public closeFormModal() {
    this.showFormModal.set(false);
    this.isEditing.set(false);
    this.editingId.set('');
  }

  public onUserSelected(userId: string) {
    if (!userId) return;
    const user = this.firebaseService.users().find((u) => u.id === userId);
    if (user) {
      this.formData.userId = user.id;
      this.formData.userDisplayName = user.displayName;
      this.formData.userEmail = user.email;
    }
  }

  public handleSaveSubmit() {
    if (!this.formData.userDisplayName.trim() || !this.formData.userEmail.trim()) {
      this.toastService.warning('Datos incompletos', 'Ingresa el nombre y correo del socio.');
      return;
    }

    if (this.isEditing()) {
      const id = this.editingId();
      this.httpService
        .updateSubscription(id, {
          userDisplayName: this.formData.userDisplayName.trim(),
          userEmail: this.formData.userEmail.trim().toLowerCase(),
          planId: this.formData.planId,
          paymentMethod: this.formData.paymentMethod,
          renewalDate: this.formData.renewalDate,
          status: this.formData.status,
          notes: this.formData.notes.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.toastService.success(
              'HTTP PUT 200 OK',
              `Suscripción de ${res.subscription.userDisplayName} actualizada.`
            );
            this.closeFormModal();
          },
          error: (err) => {
            this.toastService.error('Error HTTP PUT', err?.message);
          },
        });
    } else {
      this.httpService
        .createSubscription({
          userId: this.formData.userId || undefined,
          userDisplayName: this.formData.userDisplayName.trim(),
          userEmail: this.formData.userEmail.trim().toLowerCase(),
          planId: this.formData.planId,
          paymentMethod: this.formData.paymentMethod,
          renewalDate: this.formData.renewalDate,
          notes: this.formData.notes.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.toastService.success(
              'HTTP POST 201 Created',
              `Suscripción al plan "${res.subscription.planName}" creada con éxito.`
            );
            this.closeFormModal();
          },
          error: (err) => {
            this.toastService.error('Error HTTP POST', err?.message);
          },
        });
    }
  }

  public changeStatusViaHttp(sub: Subscription, newStatus: SubscriptionStatus) {
    if (sub.status === newStatus) return;

    this.httpService.updateStatus(sub.id, newStatus).subscribe({
      next: () => {
        this.toastService.success(
          'HTTP PATCH 200 OK',
          `Estado de la suscripción actualizado a "${newStatus}".`
        );
      },
      error: (err) => {
        this.toastService.error('Error al actualizar estado', err?.message);
      },
    });
  }

  public confirmDeleteViaHttp(sub: Subscription) {
    if (confirm(`¿Eliminar la suscripción de "${sub.userDisplayName}" al plan ${sub.planName} mediante HTTP DELETE?`)) {
      this.httpService.deleteSubscription(sub.id).subscribe({
        next: () => {
          this.toastService.success(
            'HTTP DELETE 200 OK',
            `Suscripción eliminada del sistema.`
          );
        },
        error: (err) => {
          this.toastService.error('Error HTTP DELETE', err?.message);
        },
      });
    }
  }
}
