import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { StockChartComponent } from '../stock-chart/stock-chart';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, StockChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      
      <!-- HERO & WELCOME BANNER -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl text-white">
        <div class="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Panel de Control en Vivo</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Gestión Integral Tienda & Bar
            </h1>
            <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitorea existencias de bar y tienda, administra préstamos, recibe alertas visuales inmediatas por vencimientos y consulta la bitácora de movimientos.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              (click)="openNewLoan.emit()"
              class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2">
              <span class="material-icons text-xl">assignment_turned_in</span>
              <span>Nuevo Préstamo</span>
            </button>

            <button
              (click)="openNewItem.emit()"
              class="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2">
              <span class="material-icons text-xl">add_box</span>
              <span>Agregar Artículo</span>
            </button>

            @if (firebaseService.items().length === 0) {
              <button
                (click)="seedDemoData()"
                class="px-4 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-1.5">
                <span class="material-icons text-base">cloud_download</span>
                <span>Cargar Datos de Demostración</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- CRITICAL VISUAL ALERT: OVERDUE LOANS (Alerta visual prominente) -->
      @if (overdueLoans().length > 0) {
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-slate-900 border-2 border-rose-600/80 p-6 shadow-2xl shadow-rose-900/30 animate-pulse">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40 animate-bounce">
                <span class="material-icons text-3xl">warning</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider">
                    Alerta Crítica
                  </span>
                  <span class="text-xs font-semibold text-rose-300">
                    {{ overdueLoans().length }} {{ overdueLoans().length === 1 ? 'préstamo vencido requiere' : 'préstamos vencidos requieren' }} atención
                  </span>
                </div>
                <h3 class="text-xl font-black text-white mt-1">
                  ¡Existen préstamos con fecha de devolución superada!
                </h3>
                <p class="text-xs text-rose-200/90 mt-0.5 max-w-2xl">
                  Se ha sobrepasado la fecha límite de retorno. Se recomienda contactar a los prestatarios para regularizar las existencias en inventario.
                </p>
              </div>
            </div>

            <button
              (click)="navigateToLoans.emit()"
              class="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/40 transition-all flex items-center gap-2 self-start md:self-auto shrink-0">
              <span>Gestionar Devoluciones</span>
              <span class="material-icons text-lg">arrow_forward</span>
            </button>
          </div>

          <!-- Overdue Items quick cards preview -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-rose-800/60">
            @for (loan of overdueLoans().slice(0, 3); track loan.id) {
              <div class="bg-rose-950/50 border border-rose-800/80 rounded-2xl p-3 flex items-center gap-3">
                <img 
                  [src]="loan.itemCoverUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100'" 
                  [alt]="loan.itemTitle" 
                  class="w-12 h-14 object-cover rounded-xl border border-rose-700/50 shrink-0">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span 
                      class="text-[9px] uppercase font-bold px-1 rounded"
                      [ngClass]="loan.itemType === 'bar' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'">
                      {{ loan.itemType }}
                    </span>
                    <span class="text-xs font-bold text-white truncate">{{ loan.itemTitle }}</span>
                  </div>
                  <p class="text-[11px] text-rose-200 truncate">{{ loan.userName }}</p>
                  <p class="text-[10px] text-rose-300 font-semibold mt-0.5">
                    Venció el {{ loan.dueDate }} ({{ getDaysOverdue(loan.dueDate) }} días de retraso)
                  </p>
                </div>
                <button
                  (click)="returnLoanDirect(loan.id)"
                  title="Marcar como Devuelto"
                  class="p-2 rounded-xl bg-rose-800/80 hover:bg-rose-700 text-white transition-colors shrink-0">
                  <span class="material-icons text-base">assignment_return</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- KPI METRIC CARDS (4 Main Indicators) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <!-- 1. Tienda Disponibles -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Tienda</span>
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span class="material-icons text-xl">storefront</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-white">{{ stats().tiendaAvailable }}</span>
              <span class="text-xs font-semibold text-slate-400">/ {{ stats().tiendaTotal }} total</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Ejemplares disponibles en catálogo</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              class="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              [style.width.%]="stats().tiendaTotal ? (stats().tiendaAvailable / stats().tiendaTotal) * 100 : 0">
            </div>
          </div>
        </div>

        <!-- 2. Bar Disponibles -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Bar</span>
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span class="material-icons text-xl">local_bar</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-white">{{ stats().barAvailable }}</span>
              <span class="text-xs font-semibold text-slate-400">/ {{ stats().barTotal }} total</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Unidades y botellas en Bar</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              class="bg-amber-500 h-full rounded-full transition-all duration-500" 
              [style.width.%]="stats().barTotal ? (stats().barAvailable / stats().barTotal) * 100 : 0">
            </div>
          </div>
        </div>

        <!-- 3. Préstamos Activos -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-400">En Curso</span>
            <div class="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <span class="material-icons text-xl">assignment</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-white">{{ stats().activeLoans }}</span>
              <span class="text-xs font-semibold text-blue-400">activos</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Préstamos vigentes a tiempo</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div class="bg-blue-500 h-full rounded-full transition-all duration-500" style="width: 85%"></div>
          </div>
        </div>

        <!-- 4. Préstamos Vencidos -->
        <div 
          class="bg-slate-900 border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all"
          [ngClass]="stats().overdueLoans > 0 ? 'border-rose-600 bg-rose-950/20' : 'border-slate-800'">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-rose-400">Vencidos</span>
            <div 
              class="w-10 h-10 rounded-2xl flex items-center justify-center text-rose-400"
              [ngClass]="stats().overdueLoans > 0 ? 'bg-rose-600/30 text-rose-300 animate-pulse' : 'bg-rose-500/10'">
              <span class="material-icons text-xl">event_busy</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black" [ngClass]="stats().overdueLoans > 0 ? 'text-rose-400' : 'text-white'">
                {{ stats().overdueLoans }}
              </span>
              <span class="text-xs font-semibold text-rose-400">atrasados</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Requieren devolución inmediata</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              class="bg-rose-500 h-full rounded-full transition-all duration-500" 
              [style.width.%]="stats().overdueLoans > 0 ? 100 : 0">
            </div>
          </div>
        </div>

      </div>

      <!-- INTERACTIVE STOCK DISTRIBUTION CHART (RECHARTS) -->
      <app-stock-chart [items]="firebaseService.items()" />

      <!-- TWO-COLUMN CONTENT: Active loans preview & Movements Activity Feed -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left 2 Cols: Préstamos Activos Recientes -->
        <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-400">schedule</span>
              <h2 class="text-lg font-bold text-white">Préstamos en Curso</h2>
            </div>
            <button
              (click)="navigateToLoans.emit()"
              class="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors">
              <span>Ver todos</span>
              <span class="material-icons text-sm">arrow_forward</span>
            </button>
          </div>

          @if (activeLoansList().length === 0) {
            <div class="text-center py-12 text-slate-400">
              <span class="material-icons text-4xl text-slate-600 mb-2">assignment_late</span>
              <p class="text-sm font-medium">No hay préstamos activos registrados actualmente.</p>
              <button
                (click)="openNewLoan.emit()"
                class="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-all">
                Registrar primer préstamo
              </button>
            </div>
          } @else {
            <div class="divide-y divide-slate-800/80 mt-2">
              @for (loan of activeLoansList().slice(0, 5); track loan.id) {
                <div class="py-3.5 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <img 
                      [src]="loan.itemCoverUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100'" 
                      [alt]="loan.itemTitle" 
                      class="w-12 h-14 object-cover rounded-xl border border-slate-700 shrink-0">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span 
                          class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                          [ngClass]="loan.itemType === 'bar' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'">
                          {{ loan.itemType }}
                        </span>
                        <h4 class="text-sm font-bold text-white truncate">{{ loan.itemTitle }}</h4>
                      </div>
                      <p class="text-xs text-slate-400 mt-0.5 truncate">
                        Prestatario: <strong class="text-slate-300">{{ loan.userName }}</strong>
                      </p>
                      <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>Desde: {{ loan.loanDate }}</span>
                        <span>•</span>
                        <span [ngClass]="loan.status === 'vencido' ? 'text-rose-400 font-bold' : 'text-slate-300'">
                          Límite: {{ loan.dueDate }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Status Badge & Action -->
                  <div class="flex items-center gap-3 shrink-0">
                    @if (loan.status === 'vencido') {
                      <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                        <span class="material-icons text-xs">error</span>
                        Vencido
                      </span>
                    } @else {
                      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Al día
                      </span>
                    }

                    <button
                      (click)="returnLoanDirect(loan.id)"
                      class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors flex items-center gap-1">
                      <span class="material-icons text-xs">keyboard_return</span>
                      <span class="hidden sm:inline">Devolver</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right 1 Col: Últimos Movimientos (Bitácora) -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-400">history_edu</span>
              <h2 class="text-lg font-bold text-white">Últimos Movimientos</h2>
            </div>
            <span class="text-xs font-medium text-slate-500">En tiempo real</span>
          </div>

          @if (firebaseService.movements().length === 0) {
            <div class="text-center py-12 text-slate-400">
              <span class="material-icons text-3xl text-slate-600 mb-1">list_alt</span>
              <p class="text-xs font-medium">Aún no hay movimientos registrados.</p>
            </div>
          } @else {
            <div class="space-y-4 mt-4 max-h-[480px] overflow-y-auto pr-1">
              @for (move of firebaseService.movements().slice(0, 10); track move.id) {
                <div class="flex items-start gap-3 text-xs">
                  <div 
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    [ngClass]="{
                      'bg-amber-500/20 text-amber-400': move.type === 'loan_created',
                      'bg-emerald-500/20 text-emerald-400': move.type === 'loan_returned',
                      'bg-blue-500/20 text-blue-400': move.type === 'item_created',
                      'bg-rose-500/20 text-rose-400': move.type === 'item_deleted',
                      'bg-purple-500/20 text-purple-400': move.type === 'item_updated'
                    }">
                    <span class="material-icons text-base">
                      @if (move.type === 'loan_created') { assignment }
                      @else if (move.type === 'loan_returned') { assignment_turned_in }
                      @else if (move.type === 'item_created') { add_circle }
                      @else if (move.type === 'item_deleted') { delete }
                      @else { edit }
                    </span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-white truncate">{{ move.title }}</p>
                    <p class="text-slate-400 text-[11px] leading-snug">{{ move.description }}</p>
                    <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>{{ move.performedBy }}</span>
                      <span>•</span>
                      <span>{{ formatRelativeTime(move.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>

    </div>
  `,
})
export class DashboardComponent {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public openNewLoan = output<void>();
  public openNewItem = output<void>();
  public navigateToLoans = output<void>();

  public stats = computed(() => {
    const items = this.firebaseService.items();
    const loans = this.firebaseService.loans();

    let tiendaAvail = 0;
    let tiendaTot = 0;
    let barAvail = 0;
    let barTot = 0;

    for (const item of items) {
      if (item.type === 'tienda') {
        tiendaAvail += item.availableCopies || 0;
        tiendaTot += item.totalCopies || 0;
      } else {
        barAvail += item.availableCopies || 0;
        barTot += item.totalCopies || 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let active = 0;
    let overdue = 0;
    const nearDue = 0;
    let returned = 0;

    for (const l of loans) {
      if (l.status === 'devuelto') {
        returned++;
      } else {
        active++;
        if (l.dueDate < today || l.status === 'vencido') {
          overdue++;
        }
      }
    }

    return {
      tiendaAvailable: tiendaAvail,
      tiendaTotal: tiendaTot,
      barAvailable: barAvail,
      barTotal: barTot,
      activeLoans: active,
      overdueLoans: overdue,
      nearDueLoans: nearDue,
      totalReturned: returned,
    };
  });

  public overdueLoans = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.firebaseService.loans().filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today));
  });

  public activeLoansList = computed(() => {
    return this.firebaseService.loans().filter((l) => l.status !== 'devuelto');
  });

  public getDaysOverdue(dueDate: string): number {
    const d = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((now - d) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  }

  public formatRelativeTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString).getTime();
    const now = new Date().getTime();
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `Hace ${diffDays} d`;
  }

  public async returnLoanDirect(loanId: string) {
    try {
      await this.firebaseService.returnLoan(loanId, 'Devolución rápida desde el Dashboard');
      this.toastService.success('Devolución registrada', 'El ejemplar ha regresado al inventario disponible.');
    } catch (err: any) {
      this.toastService.error('Error', err?.message || 'No se pudo registrar la devolución.');
    }
  }

  public async seedDemoData() {
    try {
      await this.firebaseService.seedFullDemoData();
      this.toastService.success('Datos cargados', 'Se han sembrado artículos, usuarios y préstamos de demostración.');
    } catch (err: any) {
      this.toastService.error('Error', err?.message || 'No se pudieron cargar los datos de prueba.');
    }
  }
}
