import { Component, inject, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { collection, onSnapshot } from 'firebase/firestore';
import { FirebaseService, OperationType } from '../../../core/services/firebase.service';
import { BarService } from '../../../core/services/bar.service';
import { Bar, BarEvent } from '../../../core/models/bar.model';

@Component({
  selector: 'app-quick-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
      
      <!-- Input Box -->
      <div
        class="relative flex items-center bg-zinc-900/90 hover:bg-zinc-900 border rounded-2xl transition-all shadow-inner"
        [ngClass]="isOpen() ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'"
      >
        <span class="material-icons text-zinc-400 pl-3 text-lg shrink-0">search</span>

        <input
          #searchInput
          type="text"
          [(ngModel)]="searchTerm"
          (focus)="openDropdown()"
          (input)="onInputChange()"
          placeholder="Buscar local o tipo de evento (Salsa, Techno, Terraza)..."
          class="w-full bg-transparent py-2 px-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />

        @if (searchTerm) {
          <button
            type="button"
            (click)="clearSearch($event)"
            class="pr-2.5 text-zinc-500 hover:text-white transition-colors"
            title="Borrar búsqueda"
          >
            <span class="material-icons text-base">cancel</span>
          </button>
        } @else {
          <div class="hidden sm:flex items-center pr-2.5 pointer-events-none">
            <kbd class="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-500">⌘K</kbd>
          </div>
        }
      </div>

      <!-- Backdrop Overlay on mobile when open -->
      @if (isOpen()) {
        <div
          (click)="closeDropdown()"
          class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] sm:hidden"
        ></div>
      }

      <!-- Dynamic Search Dropdown / Popover -->
      @if (isOpen()) {
        <div
          class="absolute left-0 right-0 top-full mt-2 z-50 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 shadow-2xl space-y-4 max-h-[80vh] sm:max-h-[500px] overflow-y-auto w-[90vw] sm:w-[460px] -left-12 sm:left-0"
        >
          <!-- Live Header Status -->
          <div class="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
            <span class="flex items-center gap-1.5 font-bold text-white">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Búsqueda en Vivo en Firestore
            </span>

            @if (searchTerm) {
              <span class="text-fuchsia-400 font-semibold">
                {{ filteredVenues().length }} locales • {{ filteredEvents().length }} eventos
              </span>
            } @else {
              <span class="text-zinc-500">Explora sugerencias o escribe</span>
            }
          </div>

          <!-- Quick Category Filters (Chips) -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Filtros Populares de Eventos & Estilos:</span>
            <div class="flex flex-wrap gap-1.5">
              @for (tag of popularTags; track tag) {
                <button
                  type="button"
                  (click)="selectTag(tag)"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all"
                  [ngClass]="searchTerm.toLowerCase() === tag.toLowerCase() 
                    ? 'bg-fuchsia-600 border-fuchsia-500 text-white' 
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'"
                >
                  {{ tag }}
                </button>
              }
            </div>
          </div>

          <!-- SECTION 1: Locales / Bares Coincidentes -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span class="material-icons text-sm text-fuchsia-400">storefront</span>
                Locales Encontrados ({{ filteredVenues().length }})
              </span>
              @if (filteredVenues().length > 0) {
                <a routerLink="/bares" (click)="closeDropdown()" class="text-[11px] text-fuchsia-400 hover:underline">
                  Ver todos
                </a>
              }
            </div>

            @if (filteredVenues().length > 0) {
              <div class="space-y-2">
                @for (bar of filteredVenues().slice(0, 4); track bar.id) {
                  <div
                    class="p-2.5 rounded-2xl bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <a
                      [routerLink]="['/bares', bar.id]"
                      (click)="closeDropdown()"
                      class="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <img [src]="bar.imageUrl" [alt]="bar.name" class="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <h4 class="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate">
                            {{ bar.name }}
                          </h4>
                          <span class="text-[10px] text-amber-400 font-bold shrink-0">★ {{ bar.rating }}</span>
                        </div>
                        <p class="text-[11px] text-fuchsia-400 font-medium truncate">{{ bar.musicGenre }}</p>
                        <p class="text-[10px] text-zinc-500 truncate">{{ bar.address }}</p>
                      </div>
                    </a>

                    <div class="flex items-center gap-1 shrink-0">
                      <a
                        [routerLink]="['/reservas']"
                        [queryParams]="{ barId: bar.id }"
                        (click)="closeDropdown()"
                        class="px-2.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                        title="Reservar mesa en este local"
                      >
                        <span class="material-icons text-xs">event_seat</span>
                        Reservar
                      </a>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center space-y-1">
                <span class="material-icons text-zinc-600 text-2xl">search_off</span>
                <p class="text-xs text-zinc-400 font-medium">No hay locales que coincidan con "{{ searchTerm }}"</p>
                <p class="text-[10px] text-zinc-500">Prueba con "Salsa", "Techno", "Terraza" o "Crossover".</p>
              </div>
            }
          </div>

          <!-- SECTION 2: Eventos & Fiestas Coincidentes -->
          @if (filteredEvents().length > 0) {
            <div class="space-y-2 pt-2 border-t border-zinc-800/80">
              <span class="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span class="material-icons text-sm text-violet-400">confirmation_number</span>
                Eventos & Fiestas Relacionadas ({{ filteredEvents().length }})
              </span>

              <div class="space-y-2">
                @for (ev of filteredEvents().slice(0, 3); track ev.id) {
                  <a
                    routerLink="/bares/eventos"
                    (click)="closeDropdown()"
                    class="p-2.5 rounded-2xl bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center gap-3 group"
                  >
                    <img [src]="ev.imageUrl" [alt]="ev.title" class="w-11 h-11 rounded-xl object-cover shrink-0" />
                    <div class="min-w-0 flex-1">
                      <div class="text-[10px] text-violet-400 font-bold uppercase tracking-wider">{{ ev.date }} • {{ ev.time }}</div>
                      <h4 class="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                        {{ ev.title }}
                      </h4>
                      <p class="text-[10px] text-zinc-400 truncate">{{ ev.barName }}</p>
                    </div>
                    <span class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400 shrink-0">
                      Entrada
                    </span>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Footer tip -->
          <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Presiona <kbd class="px-1 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">ESC</kbd> para cerrar</span>
            <a routerLink="/bares/explorar" (click)="closeDropdown()" class="text-fuchsia-400 hover:underline font-semibold">
              Explorador Avanzado de Bares →
            </a>
          </div>

        </div>
      }

    </div>
  `
})
export class QuickSearchComponent implements OnInit {
  private fb = inject(FirebaseService);
  private barService = inject(BarService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);

  public searchTerm = '';
  public isOpen = signal<boolean>(false);

  public venues = signal<Bar[]>([]);
  public events = signal<BarEvent[]>([]);

  public popularTags = [
    'Salsa',
    'Techno',
    'Terraza',
    'Crossover',
    'Boiler Room',
    'Reggaetón',
    'VIP'
  ];

  ngOnInit() {
    this.initFirestoreData();
  }

  private initFirestoreData() {
    // Initial data from local service
    this.venues.set(this.barService.bars());

    if (!this.fb.firestore) return;

    try {
      // Listen to bars collection in Firestore
      const barsCol = collection(this.fb.firestore, 'bars');
      onSnapshot(barsCol, (snapshot) => {
        if (!snapshot.empty) {
          const list: Bar[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Bar) });
          });
          this.venues.set(list);
        }
      }, (err) => {
        this.fb.handleError(err, OperationType.GET, 'bars');
      });

      // Listen to events collection in Firestore
      const eventsCol = collection(this.fb.firestore, 'events');
      onSnapshot(eventsCol, (snapshot) => {
        if (!snapshot.empty) {
          const evList: BarEvent[] = [];
          snapshot.forEach(docSnap => {
            evList.push({ id: docSnap.id, ...(docSnap.data() as BarEvent) });
          });
          this.events.set(evList);
        }
      }, (err) => {
        this.fb.handleError(err, OperationType.GET, 'events');
      });
    } catch (e) {
      console.warn('Realtime search listener fallback:', e);
    }
  }

  public filteredVenues = computed(() => {
    const list = this.venues();
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return list;

    return list.filter(bar => {
      const nameMatch = bar.name.toLowerCase().includes(query);
      const genreMatch = bar.musicGenre.toLowerCase().includes(query);
      const addressMatch = (bar.address + ' ' + bar.city).toLowerCase().includes(query);
      const descMatch = (bar.description || '').toLowerCase().includes(query);
      const featuresMatch = Array.isArray(bar.features) && bar.features.some(f => f.toLowerCase().includes(query));

      return nameMatch || genreMatch || addressMatch || descMatch || featuresMatch;
    });
  });

  public filteredEvents = computed(() => {
    const list = this.events();
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return [];

    return list.filter(ev => {
      const titleMatch = ev.title.toLowerCase().includes(query);
      const descMatch = (ev.description || '').toLowerCase().includes(query);
      const barMatch = (ev.barName || '').toLowerCase().includes(query);
      return titleMatch || descMatch || barMatch;
    });
  });

  public openDropdown() {
    this.isOpen.set(true);
  }

  public closeDropdown() {
    this.isOpen.set(false);
  }

  public onInputChange() {
    this.isOpen.set(true);
  }

  public clearSearch(event: Event) {
    event.stopPropagation();
    this.searchTerm = '';
    this.isOpen.set(true);
  }

  public selectTag(tag: string) {
    this.searchTerm = tag;
    this.isOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closeDropdown();
    }
    // Shortcut ⌘+K or Ctrl+K to open search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.isOpen.set(true);
      const inputEl = this.elementRef.nativeElement.querySelector('input');
      inputEl?.focus();
    }
  }
}
