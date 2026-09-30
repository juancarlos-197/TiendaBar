import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { doc, onSnapshot, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { FirebaseService, OperationType } from '../../../core/services/firebase.service';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Bar, BarEvent } from '../../../core/models/bar.model';

interface TableReservation {
  id?: string;
  barId: string;
  barName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guestsCount: number;
  tableArea: 'TERRAZA' | 'BARRA' | 'PISTA' | 'PALCO_VIP';
  specialRequests?: string;
  status: 'CONFIRMED' | 'PENDING';
  reservationCode: string;
  createdAt: string;
}

@Component({
  selector: 'app-venue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CopCurrencyPipe],
  template: `
    @if (venue(); as item) {
      <div class="space-y-8 pb-16">
        
        <!-- Navigation Breadcrumb -->
        <div class="flex items-center justify-between">
          <a
            routerLink="/bares"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-colors"
          >
            <span class="material-icons text-sm">arrow_back</span>
            Volver a Bares & Discotecas
          </a>

          <div class="flex items-center gap-2">
            <a
              routerLink="/bares/explorar"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-xs font-semibold text-violet-300 border border-violet-800/40 transition-colors"
            >
              <span class="material-icons text-sm">explore</span>
              Venue Explorer
            </a>
          </div>
        </div>

        <!-- 1. Interactive Photo Gallery -->
        <div class="space-y-3">
          <!-- Main Hero Image Showcase -->
          <div class="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl group">
            <img
              [src]="activeGalleryImage()"
              [alt]="item.name"
              class="w-full h-full object-cover transition-all duration-700 cursor-zoom-in"
              (click)="lightboxOpen = true"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none"></div>

            <!-- Fullscreen Lightbox Button -->
            <button
              (click)="lightboxOpen = true"
              class="absolute top-4 right-4 p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 text-white backdrop-blur-md border border-white/10 transition-transform active:scale-95 shadow-lg"
              title="Ver en pantalla completa"
            >
              <span class="material-icons text-base">fullscreen</span>
            </button>

            <!-- Status Indicator Overlay -->
            <div class="absolute top-4 left-4 flex items-center gap-2">
              <span class="px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400 flex items-center gap-1 shadow-lg">
                <span class="material-icons text-sm text-amber-400">star</span>
                {{ item.rating }}
              </span>
              <span class="px-3 py-1 rounded-full bg-violet-950/85 backdrop-blur-md border border-violet-500/30 text-xs font-bold text-violet-300">
                {{ item.musicGenre }}
              </span>
            </div>

            <!-- Bottom Title on Main Image -->
            <div class="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-none">
              <div>
                <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {{ item.name }}
                </h1>
                <p class="text-xs sm:text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                  <span class="material-icons text-sm text-fuchsia-400">location_on</span>
                  {{ item.address }}, {{ item.city }}
                </p>
              </div>

              <!-- Reservation Quick Triggers -->
              <div class="flex items-center gap-2 pointer-events-auto">
                <button
                  (click)="openReservationModal()"
                  class="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-fuchsia-600/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span class="material-icons text-base">table_restaurant</span>
                  Reservar Mesa
                </button>
              </div>
            </div>
          </div>

          <!-- Thumbnails Strip -->
          @if (galleryList().length > 1) {
            <div class="flex items-center gap-3 overflow-x-auto pb-1">
              @for (photo of galleryList(); track photo; let i = $index) {
                <button
                  (click)="activeGalleryImage.set(photo)"
                  class="relative w-24 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all"
                  [ngClass]="activeGalleryImage() === photo ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/40 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'"
                >
                  <img [src]="photo" [alt]="'Foto ' + (i + 1)" class="w-full h-full object-cover" />
                </button>
              }
            </div>
          }
        </div>

        <!-- 2. Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left 2 Cols: Details, Schedule, Features, Events -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Description & Atmosphere -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div class="flex items-center justify-between">
                <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-violet-400">nightlife</span>
                  Concepto & Ambiente
                </h2>
                <span class="text-xs text-zinc-500">ID Local: {{ item.id }}</span>
              </div>

              <p class="text-sm text-zinc-300 leading-relaxed">
                {{ item.description }}
              </p>

              <!-- Quick Specs Pills -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80">
                <div class="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <span class="text-[10px] text-zinc-500 font-semibold uppercase block">Aforo Total</span>
                  <span class="text-xs font-bold text-white mt-0.5 block">{{ item.capacity }} personas</span>
                </div>

                <div class="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <span class="text-[10px] text-zinc-500 font-semibold uppercase block">Dress Code</span>
                  <span class="text-xs font-bold text-fuchsia-400 mt-0.5 block truncate">{{ item.dressCode || 'Casual Rumba' }}</span>
                </div>

                <div class="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <span class="text-[10px] text-zinc-500 font-semibold uppercase block">Edad Mínima</span>
                  <span class="text-xs font-bold text-amber-400 mt-0.5 block">+{{ item.minAge || 18 }} Años</span>
                </div>

                <div class="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <span class="text-[10px] text-zinc-500 font-semibold uppercase block">Estilo Central</span>
                  <span class="text-xs font-bold text-violet-400 mt-0.5 block truncate">{{ item.musicGenre }}</span>
                </div>
              </div>

              <!-- Venue Features -->
              @if (item.features && item.features.length) {
                <div class="pt-2">
                  <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Comodidades y Servicios</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (feat of item.features; track feat) {
                      <span class="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5">
                        <span class="material-icons text-sm text-emerald-400">check_circle</span>
                        {{ feat }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Horarios de Apertura Desglosados -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div class="flex items-center justify-between">
                <h2 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-amber-400">schedule</span>
                  Horarios de Atención
                </h2>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Horario habitual nocturno
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                @for (entry of getScheduleList(item); track entry.day) {
                  <div class="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                    <span class="font-semibold text-zinc-300">{{ entry.day }}</span>
                    <span [ngClass]="entry.isOpen ? 'text-zinc-200 font-bold' : 'text-zinc-500'">{{ entry.hours }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Eventos Programados en Este Bar -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div class="flex items-center justify-between">
                <h2 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-fuchsia-400">confirmation_number</span>
                  Cartelera de Fiestas & Conciertos en Este Local
                </h2>
                <a routerLink="/bares/eventos" class="text-xs text-fuchsia-400 hover:underline">
                  Ver todos los eventos
                </a>
              </div>

              @if (venueEvents().length > 0) {
                <div class="space-y-3">
                  @for (ev of venueEvents(); track ev.id) {
                    <div class="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div class="flex items-center gap-3.5">
                        <img [src]="ev.imageUrl" [alt]="ev.title" class="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <div class="text-xs text-violet-400 font-semibold">{{ ev.date }} • {{ ev.time }}</div>
                          <h4 class="text-sm font-bold text-white">{{ ev.title }}</h4>
                          <p class="text-xs text-zinc-400">{{ ev.description }}</p>
                        </div>
                      </div>

                      <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <span class="font-extrabold text-sm text-fuchsia-400">{{ ev.coverPrice | copCurrency }}</span>
                        <button
                          (click)="barService.buyTicket(ev.id!)"
                          class="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 shadow-md transition-all active:scale-95"
                        >
                          Reservar Cover
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-6 text-zinc-500 text-xs">
                  No hay eventos programados en este local para los próximos días.
                </div>
              }
            </div>

          </div>

          <!-- Right 1 Col: Address & Interactive Maps, Booking Actions -->
          <div class="space-y-6">
            
            <!-- Reservation Hub Box -->
            <div class="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Mesa Garantizada</span>
                <h3 class="font-heading text-xl font-extrabold text-white">Reserva tu Espacio</h3>
                <p class="text-xs text-zinc-400">Evita filas en la entrada y asegura la mejor mesa con tus amigos.</p>
              </div>

              <div class="space-y-2.5 pt-2">
                <button
                  (click)="openReservationModal()"
                  class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <span class="material-icons text-base">event_seat</span>
                  Reserva Rápida de Mesa
                </button>

                <a
                  [routerLink]="['/reservas']"
                  [queryParams]="{ barId: item.id }"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <span class="material-icons text-base text-fuchsia-400">calendar_month</span>
                  Configurar Reserva Avanzada
                </a>

                <a
                  [href]="getWhatsAppLink(item)"
                  target="_blank"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <span class="material-icons text-base">chat</span>
                  Reservar vía WhatsApp
                </a>

                <a
                  routerLink="/tienda"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <span class="material-icons text-base text-amber-400">liquor</span>
                  Pedir Bebidas & Cócteles
                </a>
              </div>
            </div>

            <!-- Address & Map Card with Direct Navigation Link -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 class="font-heading text-base font-bold text-white flex items-center gap-2">
                <span class="material-icons text-rose-500">pin_drop</span>
                Ubicación & Cómo Llegar
              </h3>

              <div class="space-y-1 text-xs">
                <p class="text-zinc-200 font-bold">{{ item.address }}</p>
                <p class="text-zinc-400">{{ item.city }}, Cauca, Colombia</p>
                <p class="text-zinc-500 text-[11px] pt-1">Teléfono: {{ item.phone }}</p>
              </div>

              <!-- Interactive Map Mock with Direct Google Maps Button -->
              <div class="relative h-44 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center p-4 group">
                <!-- Map Background graphic styling -->
                <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div class="relative z-10 space-y-2">
                  <div class="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <span class="material-icons text-xl">location_on</span>
                  </div>
                  <span class="text-xs font-bold text-white block">{{ item.name }}</span>
                  <span class="text-[11px] text-zinc-400 block">{{ item.address }}</span>
                </div>
              </div>

              <!-- External Map Actions -->
              <div class="flex items-center gap-2 pt-1">
                <a
                  [href]="getMapUrl(item)"
                  target="_blank"
                  class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-violet-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span class="material-icons text-sm">map</span>
                  Abrir en Google Maps
                </a>

                <button
                  (click)="copyAddress(item.address)"
                  class="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                  title="Copiar dirección"
                >
                  <span class="material-icons text-sm">content_copy</span>
                </button>
              </div>
            </div>

            <!-- VIP Clubber Membership Callout -->
            <div class="bg-gradient-to-tr from-amber-950/30 to-zinc-900 border border-amber-500/30 rounded-3xl p-6 space-y-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-400">stars</span>
                <h4 class="font-heading text-sm font-bold text-amber-300">Pase VIP Clubber</h4>
              </div>
              <p class="text-xs text-zinc-300 leading-relaxed">
                Ingresa a {{ item.name }} por la Fila Express y disfruta de 15% de descuento en botellas con tu suscripción activa.
              </p>
              <a
                routerLink="/suscripciones"
                class="inline-block text-xs font-bold text-amber-400 hover:underline"
              >
                Conocer planes VIP →
              </a>
            </div>

          </div>

        </div>

        <!-- 3. Lightbox Modal for Photos -->
        @if (lightboxOpen) {
          <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <button
              (click)="lightboxOpen = false"
              class="absolute top-6 right-6 p-2 rounded-full bg-zinc-900 text-zinc-300 hover:text-white"
            >
              <span class="material-icons text-2xl">close</span>
            </button>

            <div class="max-w-4xl w-full max-h-[80vh] flex items-center justify-center">
              <img
                [src]="activeGalleryImage()"
                [alt]="item.name"
                class="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <!-- Gallery strip inside lightbox -->
            <div class="flex items-center gap-2 mt-4 overflow-x-auto p-2">
              @for (photo of galleryList(); track photo) {
                <button
                  (click)="activeGalleryImage.set(photo)"
                  class="w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0"
                  [ngClass]="activeGalleryImage() === photo ? 'border-fuchsia-500 scale-105' : 'border-zinc-800 opacity-50'"
                >
                  <img [src]="photo" alt="Thumb" class="w-full h-full object-cover" />
                </button>
              }
            </div>
          </div>
        }

        <!-- 4. Interactive Reservation Modal -->
        @if (showReservationModal) {
          <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <button
                (click)="showReservationModal = false"
                class="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <span class="material-icons">close</span>
              </button>

              @if (!reservationConfirmed) {
                <div class="space-y-4">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                      <span class="material-icons text-xl">event_seat</span>
                    </div>
                    <div>
                      <h3 class="font-heading text-lg font-bold text-white">Reserva de Mesa</h3>
                      <p class="text-xs text-zinc-400">{{ item.name }}</p>
                    </div>
                  </div>

                  <form (ngSubmit)="submitReservation(item)" class="space-y-3 text-xs">
                    <div>
                      <label class="block font-semibold text-zinc-300 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        [(ngModel)]="resForm.customerName"
                        name="customerName"
                        required
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block font-semibold text-zinc-300 mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          [(ngModel)]="resForm.customerPhone"
                          name="customerPhone"
                          required
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label class="block font-semibold text-zinc-300 mb-1">Personas</label>
                        <select
                          [(ngModel)]="resForm.guestsCount"
                          name="guestsCount"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                        >
                          <option [value]="2">2 personas (Pareja)</option>
                          <option [value]="4">4 personas</option>
                          <option [value]="6">6 personas (Grupo)</option>
                          <option [value]="10">10+ personas (Palco)</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block font-semibold text-zinc-300 mb-1">Fecha</label>
                        <input
                          type="date"
                          [(ngModel)]="resForm.date"
                          name="date"
                          required
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label class="block font-semibold text-zinc-300 mb-1">Hora Estimada</label>
                        <input
                          type="time"
                          [(ngModel)]="resForm.time"
                          name="time"
                          required
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block font-semibold text-zinc-300 mb-1">Ubicación Deseada</label>
                      <select
                        [(ngModel)]="resForm.tableArea"
                        name="tableArea"
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value="TERRAZA">Zona Terraza / Aire Libre</option>
                        <option value="BARRA">Cerca de la Barra Principal</option>
                        <option value="PISTA">Pista de Baile</option>
                        <option value="PALCO_VIP">Palco VIP Exclusivo</option>
                      </select>
                    </div>

                    <div>
                      <label class="block font-semibold text-zinc-300 mb-1">Solicitudes Especiales (Opcional)</label>
                      <textarea
                        [(ngModel)]="resForm.specialRequests"
                        name="specialRequests"
                        rows="2"
                        placeholder="Ej. Cumpleaños, botella de bienvenida..."
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                      ></textarea>
                    </div>

                    <div class="pt-3">
                      <button
                        type="submit"
                        class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
                      >
                        Confirmar Reserva Inmediata
                      </button>
                    </div>
                  </form>
                </div>
              } @else {
                <!-- Reservation Confirmation Voucher -->
                <div class="space-y-4 text-center py-2">
                  <div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <span class="material-icons text-3xl">check_circle</span>
                  </div>

                  <h3 class="font-heading text-xl font-bold text-white">¡Mesa Reservada con Éxito!</h3>
                  <p class="text-xs text-zinc-400">
                    Tu solicitud ha sido guardada en {{ item.name }}.
                  </p>

                  <div class="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-zinc-500">Código de Reserva:</span>
                      <span class="font-mono font-bold text-fuchsia-400">{{ generatedCode }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-zinc-500">Titular:</span>
                      <span class="font-bold text-white">{{ resForm.customerName }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-zinc-500">Fecha & Hora:</span>
                      <span class="font-bold text-zinc-200">{{ resForm.date }} a las {{ resForm.time }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-zinc-500">Invitados:</span>
                      <span class="font-bold text-zinc-200">{{ resForm.guestsCount }} personas ({{ resForm.tableArea }})</span>
                    </div>
                  </div>

                  <div class="pt-2 flex items-center gap-2">
                    <button
                      (click)="showReservationModal = false"
                      class="flex-1 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                    >
                      Listo, Cerrar
                    </button>
                    <a
                      [href]="getConfirmationWhatsAppLink(item)"
                      target="_blank"
                      class="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <span class="material-icons text-sm">chat</span>
                      Notificar por WhatsApp
                    </a>
                  </div>
                </div>
              }

            </div>
          </div>
        }

      </div>
    } @else {
      <!-- Not found state -->
      <div class="text-center py-24 space-y-4">
        <span class="material-icons text-5xl text-zinc-600">storefront</span>
        <h2 class="font-heading text-xl font-bold text-white">Local no encontrado</h2>
        <p class="text-xs text-zinc-400">El bar que estás buscando no existe o fue deshabilitado.</p>
        <a routerLink="/bares" class="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500">
          Volver al Catálogo de Bares
        </a>
      </div>
    }
  `
})
export class VenueDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FirebaseService);
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private notify = inject(NotificationService);

  public venue = signal<Bar | undefined>(undefined);
  public venueEvents = signal<BarEvent[]>([]);
  public activeGalleryImage = signal<string>('');
  public lightboxOpen = false;
  public showReservationModal = false;
  public reservationConfirmed = false;
  public generatedCode = '';

  public resForm = {
    customerName: '',
    customerPhone: '+57 312 000 0000',
    guestsCount: 4,
    date: '2026-10-03',
    time: '21:00',
    tableArea: 'TERRAZA' as 'TERRAZA' | 'BARRA' | 'PISTA' | 'PALCO_VIP',
    specialRequests: ''
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadVenue(id);
      }
    });

    const user = this.auth.userProfile();
    if (user) {
      this.resForm.customerName = user.name;
    }
  }

  private loadVenue(id: string) {
    // 1. Initial quick load from BarService
    const local = this.barService.getBarById(id);
    if (local) {
      this.setVenueData(local);
    }

    // 2. Real-time Firestore sync
    if (this.fb.firestore) {
      try {
        const docRef = doc(this.fb.firestore, 'bars', id);
        onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...(docSnap.data() as Bar) };
            this.setVenueData(data);
          }
        }, (err) => {
          this.fb.handleError(err, OperationType.GET, `bars/${id}`);
        });
      } catch (e) {
        console.warn('Realtime sync fallback:', e);
      }
    }

    // 3. Load venue events
    this.venueEvents.set(this.barService.events().filter(e => e.barId === id));
  }

  private setVenueData(bar: Bar) {
    this.venue.set(bar);
    const photos = this.getPhotos(bar);
    this.activeGalleryImage.set(photos[0] || bar.imageUrl);
  }

  public galleryList = computed(() => {
    const v = this.venue();
    return v ? this.getPhotos(v) : [];
  });

  private getPhotos(bar: Bar): string[] {
    if (bar.galleryUrls && bar.galleryUrls.length) {
      return bar.galleryUrls;
    }
    return [
      bar.imageUrl,
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80'
    ];
  }

  public getScheduleList(bar: Bar): { day: string; hours: string; isOpen: boolean }[] {
    if (bar.schedule && bar.schedule.length) {
      return bar.schedule.map(s => ({
        day: s.day,
        hours: s.hours,
        isOpen: s.isOpen ?? true
      }));
    }
    return [
      { day: 'Miércoles y Jueves', hours: bar.openingHours || '5:00 PM - 2:00 AM', isOpen: true },
      { day: 'Viernes y Sábado', hours: '5:00 PM - 3:30 AM', isOpen: true },
      { day: 'Domingo', hours: 'Cerrado', isOpen: false }
    ];
  }

  public getMapUrl(bar: Bar): string {
    if (bar.mapUrl) return bar.mapUrl;
    const queryStr = encodeURIComponent(`${bar.name}, ${bar.address}, ${bar.city}, Colombia`);
    return `https://www.google.com/maps/search/?api=1&query=${queryStr}`;
  }

  public getWhatsAppLink(bar: Bar): string {
    const phoneClean = bar.phone.replace(/[^0-9]/g, '') || '573124567890';
    const text = encodeURIComponent(`Hola ${bar.name}, me gustaría consultar disponibilidad y reservar una mesa.`);
    return `https://wa.me/${phoneClean}?text=${text}`;
  }

  public getConfirmationWhatsAppLink(bar: Bar): string {
    const phoneClean = bar.phone.replace(/[^0-9]/g, '') || '573124567890';
    const text = encodeURIComponent(`Hola ${bar.name}, confirmo mi reserva [${this.generatedCode}] a nombre de ${this.resForm.customerName} para el ${this.resForm.date} (${this.resForm.guestsCount} personas).`);
    return `https://wa.me/${phoneClean}?text=${text}`;
  }

  public copyAddress(address: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      this.notify.success('Dirección copiada al portapapeles');
    }
  }

  public openReservationModal() {
    this.reservationConfirmed = false;
    this.showReservationModal = true;
  }

  public async submitReservation(bar: Bar) {
    this.generatedCode = 'RES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const reservation: TableReservation = {
      barId: bar.id || 'bar-unknown',
      barName: bar.name,
      customerName: this.resForm.customerName,
      customerPhone: this.resForm.customerPhone,
      date: this.resForm.date,
      time: this.resForm.time,
      guestsCount: Number(this.resForm.guestsCount),
      tableArea: this.resForm.tableArea,
      specialRequests: this.resForm.specialRequests,
      status: 'CONFIRMED',
      reservationCode: this.generatedCode,
      createdAt: new Date().toISOString()
    };

    if (this.fb.firestore) {
      try {
        await addDoc(collection(this.fb.firestore, 'tableReservations'), reservation);
      } catch (e) {
        console.warn('Table reservation local sync:', e);
      }
    }

    this.reservationConfirmed = true;
    this.notify.success(`¡Reserva confirmada en ${bar.name}! Código: ${this.generatedCode}`);
  }
}
