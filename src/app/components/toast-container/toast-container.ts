import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto bg-slate-900/95 border rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 text-white transition-all transform animate-in slide-in-from-bottom-3 duration-200"
          [ngClass]="{
            'border-emerald-500/50 text-emerald-300 shadow-emerald-950/40': toast.type === 'success',
            'border-rose-500/50 text-rose-300 shadow-rose-950/40': toast.type === 'error',
            'border-amber-500/50 text-amber-300 shadow-amber-950/40': toast.type === 'warning',
            'border-blue-500/50 text-blue-300 shadow-blue-950/40': toast.type === 'info'
          }">
          
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <span class="material-icons text-emerald-400 text-xl">check_circle</span>
            } @else if (toast.type === 'error') {
              <span class="material-icons text-rose-400 text-xl">error</span>
            } @else if (toast.type === 'warning') {
              <span class="material-icons text-amber-400 text-xl">warning</span>
            } @else {
              <span class="material-icons text-blue-400 text-xl">info</span>
            }
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-white">{{ toast.title }}</h4>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-snug">{{ toast.message }}</p>
          </div>

          <button
            (click)="toastService.remove(toast.id)"
            class="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-lg">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
