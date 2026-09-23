import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  inject,
  input,
  PLATFORM_ID,
  afterNextRender,
  effect,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Item } from '../../models/types';

interface ChartDataItem {
  name: string;
  tienda: number;
  bar: number;
  total: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  type: string;
}

@Component({
  selector: 'app-stock-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      <!-- Header: Title, Controls & Recharts Badge -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span class="material-icons text-xl">insights</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-white">Distribución de Stock Tienda vs Bar</h2>
                <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black tracking-wide uppercase">
                  Recharts v2
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Visualización analítica interactiva de existencias disponibles y en préstamo
              </p>
            </div>
          </div>
        </div>

        <!-- Controls: Chart Type & Metric Filter -->
        <div class="flex flex-wrap items-center gap-2">
          
          <!-- Metric selector -->
          <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              (click)="selectedMetric.set('available')"
              [class.bg-amber-500]="selectedMetric() === 'available'"
              [class.text-slate-950]="selectedMetric() === 'available'"
              [class.text-slate-400]="selectedMetric() !== 'available'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all">
              Disponibles
            </button>
            <button
              type="button"
              (click)="selectedMetric.set('total')"
              [class.bg-amber-500]="selectedMetric() === 'total'"
              [class.text-slate-950]="selectedMetric() === 'total'"
              [class.text-slate-400]="selectedMetric() !== 'total'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all">
              Totales
            </button>
            <button
              type="button"
              (click)="selectedMetric.set('loaned')"
              [class.bg-amber-500]="selectedMetric() === 'loaned'"
              [class.text-slate-950]="selectedMetric() === 'loaned'"
              [class.text-slate-400]="selectedMetric() !== 'loaned'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all">
              En Préstamo
            </button>
          </div>

          <!-- Chart Mode: Bar vs Pie -->
          <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              (click)="chartType.set('bar')"
              [class.bg-amber-500]="chartType() === 'bar'"
              [class.text-slate-950]="chartType() === 'bar'"
              [class.text-slate-400]="chartType() !== 'bar'"
              title="Gráfico de Barras Comparativo"
              class="p-1.5 rounded-lg font-bold transition-all flex items-center">
              <span class="material-icons text-sm">bar_chart</span>
            </button>
            <button
              type="button"
              (click)="chartType.set('pie')"
              [class.bg-amber-500]="chartType() === 'pie'"
              [class.text-slate-950]="chartType() === 'pie'"
              [class.text-slate-400]="chartType() !== 'pie'"
              title="Gráfico Circular Donut"
              class="p-1.5 rounded-lg font-bold transition-all flex items-center">
              <span class="material-icons text-sm">pie_chart</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Quick KPI Counters -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
          <div class="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Stock Tienda</span>
          </div>
          <div class="text-xl font-black text-emerald-400 font-mono">
            {{ tiendaStock() }}
            <span class="text-xs font-normal text-slate-500">uds</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">{{ tiendaShare() }}% del total</div>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
          <div class="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Stock Bar</span>
          </div>
          <div class="text-xl font-black text-amber-400 font-mono">
            {{ barStock() }}
            <span class="text-xs font-normal text-slate-500">uds</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">{{ barShare() }}% del total</div>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
          <div class="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <span class="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>En Préstamo</span>
          </div>
          <div class="text-xl font-black text-blue-400 font-mono">
            {{ loanedStock() }}
            <span class="text-xs font-normal text-slate-500">uds</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">En manos de socios</div>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
          <div class="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Total Catálogo</span>
          </div>
          <div class="text-xl font-black text-white font-mono">
            {{ totalInventory() }}
            <span class="text-xs font-normal text-slate-500">uds</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">{{ items().length }} referencias</div>
        </div>
      </div>

      <!-- React / Recharts Mount Container -->
      <div class="relative w-full h-72 sm:h-80 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-2 overflow-hidden">
        <div #chartContainer class="w-full h-full"></div>

        @if (!isBrowser) {
          <!-- SSR Fallback -->
          <div class="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            Cargando gráfico interactivo de Recharts...
          </div>
        }
      </div>

      <!-- Legend and Note -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
            <span>Tienda (Productos & Botellería)</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-md bg-amber-500 inline-block"></span>
            <span>Bar (Cava, Copas & Degustación)</span>
          </span>
        </div>
        <div class="text-[11px] text-slate-500 flex items-center gap-1">
          <span class="material-icons text-xs">touch_app</span>
          <span>Pasa el cursor sobre el gráfico para ver detalles y porcentajes interactivos</span>
        </div>
      </div>

    </div>
  `,
})
export class StockChartComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  public isBrowser = isPlatformBrowser(this.platformId);

  public items = input.required<Item[]>();

  public chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  public chartType = signal<'bar' | 'pie'>('bar');
  public selectedMetric = signal<'available' | 'total' | 'loaned'>('available');

  private reactRoot: Root | null = null;

  public tiendaStock = computed(() => {
    const metric = this.selectedMetric();
    return this.items()
      .filter((i) => i.type === 'tienda')
      .reduce((acc, i) => {
        if (metric === 'available') return acc + i.availableCopies;
        if (metric === 'total') return acc + i.totalCopies;
        return acc + Math.max(0, i.totalCopies - i.availableCopies);
      }, 0);
  });

  public barStock = computed(() => {
    const metric = this.selectedMetric();
    return this.items()
      .filter((i) => i.type === 'bar')
      .reduce((acc, i) => {
        if (metric === 'available') return acc + i.availableCopies;
        if (metric === 'total') return acc + i.totalCopies;
        return acc + Math.max(0, i.totalCopies - i.availableCopies);
      }, 0);
  });

  public loanedStock = computed(() => {
    return this.items().reduce((acc, i) => acc + Math.max(0, i.totalCopies - i.availableCopies), 0);
  });

  public totalInventory = computed(() => {
    return this.items().reduce((acc, i) => acc + i.totalCopies, 0);
  });

  public tiendaShare = computed(() => {
    const total = this.tiendaStock() + this.barStock();
    return total > 0 ? Math.round((this.tiendaStock() / total) * 100) : 0;
  });

  public barShare = computed(() => {
    const total = this.tiendaStock() + this.barStock();
    return total > 0 ? Math.round((this.barStock() / total) * 100) : 0;
  });

  // Prepare categorized data for BarChart
  public categoryChartData = computed<ChartDataItem[]>(() => {
    const metric = this.selectedMetric();
    const categoriesMap: Record<string, { tienda: number; bar: number }> = {};

    for (const item of this.items()) {
      const cat = item.category || 'General';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { tienda: 0, bar: 0 };
      }

      let count = item.availableCopies;
      if (metric === 'total') count = item.totalCopies;
      if (metric === 'loaned') count = Math.max(0, item.totalCopies - item.availableCopies);

      if (item.type === 'tienda') {
        categoriesMap[cat].tienda += count;
      } else {
        categoriesMap[cat].bar += count;
      }
    }

    return Object.keys(categoriesMap)
      .map((cat) => ({
        name: cat,
        tienda: categoriesMap[cat].tienda,
        bar: categoriesMap[cat].bar,
        total: categoriesMap[cat].tienda + categoriesMap[cat].bar,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7); // Top 7 categories
  });

  // Prepare data for PieChart
  public pieChartData = computed<PieDataItem[]>(() => {
    const metric = this.selectedMetric();
    const list: PieDataItem[] = [];

    // Tienda items summary
    list.push({
      name: `Tienda (${metric === 'available' ? 'Disp.' : metric === 'total' ? 'Tot.' : 'Prést.'})`,
      value: this.tiendaStock(),
      color: '#10b981', // emerald-500
      type: 'Tienda',
    });

    // Bar items summary
    list.push({
      name: `Bar (${metric === 'available' ? 'Disp.' : metric === 'total' ? 'Tot.' : 'Prést.'})`,
      value: this.barStock(),
      color: '#f59e0b', // amber-500
      type: 'Bar',
    });

    return list;
  });

  constructor() {
    afterNextRender(() => {
      if (this.isBrowser) {
        this.initReactChart();
      }
    });

    // Reactively update chart whenever inputs or signals change
    effect(() => {
      // depend on signals
      this.chartType();
      this.selectedMetric();
      this.categoryChartData();
      this.pieChartData();

      if (this.isBrowser && this.reactRoot) {
        this.renderReactChart();
      }
    });
  }

  private initReactChart() {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    if (!this.reactRoot) {
      this.reactRoot = createRoot(container);
    }
    this.renderReactChart();
  }

  private renderReactChart() {
    if (!this.reactRoot) return;

    const type = this.chartType();
    const barData = this.categoryChartData();
    const pieData = this.pieChartData();

    // Dark theme custom tooltip
    const customTooltipStyle = {
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderRadius: '12px',
      color: '#f8fafc',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      padding: '8px 12px',
      fontSize: '12px',
    };

    let chartElement: React.ReactElement;

    if (type === 'bar') {
      chartElement = React.createElement(
        ResponsiveContainer as any,
        { width: '100%', height: '100%' },
        React.createElement(
          BarChart as any,
          {
            data: barData,
            margin: { top: 15, right: 20, left: -10, bottom: 5 },
          },
          React.createElement(CartesianGrid as any, {
            strokeDasharray: '3 3',
            stroke: '#1e293b',
            vertical: false,
          }),
          React.createElement(XAxis as any, {
            dataKey: 'name',
            stroke: '#94a3b8',
            fontSize: 11,
            tickLine: false,
            axisLine: { stroke: '#334155' },
          }),
          React.createElement(YAxis as any, {
            stroke: '#94a3b8',
            fontSize: 11,
            tickLine: false,
            axisLine: { stroke: '#334155' },
            allowDecimals: false,
          }),
          React.createElement(Tooltip as any, {
            contentStyle: customTooltipStyle,
            formatter: (value: any, name: any) => [
              `${value} unidades`,
              name === 'tienda' ? 'Tienda' : 'Bar',
            ],
            labelStyle: { color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' },
          }),
          React.createElement(Legend as any, {
            verticalAlign: 'top',
            height: 32,
            iconType: 'circle',
            formatter: (value: string) =>
              React.createElement(
                'span',
                { style: { color: '#cbd5e1', fontSize: '12px', fontWeight: 600 } },
                value === 'tienda' ? 'Tienda' : 'Bar'
              ),
          }),
          React.createElement(Bar as any, {
            dataKey: 'tienda',
            name: 'tienda',
            fill: '#10b981',
            radius: [6, 6, 0, 0],
            maxBarSize: 40,
          }),
          React.createElement(Bar as any, {
            dataKey: 'bar',
            name: 'bar',
            fill: '#f59e0b',
            radius: [6, 6, 0, 0],
            maxBarSize: 40,
          })
        )
      );
    } else {
      // Donut PieChart
      chartElement = React.createElement(
        ResponsiveContainer as any,
        { width: '100%', height: '100%' },
        React.createElement(
          PieChart as any,
          null,
          React.createElement(Tooltip as any, {
            contentStyle: customTooltipStyle,
            formatter: (value: any, name: any) => [`${value} unidades`, name],
          }),
          React.createElement(Legend as any, {
            verticalAlign: 'bottom',
            height: 36,
            iconType: 'circle',
            formatter: (value: string) =>
              React.createElement(
                'span',
                { style: { color: '#cbd5e1', fontSize: '12px', fontWeight: 600 } },
                value
              ),
          }),
          React.createElement(
            Pie as any,
            {
              data: pieData,
              dataKey: 'value',
              nameKey: 'name',
              cx: '50%',
              cy: '45%',
              innerRadius: 65,
              outerRadius: 100,
              paddingAngle: 5,
              label: (entry: any) => `${entry.name.split(' ')[0]}: ${entry.value} uds`,
            },
            pieData.map((entry, index) =>
              React.createElement(Cell as any, {
                key: `cell-${index}`,
                fill: entry.color,
                stroke: '#0f172a',
                strokeWidth: 2,
              })
            )
          )
        )
      );
    }

    this.reactRoot.render(chartElement);
  }

  ngOnDestroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
}
