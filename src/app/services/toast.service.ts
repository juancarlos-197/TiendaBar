import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../models/types';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts = signal<ToastMessage[]>([]);

  public show(type: ToastMessage['type'], title: string, message: string, durationMs = 4000) {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { id, type, title, message };
    this.toasts.update((current) => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  public success(title: string, message: string) {
    this.show('success', title, message);
  }

  public error(title: string, message: string) {
    this.show('error', title, message, 6000);
  }

  public warning(title: string, message: string) {
    this.show('warning', title, message, 5000);
  }

  public info(title: string, message: string) {
    this.show('info', title, message);
  }

  public remove(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
