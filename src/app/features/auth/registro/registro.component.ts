import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        
        <div class="text-center mb-8 relative">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-fuchsia-600/30 mb-4">
            <span class="material-icons text-white text-3xl">person_add</span>
          </div>
          <h2 class="font-heading text-2xl font-extrabold text-white tracking-wide">
            Crear Cuenta
          </h2>
          <p class="text-xs text-zinc-400 mt-1.5">
            Únete a la comunidad de experiencias y rumba Nocturna
          </p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Nombre Completo</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">badge</span>
              <input
                type="text"
                formControlName="name"
                placeholder="Ej. Juan Pérez"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Correo Electrónico</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">mail</span>
              <input
                type="email"
                formControlName="email"
                placeholder="juan@email.com"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Tipo de Perfil</label>
            <select
              formControlName="role"
              class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="USER">Cliente / Clubber VIP</option>
              <option value="BAR_OWNER">Dueño o Administrador de Bar</option>
              <option value="ADMIN">Administrador de la Plataforma</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">Contraseña</label>
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-3 text-zinc-500 text-lg">vpn_key</span>
              <input
                type="password"
                formControlName="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              />
            </div>
          </div>

          <button
            type="submit"
            [disabled]="registerForm.invalid || auth.isLoading()"
            class="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:from-fuchsia-500 hover:to-amber-400 shadow-lg shadow-fuchsia-600/30 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (auth.isLoading()) {
              <span class="material-icons animate-spin text-base">refresh</span>
              Registrando...
            } @else {
              <span class="material-icons text-base">how_to_reg</span>
              Crear mi Cuenta
            }
          </button>
        </form>

        <p class="text-center text-xs text-zinc-400 mt-6">
          ¿Ya tienes cuenta registrada?
          <a routerLink="/auth/login" class="text-fuchsia-400 hover:underline font-semibold ml-1">
            Inicia sesión
          </a>
        </p>

      </div>
    </div>
  `
})
export class RegistroComponent {
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER' as UserRole, [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      const { name, email, password, role } = this.registerForm.value;
      this.auth.register(name!, email!, password!, role as UserRole);
    }
  }
}
