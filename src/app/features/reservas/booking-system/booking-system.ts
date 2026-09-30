import { Component, inject, OnInit, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FirebaseService, OperationType } from '../../../core/services/firebase.service';
import { BarService } from '../../../core/services/bar.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Bar } from '../../../core/models/bar.model';

export interface BookingRecord {
  id?: string;
  barId: string;
  barName: string;
  barAddress: string;
  barImageUrl: string;
  userId: string;
  userEmail: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guestsCount: number;
  tableArea: 'TERRAZA' | 'BARRA' | 'PISTA' | 'PALCO_VIP';
  occasion: string;
  specialRequests: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  reservationCode: string;
  createdAt: string;
}

@Component({
  selector: 'app-booking-system',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8 pb-16 max-w-5xl mx-auto">
      
      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-violet-950/40 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative max-w-3xl space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
              <span class="material-icons text-sm">event_seat</span>
              Booking System • Reservas en Vivo
            </div>
            <a
              routerLink="/bares"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 text-xs text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            >
              <span class="material-icons text-sm">storefront</span>
              Ver Todos los Bares
            </a>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Reserva de Mesas & Palcos VIP
          </h1>
          <p class="text-sm text-zinc-300 leading-relaxed">
            Asegura tu mesa en los mejores bares y discotecas. Elige fecha, zona preferida y número de asistentes con confirmación y sincronización en tiempo real en Cloud Firestore.
          </p>

          <!-- Tabs: Nueva Reserva vs Mis Reservas -->
          <div class="flex items-center gap-2 pt-2">
            <button
              (click)="activeTab = 'NEW'"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              [ngClass]="activeTab === 'NEW' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'"
            >
              <span class="material-icons text-sm">add_circle</span>
              Nueva Reserva
            </button>

            <button
              (click)="activeTab = 'MY_BOOKINGS'"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              [ngClass]="activeTab === 'MY_BOOKINGS' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'"
            >
              <span class="material-icons text-sm">confirmation_number</span>
              Mis Reservas ({{ userBookings().length }})
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 1: NUEVA RESERVA -->
      @if (activeTab === 'NEW') {
        @if (!confirmedBooking) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left 2 Cols: Step-by-Step Booking Form -->
            <div class="lg:col-span-2 space-y-6">
              
              <!-- STEP 1: Seleccionar Local -->
              <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-xl bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center border border-violet-500/30">
                      1
                    </span>
                    <h3 class="font-heading text-base font-bold text-white">Selecciona el Local</h3>
                  </div>
                  <span class="text-xs text-zinc-400 font-semibold">{{ barsList().length }} locales disponibles</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (bar of barsList(); track bar.id) {
                    <div
                      (click)="selectBar(bar)"
                      class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5"
                      [ngClass]="selectedBar()?.id === bar.id ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/20' : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'"
                    >
                      <img [src]="bar.imageUrl" [alt]="bar.name" class="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 truncate">{{ bar.musicGenre }}</span>
                          <span class="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                            ★ {{ bar.rating }}
                          </span>
                        </div>
                        <h4 class="text-xs font-bold text-white truncate">{{ bar.name }}</h4>
                        <p class="text-[11px] text-zinc-400 truncate">{{ bar.address }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- STEP 2: Fecha & Horario -->
              <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-xl bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center border border-violet-500/30">
                    2
                  </span>
                  <h3 class="font-heading text-base font-bold text-white">Fecha & Horario de Llegada</h3>
                </div>

                <!-- Date quick selector -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-zinc-300">Selecciona el Día:</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      (click)="setDateQuick(todayStr)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      [ngClass]="bookingForm.date === todayStr ? 'bg-violet-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      (click)="setDateQuick(tomorrowStr)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      [ngClass]="bookingForm.date === tomorrowStr ? 'bg-violet-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'"
                    >
                      Mañana
                    </button>
                    <button
                      type="button"
                      (click)="setDateQuick(fridayStr)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      [ngClass]="bookingForm.date === fridayStr ? 'bg-violet-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'"
                    >
                      Este Viernes
                    </button>
                    <button
                      type="button"
                      (click)="setDateQuick(saturdayStr)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      [ngClass]="bookingForm.date === saturdayStr ? 'bg-violet-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'"
                    >
                      Este Sábado
                    </button>
                  </div>

                  <input
                    type="date"
                    [(ngModel)]="bookingForm.date"
                    [min]="todayStr"
                    class="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <!-- Time slots -->
                <div class="space-y-2 pt-2">
                  <label class="block text-xs font-semibold text-zinc-300">Hora Estimada de Llegada:</label>
                  <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    @for (slot of timeSlots; track slot) {
                      <button
                        type="button"
                        (click)="bookingForm.time = slot"
                        class="py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center"
                        [ngClass]="bookingForm.time === slot ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-md' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'"
                      >
                        {{ slot }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- STEP 3: Cantidad de Personas & Zona del Bar -->
              <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-xl bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center border border-violet-500/30">
                    3
                  </span>
                  <h3 class="font-heading text-base font-bold text-white">Cantidad de Personas & Ubicación de Mesa</h3>
                </div>

                <!-- Guests Stepper -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-zinc-300">Número de Asistentes:</label>
                  <div class="flex items-center gap-4">
                    <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
                      <button
                        type="button"
                        (click)="decrementGuests()"
                        class="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center font-bold text-lg transition-colors"
                      >
                        -
                      </button>
                      <span class="w-16 text-center font-heading text-xl font-extrabold text-white">
                        {{ bookingForm.guestsCount }}
                      </span>
                      <button
                        type="button"
                        (click)="incrementGuests()"
                        class="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        (click)="bookingForm.guestsCount = 2"
                        class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="bookingForm.guestsCount === 2 ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                      >
                        2 (Pareja)
                      </button>
                      <button
                        type="button"
                        (click)="bookingForm.guestsCount = 4"
                        class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="bookingForm.guestsCount === 4 ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                      >
                        4 (Mesa Estándar)
                      </button>
                      <button
                        type="button"
                        (click)="bookingForm.guestsCount = 6"
                        class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="bookingForm.guestsCount === 6 ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                      >
                        6 (Grupo)
                      </button>
                      <button
                        type="button"
                        (click)="bookingForm.guestsCount = 10"
                        class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="bookingForm.guestsCount >= 10 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'"
                      >
                        10+ (Palco VIP)
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Table Area Selector Cards -->
                <div class="space-y-2 pt-3">
                  <label class="block text-xs font-semibold text-zinc-300">Ambiente & Zona Deseada:</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (area of tableAreas; track area.id) {
                      <div
                        (click)="bookingForm.tableArea = area.id"
                        class="p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5"
                        [ngClass]="bookingForm.tableArea === area.id ? 'bg-fuchsia-950/30 border-fuchsia-500 shadow-md shadow-fuchsia-500/20' : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-bold text-white flex items-center gap-1.5">
                            <span class="material-icons text-sm text-fuchsia-400">{{ area.icon }}</span>
                            {{ area.label }}
                          </span>
                          @if (bookingForm.tableArea === area.id) {
                            <span class="material-icons text-sm text-fuchsia-400">check_circle</span>
                          }
                        </div>
                        <p class="text-[11px] text-zinc-400 leading-normal">{{ area.desc }}</p>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- STEP 4: Datos del Titular & Notas -->
              <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-xl bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center border border-violet-500/30">
                    4
                  </span>
                  <h3 class="font-heading text-base font-bold text-white">Datos de Contacto & Ocasión</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label class="block font-semibold text-zinc-300 mb-1">Nombre Completo del Titular</label>
                    <input
                      type="text"
                      [(ngModel)]="bookingForm.customerName"
                      placeholder="Ej. Camila Ríos"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label class="block font-semibold text-zinc-300 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      [(ngModel)]="bookingForm.customerPhone"
                      placeholder="+57 312 456 7890"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label class="block font-semibold text-zinc-300 mb-1">Motivo / Ocasión</label>
                    <select
                      [(ngModel)]="bookingForm.occasion"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="Cumpleaños">Cumpleaños</option>
                      <option value="Salida con Amigos">Salida de Fin de Semana</option>
                      <option value="Cita / Pareja">Cita Romántica / Pareja</option>
                      <option value="Celebración Especial">Celebración / Grado</option>
                      <option value="Negocios / After Office">After Office / Corporativo</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-semibold text-zinc-300 mb-1">Petición Especial (Opcional)</label>
                    <input
                      type="text"
                      [(ngModel)]="bookingForm.specialRequests"
                      placeholder="Ej. Botella de tequila con bengala, mesa cerca a vista..."
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <!-- Right 1 Col: Summary Card & Action Trigger -->
            <div class="space-y-6">
              
              <!-- Sticky Booking Summary Voucher -->
              <div class="sticky top-20 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                <div>
                  <span class="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Resumen de Reserva</span>
                  <h3 class="font-heading text-xl font-extrabold text-white mt-0.5">Tu Mesa en Nocturna</h3>
                </div>

                @if (selectedBar(); as bar) {
                  <!-- Bar Preview Card -->
                  <div class="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                    <img [src]="bar.imageUrl" [alt]="bar.name" class="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div class="min-w-0 flex-1">
                      <h4 class="text-xs font-bold text-white truncate">{{ bar.name }}</h4>
                      <p class="text-[11px] text-zinc-400 truncate">{{ bar.address }}</p>
                      <span class="text-[10px] text-fuchsia-400 font-semibold block">{{ bar.musicGenre }}</span>
                    </div>
                  </div>
                }

                <!-- Breakdown list -->
                <div class="space-y-3 text-xs border-t border-b border-zinc-800 py-4">
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Fecha:</span>
                    <span class="font-bold text-white">{{ bookingForm.date }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Hora:</span>
                    <span class="font-bold text-white">{{ bookingForm.time }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Asistentes:</span>
                    <span class="font-bold text-fuchsia-400">{{ bookingForm.guestsCount }} personas</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Zona Seleccionada:</span>
                    <span class="font-bold text-violet-300">{{ getAreaLabel(bookingForm.tableArea) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-400">Titular:</span>
                    <span class="font-semibold text-zinc-200 truncate max-w-[140px]">{{ bookingForm.customerName || 'No indicado' }}</span>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="space-y-2">
                  <button
                    (click)="submitBooking()"
                    [disabled]="isSubmitting"
                    class="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-xl shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    @if (isSubmitting) {
                      <span class="material-icons text-base animate-spin">refresh</span>
                      Guardando en Firestore...
                    } @else {
                      <span class="material-icons text-base">check_circle</span>
                      Confirmar Reserva Inmediata
                    }
                  </button>

                  <p class="text-[10px] text-zinc-500 text-center">
                    Sin costo de reserva anticipada. Cancela con hasta 2 horas de anticipación.
                  </p>
                </div>
              </div>

            </div>

          </div>
        } @else {
          <!-- Confirmation Screen Voucher -->
          <div class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <span class="material-icons text-3xl">verified</span>
            </div>

            <div class="space-y-1">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">¡Solicitud Guardada en Firestore!</span>
              <h2 class="font-heading text-2xl font-extrabold text-white">Reserva Confirmada</h2>
              <p class="text-xs text-zinc-400">Presenta este código al llegar a la puerta del local.</p>
            </div>

            <!-- Digital Pass Card -->
            <div class="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-left space-y-4">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span class="text-[10px] text-zinc-500 uppercase tracking-wider block">Código de Reserva</span>
                  <span class="font-mono text-xl font-black text-fuchsia-400">{{ confirmedBooking.reservationCode }}</span>
                </div>
                <div class="p-2 bg-white rounded-xl shadow-md">
                  <span class="material-icons text-3xl text-zinc-950">qr_code_2</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-zinc-500 text-[11px] block">Local:</span>
                  <span class="font-bold text-white">{{ confirmedBooking.barName }}</span>
                </div>
                <div>
                  <span class="text-zinc-500 text-[11px] block">Zona:</span>
                  <span class="font-bold text-violet-300">{{ getAreaLabel(confirmedBooking.tableArea) }}</span>
                </div>
                <div>
                  <span class="text-zinc-500 text-[11px] block">Fecha & Hora:</span>
                  <span class="font-bold text-zinc-200">{{ confirmedBooking.date }} - {{ confirmedBooking.time }}</span>
                </div>
                <div>
                  <span class="text-zinc-500 text-[11px] block">Invitados:</span>
                  <span class="font-bold text-zinc-200">{{ confirmedBooking.guestsCount }} personas</span>
                </div>
              </div>

              <div class="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Titular: <strong class="text-white">{{ confirmedBooking.customerName }}</strong></span>
                <span class="text-emerald-400 font-semibold">● Estado: {{ confirmedBooking.status }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <button
                (click)="confirmedBooking = null"
                class="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Hacer Otra Reserva
              </button>

              <button
                (click)="activeTab = 'MY_BOOKINGS'"
                class="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                Ver Mis Reservas
              </button>
            </div>
          </div>
        }
      }

      <!-- TAB 2: MIS RESERVAS EN FIRESTORE -->
      @if (activeTab === 'MY_BOOKINGS') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2">
              <span class="material-icons text-violet-400">bookmark</span>
              Historial de Reservas en Tiempo Real
            </h2>
            <button
              (click)="activeTab = 'NEW'"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5 transition-colors"
            >
              <span class="material-icons text-sm">add</span>
              Nueva Reserva
            </button>
          </div>

          @if (userBookings().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (bk of userBookings(); track bk.id || bk.reservationCode) {
                <div class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl hover:border-zinc-700 transition-all">
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <img [src]="bk.barImageUrl" [alt]="bk.barName" class="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 class="text-sm font-bold text-white">{{ bk.barName }}</h4>
                        <span class="text-xs text-zinc-400">{{ bk.date }} • {{ bk.time }}</span>
                      </div>
                    </div>

                    <span
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': bk.status === 'CONFIRMED',
                        'bg-amber-500/10 text-amber-400 border-amber-500/30': bk.status === 'PENDING',
                        'bg-rose-500/10 text-rose-400 border-rose-500/30': bk.status === 'CANCELLED'
                      }"
                    >
                      ● {{ bk.status }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs">
                    <div>
                      <span class="text-[10px] text-zinc-500 block">Código:</span>
                      <span class="font-mono font-bold text-fuchsia-400">{{ bk.reservationCode }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-zinc-500 block">Zona & Aforo:</span>
                      <span class="font-semibold text-zinc-200">{{ getAreaLabel(bk.tableArea) }} ({{ bk.guestsCount }}p)</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
                    <span class="text-zinc-500 text-[11px]">Titular: {{ bk.customerName }}</span>
                    
                    @if (bk.status !== 'CANCELLED') {
                      <button
                        (click)="cancelBooking(bk)"
                        class="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Cancelar Reserva
                      </button>
                    }
                  </div>

                </div>
              }
            </div>
          } @else {
            <!-- Empty state -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
              <div class="w-14 h-14 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <span class="material-icons text-3xl">event_seat</span>
              </div>
              <h3 class="font-heading text-lg font-bold text-white">No tienes reservas activas</h3>
              <p class="text-xs text-zinc-400 max-w-sm mx-auto">
                Selecciona tu local favorito, la fecha y la cantidad de amigos para asegurar tu mesa.
              </p>
              <button
                (click)="activeTab = 'NEW'"
                class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                Crear Mi Primera Reserva
              </button>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class BookingSystem implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FirebaseService);
  public barService = inject(BarService);
  public auth = inject(AuthService);
  private notify = inject(NotificationService);

  public initialBarId = input<string | undefined>(undefined);

  public activeTab: 'NEW' | 'MY_BOOKINGS' = 'NEW';
  public isSubmitting = false;
  public confirmedBooking: BookingRecord | null = null;

  public barsList = signal<Bar[]>([]);
  public selectedBar = signal<Bar | null>(null);
  public userBookings = signal<BookingRecord[]>([]);

  public todayStr = '';
  public tomorrowStr = '';
  public fridayStr = '';
  public saturdayStr = '';

  public timeSlots = [
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
  ];

  public tableAreas: { id: 'TERRAZA' | 'BARRA' | 'PISTA' | 'PALCO_VIP'; label: string; icon: string; desc: string }[] = [
    { id: 'TERRAZA', label: 'Zona Terraza', icon: 'deck', desc: 'Ambiente al aire libre con vista panorámica y ventilación natural.' },
    { id: 'BARRA', label: 'Barra Principal', icon: 'local_bar', desc: 'Frente a los mixólogos con coctelería express y alta energía.' },
    { id: 'PISTA', label: 'Pista de Baile', icon: 'nightlife', desc: 'Mesas laterales con acceso directo a la pista y juegos de luces.' },
    { id: 'PALCO_VIP', label: 'Palco VIP Lounge', icon: 'stars', desc: 'Atención personalizada, sofás exclusivos y servicio de botellas.' }
  ];

  public bookingForm = {
    date: '',
    time: '8:00 PM',
    guestsCount: 4,
    tableArea: 'TERRAZA' as 'TERRAZA' | 'BARRA' | 'PISTA' | 'PALCO_VIP',
    customerName: '',
    customerPhone: '+57 312 456 7890',
    occasion: 'Salida con Amigos',
    specialRequests: ''
  };

  ngOnInit() {
    this.initDates();
    this.initBars();
    this.initUserForm();
    this.initBookingsListener();
  }

  private initDates() {
    const now = new Date();
    this.todayStr = now.toISOString().split('T')[0];
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    this.tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Next Friday
    const fri = new Date(now);
    const dayOfWeek = fri.getDay();
    const daysUntilFri = (5 - dayOfWeek + 7) % 7 || 7;
    fri.setDate(now.getDate() + daysUntilFri);
    this.fridayStr = fri.toISOString().split('T')[0];

    // Next Saturday
    const sat = new Date(now);
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
    sat.setDate(now.getDate() + daysUntilSat);
    this.saturdayStr = sat.toISOString().split('T')[0];

    this.bookingForm.date = this.fridayStr;
  }

  private initBars() {
    this.barsList.set(this.barService.bars());

    // Check query params or input for barId
    this.route.queryParams.subscribe(params => {
      const qBarId = params['barId'] || this.initialBarId();
      if (qBarId) {
        const found = this.barService.getBarById(qBarId);
        if (found) {
          this.selectedBar.set(found);
          return;
        }
      }
      if (this.barsList().length > 0 && !this.selectedBar()) {
        this.selectedBar.set(this.barsList()[0]);
      }
    });
  }

  private initUserForm() {
    const user = this.auth.userProfile();
    if (user) {
      this.bookingForm.customerName = user.name;
    }
  }

  private initBookingsListener() {
    if (!this.fb.firestore) return;

    try {
      const resCol = collection(this.fb.firestore, 'tableReservations');
      onSnapshot(resCol, (snapshot) => {
        const list: BookingRecord[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...(docSnap.data() as BookingRecord) });
        });
        // Sort newest first
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        this.userBookings.set(list);
      }, (err) => {
        this.fb.handleError(err, OperationType.GET, 'tableReservations');
      });
    } catch (e) {
      console.warn('Booking listener fallback:', e);
    }
  }

  public selectBar(bar: Bar) {
    this.selectedBar.set(bar);
  }

  public setDateQuick(date: string) {
    this.bookingForm.date = date;
  }

  public incrementGuests() {
    if (this.bookingForm.guestsCount < 30) {
      this.bookingForm.guestsCount++;
    }
  }

  public decrementGuests() {
    if (this.bookingForm.guestsCount > 1) {
      this.bookingForm.guestsCount--;
    }
  }

  public getAreaLabel(area: string): string {
    switch (area) {
      case 'TERRAZA': return 'Zona Terraza';
      case 'BARRA': return 'Barra Principal';
      case 'PISTA': return 'Pista de Baile';
      case 'PALCO_VIP': return 'Palco VIP';
      default: return area;
    }
  }

  public async submitBooking() {
    const bar = this.selectedBar();
    if (!bar) {
      this.notify.warning('Por favor selecciona un local');
      return;
    }

    if (!this.bookingForm.customerName) {
      this.notify.warning('Por favor ingresa tu nombre');
      return;
    }

    if (!this.bookingForm.date) {
      this.notify.warning('Por favor selecciona una fecha');
      return;
    }

    this.isSubmitting = true;
    const code = 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const user = this.auth.userProfile();

    const record: BookingRecord = {
      barId: bar.id || 'bar-generic',
      barName: bar.name,
      barAddress: bar.address,
      barImageUrl: bar.imageUrl,
      userId: user?.uid || 'guest-user',
      userEmail: user?.email || 'guest@nocturna.com',
      customerName: this.bookingForm.customerName,
      customerPhone: this.bookingForm.customerPhone,
      date: this.bookingForm.date,
      time: this.bookingForm.time,
      guestsCount: Number(this.bookingForm.guestsCount),
      tableArea: this.bookingForm.tableArea,
      occasion: this.bookingForm.occasion,
      specialRequests: this.bookingForm.specialRequests,
      status: 'CONFIRMED',
      reservationCode: code,
      createdAt: new Date().toISOString()
    };

    try {
      if (this.fb.firestore) {
        const docRef = await addDoc(collection(this.fb.firestore, 'tableReservations'), record);
        record.id = docRef.id;
      }
      this.confirmedBooking = record;
      this.notify.success(`¡Reserva creada exitosamente en ${bar.name}! Código: ${code}`);
    } catch (err) {
      this.notify.error('Error al guardar reserva en Firestore');
      this.fb.handleError(err, OperationType.CREATE, 'tableReservations');
    } finally {
      this.isSubmitting = false;
    }
  }

  public async cancelBooking(booking: BookingRecord) {
    if (!booking.id || !this.fb.firestore) return;
    try {
      const docRef = doc(this.fb.firestore, 'tableReservations', booking.id);
      await updateDoc(docRef, { status: 'CANCELLED' });
      this.notify.info(`Reserva ${booking.reservationCode} cancelada.`);
    } catch (err) {
      this.fb.handleError(err, OperationType.UPDATE, `tableReservations/${booking.id}`);
    }
  }
}
