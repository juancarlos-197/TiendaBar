import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Item, ItemType } from '../../models/types';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-item-modal',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        (click)="$event.stopPropagation()"
        class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative text-white my-8 max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div 
              class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              [ngClass]="type() === 'bar' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'">
              <span class="material-icons text-2xl">{{ type() === 'bar' ? 'local_bar' : 'storefront' }}</span>
            </div>
            <div>
              <h2 class="text-xl font-black tracking-tight text-white">
                {{ itemToEdit() ? 'Editar Artículo' : 'Nuevo Registro en Inventario' }}
              </h2>
              <p class="text-xs text-slate-400">
                {{ type() === 'bar' ? 'Sección de Bar & Coctelería' : 'Sección de Tienda & Merchandising' }}
              </p>
            </div>
          </div>

          <button
            (click)="close.emit()"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <span class="material-icons text-xl">close</span>
          </button>
        </div>

        <form (ngSubmit)="saveItem()" class="space-y-5">
          
          <!-- Area Type Selector (Tienda vs Bar) -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Área de Inventario</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                (click)="setType('bar')"
                [class]="type() === 'bar' 
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-md ring-1 ring-amber-500' 
                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800'"
                class="py-3 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all">
                <span class="material-icons text-lg">local_bar</span>
                <span>Bar & Coctelería</span>
              </button>

              <button
                type="button"
                (click)="setType('tienda')"
                [class]="type() === 'tienda' 
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md ring-1 ring-emerald-500' 
                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800'"
                class="py-3 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all">
                <span class="material-icons text-lg">storefront</span>
                <span>Tienda & Librería</span>
              </button>
            </div>
          </div>

          <!-- Title / Nombre -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Título / Nombre del Artículo *
            </label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="Ej. Gin Hendrick’s Orbium o Guía del Sommelier Moderno"
              class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
          </div>

          <!-- Autor / Fabricante & Categoría -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Autor / Marca / Fabricante / Bodega *
              </label>
              <input
                type="text"
                [(ngModel)]="author"
                name="author"
                required
                placeholder="Ej. The Macallan, Ferran Adrià, Bodega Catena"
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoría *
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="category"
                  name="category"
                  required
                  placeholder="Ej. Vinos, Cristalería, Destilados, Libros"
                  list="categoryList"
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
                <datalist id="categoryList">
                  <option value="Vinos & Licores"></option>
                  <option value="Destilados & Ginebras"></option>
                  <option value="Destilados & Whiskies"></option>
                  <option value="Cristalería & Menaje"></option>
                  <option value="Coctelería Profesional"></option>
                  <option value="Libros & Enología"></option>
                  <option value="Libros & Coctelería"></option>
                  <option value="Merchandising & Textil"></option>
                  <option value="Accesorios de Bar"></option>
                </datalist>
              </div>
            </div>
          </div>

          <!-- ISBN / Código & Copias -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                ISBN / Código SKU / Referencia *
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="isbn"
                  name="isbn"
                  required
                  placeholder="Ej. 978-84-415-4201 o BAR-GIN-001"
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono">
                <button
                  type="button"
                  (click)="generateRandomCode()"
                  title="Generar código automático"
                  class="absolute right-2 top-2 text-[11px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">
                  Auto
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Ejemplares Disponibles *
              </label>
              <input
                type="number"
                [(ngModel)]="availableCopies"
                name="availableCopies"
                min="0"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Total de Ejemplares *
              </label>
              <input
                type="number"
                [(ngModel)]="totalCopies"
                name="totalCopies"
                min="1"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>
          </div>

          <!-- Foto de Portada (URL + Presets) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-300">
                Foto de Portada (URL de Imagen) *
              </label>
              <span class="text-[11px] text-slate-400">Selecciona una sugerencia o pega tu enlace</span>
            </div>
            
            <div class="flex gap-3 items-start">
              <div class="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                @if (coverUrl) {
                  <img [src]="coverUrl" alt="Previsualización" class="w-full h-full object-cover">
                } @else {
                  <span class="material-icons text-slate-600 text-2xl">image</span>
                }
              </div>

              <div class="flex-1 space-y-2">
                <input
                  type="url"
                  [(ngModel)]="coverUrl"
                  name="coverUrl"
                  required
                  placeholder="https://images.unsplash.com/..."
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono">
                
                <!-- Quick Cover presets based on type -->
                <div class="flex flex-wrap gap-1.5">
                  @for (preset of (type() === 'bar' ? barImagePresets : storeImagePresets); track preset.name) {
                    <button
                      type="button"
                      (click)="coverUrl = preset.url"
                      class="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full" [ngClass]="type() === 'bar' ? 'bg-amber-400' : 'bg-emerald-400'"></span>
                      <span>{{ preset.name }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Ubicación & Descripción -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Ubicación Física (Estantería, vitrina o cava)
              </label>
              <input
                type="text"
                [(ngModel)]="location"
                name="location"
                placeholder="Ej. Cava Climatizada - Estante 2B"
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Precio / Valor de Reposición (€ / $)
              </label>
              <input
                type="number"
                [(ngModel)]="price"
                name="price"
                placeholder="0.00"
                step="0.5"
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Descripción o Detalles Adicionales
            </label>
            <textarea
              [(ngModel)]="description"
              name="description"
              rows="2"
              placeholder="Notas sobre el producto, añada, precauciones de conservación..."
              class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              (click)="close.emit()"
              class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors">
              Cancelar
            </button>

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
              @if (isSubmitting()) {
                <span class="material-icons animate-spin text-base">autorenew</span>
                <span>Guardando...</span>
              } @else {
                <span class="material-icons text-base">save</span>
                <span>{{ itemToEdit() ? 'Actualizar Artículo' : 'Registrar en Inventario' }}</span>
              }
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
})
export class ItemModalComponent implements OnInit {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public itemToEdit = input<Item | null>(null);
  public defaultType = input<ItemType>('bar');

