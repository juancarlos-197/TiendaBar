import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserHttpService } from '../../services/user-http.service';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';
import { UserRecord, UserRole } from '../../models/types';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Top Title & Main Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Lista de Usuarios</span>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                {{ combinedUsers().length }} usuarios
              </span>
            </h1>
            <!-- HTTP Badge -->
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              HTTP Client Activo
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Gestión de usuarios con atributos <code class="text-amber-300 font-mono">displayName</code>, <code class="text-amber-300 font-mono">email</code> y <code class="text-amber-300 font-mono">role</code> conectados mediante protocolo HTTP REST.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            (click)="reloadViaHttp()"
            [disabled]="httpService.isLoading()"
            class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
            <span class="material-icons text-sm" [class.animate-spin]="httpService.isLoading()">refresh</span>
            <span>Recargar vía HTTP</span>
          </button>

          <button
            type="button"
            (click)="showJsonModal.set(true)"
            class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-sm">
            <span class="material-icons text-sm">data_object</span>
            <span>Ver JSON HTTP</span>
          </button>

          <button
            type="button"
            (click)="showCreateUserModal.set(true)"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
            <span class="material-icons text-base">person_add</span>
            <span>Nuevo Usuario (HTTP POST)</span>
          </button>
        </div>
      </div>

      <!-- HTTP Status & Telemetry Banner -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span class="material-icons text-xl">http</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-200">Endpoint HTTP:</span>
                <span class="font-mono text-xs text-amber-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  GET /api/users
                </span>
                @if (httpService.lastHttpLog(); as log) {
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {{ log.status }} {{ log.statusText }} ({{ log.durationMs }} ms)
                  </span>
                }
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Provee la lista reactiva de usuarios mapeada con Angular <code class="text-slate-300">HttpClient</code>.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- View Mode Switcher -->
            <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                (click)="viewMode.set('table')"
                [class.bg-amber-500]="viewMode() === 'table'"
                [class.text-slate-950]="viewMode() === 'table'"
                [class.text-slate-400]="viewMode() !== 'table'"
                class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5">
                <span class="material-icons text-xs">table_chart</span>
                <span>Tabla</span>
              </button>
              <button
                type="button"
                (click)="viewMode.set('grid')"
                [class.bg-amber-500]="viewMode() === 'grid'"
                [class.text-slate-950]="viewMode() === 'grid'"
                [class.text-slate-400]="viewMode() !== 'grid'"
                class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5">
                <span class="material-icons text-xs">grid_view</span>
                <span>Tarjetas</span>
              </button>
            </div>

            <!-- Reset to defaults button -->
            <button
              type="button"
              (click)="resetUsersDefaults()"
              title="Restablecer usuarios de prueba vía HTTP POST /api/users/reset"
              class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all">
              <span class="material-icons text-xs">restart_alt</span>
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:max-w-md">
          <span class="material-icons absolute left-3.5 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por displayName, email o role..."
            class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all">
        </div>

        <div class="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span class="text-xs text-slate-400 font-medium">Filtrar por rol:</span>
          <select
            [(ngModel)]="selectedRoleFilter"
            class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium">
            <option value="all">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="operador">Operador</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
      </div>

      <!-- MAIN USERS LIST: TABLE VIEW -->
      @if (viewMode() === 'table') {
        <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th class="py-3.5 px-5">Usuario (displayName)</th>
                  <th class="py-3.5 px-5">Correo Electrónico (email)</th>
                  <th class="py-3.5 px-5">Rol Asignado (role)</th>
                  <th class="py-3.5 px-5 hidden md:table-cell">Préstamos</th>
                  <th class="py-3.5 px-5 hidden lg:table-cell">ID de Sistema</th>
                  <th class="py-3.5 px-5 text-right">Acciones HTTP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80 text-xs">
                @if (filteredUsers().length === 0) {
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-500">
                      <span class="material-icons text-4xl text-slate-600 block mb-2">person_search</span>
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                } @else {
                  @for (user of filteredUsers(); track user.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      
                      <!-- displayName -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center font-bold text-sm shadow shrink-0 overflow-hidden">
                            @if (user.photoURL) {
                              <img [src]="user.photoURL" [alt]="user.displayName" class="w-full h-full object-cover">
                            } @else {
                              <span>{{ getInitial(user.displayName) }}</span>
                            }
                          </div>
                          <div>
                            <div class="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{{ user.displayName }}</span>
                              @if (user.role === 'admin') {
                                <span class="material-icons text-amber-400 text-xs" title="Administrador">verified</span>
                              }
                            </div>
                            <span class="text-[11px] text-slate-400 font-mono">{{ user.displayName }}</span>
                          </div>
                        </div>
                      </td>

                      <!-- email -->
                      <td class="py-3.5 px-5 font-mono text-slate-300">
                        <div class="flex items-center gap-1.5">
                          <span class="material-icons text-slate-500 text-xs">mail</span>
                          <span class="hover:text-amber-400 cursor-pointer">{{ user.email }}</span>
                        </div>
                      </td>

                      <!-- role -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1"
                            [class.bg-amber-500/20]="user.role === 'admin'"
                            [class.text-amber-300]="user.role === 'admin'"
                            [class.border-amber-500/30]="user.role === 'admin'"
                            [class.bg-blue-500/20]="user.role === 'operador'"
                            [class.text-blue-300]="user.role === 'operador'"
                            [class.border-blue-500/30]="user.role === 'operador'"
                            [class.bg-emerald-500/20]="user.role === 'cliente'"
                            [class.text-emerald-300]="user.role === 'cliente'"
                            [class.border-emerald-500/30]="user.role === 'cliente'">
                            <span class="w-1.5 h-1.5 rounded-full"
                              [class.bg-amber-400]="user.role === 'admin'"
                              [class.bg-blue-400]="user.role === 'operador'"
                              [class.bg-emerald-400]="user.role === 'cliente'"></span>
                            {{ user.role }}
                          </span>

                          <!-- Inline quick role selector via HTTP PUT -->
                          <select
                            [ngModel]="user.role"
                            (ngModelChange)="changeUserRoleViaHttp(user, $event)"
                            title="Cambiar rol (HTTP PUT)"
                            class="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer">
                            <option value="admin">admin</option>
                            <option value="operador">operador</option>
                            <option value="cliente">cliente</option>
                          </select>
                        </div>
                      </td>

                      <!-- Loans count -->
                      <td class="py-3.5 px-5 hidden md:table-cell text-slate-400">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
                          <span class="material-icons text-xs text-amber-400">assignment</span>
                          {{ getLoanCountForUser(user.id) }} préstamos
                        </span>
                      </td>

                      <!-- ID -->
                      <td class="py-3.5 px-5 hidden lg:table-cell text-slate-500 font-mono text-[10px]">
                        {{ user.id }}
                      </td>

                      <!-- Actions -->
                      <td class="py-3.5 px-5 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            (click)="openEditModal(user)"
                            title="Editar usuario (HTTP PUT)"
                            class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                            <span class="material-icons text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            (click)="confirmDeleteUserViaHttp(user)"
                            title="Eliminar usuario (HTTP DELETE)"
                            class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <span class="material-icons text-sm">delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <!-- MAIN USERS LIST: GRID VIEW -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @if (filteredUsers().length === 0) {
            <div class="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
              <span class="material-icons text-5xl text-slate-600 mb-2">group_off</span>
              <h3 class="text-base font-bold text-white mb-1">No hay usuarios encontrados</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                No se encontraron usuarios que coincidan con la búsqueda.
              </p>
            </div>
          } @else {
            @for (user of filteredUsers(); track user.id) {
              <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
                
                <!-- Header with Avatar & Details -->
                <div class="flex items-start gap-3.5">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center font-bold text-lg shadow shrink-0 overflow-hidden">
                    @if (user.photoURL) {
                      <img [src]="user.photoURL" [alt]="user.displayName" class="w-full h-full object-cover">
                    } @else {
                      <span>{{ getInitial(user.displayName) }}</span>
                    }
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <h3 class="text-sm font-bold text-white truncate">{{ user.displayName }}</h3>
                      @if (user.role === 'admin') {
                        <span class="material-icons text-amber-400 text-xs">verified</span>
                      }
                    </div>
                    <p class="text-xs text-slate-400 truncate font-mono">{{ user.email }}</p>
                    
                    <div class="flex items-center gap-2 mt-2">
                      <span 
                        class="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full"
                        [class.bg-amber-500/20]="user.role === 'admin'"
                        [class.text-amber-300]="user.role === 'admin'"
                        [class.border]="true"
                        [class.border-amber-500/30]="user.role === 'admin'"
                        [class.bg-blue-500/20]="user.role === 'operador'"
                        [class.text-blue-300]="user.role === 'operador'"
                        [class.border-blue-500/30]="user.role === 'operador'"
                        [class.bg-emerald-500/20]="user.role === 'cliente'"
                        [class.text-emerald-300]="user.role === 'cliente'"
                        [class.border-emerald-500/30]="user.role === 'cliente'">
                        {{ user.role }}
                      </span>

                      <span class="text-[10px] text-slate-500 font-medium">
                        {{ getLoanCountForUser(user.id) }} préstamos
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Role Selector & Actions via HTTP -->
                <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="text-slate-400 text-[11px]">Rol:</span>
                    <select
                      [ngModel]="user.role"
                      (ngModelChange)="changeUserRoleViaHttp(user, $event)"
                      class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-medium">
                      <option value="admin">admin</option>
                      <option value="operador">operador</option>
                      <option value="cliente">cliente</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="openEditModal(user)"
                      title="Editar usuario (HTTP PUT)"
                      class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors">
                      <span class="material-icons text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      (click)="confirmDeleteUserViaHttp(user)"
                      title="Eliminar usuario (HTTP DELETE)"
                      class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <span class="material-icons text-base">delete_outline</span>
                    </button>
                  </div>
                </div>

              </div>
            }
          }
        </div>
      }

      <!-- Modal para Registrar Nuevo Usuario vía HTTP POST -->
      @if (showCreateUserModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            (click)="$event.stopPropagation()"
            class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-400">person_add</span>
                <h3 class="text-lg font-bold text-white">
                  {{ isEditingUser() ? 'Editar Usuario' : 'Nuevo Usuario' }}
                </h3>
              </div>
              <button
                type="button"
                (click)="closeUserModal()"
                class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                <span class="material-icons text-base">close</span>
              </button>
            </div>

            <!-- HTTP Endpoint notification badge -->
            <div class="mb-4 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
              <span class="text-slate-400">Operación:</span>
              <span class="font-mono text-amber-400 font-bold">
                {{ isEditingUser() ? 'PUT /api/users/' + editingUserId() : 'POST /api/users' }}
              </span>
            </div>

            <form (ngSubmit)="handleSaveUserSubmit()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Completo (displayName) *
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.displayName"
                  name="displayName"
                  required
                  placeholder="Ej. Laura González"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico (email) *
                </label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  placeholder="laura@ejemplo.com"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-xs">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Rol Asignado (role) *
                </label>
                <select
                  [(ngModel)]="formData.role"
                  name="role"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="cliente">cliente (Prestatario / Cliente habitual)</option>
                  <option value="operador">operador (Gestión de préstamos y stock)</option>
                  <option value="admin">admin (Control total administrativo)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono de Contacto (opcional)
                </label>
                <input
                  type="tel"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  placeholder="+34 600 000 000"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500">
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  (click)="closeUserModal()"
                  class="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="httpService.isLoading()"
                  class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50">
                  <span class="material-icons text-sm" [class.animate-spin]="httpService.isLoading()">send</span>
                  <span>{{ isEditingUser() ? 'Actualizar (PUT)' : 'Crear Usuario (POST)' }}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- Modal para Inspección de Respuesta JSON HTTP -->
      @if (showJsonModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            (click)="$event.stopPropagation()"
            class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative text-white flex flex-col max-h-[85vh]">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span class="material-icons text-base">code</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white">Respuesta HTTP REST (/api/users)</h3>
                  <p class="text-[11px] text-slate-400">Carga útil con estructura displayName, email y role</p>
                </div>
              </div>
              <button
                type="button"
                (click)="showJsonModal.set(false)"
                class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                <span class="material-icons text-base">close</span>
              </button>
            </div>

            <!-- Code viewer with syntax highlight feel -->
            <div class="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-amber-300">
              <pre class="whitespace-pre-wrap">{{ httpService.rawJsonResponse() || jsonPlaceholder() }}</pre>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-800 mt-4 text-xs">
              <span class="text-slate-400">
                Petición: <span class="text-amber-400 font-mono">GET /api/users</span>
              </span>
              <button
                type="button"
                (click)="showJsonModal.set(false)"
                class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                Cerrar
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class UsersComponent implements OnInit {
  public httpService = inject(UserHttpService);
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public searchQuery = '';
  public selectedRoleFilter: 'all' | 'admin' | 'operador' | 'cliente' = 'all';
  public viewMode = signal<'table' | 'grid'>('table');

  public showCreateUserModal = signal<boolean>(false);
  public showJsonModal = signal<boolean>(false);
  public isEditingUser = signal<boolean>(false);
  public editingUserId = signal<string>('');

  public formData = {
    displayName: '',
    email: '',
    role: 'cliente' as UserRole,
    phone: '',
  };

  ngOnInit() {
    // Initial fetch via HTTP
    this.httpService.loadUsers();
  }

  /**
   * Combined list of users from HTTP service and Firestore
   */
  public combinedUsers = computed<UserRecord[]>(() => {
    const httpList = this.httpService.httpUsers();
    const firestoreList = this.firebaseService.users();

    if (httpList.length === 0) {
      return firestoreList;
    }

    // Merge without duplicates by ID or email
    const mergedMap = new Map<string, UserRecord>();
    for (const u of httpList) {
      mergedMap.set(u.id, u);
    }
    for (const u of firestoreList) {
      if (!mergedMap.has(u.id)) {
        mergedMap.set(u.id, u);
      }
    }
    return Array.from(mergedMap.values());
  });

  public filteredUsers = computed(() => {
    let list = this.combinedUsers();
    const q = this.searchQuery.trim().toLowerCase();
    const roleFilter = this.selectedRoleFilter;

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (q) {
      list = list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      );
    }
    return list;
  });

  public getInitial(name: string): string {
    return name && name.trim() ? name.trim()[0].toUpperCase() : 'U';
  }

  public getLoanCountForUser(userId: string): number {
    return this.firebaseService.loans().filter((l) => l.userId === userId).length;
  }

  public jsonPlaceholder(): string {
    return JSON.stringify(
      {
        success: true,
        protocol: 'HTTP/REST',
        count: this.combinedUsers().length,
        users: this.combinedUsers().map((u) => ({
          displayName: u.displayName,
          email: u.email,
          role: u.role,
        })),
      },
      null,
      2
    );
  }

  public reloadViaHttp() {
    this.httpService.getUsers().subscribe({
      next: (res) => {
        this.toastService.success(
          'HTTP GET 200 OK',
          `Se obtuvieron ${res.users.length} usuarios con displayName, email y role.`
        );
      },
      error: (err) => {
        this.toastService.error('Error HTTP GET', err?.message || 'Fallo en la conexión');
      },
    });
  }

  public resetUsersDefaults() {
    this.httpService.resetToDefaults().subscribe({
      next: () => {
        this.toastService.info('Usuarios Restablecidos', 'Lista restablecida con usuarios demo vía HTTP POST.');
      },
      error: (err) => {
        this.toastService.error('Error al restablecer', err?.message);
      },
    });
  }

  public openEditModal(user: UserRecord) {
    this.isEditingUser.set(true);
    this.editingUserId.set(user.id);
    this.formData = {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    };
    this.showCreateUserModal.set(true);
  }

  public closeUserModal() {
    this.showCreateUserModal.set(false);
    this.isEditingUser.set(false);
    this.editingUserId.set('');
    this.formData = {
      displayName: '',
      email: '',
      role: 'cliente',
      phone: '',
    };
  }

  public handleSaveUserSubmit() {
    if (!this.formData.displayName.trim() || !this.formData.email.trim()) {
      this.toastService.warning('Datos incompletos', 'Ingresa displayName y email válidos.');
      return;
    }

    if (this.isEditingUser()) {
      const id = this.editingUserId();
      this.httpService
        .updateUser(id, {
          displayName: this.formData.displayName.trim(),
          email: this.formData.email.trim().toLowerCase(),
          role: this.formData.role,
          phone: this.formData.phone.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.toastService.success(
              'HTTP PUT 200 OK',
              `Usuario ${res.user.displayName} (${res.user.role}) actualizado con éxito.`
            );
            this.closeUserModal();
          },
          error: (err) => {
            this.toastService.error('Error HTTP PUT', err?.message || 'No se pudo actualizar.');
          },
        });
    } else {
      // POST new user
      this.httpService
        .createUser({
          displayName: this.formData.displayName.trim(),
          email: this.formData.email.trim().toLowerCase(),
          role: this.formData.role,
          phone: this.formData.phone.trim() || undefined,
        })
        .subscribe({
          next: async (res) => {
            this.toastService.success(
              'HTTP POST 201 Created',
              `Usuario ${res.user.displayName} creado con rol ${res.user.role}.`
            );

            // Also mirror to Firestore if DB is available
            try {
              if (this.firebaseService.db) {
                const { setDoc, doc } = await import('firebase/firestore');
                await setDoc(doc(this.firebaseService.db, 'users', res.user.id), res.user);
              }
            } catch (fsErr) {
              console.warn('Firestore mirror note:', fsErr);
            }

            this.closeUserModal();
          },
          error: (err) => {
            this.toastService.error('Error HTTP POST', err?.message || 'No se pudo crear.');
          },
        });
    }
  }

  public changeUserRoleViaHttp(user: UserRecord, newRole: UserRole) {
    if (user.role === newRole) return;

    this.httpService.updateUserRole(user.id, newRole).subscribe({
      next: async () => {
        this.toastService.success(
          'HTTP PATCH 200 OK',
          `El rol de ${user.displayName} ahora es "${newRole}".`
        );

        // Also update Firestore role if exists
        try {
          if (this.firebaseService.db) {
            await this.firebaseService.updateUserRole(user.id, newRole);
          }
        } catch {
          // Handled or non-blocking
        }
      },
      error: (err) => {
        this.toastService.error('Error al actualizar rol', err?.message);
      },
    });
  }

  public confirmDeleteUserViaHttp(user: UserRecord) {
    if (confirm(`¿Eliminar al usuario ${user.displayName} (${user.email}) mediante HTTP DELETE?`)) {
      this.httpService.deleteUser(user.id).subscribe({
        next: async () => {
          this.toastService.success(
            'HTTP DELETE 200 OK',
            `Usuario ${user.displayName} eliminado de la lista.`
          );

          try {
            if (this.firebaseService.db) {
              await this.firebaseService.deleteUser(user.id);
            }
          } catch {
            // Handled or non-blocking
          }
        },
        error: (err) => {
          this.toastService.error('Error HTTP DELETE', err?.message);
        },
      });
    }
  }
}
