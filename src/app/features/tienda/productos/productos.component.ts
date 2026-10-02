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
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono mb-2">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            🔥 Conectado a Firebase Cloud Firestore NoSQL
          </div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-amber-400 text-3xl">liquor</span>
            Bebidas & Tienda de Licores
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Carta sincronizada en tiempo real con la colección <code class="text-amber-300 font-mono">products</code> de Firebase Firestore
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            (click)="storeService.seedProductsToFirestore(true)"
            [disabled]="storeService.isLoading()"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Sincronizar y restaurar las 10 bebidas en Firestore"
          >
            <span class="material-icons text-base">cloud_sync</span>
            Sincronizar a Firebase
          </button>

          <button
            type="button"
            (click)="showAddProductModal = true"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span class="material-icons text-base">add_box</span>
            Añadir Bebida
          </button>

          @if (storeService.products().length > 0) {
            <button
              type="button"
              (click)="showClearAllModal = true"
              [disabled]="storeService.isLoading()"
              class="px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              title="Eliminar todas las bebidas de la colección 'products' en Cloud Firestore"
            >
              <span class="material-icons text-base text-rose-400">delete_sweep</span>
              Vaciar Tienda en Firestore
            </button>
          }

          <a
            routerLink="/tienda/carrito"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 shadow-lg shadow-violet-600/30 flex items-center gap-2"
          >
            <span class="material-icons text-base">shopping_cart</span>
            Ver Carrito ({{ storeService.cartCount() }})
          </a>
        </div>
      </div>

      <!-- Live Firebase Banner -->
      <div class="p-3.5 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-orange-950/30 border border-amber-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div class="flex items-center gap-2 text-amber-300 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span class="font-bold text-amber-200">🔥 Colección 'products' en Cloud Firestore:</span>
          <span class="text-zinc-300">Sincronización reactiva (<code class="text-amber-400">onSnapshot</code>) activa con {{ storeService.products().length }} bebidas disponibles</span>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Total en Carta: <strong class="text-white">{{ storeService.products().length }}</strong></span>
          <span>•</span>
          <span class="text-amber-400 font-bold">Estado: Conectado</span>
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
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="openDeleteConfirmModal(prod)"
                    class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-all"
                    title="Eliminar esta bebida de Cloud Firestore"
                  >
                    <span class="material-icons text-base">delete</span>
                  </button>
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
          </div>
        }
      </div>

      <!-- Empty State if no products in Firestore or search filter -->
      @if (filteredProducts().length === 0) {
        <div class="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4 max-w-xl mx-auto my-8 shadow-xl">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <span class="material-icons text-3xl">liquor</span>
          </div>
          <div class="space-y-1">
            <h3 class="font-heading text-lg font-bold text-white">
              {{ storeService.products().length === 0 ? 'Colección de Bebidas Vacía en Firebase Firestore' : 'No se encontraron bebidas' }}
            </h3>
            <p class="text-xs text-zinc-400 max-w-md mx-auto">
              {{ storeService.products().length === 0 ? 'Se han eliminado todas las bebidas de la colección "products" en Cloud Firestore. Puedes volver a restaurar el catálogo predeterminado de 10 bebidas o registrar un nuevo producto.' : 'Intenta con otro término de búsqueda o selecciona otra categoría.' }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              (click)="storeService.seedProductsToFirestore(true)"
              class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span class="material-icons text-sm">cloud_sync</span>
              Restaurar 10 Bebidas en Firebase
            </button>
            <button
              type="button"
              (click)="showAddProductModal = true"
              class="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <span class="material-icons text-sm">add_box</span>
              Añadir Nueva Bebida
            </button>
          </div>
        </div>
      }

      <!-- Delete Single Product Confirmation Modal -->
      @if (showDeleteConfirmModal && productToDelete) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-rose-900/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div class="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span class="material-icons text-base">warning</span>
                Eliminar de Firebase Firestore
              </div>
              <button (click)="showDeleteConfirmModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
              <img
                [src]="productToDelete.imageUrl"
                [alt]="productToDelete.name"
                class="w-14 h-14 rounded-xl object-cover bg-zinc-900 shrink-0 border border-zinc-800"
              />
              <div class="min-w-0 flex-1">
                <h4 class="font-bold text-sm text-white truncate">{{ productToDelete.name }}</h4>
                <p class="text-xs text-amber-400 font-bold mt-0.5">{{ productToDelete.price | copCurrency }}</p>
                <span class="text-[10px] text-zinc-500 block truncate">{{ productToDelete.categoryName }} • ID: {{ productToDelete.id }}</span>
              </div>
            </div>

            <p class="text-xs text-zinc-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente esta bebida de la colección <code class="text-amber-300 font-mono font-bold bg-black/50 px-1 py-0.5 rounded">products</code> en Cloud Firestore?
            </p>

            <div class="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                (click)="showDeleteConfirmModal = false"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="executeDeleteProduct()"
                class="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                <span class="material-icons text-sm">delete_forever</span>
                Eliminar de Firestore
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Clear All Products Confirmation Modal -->
      @if (showClearAllModal) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-rose-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div class="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <span class="material-icons text-base text-rose-500">dangerous</span>
                Vaciar Colección en Firebase
              </div>
              <button (click)="showClearAllModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="space-y-2">
              <h3 class="font-heading text-lg font-bold text-white">
                ¿Eliminar todas las bebidas de Firestore?
              </h3>
              <p class="text-xs text-zinc-300 leading-relaxed">
                Esta acción eliminará los <strong class="text-rose-400">{{ storeService.products().length }} productos</strong> de la colección <code class="text-amber-300 font-mono bg-black/50 px-1 py-0.5 rounded">products</code> en Firebase Cloud Firestore.
              </p>
              <div class="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-[11px] text-rose-300">
                ⚠️ Podrás restaurar las 10 bebidas iniciales en cualquier momento con el botón <strong>"Sincronizar a Firebase"</strong>.
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                (click)="showClearAllModal = false"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="executeClearAll()"
                class="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:opacity-90 shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                <span class="material-icons text-sm">delete_sweep</span>
                Sí, Vaciar Colección en Firestore
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add Product Modal -->
      @if (showAddProductModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">Firebase Cloud Firestore</span>
                <h3 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-amber-400">add_box</span>
                  Nueva Bebida / Producto a la Carta
                </h3>
              </div>
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
                  placeholder="Ej. Tequila Don Julio 70 Cristalino Añejo"
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
                <button type="submit" [disabled]="productForm.invalid" class="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1.5">
                  <span class="material-icons text-sm">cloud_upload</span>
                  Guardar en Cloud Firestore
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
  public showDeleteConfirmModal = false;
  public showClearAllModal = false;
  public productToDelete: Product | null = null;

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

  public openDeleteConfirmModal(prod: Product) {
    this.productToDelete = prod;
    this.showDeleteConfirmModal = true;
  }

  public executeDeleteProduct() {
    if (this.productToDelete?.id) {
      this.storeService.deleteProduct(this.productToDelete.id);
    }
    this.showDeleteConfirmModal = false;
    this.productToDelete = null;
  }

  public executeClearAll() {
    this.storeService.clearAllProductsFromFirestore();
    this.showClearAllModal = false;
  }

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