  public close = output<void>();
  public saved = output<void>();

  public type = signal<ItemType>('bar');
  public isSubmitting = signal<boolean>(false);

  public title = '';
  public author = '';
  public category = '';
  public isbn = '';
  public availableCopies = 1;
  public totalCopies = 1;
  public coverUrl = '';
  public description = '';
  public location = '';
  public price: number | null = null;

  public barImagePresets = [
    { name: 'Vino Tinto', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80' },
    { name: 'Ginebra Botánica', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80' },
    { name: 'Set Coctelería', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
    { name: 'Whisky Reserva', url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&auto=format&fit=crop&q=80' },
    { name: 'Champagne / Cava', url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&auto=format&fit=crop&q=80' },
  ];

  public storeImagePresets = [
    { name: 'Libro Enología', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80' },
    { name: 'Juego Copas Riedel', url: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&auto=format&fit=crop&q=80' },
    { name: 'Delantal Barista', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80' },
    { name: 'Enciclopedia Cócteles', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80' },
    { name: 'Kit Sommelier', url: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=600&auto=format&fit=crop&q=80' },
  ];

  ngOnInit() {
    const item = this.itemToEdit();
    if (item) {
      this.type.set(item.type);
      this.title = item.title;
      this.author = item.author;
      this.category = item.category;
      this.isbn = item.isbn;
      this.availableCopies = item.availableCopies;
      this.totalCopies = item.totalCopies;
      this.coverUrl = item.coverUrl;
      this.description = item.description || '';
      this.location = item.location || '';
      this.price = item.price || null;
    } else {
      this.type.set(this.defaultType());
      this.coverUrl = this.type() === 'bar' ? this.barImagePresets[0].url : this.storeImagePresets[0].url;
      this.generateRandomCode();
    }
  }

  public setType(t: ItemType) {
    this.type.set(t);
    if (!this.itemToEdit()) {
      this.coverUrl = t === 'bar' ? this.barImagePresets[0].url : this.storeImagePresets[0].url;
      this.generateRandomCode();
    }
  }

  public generateRandomCode() {
    const prefix = this.type() === 'bar' ? 'BAR' : 'TND';
    const num = Math.floor(100000 + Math.random() * 900000);
    this.isbn = `${prefix}-${num}`;
  }

  public async saveItem() {
    if (!this.title.trim() || !this.author.trim() || !this.category.trim() || !this.isbn.trim()) {
      this.toastService.warning('Campos incompletos', 'Por favor llena todos los campos obligatorios (*)');
      return;
    }

    if (this.availableCopies > this.totalCopies) {
      this.toastService.warning(
        'Inconsistencia en existencias',
        'Los ejemplares disponibles no pueden superar el total de ejemplares.'
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> = {
        type: this.type(),
        title: this.title.trim(),
        author: this.author.trim(),
        category: this.category.trim(),
        isbn: this.isbn.trim(),
        availableCopies: Number(this.availableCopies),
        totalCopies: Number(this.totalCopies),
        coverUrl: this.coverUrl.trim() || (this.type() === 'bar' ? this.barImagePresets[0].url : this.storeImagePresets[0].url),
        description: this.description.trim(),
        location: this.location.trim(),
        price: this.price ? Number(this.price) : undefined,
      };

      const existing = this.itemToEdit();
      if (existing) {
        await this.firebaseService.updateItem(existing.id, itemData);
        this.toastService.success('Artículo actualizado', `"${this.title}" se ha guardado correctamente.`);
      } else {
        await this.firebaseService.addItem(itemData);
        this.toastService.success('Artículo registrado', `"${this.title}" se agregó al inventario de ${this.type() === 'bar' ? 'Bar' : 'Tienda'}.`);
      }

      this.saved.emit();
      this.close.emit();
    } catch (err: any) {
      console.error(err);
      this.toastService.error('Error al guardar', err?.message || 'No se pudo guardar el artículo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
