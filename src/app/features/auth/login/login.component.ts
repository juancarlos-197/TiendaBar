import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        
        <!-- Glow gradient effect in background -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-8 relative">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center shadow-lg shadow-violet-600/30 mb-4">
            <span class="material-icons text-white text-3xl">lock_open</span>
          </div>
          <h2 class="font-heading text-2xl font-extrabold text-white tracking-wide">
            Iniciar Sesión
          </h2>
          <p class="text-xs text-zinc-400 mt-1.5">
            Accede a la plataforma de bares, discotecas y música Nocturna
          </p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4 relative">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Correo Electrónico</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">mail</span>
              <input
                type="email"
                formControlName="email"
                placeholder="tu@correo.com"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
              />
            </div>
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <p class="text-[11px] text-rose-400 mt-1">Ingresa un correo electrónico válido</p>
            }
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-zinc-300">Contraseña</label>
              <a routerLink="/auth/recuperar-password" class="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">vpn_key</span>
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
              >
                <span class="material-icons text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loginForm.invalid || auth.isLoading()"
            class="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-fuchsia-600/30 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (auth.isLoading()) {
              <span class="material-icons animate-spin text-base">refresh</span>
              Autenticando...
            } @else {
              <span class="material-icons text-base">login</span>
              Entrar a Nocturna
            }
          </button>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-zinc-800"></div></div>
          <div class="relative flex justify-center text-xs uppercase"><span class="bg-zinc-900 px-3 text-zinc-500">O también</span></div>
        </div>

        <!-- Google Login -->
        <button
          (click)="onGoogleLogin()"
          type="button"
          class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-3 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continuar con Google
        </button>

        <!-- Demo Quick Accounts -->
        <div class="mt-6 pt-4 border-t border-zinc-800/80">
          <p class="text-[11px] text-zinc-400 font-medium text-center mb-2.5">
            O selecciona una cuenta de prueba rápida:
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              (click)="fillDemo('ADMIN')"
              type="button"
              class="p-2 rounded-lg bg-zinc-950/60 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-500/40 text-left transition-colors"
            >
              <div class="font-bold text-[11px] text-rose-400">Admin</div>
              <div class="text-[9px] text-zinc-400 truncate">J. Albán</div>
            </button>

            <button
              (click)="fillDemo('BAR_OWNER')"
              type="button"
              class="p-2 rounded-lg bg-zinc-950/60 hover:bg-amber-950/30 border border-zinc-800 hover:border-amber-500/40 text-left transition-colors"
            >
              <div class="font-bold text-[11px] text-amber-400">Dueño Bar</div>
              <div class="text-[9px] text-zinc-400 truncate">El Sotareño</div>
            </button>

            <button
              (click)="fillDemo('USER')"
              type="button"
              class="p-2 rounded-lg bg-zinc-950/60 hover:bg-emerald-950/30 border border-zinc-800 hover:border-emerald-500/40 text-left transition-colors"
            >
              <div class="font-bold text-[11px] text-emerald-400">Cliente</div>
              <div class="text-[9px] text-zinc-400 truncate">Camila VIP</div>
            </button>
          </div>
        </div>

        <p class="text-center text-xs text-zinc-400 mt-6">
          ¿No tienes una cuenta aún?
          <a routerLink="/auth/registro" class="text-fuchsia-400 hover:underline font-semibold ml-1">
            Regístrate aquí
          </a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent {
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public showPassword = false;

  public loginForm = this.fb.group({
    email: ['jalban.dacompsc@gmail.com', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.auth.loginWithEmail(email!, password!);
    }
  }

  onGoogleLogin() {
    this.auth.loginWithGoogle();
  }

  fillDemo(role: 'ADMIN' | 'BAR_OWNER' | 'USER') {
    if (role === 'ADMIN') {
      this.loginForm.patchValue({ email: 'jalban.dacompsc@gmail.com', password: 'password123' });
      this.auth.initDemoUser('ADMIN');
      this.router.navigate(['/dashboard']);
    } else if (role === 'BAR_OWNER') {
      this.loginForm.patchValue({ email: 'propietario@sotareno.bar', password: 'password123' });
      this.auth.initDemoUser('BAR_OWNER');
      this.router.navigate(['/dashboard']);
    } else {
      this.loginForm.patchValue({ email: 'camila.rios@gmail.com', password: 'password123' });
      this.auth.initDemoUser('USER');
      this.router.navigate(['/dashboard']);
    }
  }
}
