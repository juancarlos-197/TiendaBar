import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-loan-modal',
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
            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <span class="material-icons text-2xl">assignment_turned_in</span>
            </div>
            <div>
              <h2 class="text-xl font-black tracking-tight text-white">
                Registrar Nuevo Préstamo
              </h2>
              <p class="text-xs text-slate-400">
                Asignación y control de fechas límite para Tienda y Bar
              </p>
            </div>
          </div>

          <button
            (click)="close.emit()"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <span class="material-icons text-xl">close</span>
          </button>
        </div>

        <form (ngSubmit)="submitLoan()" class="space-y-5">
          
          <!-- Step 1: Selección de Artículo (Tienda vs Bar) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-300">
                1. Seleccionar Artículo a Prestar *
              </label>
              
              <!-- Filter Type -->
              <div class="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                <button
                  type="button"
                  (click)="filterType.set('all')"
                  [class]="filterType() === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
                  class="px-2.5 py-1 rounded-lg transition-colors">
                  Todos
                </button>
                <button
                  type="button"
                  (click)="filterType.set('bar')"
                  [class]="filterType() === 'bar' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
                  class="px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                  <span class="material-icons text-xs">local_bar</span>
                  Bar
                </button>
                <button
                  type="button"
                  (click)="filterType.set('tienda')"
                  [class]="filterType() === 'tienda' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
                  class="px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                  <span class="material-icons text-xs">storefront</span>
                  Tienda
                </button>
              </div>
            </div>

            <!-- Items dropdown with visual card -->
            <div class="space-y-2">
              <select
                [(ngModel)]="selectedItemId"
                name="selectedItemId"
                (change)="onItemSelect()"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-medium">
                <option value="" disabled selected>-- Elige un artículo disponible --</option>
                @for (item of filteredItems(); track item.id) {
                  <option [value]="item.id" [disabled]="item.availableCopies <= 0">
                    [{{ item.type.toUpperCase() }}] {{ item.title }} - {{ item.author }} (Disponibles: {{ item.availableCopies }}/{{ item.totalCopies }})
                  </option>
                }
              </select>

              <!-- Selected Item Preview Card -->
              @if (selectedItem(); as item) {
                <div class="p-3 bg-slate-800/50 border border-slate-700/70 rounded-2xl flex items-center gap-3">
                  <img [src]="item.coverUrl" [alt]="item.title" class="w-12 h-14 object-cover rounded-lg border border-slate-700">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span 
                        class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                        [ngClass]="item.type === 'bar' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'">
                        {{ item.type }}
                      </span>
                      <h4 class="text-sm font-bold text-white truncate">{{ item.title }}</h4>
                    </div>
                    <p class="text-xs text-slate-400">{{ item.author }} • {{ item.category }}</p>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">ISBN/Ref: {{ item.isbn }}</p>
                  </div>
                  <div class="text-right">
                    <span 
                      class="text-xs font-bold px-2.5 py-1 rounded-full"
                      [ngClass]="item.availableCopies > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'">
                      {{ item.availableCopies }} disp.
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Step 2: Selección de Usuario / Destinatario -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-300">
                2. Usuario Prestatario *
              </label>
              
              <button
                type="button"
                (click)="toggleCustomBorrower()"
                class="text-xs text-amber-400 hover:underline">
                {{ isCustomBorrower() ? '← Elegir de usuarios registrados' : '+ Nuevo cliente no registrado' }}
              </button>
            </div>

            @if (!isCustomBorrower()) {
              <select
                [(ngModel)]="selectedUserId"
                name="selectedUserId"
                (change)="onUserSelect()"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-medium">
                <option value="" disabled selected>-- Elige un usuario registrado --</option>
                @for (user of firebaseService.users(); track user.id) {
                  <option [value]="user.id">
                    {{ user.displayName }} ({{ user.email }}) - Rol: {{ user.role }}
                  </option>
                }
              </select>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                <div>
                  <label class="block text-[11px] font-medium text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    [(ngModel)]="customName"
                    name="customName"
                    placeholder="Ej. María Fernanda Morales"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    [(ngModel)]="customEmail"
                    name="customEmail"
                    placeholder="maria.morales@ejemplo.com"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500">
                </div>
              </div>
            }
          </div>

          <!-- Step 3: Fechas del Préstamo y Fecha Límite -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha del Préstamo *
              </label>
              <input
                type="date"
                [(ngModel)]="loanDate"
                name="loanDate"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all">
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-slate-300">
                  Fecha Límite de Devolución *
                </label>
                <span class="text-[11px] text-amber-400 font-semibold">
                  {{ getDurationDays() }} días de plazo
                </span>
              </div>
              <input
                type="date"
                [(ngModel)]="dueDate"
                name="dueDate"
                required
                class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-semibold text-amber-300">
            </div>
          </div>

          <!-- Quick presets for due date -->
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">Atajos para fecha de límite:</label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="addDaysToDue(3)"
                class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                +3 Días (Fin de semana)
              </button>
              <button
                type="button"
                (click)="addDaysToDue(7)"
                class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                +7 Días (1 Semana)
              </button>
              <button
                type="button"
                (click)="addDaysToDue(15)"
                class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                +15 Días (Quincena)
              </button>
              <button
                type="button"
                (click)="addDaysToDue(30)"
                class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                +30 Días (1 Mes)
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Observaciones / Destino del Préstamo (Opcional)
            </label>
            <input
              type="text"
              [(ngModel)]="notes"
              name="notes"
              placeholder="Ej. Prestado para evento degustación o exhibición de fin de semana"
              class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all">
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              (click)="close.emit()"
              class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors">
              Cancelar
            </button>

            <button
              type="submit"
              [disabled]="isSubmitting() || !selectedItemId || (!selectedUserId && !customName)"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
              @if (isSubmitting()) {
                <span class="material-icons animate-spin text-base">autorenew</span>
                <span>Registrando...</span>
              } @else {
                <span class="material-icons text-base">check_circle</span>
                <span>Confirmar Préstamo</span>
              }
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
})
export class LoanModalComponent implements OnInit {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public preselectedItemId = input<string | null>(null);

