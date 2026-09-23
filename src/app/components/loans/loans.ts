import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { Loan } from '../../models/types';

@Component({
  selector: 'app-loans',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Gestión de Préstamos</span>
            @if (overdueCount() > 0) {
              <span class="text-xs font-black px-3 py-1 rounded-full bg-rose-600 text-white flex items-center gap-1 animate-pulse shadow-lg shadow-rose-600/30">
                <span class="material-icons text-sm">warning</span>
                {{ overdueCount() }} {{ overdueCount() === 1 ? 'Vencido' : 'Vencidos' }}
              </span>
            }
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Asignaciones de Tienda y Bar, fechas de entrega, alertas de retraso y registro de devoluciones
          </p>
        </div>

        <button
          (click)="openNewLoan.emit()"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto">
          <span class="material-icons text-lg">add_task</span>
          <span>Registrar Préstamo</span>
        </button>
      </div>

      <!-- Controls & Search -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <!-- Filter Tabs -->
          <div class="flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-x-auto">
            <button
              (click)="selectedTab.set('active')"
              [class]="selectedTab() === 'active' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="px-4 py-2 text-xs rounded-xl transition-all whitespace-nowrap">
              Activos ({{ activeCount() }})
            </button>
            <button
              (click)="selectedTab.set('overdue')"
              [class]="selectedTab() === 'overdue' ? 'bg-rose-600 text-white font-bold shadow' : 'text-slate-400 hover:text-rose-400'"
              class="px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap">
              <span class="material-icons text-xs">warning</span>
              Vencidos ({{ overdueCount() }})
            </button>
            <button
              (click)="selectedTab.set('all')"
              [class]="selectedTab() === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="px-4 py-2 text-xs rounded-xl transition-all whitespace-nowrap">
              Todos los Préstamos
            </button>
          </div>

          <!-- Type filter: Tienda / Bar -->
          <div class="flex items-center gap-2">
            <button
              (click)="selectedType.set('all')"
              [class]="selectedType() === 'all' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-slate-400 border border-slate-700/60'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors">
              Todos
            </button>
            <button
              (click)="selectedType.set('bar')"
              [class]="selectedType() === 'bar' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-slate-800 text-slate-400 border border-slate-700/60'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors border flex items-center gap-1">
              <span class="material-icons text-xs">local_bar</span>
              Bar
            </button>
            <button
              (click)="selectedType.set('tienda')"
              [class]="selectedType() === 'tienda' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-800 text-slate-400 border border-slate-700/60'"
              class="px-3 py-1.5 rounded-xl text-xs transition-colors border flex items-center gap-1">
              <span class="material-icons text-xs">storefront</span>
              Tienda
            </button>
          </div>

          <!-- Search query -->
          <div class="relative flex-1 max-w-sm">
            <span class="material-icons absolute left-3.5 top-2.5 text-slate-400 text-lg">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por artículo, usuario o correo..."
              class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all">
          </div>

        </div>
      </div>

      <!-- Overdue Callout (if viewing overdue tab or alert active) -->
      @if (overdueCount() > 0 && selectedTab() === 'overdue') {
        <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <span class="material-icons text-2xl text-rose-400">notification_important</span>
          <div>
            <strong class="text-white font-bold">Atención prioritaria:</strong>
            Los siguientes artículos han sobrepasado la fecha pactada de entrega. Haz clic en "Devolver" una vez que el usuario reintegre el ejemplar.
          </div>
        </div>
      }

      <!-- Loans Cards / Table List -->
      @if (filteredLoans().length === 0) {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
          <span class="material-icons text-5xl text-slate-600 mb-3">assignment_turned_in</span>
          <h3 class="text-base font-bold text-white mb-1">No hay préstamos en este estado</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            No se encontraron préstamos activos o coincidentes con los filtros seleccionados.
          </p>
          <button
            (click)="openNewLoan.emit()"
            class="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors">
            Registrar Préstamo Ahora
          </button>
        </div>
      } @else {
        <div class="space-y-4">
          @for (loan of filteredLoans(); track loan.id) {
            <div 
              class="bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all duration-200 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-5"
              [ngClass]="{
                'border-rose-600/80 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900': isOverdue(loan),
                'border-slate-800': !isOverdue(loan)
              }">
              
              <!-- Left: Item Cover & Info -->
              <div class="flex items-center gap-4 min-w-0">
                <img 
                  [src]="loan.itemCoverUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=120'" 
                  [alt]="loan.itemTitle" 
                  class="w-16 h-20 object-cover rounded-2xl border border-slate-700/80 shrink-0 shadow-md">

                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span 
                      class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                      [ngClass]="loan.itemType === 'bar' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'">
                      {{ loan.itemType }}
                    </span>
                    @if (loan.itemIsbn) {
                      <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {{ loan.itemIsbn }}
                      </span>
                    }
                  </div>

                  <h3 class="text-base font-bold text-white truncate max-w-md">
                    {{ loan.itemTitle }}
                  </h3>

                  <!-- Borrower details -->
                  <div class="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
                    <span class="flex items-center gap-1 font-semibold text-slate-200">
                      <span class="material-icons text-sm text-amber-400">person</span>
                      {{ loan.userName }}
                    </span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400 text-[11px]">{{ loan.userEmail }}</span>
                  </div>

                  @if (loan.notes) {
                    <p class="text-[11px] text-slate-400 italic mt-0.5">
                      "{{ loan.notes }}"
                    </p>
                  }
                </div>
              </div>

              <!-- Center: Dates & Visual Status Badge -->
              <div class="flex flex-wrap md:flex-col items-start md:items-center justify-between md:justify-center gap-3 py-2 px-4 bg-slate-800/40 rounded-2xl border border-slate-800 shrink-0 min-w-[210px]">
                
                <!-- Status Badge -->
                @if (loan.status === 'devuelto') {
                  <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600 flex items-center gap-1">
                    <span class="material-icons text-xs">check_circle</span>
                    Devuelto el {{ loan.returnDate }}
                  </span>
                } @else if (isOverdue(loan)) {
                  <span class="text-xs font-black px-3 py-1 rounded-full bg-rose-600 text-white flex items-center gap-1.5 animate-pulse shadow-md shadow-rose-600/40">
                    <span class="material-icons text-xs">warning</span>
                    ¡VENCIDO! ({{ getDaysOverdue(loan.dueDate) }} días tarde)
                  </span>
                } @else if (isNearDue(loan)) {
                  <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <span class="material-icons text-xs">schedule</span>
                    Por vencer (dentro de 48h)
                  </span>
                } @else {
                  <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span class="material-icons text-xs">schedule</span>
                    En curso (al día)
                  </span>
                }

                <!-- Dates summary -->
                <div class="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Prestado: <strong class="text-slate-200">{{ loan.loanDate }}</strong></span>
                  <span>•</span>
                  <span>Límite: <strong [ngClass]="isOverdue(loan) ? 'text-rose-400 font-bold' : 'text-slate-200'">{{ loan.dueDate }}</strong></span>
                </div>

              </div>

              <!-- Right: Actions -->
              <div class="flex items-center gap-2 shrink-0 justify-end">
                @if (loan.status !== 'devuelto') {
                  <button
                    (click)="processReturn(loan)"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5">
                    <span class="material-icons text-sm">assignment_return</span>
                    <span>Registrar Devolución</span>
                  </button>
                } @else {
                  <span class="text-xs text-slate-500 font-medium px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-800">
                    Completado
                  </span>
                }
              </div>

            </div>
          }
        </div>
      }

    </div>
  `,
})
export class LoansComponent {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public openNewLoan = output<void>();

  public selectedTab = signal<'active' | 'overdue' | 'all'>('active');
  public selectedType = signal<'all' | 'tienda' | 'bar'>('all');
  public searchQuery = '';

  public activeCount = computed(() => {
    return this.firebaseService.loans().filter((l) => l.status !== 'devuelto').length;
  });

  public overdueCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.firebaseService.loans().filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today)).length;
  });

  public filteredLoans = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    let list = this.firebaseService.loans();

    // Tab filter
    if (this.selectedTab() === 'active') {
      list = list.filter((l) => l.status !== 'devuelto');
    } else if (this.selectedTab() === 'overdue') {
      list = list.filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today));
    }

    // Type filter
    if (this.selectedType() !== 'all') {
      list = list.filter((l) => l.itemType === this.selectedType());
    }

    // Search filter
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.itemTitle.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.itemIsbn?.toLowerCase().includes(q)
      );
    }

    return list;
  });

  public isOverdue(loan: Loan): boolean {
    if (loan.status === 'devuelto') return false;
    const today = new Date().toISOString().split('T')[0];
    return loan.status === 'vencido' || loan.dueDate < today;
  }

  public isNearDue(loan: Loan): boolean {
    if (loan.status === 'devuelto' || this.isOverdue(loan)) return false;
    const today = new Date();
    const due = new Date(loan.dueDate);
    const diffHours = (due.getTime() - today.getTime()) / (1000 * 3600);
    return diffHours <= 48 && diffHours >= 0;
  }

  public getDaysOverdue(dueDate: string): number {
    const d = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((now - d) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  }

  public async processReturn(loan: Loan) {
    if (confirm(`¿Confirmar recepción y devolución de "${loan.itemTitle}" prestado a ${loan.userName}?`)) {
      try {
        await this.firebaseService.returnLoan(loan.id);
        this.toastService.success(
          'Devolución registrada con éxito',
          `"${loan.itemTitle}" reintegrado a las existencias disponibles de ${loan.itemType === 'bar' ? 'Bar' : 'Tienda'}.`
        );
      } catch (err: any) {
        this.toastService.error('Error al devolver', err?.message || 'No se pudo procesar la devolución.');
      }
    }
  }
}
