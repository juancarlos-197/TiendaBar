import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { Loan } from '../../models/types';

@Component({
  selector: 'app-history',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Historial de Préstamos</span>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {{ filteredHistory().length }} registros
            </span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Auditoría de todos los préstamos por tienda, bar o usuario, con cálculo de fechas y duración del préstamo
          </p>
        </div>

        <!-- Export / Print action -->
        <button
          (click)="printReport()"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors">
          <span class="material-icons text-base">print</span>
          <span>Imprimir Reporte</span>
        </button>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Histórico</span>
          <p class="text-2xl font-black text-white mt-1">{{ totalLoansCount() }}</p>
          <span class="text-[10px] text-slate-500">Préstamos registrados</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Devueltos</span>
          <p class="text-2xl font-black text-white mt-1">{{ returnedCount() }}</p>
          <span class="text-[10px] text-emerald-400/80">Reintegrados a stock</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">En Curso</span>
          <p class="text-2xl font-black text-white mt-1">{{ activeCount() }}</p>
          <span class="text-[10px] text-amber-400/80">Actualmente asignados</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span class="text-[11px] font-bold uppercase tracking-wider text-rose-400">Vencidos</span>
          <p class="text-2xl font-black text-white mt-1">{{ overdueCount() }}</p>
          <span class="text-[10px] text-rose-400/80">Con plazo vencido</span>
        </div>
      </div>

      <!-- Filter Controls: Por Tienda/Bar, Por Usuario, Por Estado -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- 1. Filter by Tienda / Bar -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Filtrar por Área
            </label>
            <select
              [(ngModel)]="selectedArea"
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium">
              <option value="all">Todas las áreas (Tienda & Bar)</option>
              <option value="bar">Solo Bar & Coctelería</option>
              <option value="tienda">Solo Tienda & Libros</option>
            </select>
          </div>

          <!-- 2. Filter by User -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Filtrar por Usuario
            </label>
            <select
              [(ngModel)]="selectedUser"
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium">
              <option value="all">Todos los usuarios</option>
              @for (user of uniqueBorrowers(); track user) {
                <option [value]="user">{{ user }}</option>
              }
            </select>
          </div>

          <!-- 3. Filter by Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Estado del Préstamo
            </label>
            <select
              [(ngModel)]="selectedStatus"
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium">
              <option value="all">Todos los estados</option>
              <option value="activo">Solo Activos</option>
              <option value="devuelto">Solo Devueltos</option>
              <option value="vencido">Solo Vencidos</option>
            </select>
          </div>

          <!-- 4. Text Search -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Búsqueda General
            </label>
            <div class="relative">
              <span class="material-icons absolute left-3 top-2 text-slate-400 text-base">search</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Título, usuario, correo, notas..."
                class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all">
            </div>
          </div>

        </div>
      </div>

      <!-- Historical Loans Table -->
      @if (filteredHistory().length === 0) {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
          <span class="material-icons text-5xl text-slate-600 mb-2">history_toggle_off</span>
          <h3 class="text-base font-bold text-white mb-1">Sin registros coincidentes</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            No se han encontrado préstamos históricos con los criterios de filtrado seleccionados.
          </p>
        </div>
      } @else {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700/60 text-[10px] tracking-wider">
                <tr>
                  <th scope="col" class="py-3.5 px-4">Artículo</th>
                  <th scope="col" class="py-3.5 px-4">Área</th>
                  <th scope="col" class="py-3.5 px-4">Usuario Prestatario</th>
                  <th scope="col" class="py-3.5 px-4">Fecha Préstamo</th>
                  <th scope="col" class="py-3.5 px-4">Fecha Límite</th>
                  <th scope="col" class="py-3.5 px-4">Fecha Devolución</th>
                  <th scope="col" class="py-3.5 px-4">Duración</th>
                  <th scope="col" class="py-3.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                @for (loan of filteredHistory(); track loan.id) {
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    
                    <!-- Article -->
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2.5">
                        <img 
                          [src]="loan.itemCoverUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=80'" 
                          [alt]="loan.itemTitle" 
                          class="w-8 h-10 object-cover rounded-lg border border-slate-700 shrink-0">
                        <div class="min-w-0">
                          <p class="font-bold text-white truncate max-w-[200px]">{{ loan.itemTitle }}</p>
                          @if (loan.itemIsbn) {
                            <span class="text-[10px] font-mono text-slate-400">{{ loan.itemIsbn }}</span>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Area -->
                    <td class="py-3 px-4">
                      <span 
                        class="text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                        [ngClass]="loan.itemType === 'bar' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'">
                        {{ loan.itemType }}
                      </span>
                    </td>

                    <!-- Borrower -->
                    <td class="py-3 px-4">
                      <div>
                        <p class="font-semibold text-white">{{ loan.userName }}</p>
                        <p class="text-[10px] text-slate-400 truncate max-w-[150px]">{{ loan.userEmail }}</p>
                      </div>
                    </td>

                    <!-- Loan Date -->
                    <td class="py-3 px-4 font-mono">
                      {{ loan.loanDate }}
                    </td>

                    <!-- Due Date -->
                    <td class="py-3 px-4 font-mono" [ngClass]="isOverdue(loan) ? 'text-rose-400 font-bold' : 'text-slate-300'">
                      {{ loan.dueDate }}
                    </td>

                    <!-- Return Date -->
                    <td class="py-3 px-4 font-mono">
                      @if (loan.returnDate) {
                        <span class="text-emerald-400 font-semibold">{{ loan.returnDate }}</span>
                      } @else {
                        <span class="text-slate-500 italic">Pendiente</span>
                      }
                    </td>

                    <!-- Duration calculation -->
                    <td class="py-3 px-4">
                      <span class="font-semibold text-white">
                        {{ getLoanDurationString(loan) }}
                      </span>
                    </td>

                    <!-- Status badge -->
                    <td class="py-3 px-4">
                      @if (loan.status === 'devuelto') {
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700/80 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <span class="material-icons text-[12px]">check</span>
                          Devuelto
                        </span>
                      } @else if (isOverdue(loan)) {
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white shadow inline-flex items-center gap-1">
                          <span class="material-icons text-[12px]">warning</span>
                          Vencido
                        </span>
                      } @else {
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                          <span class="material-icons text-[12px]">schedule</span>
                          Activo
                        </span>
                      }
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `,
})
export class HistoryComponent {
  public firebaseService = inject(FirebaseService);

  public selectedArea = 'all';
  public selectedUser = 'all';
  public selectedStatus = 'all';
  public searchQuery = '';

  public totalLoansCount = computed(() => this.firebaseService.loans().length);
  public returnedCount = computed(() => this.firebaseService.loans().filter((l) => l.status === 'devuelto').length);
  public activeCount = computed(() => this.firebaseService.loans().filter((l) => l.status === 'activo').length);
  public overdueCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.firebaseService.loans().filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today)).length;
  });

  public uniqueBorrowers = computed(() => {
    const names = new Set<string>();
    this.firebaseService.loans().forEach((l) => {
      if (l.userName) names.add(l.userName);
    });
    return Array.from(names);
  });

  public filteredHistory = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    let list = this.firebaseService.loans();

    // Area filter
    if (this.selectedArea !== 'all') {
      list = list.filter((l) => l.itemType === this.selectedArea);
    }

    // User filter
    if (this.selectedUser !== 'all') {
      list = list.filter((l) => l.userName === this.selectedUser);
    }

    // Status filter
    if (this.selectedStatus === 'devuelto') {
      list = list.filter((l) => l.status === 'devuelto');
    } else if (this.selectedStatus === 'activo') {
      list = list.filter((l) => l.status === 'activo' && l.dueDate >= today);
    } else if (this.selectedStatus === 'vencido') {
      list = list.filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today));
    }

    // Search query
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.itemTitle.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q) ||
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

  public getLoanDurationString(loan: Loan): string {
    const startDate = new Date(loan.loanDate).getTime();
    if (isNaN(startDate)) return '-';

    let endDate: number;
    if (loan.returnDate) {
      endDate = new Date(loan.returnDate).getTime();
    } else {
      endDate = new Date().getTime();
    }

    const diffDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 3600 * 24)));
    if (loan.returnDate) {
      return `${diffDays} ${diffDays === 1 ? 'día (completado)' : 'días (completado)'}`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'día transcurrido' : 'días transcurridos'}`;
    }
  }

  public printReport() {
    window.print();
  }
}