  public close = output<void>();
  public saved = output<void>();

  public filterType = signal<'all' | 'tienda' | 'bar'>('all');
  public selectedItemId = '';
  public selectedUserId = '';
  public isCustomBorrower = signal<boolean>(false);
  public customName = '';
  public customEmail = '';

  public toggleCustomBorrower() {
    this.isCustomBorrower.update((v) => !v);
  }

  public loanDate = '';
  public dueDate = '';
  public notes = '';
  public isSubmitting = signal<boolean>(false);

  public filteredItems = computed(() => {
    const items = this.firebaseService.items();
    const f = this.filterType();
    if (f === 'all') return items;
    return items.filter((i) => i.type === f);
  });

  public selectedItem = computed(() => {
    return this.firebaseService.items().find((i) => i.id === this.selectedItemId) || null;
  });

  ngOnInit() {
    const today = new Date();
    this.loanDate = today.toISOString().split('T')[0];

    const defaultDue = new Date(today);
    defaultDue.setDate(today.getDate() + 7);
    this.dueDate = defaultDue.toISOString().split('T')[0];

    if (this.preselectedItemId()) {
      this.selectedItemId = this.preselectedItemId()!;
    }
  }

  public onItemSelect() {
    // optional logic
  }

  public onUserSelect() {
    // optional logic
  }

  public addDaysToDue(days: number) {
    const start = this.loanDate ? new Date(this.loanDate) : new Date();
    const newDue = new Date(start);
    newDue.setDate(start.getDate() + days);
    this.dueDate = newDue.toISOString().split('T')[0];
  }

  public getDurationDays(): number {
    if (!this.loanDate || !this.dueDate) return 0;
    const l = new Date(this.loanDate).getTime();
    const d = new Date(this.dueDate).getTime();
    const diff = Math.ceil((d - l) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  }

  public async submitLoan() {
    if (!this.selectedItemId) {
      this.toastService.warning('Selección requerida', 'Por favor selecciona un artículo para prestar.');
      return;
    }

    const item = this.selectedItem();
    if (!item) {
      this.toastService.error('Error', 'El artículo seleccionado no es válido.');
      return;
    }

    if (item.availableCopies <= 0) {
      this.toastService.warning('Sin stock', 'No hay ejemplares disponibles de este artículo.');
      return;
    }

    let borrowerId = '';
    let borrowerName = '';
    let borrowerEmail = '';

    if (!this.isCustomBorrower()) {
      const user = this.firebaseService.users().find((u) => u.id === this.selectedUserId);
      if (!user) {
        this.toastService.warning('Usuario requerido', 'Por favor selecciona un usuario registrado.');
        return;
      }
      borrowerId = user.id;
      borrowerName = user.displayName;
      borrowerEmail = user.email;
    } else {
      if (!this.customName.trim()) {
        this.toastService.warning('Nombre requerido', 'Por favor ingresa el nombre del usuario cliente.');
        return;
      }
      borrowerId = 'usr_guest_' + Date.now();
      borrowerName = this.customName.trim();
      borrowerEmail = this.customEmail.trim() || 'sin-correo@cliente.com';
    }

    if (!this.dueDate) {
      this.toastService.warning('Fecha límite', 'Por favor especifica la fecha límite de devolución.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.firebaseService.createLoan({
        itemId: item.id,
        userId: borrowerId,
        userName: borrowerName,
        userEmail: borrowerEmail,
        loanDate: this.loanDate,
        dueDate: this.dueDate,
        notes: this.notes.trim(),
      });

      this.toastService.success(
        'Préstamo Registrado',
        `Se prestó "${item.title}" a ${borrowerName} hasta el ${this.dueDate}.`
      );
      this.saved.emit();
      this.close.emit();
    } catch (err: any) {
      console.error(err);
      this.toastService.error('Error', err?.message || 'No se pudo registrar el préstamo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
