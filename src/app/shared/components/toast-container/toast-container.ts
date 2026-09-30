import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300"
          [ngClass]="{
            'bg-zinc-900/95 border-emerald-500/40 text-emerald-400': toast.type === 'success',
            'bg-zinc-900/95 border-rose-500/40 text-rose-400': toast.type === 'error',
            'bg-zinc-900/95 border-amber-500/40 text-amber-400': toast.type === 'warning',
            'bg-zinc-900/95 border-violet-500/40 text-violet-400': toast.type === 'info'
          }"
        >
          <span class="material-icons text-xl shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') { check_circle }
              @case ('error') { error }
              @case ('warning') { warning }
              @default { info }
            }
          </span>
          <div class="flex-1">
            @if (toast.title) {
              <h4 class="font-bold text-sm text-zinc-100">{{ toast.title }}</h4>
            }
            <p class="text-xs text-zinc-300 mt-0.5">{{ toast.message }}</p>
          </div>
          <button
            (click)="notify.dismiss(toast.id)"
            class="text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
          >
            <span class="material-icons text-base">close</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public notify = inject(NotificationService);
}
