import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, UserRole, UserEstado } from '../../core/models/user.model';
import { UserHttpService } from '../../core/services/user-http.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-20 max-w-7xl mx-auto">
      
      <!-- 1. Header con Indicadores Node Express & AngularNode -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-3xl shadow-xl">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <span class="material-icons text-sm">security</span>
              Panel de Control de Usuarios
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              HTTP Node.js + Express (AngularNode SSR)
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[11px] font-mono">
              <span class="material-icons text-xs">tune</span>
              apiInterceptor Activo
            </span>
          </div>

          <h1 class="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Gestión Integral de Usuarios
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Administra cuentas con atributos <code class="text-rose-400">displayName</code>, <code class="text-fuchsia-400">email</code>, <code class="text-amber-400">role</code>, <code class="text-emerald-400">estado</code>, <code class="text-blue-400">registro</code> y <code class="text-zinc-300">acciones</code> comunicadas mediante peticiones REST a Node & Express.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 shrink-0">
          <button
            type="button"
            (click)="reloadUsers()"
            [disabled]="userHttp.isLoading()"
            class="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-bold text-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Recargar desde Node/Express"
          >
            <span class="material-icons text-base" [class.animate-spin]="userHttp.isLoading()">sync</span>
            Recargar
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:opacity-90 text-xs font-bold text-white transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 active:scale-95"
          >
            <span class="material-icons text-base">person_add</span>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- 2. Filtros y Búsqueda -->
      <div class="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-3xl space-y-4">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          <!-- Input Búsqueda -->
          <div class="relative flex-1 max-w-md">
            <span class="material-icons absolute left-3.5 top-2.5 text-zinc-500 text-lg">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por displayName, correo o teléfono..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
            />
            @if (searchQuery) {
              <button
                (click)="searchQuery = ''"
                class="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            }
          </div>

          <!-- Filtros por Rol -->
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <span class="text-[11px] font-bold text-zinc-500 uppercase mr-1">Rol:</span>
            <button
              (click)="selectedRole = 'ALL'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all"
              [ngClass]="selectedRole === 'ALL' ? 'bg-rose-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Todos ({{ userHttp.users().length }})
            </button>
            <button
              (click)="selectedRole = 'ADMIN'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all"
              [ngClass]="selectedRole === 'ADMIN' ? 'bg-rose-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Admins
            </button>
            <button
              (click)="selectedRole = 'BAR_OWNER'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all"
              [ngClass]="selectedRole === 'BAR_OWNER' ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Dueños de Bar
            </button>
            <button
              (click)="selectedRole = 'USER'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all"
              [ngClass]="selectedRole === 'USER' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Clientes
            </button>
          </div>

          <!-- Filtros por Estado -->
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <span class="text-[11px] font-bold text-zinc-500 uppercase mr-1">Estado:</span>
            <select
              [(ngModel)]="selectedEstado"
              class="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

        </div>
      </div>

      <!-- 3. Tabla Principal de Usuarios: displayName, email, role, estado, registro, acciones -->
      <div class="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            
            <!-- Encabezados de Columna -->
            <thead class="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th class="py-4 px-5">displayName (Usuario)</th>
                <th class="py-4 px-5">email</th>
                <th class="py-4 px-5">role</th>
                <th class="py-4 px-5">estado</th>
                <th class="py-4 px-5">registro</th>
                <th class="py-4 px-5 text-right">acciones</th>
              </tr>
            </thead>

            <!-- Cuerpo de la Tabla -->
            <tbody class="divide-y divide-zinc-800/80">
              @if (userHttp.isLoading()) {
                <tr>
                  <td colspan="6" class="p-8 text-center text-zinc-400">
                    <div class="flex items-center justify-center gap-2">
                      <span class="material-icons animate-spin text-rose-500">refresh</span>
                      <span>Consultando datos vía HTTP a Node.js + Express...</span>
                    </div>
                  </td>
                </tr>
              } @else if (filteredUsers().length === 0) {
                <tr>
                  <td colspan="6" class="p-12 text-center text-zinc-500 space-y-2">
                    <span class="material-icons text-3xl text-zinc-600">people_outline</span>
                    <p class="text-sm font-medium text-zinc-400">No se encontraron usuarios con los criterios de búsqueda.</p>
                    <p class="text-xs text-zinc-600">Prueba ajustando el término o crea un nuevo usuario.</p>
                  </td>
                </tr>
              } @else {
                @for (user of filteredUsers(); track user.uid) {
                  <tr class="hover:bg-zinc-800/40 transition-colors group">
                    
                    <!-- 1. displayName -->
                    <td class="py-4 px-5">
                      <div class="flex items-center gap-3">
                        <img
                          [src]="user.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'"
                          [alt]="user.displayName"
                          class="w-10 h-10 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                        />
                        <div class="min-w-0">
                          <span class="font-extrabold text-white text-sm block group-hover:text-rose-400 transition-colors truncate">
                            {{ user.displayName }}
                          </span>
                          <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span>ID: {{ user.uid }}</span>
                            @if (user.phone) {
                              <span>• {{ user.phone }}</span>
                            }
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 2. email -->
                    <td class="py-4 px-5">
                      <div class="flex items-center gap-1.5 font-mono text-zinc-300">
                        <span class="material-icons text-xs text-zinc-500">mail</span>
                        <span class="truncate max-w-[200px]">{{ user.email }}</span>
                      </div>
                    </td>

                    <!-- 3. role -->
                    <td class="py-4 px-5">
                      <div class="inline-flex items-center gap-1">
                        <span
                          class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm"
                          [ngClass]="{
                            'bg-rose-500/15 text-rose-400 border-rose-500/30': user.role === 'ADMIN',
                            'bg-amber-500/15 text-amber-400 border-amber-500/30': user.role === 'BAR_OWNER',
                            'bg-emerald-500/15 text-emerald-400 border-emerald-500/30': user.role === 'USER'
                          }"
                        >
                          {{ user.role === 'ADMIN' ? 'Administrador' : user.role === 'BAR_OWNER' ? 'Dueño de Bar' : 'Cliente' }}
                        </span>
                      </div>
                    </td>

                    <!-- 4. estado -->
                    <td class="py-4 px-5">
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': user.estado === 'ACTIVO',
                          'bg-rose-500/10 text-rose-400 border-rose-500/30': user.estado === 'SUSPENDIDO',
                          'bg-amber-500/10 text-amber-400 border-amber-500/30': user.estado === 'PENDIENTE',
                          'bg-zinc-800 text-zinc-400 border-zinc-700': user.estado === 'INACTIVO'
                        }"
                      >
                        <span
                          class="w-2 h-2 rounded-full"
                          [ngClass]="{
                            'bg-emerald-400 animate-pulse': user.estado === 'ACTIVO',
                            'bg-rose-400': user.estado === 'SUSPENDIDO',
                            'bg-amber-400': user.estado === 'PENDIENTE',
                            'bg-zinc-500': user.estado === 'INACTIVO'
                          }"
                        ></span>
                        {{ user.estado }}
                      </span>
                    </td>

                    <!-- 5. registro -->
                    <td class="py-4 px-5 text-zinc-400 font-mono text-[11px]">
                      <div class="flex items-center gap-1.5">
                        <span class="material-icons text-xs text-zinc-600">calendar_today</span>
                        <span>{{ user.registro }}</span>
                      </div>
                    </td>

                    <!-- 6. acciones -->
                    <td class="py-4 px-5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        
                        <!-- Accion 1: Cambiar Estado rápido -->
                        <button
                          type="button"
                          (click)="toggleUserStatus(user)"
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
                          [title]="user.estado === 'ACTIVO' ? 'Suspender usuario' : 'Activar usuario'"
                        >
                          <span class="material-icons text-base">
                            {{ user.estado === 'ACTIVO' ? 'pause_circle' : 'play_circle' }}
                          </span>
                        </button>

                        <!-- Accion 2: Cambiar Rol rápido -->
                        <button
                          type="button"
                          (click)="cycleUserRole(user)"
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-all"
                          title="Alternar Rol (Admin / Bar Owner / Cliente)"
                        >
                          <span class="material-icons text-base">swap_horiz</span>
                        </button>

                        <!-- Accion 3: Editar en Modal -->
                        <button
                          type="button"
                          (click)="openEditModal(user)"
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-rose-400 transition-all"
                          title="Editar detalles completos"
                        >
                          <span class="material-icons text-base">edit</span>
                        </button>

                        <!-- Accion 4: Eliminar -->
                        <button
                          type="button"
                          (click)="confirmDeleteUser(user)"
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-all"
                          title="Eliminar usuario de Node Express"
                        >
                          <span class="material-icons text-base">delete_outline</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                }
              }
            </tbody>

          </table>
        </div>

        <!-- Table Footer Info -->
        <div class="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <span>Mostrando {{ filteredUsers().length }} de {{ userHttp.users().length }} usuarios registrados</span>
          <span class="font-mono text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Endpoints: GET, POST, PATCH, DELETE en /api/users
          </span>
        </div>
      </div>

      <!-- 4. Modal para Crear / Editar Usuario -->
      @if (showModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            <button
              type="button"
              (click)="closeModal()"
              class="absolute top-5 right-5 text-zinc-500 hover:text-white"
            >
              <span class="material-icons">close</span>
            </button>

            <!-- Modal Header -->
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                <span class="material-icons text-sm">{{ isEditing ? 'edit' : 'person_add' }}</span>
                {{ isEditing ? 'Actualizar Usuario en Node Express' : 'Nuevo Usuario en Node Express' }}
              </div>
              <h3 class="font-heading text-xl font-black text-white">
                {{ isEditing ? 'Editar Atributos del Usuario' : 'Registrar Nuevo Usuario' }}
              </h3>
              <p class="text-xs text-zinc-400">
                Los datos se envían por HTTP al servidor Express interceptados por <code>apiInterceptor</code>.
              </p>
            </div>

            <!-- Form -->
            <form (ngSubmit)="saveUser()" class="space-y-4 text-xs">
              
              <!-- displayName -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">
                  displayName <span class="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.displayName"
                  name="displayName"
                  required
                  placeholder="Ej: Sofia Herrera"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <!-- email -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">
                  email <span class="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  placeholder="Ej: sofia@nocturna.club"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <!-- Grid: role y estado -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- role -->
                <div class="space-y-1.5">
                  <label class="block font-bold text-zinc-300">
                    role <span class="text-rose-400">*</span>
                  </label>
                  <select
                    [(ngModel)]="formData.role"
                    name="role"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="USER">Cliente (USER)</option>
                    <option value="BAR_OWNER">Dueño de Bar (BAR_OWNER)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                  </select>
                </div>

                <!-- estado -->
                <div class="space-y-1.5">
                  <label class="block font-bold text-zinc-300">
                    estado <span class="text-rose-400">*</span>
                  </label>
                  <select
                    [(ngModel)]="formData.estado"
                    name="estado"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>

              </div>

              <!-- Phone -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">Teléfono (Opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  placeholder="+57 300 123 4567"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <!-- Modal Actions -->
              <div class="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!formData.displayName || !formData.email"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:opacity-90 text-white font-extrabold transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span class="material-icons text-sm">save</span>
                  {{ isEditing ? 'Guardar Cambios (PATCH)' : 'Crear Usuario (POST)' }}
                </button>
              </div>

            </form>

          </div>
        </div>
      }

    </div>
  `
})
export class UsuariosComponent implements OnInit {
  public userHttp = inject(UserHttpService);
  private notify = inject(NotificationService);

  public searchQuery = '';
  public selectedRole: 'ALL' | UserRole = 'ALL';
  public selectedEstado: 'ALL' | UserEstado = 'ALL';

  // Modal State
  public showModal = false;
  public isEditing = false;
  public editingUid: string | null = null;

  public formData: {
    displayName: string;
    email: string;
    role: UserRole;
    estado: UserEstado;
    phone: string;
  } = {
    displayName: '',
    email: '',
    role: 'USER',
    estado: 'ACTIVO',
    phone: ''
  };

  ngOnInit() {
    this.reloadUsers();
  }

  public reloadUsers() {
    this.userHttp.loadUsers().subscribe();
  }

  public filteredUsers = computed(() => {
    let list = this.userHttp.users();
    const query = this.searchQuery.trim().toLowerCase();

    if (this.selectedRole !== 'ALL') {
      list = list.filter((u) => u.role === this.selectedRole);
    }

    if (this.selectedEstado !== 'ALL') {
      list = list.filter((u) => u.estado === this.selectedEstado);
    }

    if (query) {
      list = list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone && u.phone.includes(query)) ||
          u.uid.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Action: Toggle Status quickly
  public toggleUserStatus(user: UserProfile) {
    const newEstado: UserEstado = user.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    this.userHttp.updateUser(user.uid, { estado: newEstado }).subscribe();
  }

  // Action: Cycle Role quickly
  public cycleUserRole(user: UserProfile) {
    let newRole: UserRole = 'USER';
    if (user.role === 'USER') newRole = 'BAR_OWNER';
    else if (user.role === 'BAR_OWNER') newRole = 'ADMIN';
    else newRole = 'USER';

    this.userHttp.updateUser(user.uid, { role: newRole }).subscribe();
  }

  // Action: Open Create Modal
  public openCreateModal() {
    this.isEditing = false;
    this.editingUid = null;
    this.formData = {
      displayName: '',
      email: '',
      role: 'USER',
      estado: 'ACTIVO',
      phone: ''
    };
    this.showModal = true;
  }

  // Action: Open Edit Modal
  public openEditModal(user: UserProfile) {
    this.isEditing = true;
    this.editingUid = user.uid;
    this.formData = {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      estado: user.estado,
      phone: user.phone || ''
    };
    this.showModal = true;
  }

  public closeModal() {
    this.showModal = false;
  }

  // Action: Save Create / Edit
  public saveUser() {
    if (!this.formData.displayName || !this.formData.email) return;

    if (this.isEditing && this.editingUid) {
      this.userHttp.updateUser(this.editingUid, {
        displayName: this.formData.displayName,
        email: this.formData.email,
        role: this.formData.role,
        estado: this.formData.estado,
        phone: this.formData.phone
      }).subscribe(() => {
        this.closeModal();
      });
    } else {
      this.userHttp.createUser({
        displayName: this.formData.displayName,
        email: this.formData.email,
        role: this.formData.role,
        estado: this.formData.estado,
        phone: this.formData.phone
      }).subscribe(() => {
        this.closeModal();
      });
    }
  }

  // Action: Delete user
  public confirmDeleteUser(user: UserProfile) {
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.displayName}" del servidor Node Express?`)) {
      this.userHttp.deleteUser(user.uid).subscribe();
    }
  }
}
