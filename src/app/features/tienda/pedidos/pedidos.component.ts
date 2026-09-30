import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { OrderStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-emerald-400 text-3xl">receipt_long</span>
            Gestión & Monitoreo de Pedidos
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Revisa el estado de preparación de tragos en barra y las órdenes servidas a las mesas
          </p>
        </div>

        <a
          routerLink="/tienda"
          class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1.5 transition-colors"
        >
          <span class="material-icons text-base">liquor</span>
          Hacer Nuevo Pedido
        </a>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          (click)="filterStatus = 'ALL'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          [ngClass]="filterStatus === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          Todos los Pedidos ({{ storeService.orders().length }})
        </button>
        <button
          (click)="filterStatus = 'PENDING'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          [ngClass]="filterStatus === 'PENDING' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          Pendientes
        </button>
        <button
          (click)="filterStatus = 'PREPARING'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          [ngClass]="filterStatus === 'PREPARING' ? 'bg-violet-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          En Preparación
        </button>
        <button
          (click)="filterStatus = 'DELIVERED'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          [ngClass]="filterStatus === 'DELIVERED' ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          Servidos / Entregados
        </button>
      </div>

      <!-- Orders List -->
      <div class="space-y-4">
        @for (order of filteredOrders(); track order.id) {
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all shadow-xl space-y-4">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                  #
                </span>
                <div>
                  <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    Orden #{{ order.id }}
                    <span class="text-xs font-normal text-zinc-500">• {{ order.userName }} ({{ order.userEmail }})</span>
                  </h3>
                  <p class="text-xs text-zinc-400">
                    Destino: <strong class="text-fuchsia-400">{{ order.deliveryMethod }} - {{ order.tableNumber || 'Barra' }}</strong>
                  </p>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border"
                  [ngClass]="{
                    'bg-amber-500/20 text-amber-400 border-amber-500/30': order.status === 'PENDING',
                    'bg-violet-500/20 text-violet-400 border-violet-500/30': order.status === 'PREPARING',
                    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30': order.status === 'SERVED',
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30': order.status === 'DELIVERED',
                    'bg-rose-500/20 text-rose-400 border-rose-500/30': order.status === 'CANCELLED'
                  }"
                >
                  ● {{ order.status }}
                </span>
              </div>
            </div>

            <!-- Items table -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tragos y Productos en Orden:</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                @for (item of order.items; track item.product.id) {
                  <div class="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-3">
                    <img [src]="item.product.imageUrl" [alt]="item.product.name" class="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0" />
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-zinc-200 truncate">{{ item.product.name }}</p>
                      <p class="text-[11px] text-zinc-400">Cant: <strong class="text-white">{{ item.quantity }}</strong></p>
                    </div>
                  </div>
                }
              </div>
            </div>

            @if (order.notes) {
              <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
                <strong class="text-zinc-300">Nota del cliente:</strong> {{ order.notes }}
              </div>
            }

            <!-- Bottom: Total and Owner Status Actions -->
            <div class="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="text-xs text-zinc-400">
                Total pagado: <strong class="text-white text-base font-extrabold ml-1">{{ order.total | copCurrency }}</strong>
              </div>

              <!-- Status transitions for Admin or Bar Owner -->
              @if (auth.isAdmin() || auth.isBarOwner()) {
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] text-zinc-500 font-semibold mr-1">Cambiar estado:</span>
                  @if (order.status === 'PENDING') {
                    <button
                      (click)="storeService.updateOrderStatus(order.id!, 'PREPARING')"
                      class="px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    >
                      Aceptar y Preparar
                    </button>
                  }
                  @if (order.status === 'PREPARING') {
                    <button
                      (click)="storeService.updateOrderStatus(order.id!, 'SERVED')"
                      class="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    >
                      Servir en Barra/Mesa
                    </button>
                  }
                  @if (order.status === 'SERVED') {
                    <button
                      (click)="storeService.updateOrderStatus(order.id!, 'DELIVERED')"
                      class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      Marcar Entregado
                    </button>
                  }
                  @if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
                    <button
                      (click)="storeService.updateOrderStatus(order.id!, 'CANCELLED')"
                      class="px-3 py-1 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors"
                    >
                      Cancelar
                    </button>
                  }
                </div>
              }
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class PedidosComponent {
  public storeService = inject(StoreService);
  public auth = inject(AuthService);

  public filterStatus = 'ALL';

  public filteredOrders = computed(() => {
    let list = this.storeService.orders();
    if (this.filterStatus !== 'ALL') {
      list = list.filter(o => o.status === this.filterStatus);
    }
    return list;
  });
}
