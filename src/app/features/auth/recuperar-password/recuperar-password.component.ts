import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
            <span class="material-icons text-white text-3xl">mark_email_read</span>
          </div>
          <h2 class="font-heading text-2xl font-extrabold text-white tracking-wide">
            Recuperar Contraseña
          </h2>
          <p class="text-xs text-zinc-400 mt-1.5">
            Ingresa tu correo registrado y te enviaremos el enlace de restauración de Firebase Auth
          </p>
        </div>

        <form (ngSubmit)="onReset()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Correo Electrónico</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">mail</span>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="tu@correo.com"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            [disabled]="!email"
            class="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Enviar Enlace de Recuperación
          </button>
        </form>

        <p class="text-center text-xs text-zinc-400 mt-6">
          <a routerLink="/auth/login" class="text-zinc-300 hover:text-white flex items-center justify-center gap-1">
            <span class="material-icons text-sm">arrow_back</span>
            Volver a Iniciar Sesión
          </a>
        </p>
      </div>
    </div>
  `
})
export class RecuperarPasswordComponent {
  public auth = inject(AuthService);
  public email = '';

  onReset() {
    if (this.email) {
      this.auth.resetPassword(this.email);
    }
  }
}
