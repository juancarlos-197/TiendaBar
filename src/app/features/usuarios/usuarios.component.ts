import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, UserRole, UserEstado } from '../../core/models/user.model';
import { UserFirestoreService, EJEMPLOS_USUARIOS_FIRESTORE } from '../../core/services/user-firestore.service';
import { UserHttpService } from '../../core/services/user-http.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-24 max-w-7xl mx-auto">
      
      <!-- 1. Header con Indicadores Cloud Firestore & Node Express -->
      <div class="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <span class="material-icons text-sm">security</span>
                Panel Administrativo
              </span>

              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                Base de Datos No Relacional (Cloud Firestore)
              </span>

              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                <span class="material-icons text-xs">dns</span>
                Node.js + Express (AngularNode)
              </span>
            </div>

            <h1 class="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Gestión de Usuarios con Cloud Firestore
            </h1>
            <p class="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Base de datos no relacional sincronizada en tiempo real mediante la colección <code class="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">users</code>. Gestiona y filtra atributos: <code class="text-rose-400">displayName</code>, <code class="text-fuchsia-400">email</code>, <code class="text-amber-400">role</code>, <code class="text-emerald-400">estado</code>, <code class="text-blue-400">registro</code> y <code class="text-zinc-300">acciones</code>.
            </p>
          </div>

          <!-- Botones de Acción Superior -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Botón Cargar Ejemplos en Firestore -->
            <button
              type="button"
              (click)="seedEjemplosFirestore()"
              [disabled]="userFirestore.isLoading()"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Poblar la colección 'users' de Firestore con datos de prueba realistas"
            >
              <span class="material-icons text-base">auto_fix_high</span>
              Cargar Ejemplos en Firestore
            </button>

            <!-- Botón Nuevo Usuario -->
            <button
              type="button"
              (click)="openCreateModal()"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:opacity-90 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 active:scale-95"
            >
              <span class="material-icons text-base">person_add</span>
              Nuevo Usuario
            </button>
          </div>
        </div>

        <!-- Barra de Estado / Origen de Datos -->
        <div class="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div class="flex items-center gap-2">
            <span class="text-zinc-500">Origen de Datos Activo:</span>
            <div class="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-bold">
              <button
                type="button"
                (click)="switchSource('FIRESTORE')"
                class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5"
                [ngClass]="activeSource === 'FIRESTORE' ? 'bg-amber-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'"
              >
                <span class="material-icons text-xs">cloud_done</span>
                Firestore NoSQL (En Vivo)
              </button>
              <button
                type="button"
                (click)="switchSource('NODE_EXPRESS')"
                class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5"
                [ngClass]="activeSource === 'NODE_EXPRESS' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
              >
                <span class="material-icons text-xs">dns</span>
                Node.js Express (HTTP)
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>Documentos: <strong class="text-white">{{ activeUsersList().length }}</strong></span>
            <span>•</span>
            <span class="text-amber-400 font-bold">Colección: 'users'</span>
          </div>
        </div>
      </div>

      <!-- 2. Ejemplos Rápidos Destacados (Cards de Acceso Rápido) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-icons text-amber-400 text-base">stars</span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Muestrario de Ejemplos Preconfigurados
            </h3>
          </div>
          <span class="text-[11px] text-zinc-500">
            Haz clic en un ejemplo para cargarlo o filtrarlo en la tabla
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          @for (ejemplo of ejemplosDisponibles; track ejemplo.uid) {
            <button
              type="button"
              (click)="quickFilterUser(ejemplo)"
              class="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/50 text-left transition-all group flex flex-col items-center text-center space-y-1.5 shadow-sm"
              [title]="'Filtrar por ' + ejemplo.displayName"
            >
              <img
                [src]="ejemplo.photoUrl"
                [alt]="ejemplo.displayName"
                class="w-10 h-10 rounded-xl object-cover bg-zinc-950 border border-zinc-800 group-hover:scale-105 transition-transform"
              />
              <div class="w-full">
                <span class="text-[11px] font-bold text-white block truncate leading-tight group-hover:text-amber-300">
                  {{ ejemplo.displayName.split(' ')[0] }}
                </span>
                <span
                  class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                  [ngClass]="{
                    'bg-rose-500/20 text-rose-400': ejemplo.role === 'ADMIN',
                    'bg-amber-500/20 text-amber-400': ejemplo.role === 'BAR_OWNER',
                    'bg-emerald-500/20 text-emerald-400': ejemplo.role === 'USER'
                  }"
                >
                  {{ ejemplo.role }}
                </span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- 3. Filtros y Búsqueda -->
      <div class="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-3xl space-y-4">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          <!-- Input Búsqueda -->
          <div class="relative flex-1 max-w-md">
            <span class="material-icons absolute left-3.5 top-2.5 text-zinc-500 text-lg">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por displayName, correo o teléfono..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
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
              class="px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
              [ngClass]="selectedRole === 'ALL' ? 'bg-amber-500 text-zinc-950 font-black shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Todos ({{ activeUsersList().length }})
            </button>
            <button
              (click)="selectedRole = 'ADMIN'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
              [ngClass]="selectedRole === 'ADMIN' ? 'bg-rose-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Admins
            </button>
            <button
              (click)="selectedRole = 'BAR_OWNER'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
              [ngClass]="selectedRole === 'BAR_OWNER' ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Dueños de Bar
            </button>
            <button
              (click)="selectedRole = 'USER'"
              class="px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
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
              class="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
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

      <!-- 4. Tabla Principal: displayName, email, role, estado, registro, acciones -->
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
              @if (isLoading()) {
                <tr>
                  <td colspan="6" class="p-10 text-center text-zinc-400">
                    <div class="flex items-center justify-center gap-2">
                      <span class="material-icons animate-spin text-amber-400">refresh</span>
                      <span>Sincronizando con Cloud Firestore NoSQL...</span>
                    </div>
                  </td>
                </tr>
              } @else if (filteredUsers().length === 0) {
                <tr>
                  <td colspan="6" class="p-12 text-center text-zinc-500 space-y-3">
                    <span class="material-icons text-4xl text-zinc-600">people_outline</span>
                    <p class="text-sm font-semibold text-zinc-300">No hay usuarios en la base de datos que coincidan con la búsqueda.</p>
                    <div>
                      <button
                        (click)="seedEjemplosFirestore()"
                        class="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-extrabold text-xs shadow-md hover:bg-amber-400 transition-all inline-flex items-center gap-1.5"
                      >
                        <span class="material-icons text-sm">auto_fix_high</span>
                        Cargar Ejemplos en Firestore
                      </button>
                    </div>
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
                          class="w-10 h-10 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 shrink-0 group-hover:border-amber-500/40 transition-colors"
                        />
                        <div class="min-w-0">
                          <span class="font-extrabold text-white text-sm block group-hover:text-amber-400 transition-colors truncate">
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

                        <!-- Accion 2: Alternar Rol rápido -->
                        <button
                          type="button"
                          (click)="cycleUserRole(user)"
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-all"
                          title="Alternar Rol (Admin / Dueño de Bar / Cliente)"
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
                          title="Eliminar usuario"
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
          <span>Mostrando {{ filteredUsers().length }} de {{ activeUsersList().length }} usuarios</span>
          <span class="font-mono text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Firestore: Colección 'users' sincronizada en tiempo real
          </span>
        </div>
      </div>

      <!-- 5. Modal para Crear / Editar Usuario -->
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
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span class="material-icons text-sm">{{ isEditing ? 'edit' : 'person_add' }}</span>
                {{ isEditing ? 'Editar en Cloud Firestore NoSQL' : 'Nuevo Usuario en Cloud Firestore' }}
              </div>
              <h3 class="font-heading text-xl font-black text-white">
                {{ isEditing ? 'Editar Atributos del Usuario' : 'Registrar Nuevo Usuario' }}
              </h3>
              <p class="text-xs text-zinc-400">
                Se guardará inmediatamente en la colección <code class="text-amber-400">users</code> de Firestore.
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
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
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
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
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
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
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
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
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
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span class="material-icons text-sm">cloud_upload</span>
                  {{ isEditing ? 'Actualizar en Firestore' : 'Guardar en Firestore' }}
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
  public userFirestore = inject(UserFirestoreService);
  public userHttp = inject(UserHttpService);
  private notify = inject(NotificationService);

  public activeSource: 'FIRESTORE' | 'NODE_EXPRESS' = 'FIRESTORE';
  public ejemplosDisponibles = EJEMPLOS_USUARIOS_FIRESTORE;

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
    this.userFirestore.initFirestoreSync();
    this.userHttp.loadUsers().subscribe();
  }

  public activeUsersList = computed(() => {
    return this.activeSource === 'FIRESTORE'
      ? this.userFirestore.users()
      : this.userHttp.users();
  });

  public isLoading = computed(() => {
    return this.activeSource === 'FIRESTORE'
      ? this.userFirestore.isLoading()
      : this.userHttp.isLoading();
  });

  public filteredUsers = computed(() => {
    let list = this.activeUsersList();
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

  public switchSource(source: 'FIRESTORE' | 'NODE_EXPRESS') {
    this.activeSource = source;
    if (source === 'FIRESTORE') {
      this.notify.info('Visualizando datos en tiempo real de Cloud Firestore (NoSQL)');
    } else {
      this.userHttp.loadUsers().subscribe();
      this.notify.info('Visualizando datos del servidor Node.js + Express (HTTP REST)');
    }
  }

  // Seed examples directly into Firestore
  public seedEjemplosFirestore() {
    this.userFirestore.seedExampleUsers(true);
  }

  // Quick filter by clicking an example chip
  public quickFilterUser(ejemplo: UserProfile) {
    this.searchQuery = ejemplo.displayName;
  }

  // Action: Toggle Status quickly
  public toggleUserStatus(user: UserProfile) {
    const newEstado: UserEstado = user.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    if (this.activeSource === 'FIRESTORE') {
      this.userFirestore.updateUser(user.uid, { estado: newEstado });
    } else {
      this.userHttp.updateUser(user.uid, { estado: newEstado }).subscribe();
    }
  }

  // Action: Cycle Role quickly
  public cycleUserRole(user: UserProfile) {
    let newRole: UserRole = 'USER';
    if (user.role === 'USER') newRole = 'BAR_OWNER';
    else if (user.role === 'BAR_OWNER') newRole = 'ADMIN';
    else newRole = 'USER';

    if (this.activeSource === 'FIRESTORE') {
      this.userFirestore.updateUser(user.uid, { role: newRole });
    } else {
      this.userHttp.updateUser(user.uid, { role: newRole }).subscribe();
    }
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
      if (this.activeSource === 'FIRESTORE') {
        this.userFirestore.updateUser(this.editingUid, {
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        });
        this.closeModal();
      } else {
        this.userHttp.updateUser(this.editingUid, {
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        }).subscribe(() => {
          this.closeModal();
        });
      }
    } else {
      if (this.activeSource === 'FIRESTORE') {
        this.userFirestore.createUser({
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        });
        this.closeModal();
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
  }

  // Action: Delete user
  public confirmDeleteUser(user: UserProfile) {
    const targetDb = this.activeSource === 'FIRESTORE' ? 'Cloud Firestore NoSQL' : 'Node Express';
    if (confirm(`¿Estás seguro de eliminar a "${user.displayName}" de ${targetDb}?`)) {
      if (this.activeSource === 'FIRESTORE') {
        this.userFirestore.deleteUser(user.uid);
      } else {
        this.userHttp.deleteUser(user.uid).subscribe();
      }
    }
  }
}
