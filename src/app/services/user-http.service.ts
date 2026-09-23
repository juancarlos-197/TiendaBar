import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { UserRecord, UserRole } from '../models/types';

export interface UsersApiResponse {
  success: boolean;
  protocol?: string;
  count?: number;
  users: UserRecord[];
  timestamp?: string;
}

export interface SingleUserApiResponse {
  success: boolean;
  message?: string;
  user: UserRecord;
}

export interface DeleteUserApiResponse {
  success: boolean;
  message?: string;
  id: string;
}

export interface HttpLogEntry {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: number;
  statusText: string;
  durationMs: number;
  timestamp: string;
  payloadSummary?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserHttpService {
  private http = inject(HttpClient);

  // Reactive state from HTTP operations
  public httpUsers = signal<UserRecord[]>([]);
  public isLoading = signal<boolean>(false);
  public lastHttpLog = signal<HttpLogEntry | null>(null);
  public rawJsonResponse = signal<string>('');
  public error = signal<string | null>(null);

  private readonly API_BASE = '/api/users';

  /**
   * HTTP GET: Obtiene la lista de usuarios con displayName, email y role
   */
  public getUsers(): Observable<UsersApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<UsersApiResponse>(this.API_BASE).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        const usersList = res.users || [];
        this.httpUsers.set(usersList);
        this.isLoading.set(false);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'GET',
          endpoint: this.API_BASE,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `${usersList.length} usuarios recibidos (displayName, email, role)`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error en petición HTTP GET');
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP POST: Crea un nuevo usuario con displayName, email y role
   */
  public createUser(userData: {
    displayName: string;
    email: string;
    role: UserRole;
    phone?: string;
    photoURL?: string;
  }): Observable<SingleUserApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);

    return this.http.post<SingleUserApiResponse>(this.API_BASE, userData).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.user) {
          this.httpUsers.update((list) => [res.user, ...list]);
        }
        this.isLoading.set(false);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'POST',
          endpoint: this.API_BASE,
          status: 201,
          statusText: 'Created',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `Usuario creado: ${res.user?.displayName} (${res.user?.email}) [${res.user?.role}]`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP PUT: Actualiza los datos de un usuario (displayName, email, role)
   */
  public updateUser(
    id: string,
    updates: Partial<UserRecord>
  ): Observable<SingleUserApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);
    const endpoint = `${this.API_BASE}/${id}`;

    return this.http.put<SingleUserApiResponse>(endpoint, updates).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.user) {
          this.httpUsers.update((list) =>
            list.map((u) => (u.id === id ? res.user : u))
          );
        }
        this.isLoading.set(false);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'PUT',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `Usuario actualizado: ${res.user?.displayName} [${res.user?.role}]`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP PATCH: Actualiza específicamente el rol de un usuario
   */
  public updateUserRole(
    id: string,
    role: UserRole
  ): Observable<SingleUserApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/${id}/role`;

    return this.http.patch<SingleUserApiResponse>(endpoint, { role }).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.user) {
          this.httpUsers.update((list) =>
            list.map((u) => (u.id === id ? { ...u, role } : u))
          );
        }
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'PATCH',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `Rol cambiado a "${role}" para ${res.user?.displayName}`,
        });
      })
    );
  }

  /**
   * HTTP DELETE: Elimina un usuario por ID
   */
  public deleteUser(id: string): Observable<DeleteUserApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/${id}`;

    return this.http.delete<DeleteUserApiResponse>(endpoint).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        this.httpUsers.update((list) => list.filter((u) => u.id !== id));
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'DELETE',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `Usuario ${id} eliminado`,
        });
      })
    );
  }

  /**
   * HTTP POST: Restablece usuarios a la lista predeterminada
   */
  public resetToDefaults(): Observable<UsersApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/reset`;

    return this.http.post<UsersApiResponse>(endpoint, {}).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        this.httpUsers.set(res.users || []);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'POST',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: 'Lista restablecida con usuarios predeterminados',
        });
      })
    );
  }

  /**
   * Carga inicial síncrona/reactiva
   */
  public loadUsers() {
    this.getUsers().subscribe({
      error: (err) => console.warn('HTTP GET /api/users error:', err),
    });
  }
}
