import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { FirebaseService, OperationType } from '../../../core/services/firebase.service';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { Bar } from '../../../core/models/bar.model';

@Component({
  selector: 'app-venue-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Hero Header -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-violet-950/40 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative max-w-3xl space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold uppercase tracking-wider">
            <span class="material-icons text-sm">explore</span>
            Venue Explorer • Popayán Nightlife
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explorador de Bares & Discotecas Populares
          </h1>
          <p class="text-sm text-zinc-300 leading-relaxed">
            Descubre los mejores spots nocturnos filtrados por tu estilo musical preferido y zona de la ciudad. Conexión en tiempo real con Cloud Firestore.
          </p>

          <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <strong class="text-white">{{ filteredVenues().length }}</strong> locales encontrados
            </div>
            <span>•</span>
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-sm text-amber-400">star</span>
              Promedio rating: <strong class="text-white">{{ averageRating() }}</strong>
            </div>
            <span>•</span>
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-sm text-violet-400">groups</span>
              Aforo total activo: <strong class="text-white">{{ totalCapacity() }}</strong> pers.
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Control Center -->
      <div class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        <!-- Search bar & Sorting -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por nombre, ambientación o servicios..."
              class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
            />
          </div>

          <div class="flex items-center gap-3">
            <!-- Filter by Favorites button -->
            <button
              type="button"
              (click)="onlyFavorites.set(!onlyFavorites())"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              [ngClass]="onlyFavorites() ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/50' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'"
              title="Filtrar solo locales que tienes en favoritos"
            >
              <span class="material-icons text-base" [ngClass]="onlyFavorites() ? 'text-white' : 'text-rose-500'">favorite</span>
              <span>Favoritos</span>
              @if (favoritesService.count() > 0) {
                <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950 border border-rose-500/40 text-rose-300 font-extrabold">
                  {{ favoritesService.count() }}
                </span>
              }
            </button>

            <span class="text-xs text-zinc-400 font-semibold shrink-0">Ordenar por:</span>
            <select
              [(ngModel)]="sortBy"
              class="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="rating">★ Más Populares (Rating)</option>
              <option value="capacity">Aforo (Mayor Capacidad)</option>
              <option value="name">Nombre (A - Z)</option>
            </select>

            <button
              (click)="resetFilters()"
              class="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Restablecer filtros"
            >
              Limpiar
            </button>
          </div>
        </div>

        <!-- Filter 1: Estilos Musicales -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span class="material-icons text-sm text-violet-400">queue_music</span>
              Estilo Musical
            </span>
            @if (selectedGenre()) {
              <span class="text-[11px] text-violet-400 font-medium">Filtrando por: {{ selectedGenre() }}</span>
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              (click)="selectedGenre.set('')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              [ngClass]="selectedGenre() === '' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'"
            >
              Todos los Estilos
            </button>

            @for (genre of musicStyles; track genre) {
              <button
                (click)="selectedGenre.set(genre)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                [ngClass]="selectedGenre() === genre ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'"
              >
                <span>{{ genre }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Filter 2: Ubicación & Zonas -->
        <div class="space-y-2 pt-4 border-t border-zinc-800/80">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span class="material-icons text-sm text-fuchsia-400">location_on</span>
              Ubicación & Sector
            </span>
            @if (selectedLocation()) {
              <span class="text-[11px] text-fuchsia-400 font-medium">Zona: {{ selectedLocation() }}</span>
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              (click)="selectedLocation.set('')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              [ngClass]="selectedLocation() === '' ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'"
            >
              Todas las Zonas
            </button>

            @for (loc of locations; track loc) {
              <button
                (click)="selectedLocation.set(loc)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                [ngClass]="selectedLocation() === loc ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'"
              >
                {{ loc }}
              </button>
            }
          </div>
        </div>

      </div>

      <!-- Venues Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (venue of filteredVenues(); track venue.id) {
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-violet-500/50 transition-all flex flex-col group shadow-xl">
            
            <!-- Venue Image & Badges -->
            <div class="relative h-56 bg-zinc-950 overflow-hidden">
              <img
                [src]="venue.imageUrl"
                [alt]="venue.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>

              <!-- Top floating badges -->
              <div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span class="px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400 flex items-center gap-1 shadow-lg">
                  <span class="material-icons text-sm text-amber-400">star</span>
                  {{ venue.rating }}
                </span>

                <div class="flex items-center gap-2">
                  <!-- Heart Toggle Button -->
                  <button
                    type="button"
                    (click)="toggleFav(venue, $event)"
                    class="w-8 h-8 rounded-full bg-zinc-950/85 hover:bg-zinc-900 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all active:scale-75 hover:scale-110 shadow-lg cursor-pointer z-10"
                    [title]="favoritesService.isFavorite(venue.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                  >
                    <span
                      class="material-icons text-base transition-colors"
                      [ngClass]="favoritesService.isFavorite(venue.id) ? 'text-rose-500' : 'text-zinc-400 hover:text-white'"
                    >
                      {{ favoritesService.isFavorite(venue.id) ? 'favorite' : 'favorite_border' }}
                    </span>
                  </button>

                  <span class="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Abierto
                  </span>
                </div>
              </div>

              <!-- Bottom overlay text -->
              <div class="absolute bottom-3 left-4 right-4">
                <span class="inline-block px-2.5 py-0.5 rounded-md bg-violet-950/90 border border-violet-500/30 text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-1">
                  {{ venue.musicGenre }}
                </span>
                <h3 class="font-heading text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors line-clamp-1">
                  {{ venue.name }}
                </h3>
              </div>
            </div>

            <!-- Content Details -->
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div class="space-y-2.5">
                <p class="text-xs text-zinc-300 flex items-center gap-1.5">
                  <span class="material-icons text-sm text-fuchsia-400">location_on</span>
                  {{ venue.address }}, {{ venue.city }}
                </p>

                <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {{ venue.description }}
                </p>

                <!-- Features pills -->
                @if (venue.features && venue.features.length) {
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    @for (feat of venue.features.slice(0, 3); track feat) {
                      <span class="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300">
                        {{ feat }}
                      </span>
                    }
                  </div>
                }
              </div>

              <!-- Stats bar -->
              <div class="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div class="flex items-center gap-1">
                  <span class="material-icons text-xs text-zinc-500">schedule</span>
                  <span class="truncate">{{ venue.openingHours }}</span>
                </div>
                <div class="flex items-center justify-end gap-1">
                  <span class="material-icons text-xs text-zinc-500">groups</span>
                  <span>Aforo: <strong class="text-zinc-200">{{ venue.capacity }}</strong></span>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-2 flex items-center gap-2">
                <button
                  (click)="openQuickView(venue)"
                  class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-violet-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span class="material-icons text-sm">visibility</span>
                  Vista Rápida
                </button>

                <a
                  [routerLink]="['/bares', venue.id]"
                  class="py-2.5 px-3 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1"
                  title="Ficha completa"
                >
                  <span class="material-icons text-sm text-fuchsia-400">arrow_forward</span>
                  Ficha
                </a>
              </div>

            </div>

          </div>
        }
      </div>

      <!-- Empty state when no venues match filter -->
      @if (filteredVenues().length === 0) {
        <div class="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto">
            <span class="material-icons text-3xl">nightlife</span>
          </div>
          <h3 class="font-heading text-lg font-bold text-white">No encontramos locales con esos criterios</h3>
          <p class="text-xs text-zinc-400 max-w-sm mx-auto">
            Prueba seleccionando otro estilo musical o ubicaciones más amplias.
          </p>
          <button
            (click)="resetFilters()"
            class="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            Ver Todos los Bares
          </button>
        </div>
      }

      <!-- Quick View Modal -->
      @if (selectedVenueModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                (click)="toggleFav(selectedVenueModal, $event)"
                class="w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 flex items-center justify-center transition-transform active:scale-90"
                [title]="favoritesService.isFavorite(selectedVenueModal.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'"
              >
                <span
                  class="material-icons text-base transition-colors"
                  [ngClass]="favoritesService.isFavorite(selectedVenueModal.id) ? 'text-rose-500' : 'text-zinc-400 hover:text-white'"
                >
                  {{ favoritesService.isFavorite(selectedVenueModal.id) ? 'favorite' : 'favorite_border' }}
                </span>
              </button>

              <button
                (click)="selectedVenueModal = null"
                class="w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <span class="material-icons text-base">close</span>
              </button>
            </div>

            <div class="relative h-48 rounded-2xl overflow-hidden bg-zinc-950">
              <img [src]="selectedVenueModal.imageUrl" [alt]="selectedVenueModal.name" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
              <div class="absolute bottom-3 left-4 right-4">
                <span class="text-xs font-bold text-fuchsia-400 uppercase tracking-wider block">
                  {{ selectedVenueModal.musicGenre }}
                </span>
                <h3 class="font-heading text-xl font-bold text-white">
                  {{ selectedVenueModal.name }}
                </h3>
              </div>
            </div>

            <div class="space-y-3 text-xs text-zinc-300">
              <p class="leading-relaxed">{{ selectedVenueModal.description }}</p>

              <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div class="flex justify-between">
                  <span class="text-zinc-500">Dirección:</span>
                  <span class="font-semibold text-zinc-200">{{ selectedVenueModal.address }}, {{ selectedVenueModal.city }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Horarios:</span>
                  <span class="font-semibold text-zinc-200">{{ selectedVenueModal.openingHours }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Aforo:</span>
                  <span class="font-semibold text-zinc-200">{{ selectedVenueModal.capacity }} personas</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Contacto:</span>
                  <span class="font-semibold text-zinc-200">{{ selectedVenueModal.phone }}</span>
                </div>
              </div>

              @if (selectedVenueModal.features && selectedVenueModal.features.length) {
                <div>
                  <h4 class="font-bold text-zinc-400 mb-1.5 uppercase text-[10px]">Servicios & Comodidades:</h4>
                  <div class="flex flex-wrap gap-1.5">
                    @for (f of selectedVenueModal.features; track f) {
                      <span class="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                        ✓ {{ f }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
              <a
                href="https://wa.me/573124567890?text=Hola,%20quisiera%20reservar%20en%20Nocturna"
                target="_blank"
                class="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span class="material-icons text-base">chat</span>
                Reservar Mesa
              </a>

              <a
                [routerLink]="['/bares', selectedVenueModal.id]"
                (click)="selectedVenueModal = null"
                class="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span class="material-icons text-base">local_fire_department</span>
                Ver Eventos & Tragos
              </a>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class VenueExplorer implements OnInit {
  private fb = inject(FirebaseService);
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private notify = inject(NotificationService);
  public favoritesService = inject(FavoritesService);

  public venues = signal<Bar[]>([]);
  public searchQuery = '';
  public selectedGenre = signal<string>('');
  public selectedLocation = signal<string>('');
  public onlyFavorites = signal<boolean>(false);
  public sortBy = 'rating';
  public selectedVenueModal: Bar | null = null;

  public musicStyles = [
    'Salsa, Bolero, Son Cubano & Crossover',
    'Techno, Melodic House & Tech-House',
    'Sunset Vibes, Deep House & Nu-Disco',
    'Urbano, Reggaetón, Afrobeat & Crossover'
  ];

  public locations = [
    'Centro Histórico',
    'Barrio Bolívar',
    'Terraza Piso 5',
    'Av. Panamericana'
  ];

  ngOnInit() {
    this.initFirestoreVenues();
  }

  private initFirestoreVenues() {
    // Start with current local bars from service
    this.venues.set(this.barService.bars());

    if (!this.fb.firestore) return;

    try {
      const barsCol = collection(this.fb.firestore, 'bars');
      onSnapshot(barsCol, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Bar[] = [];
          snapshot.forEach(docSnap => {
            loaded.push({ id: docSnap.id, ...(docSnap.data() as Bar) });
          });
          this.venues.set(loaded);
        }
      }, (error) => {
        this.fb.handleError(error, OperationType.GET, 'bars');
      });
    } catch (err) {
      console.warn('Realtime listener fallback to BarService:', err);
    }
  }

  public filteredVenues = computed(() => {
    let list = this.venues();

    // Filter by favorites
    if (this.onlyFavorites()) {
      list = list.filter(v => this.favoritesService.isFavorite(v.id));
    }

    // Filter by music genre
    const genreFilter = this.selectedGenre().toLowerCase();
    if (genreFilter) {
      list = list.filter(v => v.musicGenre.toLowerCase().includes(genreFilter));
    }

    // Filter by location
    const locFilter = this.selectedLocation().toLowerCase();
    if (locFilter) {
      list = list.filter(v =>
        v.address.toLowerCase().includes(locFilter) ||
        v.city.toLowerCase().includes(locFilter)
      );
    }

    // Filter by search text
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.musicGenre.toLowerCase().includes(q)
      );
    }

    // Sort
    if (this.sortBy === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (this.sortBy === 'capacity') {
      list = [...list].sort((a, b) => b.capacity - a.capacity);
    } else if (this.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });

  public averageRating = computed(() => {
    const list = this.filteredVenues();
    if (!list.length) return '0.0';
    const sum = list.reduce((acc, v) => acc + (v.rating || 4.5), 0);
    return (sum / list.length).toFixed(1);
  });

  public totalCapacity = computed(() => {
    return this.filteredVenues().reduce((acc, v) => acc + (v.capacity || 0), 0);
  });

  public resetFilters() {
    this.searchQuery = '';
    this.selectedGenre.set('');
    this.selectedLocation.set('');
    this.onlyFavorites.set(false);
    this.sortBy = 'rating';
  }

  public openQuickView(venue: Bar) {
    this.selectedVenueModal = venue;
  }

  public toggleFav(venue: Bar, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (venue.id) {
      this.favoritesService.toggleFavorite(venue.id, venue.name);
    }
  }
}
