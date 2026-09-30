import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { BarEvent } from '../../../core/models/bar.model';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CopCurrencyPipe],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-fuchsia-400 text-3xl">confirmation_number</span>
            Cartelera de Fiestas & Eventos
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Conciertos en vivo, noches temáticas, sets de DJs invitados y festivales locales
          </p>
        </div>

        @if (auth.isBarOwner() || auth.isAdmin()) {
          <button
            (click)="showCreateModal = true"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-lg shadow-fuchsia-600/30 flex items-center gap-2"
          >
            <span class="material-icons text-base">add_circle</span>
            Publicar Nuevo Evento
          </button>
        }
      </div>

      <!-- Events Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (ev of barService.events(); track ev.id) {
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-fuchsia-500/40 transition-all flex flex-col group shadow-xl">
            <div class="relative h-52 overflow-hidden bg-zinc-800">
              <img
                [src]="ev.imageUrl"
                [alt]="ev.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>

              <div class="absolute top-3.5 right-3.5 px-3 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-fuchsia-400">
                {{ ev.coverPrice | copCurrency }}
              </div>

              <div class="absolute bottom-3 left-4 right-4">
                <span class="text-xs font-semibold text-violet-300 flex items-center gap-1">
                  <span class="material-icons text-sm">place</span>
                  {{ ev.barName }}
                </span>
                <h3 class="font-heading text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                  {{ ev.title }}
                </h3>
              </div>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center gap-3 text-xs text-zinc-400 mb-2">
                  <span class="flex items-center gap-1 text-violet-400 font-semibold">
                    <span class="material-icons text-sm">today</span> {{ ev.date }}
                  </span>
                  <span>•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-icons text-sm">schedule</span> {{ ev.time }}
                  </span>
                </div>

                @if (ev.djOrArtist) {
                  <p class="text-xs text-amber-400 font-medium mb-1.5 flex items-center gap-1">
                    <span class="material-icons text-sm">mic</span> Lineup: {{ ev.djOrArtist }}
                  </p>
                }

                <p class="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {{ ev.description }}
                </p>
              </div>

              <div class="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <div class="text-[11px] text-zinc-500">
                  Aforo disponible: <strong class="text-zinc-200">{{ ev.ticketStock }}</strong>
                </div>
                <button
                  (click)="openBuyTicket(ev)"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span class="material-icons text-sm">qr_code_2</span>
                  Comprar Cover
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Ticket Purchase Modal with Instant QR Digital Pass -->
      @if (selectedEventForTicket) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center relative">
            <button
              (click)="selectedEventForTicket = null"
              class="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <span class="material-icons">close</span>
            </button>

            @if (!ticketPurchased) {
              <div class="space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-fuchsia-600/20 text-fuchsia-400 flex items-center justify-center mx-auto">
                  <span class="material-icons text-2xl">confirmation_number</span>
                </div>
                <h3 class="font-heading text-lg font-bold text-white">Comprar Cover Digital</h3>
                <p class="text-xs text-zinc-400">{{ selectedEventForTicket.title }} en {{ selectedEventForTicket.barName }}</p>

                <div class="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs">
                  <div class="flex justify-between text-zinc-400">
                    <span>Precio por boleta:</span>
                    <span class="text-zinc-200 font-bold">{{ selectedEventForTicket.coverPrice | copCurrency }}</span>
                  </div>
                  <div class="flex justify-between items-center text-zinc-400">
                    <span>Cantidad:</span>
                    <div class="flex items-center gap-2">
                      <button (click)="ticketQty = ticketQty > 1 ? ticketQty - 1 : 1" class="w-6 h-6 rounded bg-zinc-800 text-white">-</button>
                      <span class="font-bold text-white">{{ ticketQty }}</span>
                      <button (click)="ticketQty = ticketQty + 1" class="w-6 h-6 rounded bg-zinc-800 text-white">+</button>
                    </div>
                  </div>
                  <div class="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
                    <span>Total a pagar:</span>
                    <span class="text-fuchsia-400">{{ (selectedEventForTicket.coverPrice * ticketQty) | copCurrency }}</span>
                  </div>
                </div>

                <button
                  (click)="confirmPurchase()"
                  class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 shadow-lg shadow-fuchsia-600/30"
                >
                  Confirmar y Generar Pase QR
                </button>
              </div>
            } @else {
              <!-- Digital QR Pass Ticket -->
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <span class="material-icons text-2xl">check</span>
                </div>
                <h3 class="font-heading text-lg font-bold text-white">¡Pase Digital Confirmado!</h3>
                <p class="text-xs text-zinc-400">Presenta este código en la entrada de {{ selectedEventForTicket.barName }}</p>

                <!-- Mock QR Code Box -->
                <div class="p-6 bg-white rounded-2xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-lg">
                  <span class="material-icons text-7xl text-zinc-950">qr_code_2</span>
                  <span class="text-[9px] font-mono text-zinc-800 font-bold uppercase mt-1">NOC-{{ selectedEventForTicket.id }}-{{ ticketQty }}P</span>
                </div>

                <div class="text-xs text-zinc-400">
                  Pase válido para: <strong class="text-zinc-200">{{ ticketQty }} persona(s)</strong> • Fecha: <strong class="text-zinc-200">{{ selectedEventForTicket.date }}</strong>
                </div>

                <button
                  (click)="selectedEventForTicket = null"
                  class="w-full py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Listo, Guardar en mi Dispositivo
                </button>
              </div>
            }

          </div>
        </div>
      }

      <!-- Create Event Modal -->
      @if (showCreateModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span class="material-icons text-fuchsia-400">event_available</span>
                Programar Evento o Noche Temática
              </h3>
              <button (click)="showCreateModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="eventForm" (ngSubmit)="onCreateEvent()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Título del Evento</label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="Ej. Boiler Room Session / Noche de Salsa Brava"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Bar Anfitrión</label>
                <select
                  formControlName="barId"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                >
                  @for (b of barService.bars(); track b.id) {
                    <option [value]="b.id">{{ b.name }} ({{ b.city }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Descripción</label>
                <textarea
                  formControlName="description"
                  rows="2"
                  placeholder="Detalles de la fiesta, promociones..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    formControlName="date"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    formControlName="time"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Precio Cover (COP)</label>
                  <input
                    type="number"
                    formControlName="coverPrice"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Boletas Disponibles</label>
                  <input
                    type="number"
                    formControlName="ticketStock"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Artistas / DJs Invitados</label>
                <input
                  type="text"
                  formControlName="djOrArtist"
                  placeholder="Ej. DJ Residente + Artista Invitado"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">URL Foto Afiche</label>
                <input
                  type="text"
                  formControlName="imageUrl"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-fuchsia-500"
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
                  [disabled]="eventForm.invalid"
                  class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 shadow-md shadow-fuchsia-600/30 disabled:opacity-50"
                >
                  Publicar en Cartelera
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class EventosComponent {
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public showCreateModal = false;
  public selectedEventForTicket: BarEvent | null = null;
  public ticketPurchased = false;
  public ticketQty = 1;

  public eventForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    barId: ['bar-sotareno', [Validators.required]],
    description: ['', [Validators.required]],
    date: ['2026-10-15', [Validators.required]],
    time: ['21:00', [Validators.required]],
    coverPrice: [30000, [Validators.required]],
    ticketStock: [100, [Validators.required]],
    djOrArtist: ['DJs Invitados'],
    imageUrl: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80']
  });

  openBuyTicket(ev: BarEvent) {
    this.selectedEventForTicket = ev;
    this.ticketPurchased = false;
    this.ticketQty = 1;
  }

  confirmPurchase() {
    if (this.selectedEventForTicket) {
      this.barService.buyTicket(this.selectedEventForTicket.id!, this.ticketQty);
      this.ticketPurchased = true;
    }
  }

  onCreateEvent() {
    if (this.eventForm.valid) {
      const val = this.eventForm.value;
      const bar = this.barService.getBarById(val.barId!) || this.barService.bars()[0];

      this.barService.createEvent({
        title: val.title!,
        barId: val.barId!,
        barName: bar.name,
        description: val.description!,
        date: val.date!,
        time: val.time!,
        coverPrice: Number(val.coverPrice),
        ticketStock: Number(val.ticketStock),
        djOrArtist: val.djOrArtist || undefined,
        imageUrl: val.imageUrl!,
        active: true
      });

      this.showCreateModal = false;
    }
  }
}
