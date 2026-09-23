import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { Item, ItemType } from '../../models/types';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Top Action Bar & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Inventario Tienda & Bar</span>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {{ filteredItems().length }} artículos
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Gestión de existencias, ejemplares disponibles, códigos ISBN/SKU y portadas
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Botón de Exportar a CSV -->
          <div class="relative">
            <button
              type="button"
              (click)="toggleExportMenu()"
              [disabled]="filteredItems().length === 0 && totalCount() === 0"
              title="Exportar inventario actual a CSV (Excel / Hojas de cálculo)"
              class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
              <span class="material-icons text-base text-amber-400">file_download</span>
              <span>Exportar CSV</span>
              <span class="material-icons text-xs text-slate-400">arrow_drop_down</span>
            </button>

            @if (showExportMenu()) {
              <div 
                class="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div class="px-3 py-2 border-b border-slate-800">
                  <p class="font-bold text-white text-xs">Descargar Existencias</p>
                  <p class="text-[10px] text-slate-400">Compatible con Excel y Google Sheets (UTF-8)</p>
                </div>
                
                <div class="py-1">
                  <button
                    type="button"
                    (click)="handleExportCurrent()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between group transition-colors">
                    <span class="flex items-center gap-2">
                      <span class="material-icons text-sm text-amber-400">filter_list</span>
                      <span>Vista actual filtrada</span>
                    </span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 group-hover:bg-slate-700 text-slate-400">
                      {{ filteredItems().length }}
                    </span>
                  </button>

                  <button
                    type="button"
                    (click)="handleExportAll()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between group transition-colors">
                    <span class="flex items-center gap-2">
                      <span class="material-icons text-sm text-emerald-400">inventory</span>
                      <span>Catálogo completo</span>
                    </span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 group-hover:bg-slate-700 text-slate-400">
                      {{ totalCount() }}
                    </span>
                  </button>
                </div>

                <div class="pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Separador:</span>
                  <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      (click)="setCsvDelimiter(';')"
                      [class.bg-amber-500]="csvDelimiter() === ';'"
                      [class.text-slate-950]="csvDelimiter() === ';'"
                      [class.font-bold]="csvDelimiter() === ';'"
                      class="px-2 py-0.5 rounded text-[10px]">
                      ; (Excel ES)
                    </button>
                    <button
                      type="button"
                      (click)="setCsvDelimiter(',')"
                      [class.bg-amber-500]="csvDelimiter() === ','"
                      [class.text-slate-950]="csvDelimiter() === ','"
                      [class.font-bold]="csvDelimiter() === ','"
                      class="px-2 py-0.5 rounded text-[10px]">
                      , (Estándar)
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <button
            (click)="openAddItem.emit('bar')"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5">
            <span class="material-icons text-base">local_bar</span>
            <span>+ Agregar a Bar</span>
          </button>

          <button
            (click)="openAddItem.emit('tienda')"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5">
            <span class="material-icons text-base">storefront</span>
            <span>+ Agregar a Tienda</span>
          </button>
        </div>
      </div>

      <!-- Controls: Tabs, Search & Filters -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <!-- Area Tabs -->
          <div class="flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 w-full sm:w-auto">
            <button
              (click)="selectedArea.set('all')"
              [class]="selectedArea() === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="flex-1 sm:flex-initial px-4 py-2 text-xs rounded-xl transition-all">
              Todos ({{ totalCount() }})
            </button>
            <button
              (click)="selectedArea.set('bar')"
              [class]="selectedArea() === 'bar' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="flex-1 sm:flex-initial px-4 py-2 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
              <span class="material-icons text-sm">local_bar</span>
              Bar ({{ barCount() }})
            </button>
            <button
              (click)="selectedArea.set('tienda')"
              [class]="selectedArea() === 'tienda' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="flex-1 sm:flex-initial px-4 py-2 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
              <span class="material-icons text-sm">storefront</span>
              Tienda ({{ tiendaCount() }})
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative flex-1 max-w-md">
            <span class="material-icons absolute left-3.5 top-2.5 text-slate-400 text-lg">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por título, autor/marca, ISBN o categoría..."
              class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            @if (searchQuery) {
              <button
                (click)="searchQuery = ''"
                class="absolute right-3 top-2 text-slate-400 hover:text-white">
                <span class="material-icons text-base">close</span>
              </button>
            }
          </div>

          <!-- Stock Availability Filter -->
          <div class="flex items-center gap-2">
            <button
              (click)="stockFilter.set('all')"
              [class]="stockFilter() === 'all' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-slate-400'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors border border-slate-700/60">
              Todos
            </button>
            <button
              (click)="stockFilter.set('available')"
              [class]="stockFilter() === 'available' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700/60'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors border">
              Disponibles
            </button>
            <button
              (click)="stockFilter.set('empty')"
              [class]="stockFilter() === 'empty' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700/60'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors border">
              Agotados / En préstamo
            </button>
          </div>

        </div>

        <!-- Category chips (dynamic) -->
        @if (allCategories().length > 0) {
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <span class="text-[11px] text-slate-500 mr-1">Categorías:</span>
            <button
              (click)="selectedCategory.set('all')"
              [class]="selectedCategory() === 'all' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
              class="text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors">
              Todas
            </button>
            @for (cat of allCategories(); track cat) {
              <button
                (click)="selectedCategory.set(cat)"
                [class]="selectedCategory() === cat ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
                class="text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors">
                {{ cat }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Items Grid -->
      @if (filteredItems().length === 0) {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
          <span class="material-icons text-5xl text-slate-600 mb-3">inventory_2</span>
          <h3 class="text-base font-bold text-white mb-1">No se encontraron artículos</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Prueba ajustando los términos de búsqueda o añade nuevos ejemplares a la sección de Tienda o Bar.
          </p>
          <div class="flex justify-center gap-3 mt-4">
            <button
              (click)="searchQuery = ''; selectedArea.set('all'); selectedCategory.set('all'); stockFilter.set('all')"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors">
              Limpiar filtros
            </button>
            <button
              (click)="openAddItem.emit('bar')"
              class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors">
              Crear artículo
            </button>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (item of filteredItems(); track item.id) {
            <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all duration-200 hover:-translate-y-1">
              
              <!-- Cover Image & Badges -->
              <div class="relative h-48 bg-slate-800 overflow-hidden">
                <img 
                  [src]="item.coverUrl" 
                  [alt]="item.title" 
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                
                <!-- Area Type Badge -->
                <div class="absolute top-3 left-3">
                  <span 
                    class="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md"
                    [ngClass]="item.type === 'bar' 
                      ? 'bg-amber-500/90 text-slate-950' 
                      : 'bg-emerald-500/90 text-slate-950'">
                    <span class="material-icons text-[12px]">{{ item.type === 'bar' ? 'local_bar' : 'storefront' }}</span>
                    {{ item.type }}
                  </span>
                </div>

                <!-- ISBN Badge -->
                <div class="absolute top-3 right-3">
                  <span class="text-[10px] font-mono font-bold bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700/80 backdrop-blur-md">
                    {{ item.isbn }}
                  </span>
                </div>

                <!-- Stock availability bar overlay -->
                <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span 
                    class="text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow"
                    [ngClass]="item.availableCopies > 0 
                      ? 'bg-emerald-500/80 text-white' 
                      : 'bg-rose-600/90 text-white animate-pulse'">
                    {{ item.availableCopies > 0 ? item.availableCopies + ' disponibles' : 'Sin stock' }}
                  </span>
                  
                  <span class="text-[11px] font-semibold text-slate-300 drop-shadow">
                    Total: {{ item.totalCopies }}
                  </span>
                </div>
              </div>

              <!-- Body Info -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                    <span>{{ item.category }}</span>
                  </div>

                  <h3 class="text-base font-bold text-white line-clamp-1 leading-snug group-hover:text-amber-300 transition-colors">
                    {{ item.title }}
                  </h3>

                  <p class="text-xs text-slate-400 flex items-center gap-1">
                    <span class="material-icons text-sm text-slate-500">business</span>
                    <span class="truncate">{{ item.author }}</span>
                  </p>

                  @if (item.location) {
                    <p class="text-[11px] text-slate-500 flex items-center gap-1">
                      <span class="material-icons text-xs">place</span>
                      <span class="truncate">{{ item.location }}</span>
                    </p>
                  }
                </div>

                <!-- Progress bar of stock -->
                <div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      [ngClass]="item.availableCopies > 0 ? 'bg-amber-400' : 'bg-rose-500'"
                      [style.width.%]="item.totalCopies ? (item.availableCopies / item.totalCopies) * 100 : 0">
                    </div>
                  </div>
                </div>

                <!-- Card Actions -->
                <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    (click)="handleLoanDirect(item)"
                    [disabled]="item.availableCopies <= 0"
                    class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
                    <span class="material-icons text-sm">assignment</span>
                    <span>Prestar</span>
                  </button>

                  <div class="flex items-center gap-1">
                    <button
                      (click)="editItem.emit(item)"
                      title="Editar artículo"
                      class="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors">
                      <span class="material-icons text-base">edit</span>
                    </button>

                    <button
                      (click)="confirmDelete(item)"
                      title="Eliminar artículo"
                      class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <span class="material-icons text-base">delete_outline</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          }
        </div>
      }

    </div>
  `,
})
export class InventoryComponent {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public openAddItem = output<ItemType>();
  public editItem = output<Item>();
  public loanItem = output<string>(); // emits itemId

  public searchQuery = '';
  public selectedArea = signal<'all' | 'tienda' | 'bar'>('all');
  public selectedCategory = signal<string>('all');
  public stockFilter = signal<'all' | 'available' | 'empty'>('all');

  // CSV Export state
  public showExportMenu = signal<boolean>(false);
  public csvDelimiter = signal<string>(';');

  public toggleExportMenu() {
    this.showExportMenu.update((v) => !v);
  }

  public setCsvDelimiter(delim: string) {
    this.csvDelimiter.set(delim);
  }

  public handleExportCurrent() {
    this.showExportMenu.set(false);
    this.exportToCsv(false);
  }

  public handleExportAll() {
    this.showExportMenu.set(false);
    this.exportToCsv(true);
  }

  public totalCount = computed(() => this.firebaseService.items().length);
  public barCount = computed(() => this.firebaseService.items().filter((i) => i.type === 'bar').length);
  public tiendaCount = computed(() => this.firebaseService.items().filter((i) => i.type === 'tienda').length);

  public allCategories = computed(() => {
    const cats = new Set<string>();
    this.firebaseService.items().forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats);
  });

  public filteredItems = computed(() => {
    let list = this.firebaseService.items();

    // Area filter
    if (this.selectedArea() !== 'all') {
      list = list.filter((i) => i.type === this.selectedArea());
    }

    // Category filter
    if (this.selectedCategory() !== 'all') {
      list = list.filter((i) => i.category === this.selectedCategory());
    }

    // Stock filter
    if (this.stockFilter() === 'available') {
      list = list.filter((i) => i.availableCopies > 0);
    } else if (this.stockFilter() === 'empty') {
      list = list.filter((i) => i.availableCopies <= 0);
    }

    // Search query
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.author?.toLowerCase().includes(q) ||
          i.isbn?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q)
      );
    }

    return list;
  });

  public handleLoanDirect(item: Item) {
    if (item.availableCopies <= 0) {
      this.toastService.warning('Sin existencias', 'No quedan ejemplares disponibles de este artículo.');
      return;
    }
    this.loanItem.emit(item.id);
  }

  public async confirmDelete(item: Item) {
    if (confirm(`¿Estás seguro de que deseas eliminar "${item.title}" (${item.isbn}) del inventario?`)) {
      try {
        await this.firebaseService.deleteItem(item.id, item.title);
        this.toastService.success('Eliminado', `"${item.title}" fue eliminado del catálogo.`);
      } catch (err: any) {
        this.toastService.error('Error', err?.message || 'No se pudo eliminar el artículo.');
      }
    }
  }

  /**
   * Exporta la lista de existencias a un archivo CSV para gestión externa (Excel, Google Sheets)
   */
  public exportToCsv(exportAll = false) {
    const itemsToExport = exportAll ? this.firebaseService.items() : this.filteredItems();

    if (itemsToExport.length === 0) {
      this.toastService.warning('Inventario vacío', 'No hay artículos en la lista para exportar.');
      return;
    }

    const delimiter = this.csvDelimiter();

    // Encabezados con nombres descriptivos para gestión externa
    const headers = [
      'ID Sistema',
      'Área',
      'Título / Producto',
      'Autor / Marca / Bodega',
      'Categoría',
      'ISBN / SKU / Código',
      'Ejemplares Disponibles',
      'Ejemplares Totales',
      'Ejemplares en Préstamo',
      'Ubicación',
      'Precio Estimado (€)',
      'Estado de Stock',
      'Descripción',
      'Fecha Registro',
      'Última Modificación',
    ];

    const escapeCsv = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const cleanStr = String(val).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const headerLine = headers.map((h) => escapeCsv(h)).join(delimiter);

    const dataRows = itemsToExport.map((item) => {
      const prestados = Math.max(0, item.totalCopies - item.availableCopies);
      const estadoStock = item.availableCopies > 0 ? 'Disponible' : 'Agotado';
      const area = item.type === 'bar' ? 'Bar' : 'Tienda';
      const precio = item.price !== undefined ? item.price.toFixed(2) : '';
      const createdStr = item.createdAt ? new Date(item.createdAt).toLocaleString('es-ES') : '';
      const updatedStr = item.updatedAt ? new Date(item.updatedAt).toLocaleString('es-ES') : '';

      return [
        escapeCsv(item.id),
        escapeCsv(area),
        escapeCsv(item.title),
        escapeCsv(item.author),
        escapeCsv(item.category),
        escapeCsv(item.isbn),
        item.availableCopies,
        item.totalCopies,
        prestados,
        escapeCsv(item.location || 'No especificada'),
        escapeCsv(precio),
        escapeCsv(estadoStock),
        escapeCsv(item.description || ''),
        escapeCsv(createdStr),
        escapeCsv(updatedStr),
      ].join(delimiter);
    });

    // Añadir Byte Order Mark (BOM) UTF-8 para garantizar apertura perfecta de tildes y caracteres especiales en Excel
    const csvContent = '\uFEFF' + [headerLine, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const scopeLabel = exportAll ? 'catalogo_completo' : this.selectedArea();
    const fileName = `existencias_${scopeLabel}_${dateStr}_${timeStr}.csv`;

    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    this.toastService.success(
      'Exportación CSV exitosa',
      `Se descargó "${fileName}" con ${itemsToExport.length} artículos.`
    );
  }
}
