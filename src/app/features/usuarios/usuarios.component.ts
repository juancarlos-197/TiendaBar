import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, UserRole, UserEstado } from '../../core/models/user.model';
import { UserMysqlService, MysqlUser } from '../../core/services/user-mysql.service';
import { UserFirestoreService, EJEMPLOS_USUARIOS_FIRESTORE } from '../../core/services/user-firestore.service';
import { UserHttpService } from '../../core/services/user-http.service';
import { NotificationService } from '../../core/services/notification.service';

type DatabaseMode = 'MYSQL_RELATIONAL' | 'FIRESTORE' | 'NODE_EXPRESS';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-24 max-w-7xl mx-auto">
      
      <!-- 1. Header con Indicadores de Base de Datos -->
      <div class="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <span class="material-icons text-sm">security</span>
                Panel Administrativo
              </span>

              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Base de Datos Relacional (MySQL / InnoDB)
              </span>

              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <span class="material-icons text-xs">storage</span>
                NoSQL (Cloud Firestore)
              </span>
            </div>

            <h1 class="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Gestión de Usuarios con Base de Datos Relacional MySQL</span>
            </h1>
            <p class="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              Estructura normalizada en tablas relacionales (<code class="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">usuarios</code>, <code class="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">roles</code>, <code class="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">estados</code> y <code class="text-fuchsia-400 font-bold bg-fuchsia-950/60 px-1.5 py-0.5 rounded border border-fuchsia-800">bares_afiliados</code>) con claves foráneas (<code class="text-cyan-300">FK</code>) y consultas <code class="text-cyan-400 font-mono">INNER JOIN</code>.
            </p>
          </div>

          <!-- Botones de Acción Superior -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Botón Cargar Ejemplos en MySQL -->
            <button
              type="button"
              (click)="seedEjemplos()"
              [disabled]="isLoading()"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Poblar las tablas relacionales de MySQL con 8 usuarios de ejemplo y sus claves foráneas"
            >
              <span class="material-icons text-base">cloud_sync</span>
              Cargar Ejemplos en MySQL
            </button>

            <!-- Ver Esquema SQL & Consultas DDL -->
            <button
              type="button"
              (click)="showSqlModal = true"
              class="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-cyan-300 font-bold text-xs transition-all flex items-center gap-2"
              title="Ver el script DDL (CREATE TABLE, FOREIGN KEYS) y la última consulta SELECT JOIN ejecutada"
            >
              <span class="material-icons text-base text-cyan-400">code</span>
              Esquema DDL & SQL
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

        <!-- Selector de Motor de Base de Datos -->
        <div class="pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-zinc-500 font-bold">Motor de Base de Datos:</span>
            <div class="inline-flex p-1 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-bold">
              
              <!-- Tab 1: MySQL Relacional -->
              <button
                type="button"
                (click)="switchMode('MYSQL_RELATIONAL')"
                class="px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                [ngClass]="activeMode === 'MYSQL_RELATIONAL' ? 'bg-cyan-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'"
              >
                <span class="material-icons text-xs">table_view</span>
                MySQL Relacional (SQL / JOIN)
              </button>

              <!-- Tab 2: Firestore NoSQL -->
              <button
                type="button"
                (click)="switchMode('FIRESTORE')"
                class="px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                [ngClass]="activeMode === 'FIRESTORE' ? 'bg-amber-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'"
              >
                <span class="material-icons text-xs">cloud_done</span>
                Firestore NoSQL (Colección)
              </button>

              <!-- Tab 3: Node Express REST -->
              <button
                type="button"
                (click)="switchMode('NODE_EXPRESS')"
                class="px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                [ngClass]="activeMode === 'NODE_EXPRESS' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
              >
                <span class="material-icons text-xs">dns</span>
                Node Express (REST)
              </button>

            </div>
          </div>

          <div class="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>Registros: <strong class="text-white">{{ displayUsers().length }}</strong></span>
            <span>•</span>
            <span [ngClass]="activeMode === 'MYSQL_RELATIONAL' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'">
              {{ activeMode === 'MYSQL_RELATIONAL' ? 'Tablas: usuarios ⨝ roles ⨝ estados' : activeMode === 'FIRESTORE' ? "Colección: 'users'" : 'Array Express' }}
            </span>
          </div>
        </div>

        <!-- Consulta SQL Ejecutada en Tiempo Real (Banner interactivo) -->
        @if (activeMode === 'MYSQL_RELATIONAL' && userMysql.lastQuery()) {
          <div class="p-3 bg-zinc-950/90 border border-cyan-900/40 rounded-2xl flex items-center justify-between gap-3 text-[11px] font-mono">
            <div class="flex items-center gap-2 text-cyan-300 min-w-0">
              <span class="material-icons text-xs text-cyan-400 shrink-0">terminal</span>
              <span class="text-zinc-500 shrink-0">Última Consulta SQL:</span>
              <span class="truncate text-cyan-200">{{ userMysql.lastQuery() }}</span>
            </div>
            <button
              (click)="showSqlModal = true"
              class="text-xs text-cyan-400 hover:underline shrink-0 font-bold"
            >
              Ver Consulta Completa →
            </button>
          </div>
        }
      </div>

      <!-- 2. Galería de Ejemplos Relacionales -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-icons text-cyan-400 text-base">hub</span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Ejemplos Relacionales Preconfigurados (Con Claves Foráneas)
            </h3>
          </div>
          <span class="text-[11px] text-zinc-500">
            Haz clic en un ejemplo para filtrar la tabla
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          @for (ejemplo of ejemplosRapidos; track ejemplo.uid) {
            <button
              type="button"
              (click)="searchQuery = ejemplo.displayName"
              class="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/50 text-left transition-all group flex flex-col items-center text-center space-y-1.5 shadow-sm"
              [title]="'Filtrar por ' + ejemplo.displayName"
            >
              <img
                [src]="ejemplo.photoUrl"
                [alt]="ejemplo.displayName"
                class="w-10 h-10 rounded-xl object-cover bg-zinc-950 border border-zinc-800 group-hover:scale-105 transition-transform"
              />
              <div class="w-full">
                <span class="text-[11px] font-bold text-white block truncate leading-tight group-hover:text-cyan-300">
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
              class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all"
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
              [ngClass]="selectedRole === 'ALL' ? 'bg-cyan-500 text-zinc-950 font-black shadow-md' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'"
            >
              Todos ({{ displayUsers().length }})
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
              class="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
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
                <th class="py-4 px-5">
                  <div class="flex items-center gap-1">
                    <span>Nombre / Usuario</span>
                    <span class="text-[9px] text-cyan-400 font-mono font-normal">({{ activeMode === 'MYSQL_RELATIONAL' ? 'displayName • PK' : 'displayName' }})</span>
                  </div>
                </th>
                <th class="py-4 px-5">Correo Electrónico (email)</th>
                <th class="py-4 px-5">
                  <div class="flex items-center gap-1">
                    <span>Rol (role)</span>
                    @if (activeMode === 'MYSQL_RELATIONAL') {
                      <span class="text-[9px] text-cyan-400 font-mono font-normal">FK: roles</span>
                    }
                  </div>
                </th>
                <th class="py-4 px-5">
                  <div class="flex items-center gap-1">
                    <span>Estado (estado)</span>
                    @if (activeMode === 'MYSQL_RELATIONAL') {
                      <span class="text-[9px] text-cyan-400 font-mono font-normal">FK: estados</span>
                    }
                  </div>
                </th>
                <th class="py-4 px-5">Fecha de Registro</th>
                @if (activeMode === 'MYSQL_RELATIONAL') {
                  <th class="py-4 px-5">Bar Asignado (FK: bar_id)</th>
                }
                <th class="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>

            <!-- Cuerpo de la Tabla -->
            <tbody class="divide-y divide-zinc-800/80">
              @if (isLoading()) {
                <tr>
                  <td [attr.colspan]="activeMode === 'MYSQL_RELATIONAL' ? 7 : 6" class="p-10 text-center text-zinc-400">
                    <div class="flex items-center justify-center gap-2">
                      <span class="material-icons animate-spin text-cyan-400">refresh</span>
                      <span>Consultando datos en la base de datos...</span>
                    </div>
                  </td>
                </tr>
              } @else if (filteredUsers().length === 0) {
                <tr>
                  <td [attr.colspan]="activeMode === 'MYSQL_RELATIONAL' ? 7 : 6" class="p-12 text-center text-zinc-500 space-y-3">
                    <span class="material-icons text-4xl text-zinc-600">dns</span>
                    <p class="text-sm font-semibold text-zinc-300">No se encontraron registros con los criterios solicitados.</p>
                    <div>
                      <button
                        (click)="seedEjemplos()"
                        class="px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-extrabold text-xs shadow-md hover:bg-cyan-400 transition-all inline-flex items-center gap-1.5"
                      >
                        <span class="material-icons text-sm">cloud_sync</span>
                        Cargar Ejemplos en MySQL
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
                          class="w-10 h-10 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 shrink-0 group-hover:border-cyan-500/40 transition-colors"
                        />
                        <div class="min-w-0">
                          <span class="font-extrabold text-white text-sm block group-hover:text-cyan-300 transition-colors truncate">
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

                    <!-- 5.1 Bar Asignado (solo en modo MySQL) -->
                    @if (activeMode === 'MYSQL_RELATIONAL') {
                      <td class="py-4 px-5">
                        @if (getAsignado(user)) {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800 text-cyan-300 font-medium text-[11px]">
                            <span class="material-icons text-xs">storefront</span>
                            {{ getAsignado(user) }}
                          </span>
                        } @else {
                          <span class="text-zinc-600 italic text-[11px]">Sin bar asignado</span>
                        }
                      </td>
                    }

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
                          class="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-400 transition-all"
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
          <span>Mostrando {{ filteredUsers().length }} de {{ displayUsers().length }} registros</span>
          <span class="font-mono text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {{ activeMode === 'MYSQL_RELATIONAL' ? 'Motor: MySQL 8.0 InnoDB (Relacional)' : activeMode === 'FIRESTORE' ? 'Motor: Cloud Firestore (NoSQL)' : 'Motor: Node.js Express' }}
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
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                <span class="material-icons text-sm">{{ isEditing ? 'edit' : 'person_add' }}</span>
                {{ isEditing ? 'Editar en MySQL Relacional' : 'Insertar Registro en MySQL' }}
              </div>
              <h3 class="font-heading text-xl font-black text-white">
                {{ isEditing ? 'Editar Usuario Relacional' : 'Nuevo Usuario en Tabla Relacional' }}
              </h3>
              <p class="text-xs text-zinc-400">
                Se ejecutará una sentencia SQL <code class="text-cyan-400 font-mono">{{ isEditing ? 'UPDATE usuarios' : 'INSERT INTO usuarios' }}</code> validando restricciones de clave foránea.
              </p>
            </div>

            <!-- Form -->
            <form (ngSubmit)="saveUser()" class="space-y-4 text-xs">
              
              <!-- displayName -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">
                  Nombre Completo (displayName) <span class="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.displayName"
                  name="displayName"
                  required
                  placeholder="Ej: Sofía Herrera"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <!-- email -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">
                  Correo Electrónico (email) <span class="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  placeholder="Ej: sofia@nocturna.club"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <!-- Grid: role y estado -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- role -->
                <div class="space-y-1.5">
                  <label class="block font-bold text-zinc-300">
                    Rol Asignado (role_id) <span class="text-rose-400">*</span>
                  </label>
                  <select
                    [(ngModel)]="formData.role"
                    name="role"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USER">Cliente (USER -> role_id=3)</option>
                    <option value="BAR_OWNER">Dueño de Bar (BAR_OWNER -> role_id=2)</option>
                    <option value="ADMIN">Administrador (ADMIN -> role_id=1)</option>
                  </select>
                </div>

                <!-- estado -->
                <div class="space-y-1.5">
                  <label class="block font-bold text-zinc-300">
                    Estado de Cuenta (estado_id) <span class="text-rose-400">*</span>
                  </label>
                  <select
                    [(ngModel)]="formData.estado"
                    name="estado"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVO">ACTIVO (estado_id=1)</option>
                    <option value="SUSPENDIDO">SUSPENDIDO (estado_id=3)</option>
                    <option value="PENDIENTE">PENDIENTE (estado_id=4)</option>
                    <option value="INACTIVO">INACTIVO (estado_id=2)</option>
                  </select>
                </div>

              </div>

              <!-- Bar Asignado (Relación 1:N) -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">
                  Establecimiento / Bar Asociado (FK: bar_id) - Opcional
                </label>
                <select
                  [(ngModel)]="formData.barId"
                  name="barId"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                >
                  <option [ngValue]="null">Ninguno (NULL - Sin bar asignado)</option>
                  <option [ngValue]="1">El Sotareño VIP (bar_id=1)</option>
                  <option [ngValue]="2">Club Eclipse Popayán (bar_id=2)</option>
                  <option [ngValue]="3">Sky Rooftop Lounge (bar_id=3)</option>
                  <option [ngValue]="4">La Clandestina Terraza (bar_id=4)</option>
                </select>
              </div>

              <!-- Phone -->
              <div class="space-y-1.5">
                <label class="block font-bold text-zinc-300">Teléfono Móvil (Opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  placeholder="+57 300 123 4567"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
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
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span class="material-icons text-sm">save</span>
                  {{ isEditing ? 'Ejecutar UPDATE' : 'Ejecutar INSERT' }}
                </button>
              </div>

            </form>

          </div>
        </div>
      }

      <!-- 6. Modal de Esquema DDL & Consultas SQL MySQL -->
      @if (showSqlModal) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            <button
              type="button"
              (click)="showSqlModal = false"
              class="absolute top-5 right-5 text-zinc-500 hover:text-white"
            >
              <span class="material-icons">close</span>
            </button>

            <!-- Modal Header -->
            <div class="space-y-1 shrink-0">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                <span class="material-icons text-sm">terminal</span>
                MySQL DDL Script & Consultas Relacionales
              </div>
              <h3 class="font-heading text-xl font-black text-white">
                Esquema de Base de Datos Relacional (MySQL InnoDB)
              </h3>
              <p class="text-xs text-zinc-400">
                Modelo relacional con claves primarias (<code class="text-cyan-300">PK</code>), foráneas (<code class="text-cyan-300">FK</code>) e índices.
              </p>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              
              <!-- Última Consulta Ejecutada -->
              <div class="space-y-1.5">
                <h4 class="font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span class="material-icons text-cyan-400 text-sm">play_arrow</span>
                  Consulta SELECT JOIN Ejecutada:
                </h4>
                <pre class="p-3.5 rounded-2xl bg-zinc-900 border border-cyan-900/50 text-cyan-300 font-mono text-[11px] overflow-x-auto whitespace-pre">{{ userMysql.lastQuery() || 'SELECT u.*, r.nombre, e.nombre FROM usuarios u INNER JOIN roles r ON u.role_id = r.id;' }}</pre>
              </div>

              <!-- Script DDL Completo -->
              <div class="space-y-1.5">
                <h4 class="font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span class="material-icons text-cyan-400 text-sm">schema</span>
                  Script DDL (CREATE TABLE con Constraints):
                </h4>
                <pre class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">{{ userMysql.ddlScript() }}</pre>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <span class="text-zinc-500 text-[11px]">Motor: InnoDB • Charset: UTF8MB4</span>
              <button
                type="button"
                (click)="showSqlModal = false"
                class="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class UsuariosComponent implements OnInit {
  public userMysql = inject(UserMysqlService);
  public userFirestore = inject(UserFirestoreService);
  public userHttp = inject(UserHttpService);
  private notify = inject(NotificationService);

  public activeMode: DatabaseMode = 'MYSQL_RELATIONAL';
  public ejemplosRapidos = EJEMPLOS_USUARIOS_FIRESTORE;

  public searchQuery = '';
  public selectedRole: 'ALL' | UserRole = 'ALL';
  public selectedEstado: 'ALL' | UserEstado = 'ALL';

  // Modal State
  public showModal = false;
  public showSqlModal = false;
  public isEditing = false;
  public editingId: number | null = null;
  public editingUid: string | null = null;

  public formData: {
    displayName: string;
    email: string;
    role: UserRole;
    estado: UserEstado;
    phone: string;
    barId: number | null;
  } = {
    displayName: '',
    email: '',
    role: 'USER',
    estado: 'ACTIVO',
    phone: '',
    barId: null
  };

  ngOnInit() {
    this.userMysql.loadUsers().subscribe();
    this.userFirestore.initFirestoreSync();
  }

  public displayUsers = computed<UserProfile[]>(() => {
    if (this.activeMode === 'MYSQL_RELATIONAL') {
      return this.userMysql.users().map((m: MysqlUser) => ({
        uid: m.uid,
        displayName: m.displayName,
        name: m.displayName,
        email: m.email,
        role: m.role,
        estado: m.estado,
        registro: m.registro,
        active: m.estado === 'ACTIVO',
        phone: m.phone,
        photoUrl: m.photoUrl
      }));
    } else if (this.activeMode === 'FIRESTORE') {
      return this.userFirestore.users();
    } else {
      return this.userHttp.users();
    }
  });

  public isLoading = computed(() => {
    if (this.activeMode === 'MYSQL_RELATIONAL') return this.userMysql.isLoading();
    if (this.activeMode === 'FIRESTORE') return this.userFirestore.isLoading();
    return this.userHttp.isLoading();
  });

  public filteredUsers = computed(() => {
    let list = this.displayUsers();
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

  public getAsignado(user: UserProfile): string | null {
    if (this.activeMode !== 'MYSQL_RELATIONAL') return null;
    const mysqlU = this.userMysql.users().find((m) => m.uid === user.uid);
    return mysqlU ? mysqlU.barAsignado : null;
  }

  public switchMode(mode: DatabaseMode) {
    this.activeMode = mode;
    if (mode === 'MYSQL_RELATIONAL') {
      this.userMysql.loadUsers().subscribe();
      this.notify.info('Cambiado a Base de Datos Relacional MySQL (Consultas SQL & Claves Foráneas)');
    } else if (mode === 'FIRESTORE') {
      this.notify.info('Cambiado a Cloud Firestore NoSQL (Sincronización en Tiempo Real)');
    } else {
      this.userHttp.loadUsers().subscribe();
      this.notify.info('Cambiado a Servidor Node.js + Express (HTTP REST)');
    }
  }

  // Seed examples into MySQL or active database
  public seedEjemplos() {
    if (this.activeMode === 'MYSQL_RELATIONAL') {
      this.userMysql.seedExampleUsers().subscribe();
    } else if (this.activeMode === 'FIRESTORE') {
      this.userFirestore.seedExampleUsers(true);
    } else {
      this.userMysql.seedExampleUsers().subscribe(() => {
        this.userHttp.loadUsers().subscribe();
      });
    }
  }

  // Action: Toggle Status quickly
  public toggleUserStatus(user: UserProfile) {
    const newEstado: UserEstado = user.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    if (this.activeMode === 'MYSQL_RELATIONAL') {
      const mysqlU = this.userMysql.users().find((m) => m.uid === user.uid);
      if (mysqlU) {
        this.userMysql.updateUser(mysqlU.id, { estado: newEstado }).subscribe();
      }
    } else if (this.activeMode === 'FIRESTORE') {
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

    if (this.activeMode === 'MYSQL_RELATIONAL') {
      const mysqlU = this.userMysql.users().find((m) => m.uid === user.uid);
      if (mysqlU) {
        this.userMysql.updateUser(mysqlU.id, { role: newRole }).subscribe();
      }
    } else if (this.activeMode === 'FIRESTORE') {
      this.userFirestore.updateUser(user.uid, { role: newRole });
    } else {
      this.userHttp.updateUser(user.uid, { role: newRole }).subscribe();
    }
  }

  // Action: Open Create Modal
  public openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.editingUid = null;
    this.formData = {
      displayName: '',
      email: '',
      role: 'USER',
      estado: 'ACTIVO',
      phone: '',
      barId: null
    };
    this.showModal = true;
  }

  // Action: Open Edit Modal
  public openEditModal(user: UserProfile) {
    this.isEditing = true;
    this.editingUid = user.uid;

    const mysqlU = this.userMysql.users().find((m) => m.uid === user.uid);
    this.editingId = mysqlU ? mysqlU.id : null;

    this.formData = {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      estado: user.estado,
      phone: user.phone || '',
      barId: mysqlU ? mysqlU.barId : null
    };
    this.showModal = true;
  }

  public closeModal() {
    this.showModal = false;
  }

  // Action: Save Create / Edit
  public saveUser() {
    if (!this.formData.displayName || !this.formData.email) return;

    if (this.activeMode === 'MYSQL_RELATIONAL') {
      if (this.isEditing && this.editingId !== null) {
        this.userMysql.updateUser(this.editingId, {
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone,
          barId: this.formData.barId
        }).subscribe(() => this.closeModal());
      } else {
        this.userMysql.createUser({
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone,
          barId: this.formData.barId
        }).subscribe(() => this.closeModal());
      }
    } else if (this.activeMode === 'FIRESTORE') {
      if (this.isEditing && this.editingUid) {
        this.userFirestore.updateUser(this.editingUid, {
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        });
        this.closeModal();
      } else {
        this.userFirestore.createUser({
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        });
        this.closeModal();
      }
    } else {
      if (this.isEditing && this.editingUid) {
        this.userHttp.updateUser(this.editingUid, {
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        }).subscribe(() => this.closeModal());
      } else {
        this.userHttp.createUser({
          displayName: this.formData.displayName,
          email: this.formData.email,
          role: this.formData.role,
          estado: this.formData.estado,
          phone: this.formData.phone
        }).subscribe(() => this.closeModal());
      }
    }
  }

  // Action: Delete user
  public confirmDeleteUser(user: UserProfile) {
    if (confirm(`¿Estás seguro de eliminar el registro relacional "${user.displayName}"?`)) {
      if (this.activeMode === 'MYSQL_RELATIONAL') {
        const mysqlU = this.userMysql.users().find((m) => m.uid === user.uid);
        if (mysqlU) {
          this.userMysql.deleteUser(mysqlU.id).subscribe();
        }
      } else if (this.activeMode === 'FIRESTORE') {
        this.userFirestore.deleteUser(user.uid);
      } else {
        this.userHttp.deleteUser(user.uid).subscribe();
      }
    }
  }
}
