import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-amber-400 text-3xl">liquor</span>
            Carta de Licores, Cócteles & Piqueos
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Pide directamente desde tu teléfono a tu mesa o palco sin hacer filas en la barra
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/tienda/carrito"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 shadow-lg shadow-violet-600/30 flex items-center gap-2"
          >
            <span class="material-icons text-base">shopping_cart</span>
            Ver Carrito ({{ storeService.cartCount() }})
          </a>

          @if (auth.isAdmin() || auth.isBarOwner()) {
            <button
              (click)="showAddProductModal = true"
              class="px-4 py-2.5 rounded-xl font-bold text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1.5"
            >
              <span class="material-icons text-base">add</span>
              Añadir Producto
            </button>
          }
        </div>
      </div>

      <!-- Filters & Categories Bar -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
        <!-- Search input -->
        <div class="relative w-full md:w-80">
          <span class="material-icons absolute left-3.5 top-2.5 text-zinc-500 text-lg">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar trago, botella, cerveza..."
            class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <!-- Categories horizontal pills -->
        <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            (click)="selectedCategory = ''"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedCategory === '' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
          >
            Todo el Menú
          </button>
          @for (cat of storeService.categories(); track cat.id) {
            <button
              (click)="selectedCategory = cat.id!"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
              [ngClass]="selectedCategory === cat.id ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
            >
              <span class="material-icons text-sm">{{ cat.icon }}</span>
              {{ cat.name }}
            </button>
          }
        </div>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (prod of filteredProducts(); track prod.id) {
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col group shadow-xl">
            <div class="relative h-48 bg-zinc-950 overflow-hidden">
              <img
                [src]="prod.imageUrl"
                [alt]="prod.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>

              <div class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
                {{ prod.price | copCurrency }}
              </div>

              @if (prod.volumeOrServing) {
                <div class="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-zinc-900/80 text-[10px] text-zinc-300 font-medium">
                  {{ prod.volumeOrServing }}
                </div>
              }
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[11px] font-semibold text-fuchsia-400 block mb-1">
                  {{ prod.categoryName || 'Bebidas' }} • {{ prod.barName || 'Bar Asociado' }}
                </span>
                <h3 class="font-heading text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {{ prod.name }}
                </h3>
                <p class="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {{ prod.description }}
                </p>
              </div>

              <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span class="text-[11px] text-zinc-500">
                  Stock: <strong class="text-zinc-300">{{ prod.stock }}</strong> disp.
                </span>
                <button
                  (click)="storeService.addToCart(prod, 1)"
                  [disabled]="prod.stock <= 0"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span class="material-icons text-sm">add_shopping_cart</span>
                  Pedir
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add Product Modal -->
      @if (showAddProductModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span class="material-icons text-amber-400">add_box</span>
                Nuevo Producto a la Carta
              </h3>
              <button (click)="showAddProductModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="onCreateProduct()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Nombre del Trago / Producto</label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej. Ron Medellín 8 Años 750ml"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Categoría</label>
                <select
                  formControlName="categoryId"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  @for (c of storeService.categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Precio (COP)</label>
                  <input
                    type="number"
                    formControlName="price"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Stock</label>
                  <input
                    type="number"
                    formControlName="stock"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Descripción / Presentación</label>
                <textarea
                  formControlName="description"
                  rows="2"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">URL Foto del Trago / Botella</label>
                <input
                  type="text"
                  formControlName="imageUrl"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="showAddProductModal = false" class="px-4 py-2 text-xs text-zinc-400">Cancelar</button>
                <button type="submit" [disabled]="productForm.invalid" class="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class ProductosComponent {
  public storeService = inject(StoreService);
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public searchQuery = '';
  public selectedCategory = '';
  public showAddProductModal = false;

  public productForm = this.fb.group({
    name: ['', [Validators.required]],
    categoryId: ['cat-licores', [Validators.required]],
    price: [120000, [Validators.required]],
    stock: [25, [Validators.required]],
    description: ['Servido con cubeta de hielo y mezcladores a elección.'],
    imageUrl: ['https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80', [Validators.required]]
  });

  public filteredProducts = computed(() => {
    let list = this.storeService.products();
    if (this.selectedCategory) {
      list = list.filter(p => p.categoryId === this.selectedCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  });

  onCreateProduct() {
    if (this.productForm.valid) {
      const val = this.productForm.value;
      const cat = this.storeService.categories().find(c => c.id === val.categoryId);

      this.storeService.addProduct({
        name: val.name!,
        categoryId: val.categoryId!,
        categoryName: cat?.name || 'Licores',
        price: Number(val.price),
        stock: Number(val.stock),
        description: val.description!,
        imageUrl: val.imageUrl!,
        barId: 'bar-sotareno',
        barName: 'El Sotareño',
        active: true,
        volumeOrServing: 'Presentación Bar'
      });

      this.showAddProductModal = false;
    }
  }
}
