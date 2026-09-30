import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { DeliveryMethod } from '../../../core/models/product.model';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16 max-w-4xl mx-auto">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-fuchsia-400 text-3xl">shopping_cart</span>
            Tu Pedido Nocturno
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Revisa tus botellas y bebidas antes de despachar la orden a los bartenders
          </p>
        </div>

        @if (store.cartCount() > 0) {
          <button
            (click)="store.clearCart()"
            class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span class="material-icons text-sm">delete_outline</span>
            Vaciar carrito
          </button>
        }
      </div>

      @if (store.cart().length > 0) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Items List (2 cols) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 divide-y divide-zinc-800 shadow-xl">
              @for (item of store.cart(); track item.product.id) {
                <div class="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <img
                      [src]="item.product.imageUrl"
                      [alt]="item.product.name"
                      class="w-16 h-16 rounded-2xl object-cover bg-zinc-950 shrink-0"
                    />
                    <div class="min-w-0">
                      <h4 class="text-sm font-bold text-zinc-100 truncate">{{ item.product.name }}</h4>
                      <p class="text-xs text-fuchsia-400 font-semibold">{{ item.product.price | copCurrency }}</p>
                      @if (item.product.barName) {
                        <p class="text-[11px] text-zinc-500">📍 {{ item.product.barName }}</p>
                      }
                    </div>
                  </div>

                  <!-- Quantity controls -->
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1">
                      <button
                        (click)="store.updateCartQuantity(item.product.id!, item.quantity - 1)"
                        class="text-zinc-400 hover:text-white px-2 py-0.5 text-xs font-bold"
                      >
                        -
                      </button>
                      <span class="text-xs font-bold text-white px-2">{{ item.quantity }}</span>
                      <button
                        (click)="store.updateCartQuantity(item.product.id!, item.quantity + 1)"
                        class="text-zinc-400 hover:text-white px-2 py-0.5 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      (click)="store.removeFromCart(item.product.id!)"
                      class="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Quitar"
                    >
                      <span class="material-icons text-base">delete</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <a
              routerLink="/tienda"
              class="inline-flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300"
            >
              <span class="material-icons text-sm">arrow_back</span>
              Seguir agregando tragos a la orden
            </a>
          </div>

          <!-- Checkout Details Panel (1 col) -->
          <div class="space-y-6">
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 class="font-heading text-base font-bold text-white flex items-center gap-2">
                <span class="material-icons text-amber-400">room_service</span>
                Datos de Entrega
              </h3>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1.5">¿Dónde deseas recibir tu trago?</label>
                <select
                  [(ngModel)]="deliveryMethod"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="TABLE">Entrega directa a Mesa</option>
                  <option value="BAR_PICKUP">Retiro directo en Barra</option>
                  <option value="VIP_LOUNGE">Servicio Palco VIP</option>
                </select>
              </div>

              @if (deliveryMethod !== 'BAR_PICKUP') {
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Número de Mesa o Palco</label>
                  <input
                    type="text"
                    [(ngModel)]="tableNumber"
                    placeholder="Ej. Mesa 12 (Frente a la pista)"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              }

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Instrucciones para el Bartender</label>
                <textarea
                  [(ngModel)]="notes"
                  rows="2"
                  placeholder="Ej. Mucho hielo, limón extra, bengala..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                ></textarea>
              </div>

              <!-- Cost breakdown -->
              <div class="pt-4 border-t border-zinc-800 space-y-2 text-xs">
                <div class="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span class="text-zinc-200 font-bold">{{ store.cartTotal() | copCurrency }}</span>
                </div>

                @if (sub.currentSubscription()?.status === 'ACTIVE') {
                  <div class="flex justify-between text-emerald-400 font-medium">
                    <span>Descuento VIP (15%):</span>
                    <span>- {{ (store.cartTotal() * 0.15) | copCurrency }}</span>
                  </div>
                }

                <div class="pt-2 border-t border-zinc-800 flex justify-between font-extrabold text-base text-white">
                  <span>Total Final:</span>
                  <span class="text-amber-400">
                    {{ (sub.currentSubscription()?.status === 'ACTIVE' ? store.cartTotal() * 0.85 : store.cartTotal()) | copCurrency }}
                  </span>
                </div>
              </div>

              <button
                (click)="onSendOrder()"
                class="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 shadow-lg shadow-fuchsia-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span class="material-icons text-base">send</span>
                Enviar Pedido a la Barra
              </button>
            </div>
          </div>

        </div>
      } @else {
        <!-- Empty Cart -->
        <div class="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto">
            <span class="material-icons text-3xl">remove_shopping_cart</span>
          </div>
          <h3 class="font-heading text-lg font-bold text-white">Tu carrito nocturno está vacío</h3>
          <p class="text-xs text-zinc-400 max-w-sm mx-auto">
            Explora la carta de licores, cócteles de autor y cervezas heladas para añadir a tu orden.
          </p>
          <a
            routerLink="/tienda"
            class="inline-block py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors shadow-lg shadow-fuchsia-600/30"
          >
            Explorar Carta de Bebidas
          </a>
        </div>
      }

    </div>
  `
})
export class CarritoComponent {
  public store = inject(StoreService);
  public sub = inject(SubscriptionService);
  private router = inject(Router);

  public deliveryMethod: DeliveryMethod = 'TABLE';
  public tableNumber = 'Mesa 7';
  public notes = '';

  async onSendOrder() {
    const order = await this.store.checkout(this.deliveryMethod, this.tableNumber, this.notes);
    if (order) {
      this.router.navigate(['/tienda/pedidos']);
    }
  }
}
