import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bar } from '../../../core/models/bar.model';

@Component({
  selector: 'app-lista-bares',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-violet-400 text-3xl">local_bar</span>
            Bares, Discotecas & Clubs
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Los mejores espacios nocturnos, música en vivo y pistas de baile de la ciudad
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <a
            routerLink="/bares/explorar"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 shadow-lg shadow-fuchsia-600/30 flex items-center gap-2"
          >
            <span class="material-icons text-base">explore</span>
            Venue Explorer
          </a>

          <!-- Add bar button (available for BAR_OWNER or ADMIN) -->
          @if (auth.isBarOwner() || auth.isAdmin()) {
            <button
              (click)="showCreateModal = true"
              class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30 flex items-center gap-2"
            >
              <span class="material-icons text-base">add_business</span>
              Registrar Bar
            </button>
          }
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="relative w-full md:w-96">
          <span class="material-icons absolute left-3.5 top-2.5 text-zinc-500 text-lg">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre, género musical o zona..."
            class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <!-- Filter genres -->
        <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            (click)="selectedGenre = ''"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedGenre === '' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'"
          >
            Todos
          </button>
          <button
            (click)="selectedGenre = 'Salsa'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedGenre === 'Salsa' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'"
          >
            Salsa & Bohemia
          </button>
          <button
            (click)="selectedGenre = 'Techno'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedGenre === 'Techno' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'"
          >
            Electrónica & Techno
          </button>
          <button
            (click)="selectedGenre = 'Sunset'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedGenre === 'Sunset' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'"
          >
            Rooftops & Lounge
          </button>
          <button
            (click)="selectedGenre = 'Reggaetón'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            [ngClass]="selectedGenre === 'Reggaetón' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'"
          >
            Reggaetón & Perreo
          </button>
        </div>
      </div>

      <!-- Bares Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        @for (bar of filteredBars(); track bar.id) {
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-violet-500/40 transition-all flex flex-col group shadow-xl">
            
            <div class="relative h-60 overflow-hidden bg-zinc-800">
              <img
                [src]="bar.imageUrl"
                [alt]="bar.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>

              <!-- Top badges -->
              <div class="absolute top-4 left-4 flex items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400 flex items-center gap-1">
                  <span class="material-icons text-sm text-amber-400">star</span>
                  {{ bar.rating }}
                </span>
                <span class="px-3 py-1 rounded-full bg-violet-950/80 backdrop-blur-md border border-violet-500/30 text-xs font-semibold text-violet-300">
                  {{ bar.musicGenre }}
                </span>
              </div>

              <!-- Bottom location details over image -->
              <div class="absolute bottom-4 left-4 right-4">
                <h3 class="font-heading text-xl font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                  {{ bar.name }}
                </h3>
                <p class="text-xs text-zinc-300 flex items-center gap-1 mt-1">
                  <span class="material-icons text-sm text-fuchsia-400">location_on</span>
                  {{ bar.address }}, {{ bar.city }}
                </p>
              </div>
            </div>

            <!-- Content body -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
              <p class="text-xs text-zinc-400 leading-relaxed">
                {{ bar.description }}
              </p>

              <!-- Tags / Features -->
              @if (bar.features && bar.features.length) {
                <div class="flex flex-wrap gap-1.5">
                  @for (feat of bar.features; track feat) {
                    <span class="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                      ✓ {{ feat }}
                    </span>
                  }
                </div>
              }

              <div class="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-sm text-zinc-500">schedule</span>
                  {{ bar.openingHours }}
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-sm text-zinc-500">groups</span>
                  Aforo: {{ bar.capacity }} pers.
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-2 flex items-center gap-3">
                <a
                  [routerLink]="['/bares', bar.id]"
                  class="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-zinc-800 hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span class="material-icons text-sm">visibility</span>
                  Ver Detalle & Eventos
                </a>

                <a
                  routerLink="/tienda"
                  class="py-2.5 px-3 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1"
                  title="Pedir bebidas"
                >
                  <span class="material-icons text-base text-amber-400">local_bar</span>
                  Pedir Tragos
                </a>

                @if (auth.isAdmin() || (auth.isBarOwner() && bar.ownerId === auth.userProfile()?.uid)) {
                  <button
                    (click)="barService.deleteBar(bar.id!)"
                    class="p-2.5 rounded-xl text-xs text-rose-400 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-800/30 transition-colors"
                    title="Eliminar Bar"
                  >
                    <span class="material-icons text-base">delete</span>
                  </button>
                }
              </div>

            </div>

          </div>
        }
      </div>

      <!-- Create Bar Modal -->
      @if (showCreateModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span class="material-icons text-violet-400">store</span>
                Registrar Nuevo Bar o Discoteca
              </h3>
              <button (click)="showCreateModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="barForm" (ngSubmit)="onCreateBar()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Nombre del Local</label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej. Club Nocturno Berlín"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Descripción</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  placeholder="Concepto, ambiente, propuesta gastronómica..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Dirección</label>
                  <input
                    type="text"
                    formControlName="address"
                    placeholder="Cra 9 # 10-20"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Ciudad</label>
                  <input
                    type="text"
                    formControlName="city"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Género Musical Principal</label>
                  <input
                    type="text"
                    formControlName="musicGenre"
                    placeholder="Salsa, Techno, Crossover..."
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Aforo (Capacidad)</label>
                  <input
                    type="number"
                    formControlName="capacity"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  formControlName="imageUrl"
                  placeholder="https://..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Horario de Atención</label>
                <input
                  type="text"
                  formControlName="openingHours"
                  placeholder="Jue - Sáb: 7:00 PM - 3:00 AM"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="showCreateModal = false"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="barForm.invalid"
                  class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/30 disabled:opacity-50"
                >
                  Guardar en Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class ListaBaresComponent {
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public searchQuery = '';
  public selectedGenre = '';
  public showCreateModal = false;

  public barForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['Popayán', [Validators.required]],
    phone: ['+57 310 000 0000'],
    musicGenre: ['Crossover & Rumba', [Validators.required]],
    capacity: [200, [Validators.required]],
    openingHours: ['Jue - Sáb: 6:00 PM - 3:00 AM'],
    imageUrl: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80']
  });

  public filteredBars = computed(() => {
    let list = this.barService.bars();
    if (this.selectedGenre) {
      list = list.filter(b => b.musicGenre.toLowerCase().includes(this.selectedGenre.toLowerCase()));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.musicGenre.toLowerCase().includes(q)
      );
    }
    return list;
  });

  onCreateBar() {
    if (this.barForm.valid) {
      const val = this.barForm.value;
      this.barService.createBar({
        name: val.name!,
        description: val.description!,
        address: val.address!,
        city: val.city!,
        phone: val.phone!,
        musicGenre: val.musicGenre!,
        capacity: Number(val.capacity),
        rating: 4.8,
        openingHours: val.openingHours!,
        imageUrl: val.imageUrl!,
        active: true,
        ownerId: this.auth.userProfile()?.uid || 'owner-custom',
        features: ['Música en Vivo', 'Barra Premium']
      });
      this.showCreateModal = false;
      this.barForm.reset({
        city: 'Popayán',
        phone: '+57 310 000 0000',
        musicGenre: 'Crossover',
        capacity: 200,
        openingHours: 'Jue - Sáb: 6:00 PM - 3:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80'
      });
    }
  }
}
