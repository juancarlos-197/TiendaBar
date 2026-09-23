import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { UserRole } from '../../models/types';

@Component({
  selector: 'app-auth-modal',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        (click)="$event.stopPropagation()"
        class="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white">
        
        <!-- Close button -->
        <button
          (click)="close.emit()"
          class="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
          <span class="material-icons text-xl">close</span>
        </button>

        <!-- Brand / Header -->
        <div class="text-center mb-6">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 ring-4 ring-amber-500/20">
            <span class="material-icons text-3xl text-slate-950">local_bar</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-white">
            @if (mode() === 'login') { Iniciar Sesión }
            @else if (mode() === 'register') { Crear Cuenta }
            @else { Recuperar Contraseña }
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            @if (mode() === 'login') { Accede al panel de control de Tienda y Bar }
            @else if (mode() === 'register') { Registra tu usuario con rol en Firebase }
            @else { Te enviaremos un enlace a tu correo para restablecer tu contraseña }
          </p>
        </div>

        <!-- Mode Switcher Tabs -->
        @if (mode() !== 'forgot') {
          <div class="flex p-1 bg-slate-800/90 rounded-2xl mb-6 border border-slate-700/60">
            <button
              (click)="mode.set('login')"
              [class]="mode() === 'login' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="flex-1 py-2 text-xs rounded-xl transition-all font-medium">
              Iniciar Sesión
            </button>
            <button
              (click)="mode.set('register')"
              [class]="mode() === 'register' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="flex-1 py-2 text-xs rounded-xl transition-all font-medium">
              Registrarse
            </button>
          </div>
        }

        <!-- Error / Info message banner -->
        @if (errorMessage()) {
          <div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <span class="material-icons text-base mt-0.5 text-rose-400">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <span class="material-icons text-base mt-0.5 text-emerald-400">check_circle</span>
            <span>{{ successMessage() }}</span>
          </div>
        }

        <!-- Form fields -->
        <form (ngSubmit)="handleSubmit()" class="space-y-4">
          
          <!-- Name (only for register) -->
          @if (mode() === 'register') {
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo</label>
              <div class="relative">
                <span class="material-icons absolute left-3.5 top-3 text-slate-400 text-lg">person</span>
                <input
                  type="text"
                  [(ngModel)]="name"
                  name="name"
                  required
                  placeholder="Ej. Juan Pérez"
                  class="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
              </div>
            </div>

            <!-- Role Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Rol en el Sistema</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="selectedRole.set('operador')"
                  [class]="selectedRole() === 'operador' ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold' : 'border-slate-700 bg-slate-800/50 text-slate-400'"
                  class="py-2 px-1 text-center rounded-xl border text-xs transition-all">
                  Operador
                </button>
                <button
                  type="button"
                  (click)="selectedRole.set('admin')"
                  [class]="selectedRole() === 'admin' ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold' : 'border-slate-700 bg-slate-800/50 text-slate-400'"
                  class="py-2 px-1 text-center rounded-xl border text-xs transition-all">
                  Admin
                </button>
                <button
                  type="button"
                  (click)="selectedRole.set('cliente')"
                  [class]="selectedRole() === 'cliente' ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold' : 'border-slate-700 bg-slate-800/50 text-slate-400'"
                  class="py-2 px-1 text-center rounded-xl border text-xs transition-all">
                  Cliente
                </button>
              </div>
            </div>
          }

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-slate-400 text-lg">email</span>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="nombre@correo.com"
                class="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
            </div>
          </div>

          <!-- Password (login & register) -->
          @if (mode() !== 'forgot') {
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300">Contraseña</label>
                @if (mode() === 'login') {
                  <button
                    type="button"
                    (click)="mode.set('forgot'); errorMessage.set(''); successMessage.set('');"
                    class="text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                }
              </div>
              <div class="relative">
                <span class="material-icons absolute left-3.5 top-3 text-slate-400 text-lg">lock</span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  class="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
                <button
                  type="button"
                  (click)="toggleShowPassword()"
                  class="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                  <span class="material-icons text-base">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
          }

          <!-- Submit button -->
          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            @if (isLoading()) {
              <span class="material-icons animate-spin text-lg">autorenew</span>
              <span>Procesando...</span>
            } @else {
              <span class="material-icons text-lg">
                {{ mode() === 'login' ? 'login' : mode() === 'register' ? 'person_add' : 'mark_email_read' }}
              </span>
              <span>
                {{ mode() === 'login' ? 'Entrar al Sistema' : mode() === 'register' ? 'Crear mi Cuenta' : 'Enviar Enlace de Recuperación' }}
              </span>
            }
          </button>
        </form>

        <!-- Back to login for Forgot Password -->
        @if (mode() === 'forgot') {
          <div class="mt-4 text-center">
            <button
              (click)="mode.set('login'); errorMessage.set(''); successMessage.set('');"
              class="text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-medium">
              <span class="material-icons text-sm">arrow_back</span>
              Volver al inicio de sesión
            </button>
          </div>
        }

        <!-- Divider -->
        @if (mode() !== 'forgot') {
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-700/60"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-3 bg-slate-900 text-slate-400 font-medium">O continúa con</span>
            </div>
          </div>

          <!-- Google Sign In -->
          <button
            type="button"
            (click)="handleGoogleLogin()"
            [disabled]="isLoading()"
            class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Acceder con Google</span>
          </button>
        }

      </div>
    </div>
  `,
})
export class AuthModalComponent {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public close = output<void>();

  public mode = signal<'login' | 'register' | 'forgot'>('login');
  public selectedRole = signal<UserRole>('operador');
  public showPassword = signal<boolean>(false);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');

  public name = '';
  public email = '';
  public password = '';

  public toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  public async handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email) {
      this.errorMessage.set('Por favor ingresa tu correo electrónico.');
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.mode() === 'login') {
        if (!this.password) {
          this.errorMessage.set('Ingresa tu contraseña.');
          this.isLoading.set(false);
          return;
        }
        await this.firebaseService.loginWithEmail(this.email, this.password);
        this.toastService.success('¡Bienvenido!', 'Has iniciado sesión con éxito.');
        this.close.emit();
      } else if (this.mode() === 'register') {
        if (!this.name.trim()) {
          this.errorMessage.set('Ingresa tu nombre completo.');
          this.isLoading.set(false);
          return;
        }
        if (this.password.length < 6) {
          this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
          this.isLoading.set(false);
          return;
        }
        await this.firebaseService.registerWithEmail(
          this.email,
          this.password,
          this.name,
          this.selectedRole()
        );
        this.toastService.success('¡Cuenta Creada!', 'Bienvenido a Gestión Tienda & Bar.');
        this.close.emit();
      } else if (this.mode() === 'forgot') {
        await this.firebaseService.sendPasswordReset(this.email);
        this.successMessage.set(
          `Hemos enviado un correo a "${this.email}" con las instrucciones para restablecer tu contraseña.`
        );
        this.toastService.info(
          'Correo enviado',
          'Revisa tu bandeja de entrada o spam para restablecer tu clave.'
        );
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error. Por favor intenta de nuevo.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        msg = 'Credenciales inválidas. Revisa tu correo y contraseña.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'Este correo ya está registrado. Prueba iniciar sesión o restablecer tu clave.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      } else if (err?.code === 'auth/user-not-found') {
        msg = 'No se encontró ninguna cuenta con este correo.';
      } else if (err?.message) {
        msg = err.message;
      }
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async handleGoogleLogin() {
    this.errorMessage.set('');
    this.isLoading.set(true);
    try {
      await this.firebaseService.loginWithGoogle();
      this.toastService.success('Autenticación Exitosa', 'Has ingresado con tu cuenta de Google.');
      this.close.emit();
    } catch (err: any) {
      console.error(err);
      this.errorMessage.set(err?.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
