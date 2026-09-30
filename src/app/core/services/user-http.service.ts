import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { UserProfile, UserRole, UserEstado } from '../models/user.model';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserHttpService {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);

  private baseUrl = environment.apiUrl + '/users';

  // Signals for reactive UI state
  public users = signal<UserProfile[]>([]);
  public isLoading = signal<boolean>(false);

  /**
   * Fetch all users from Node & Express backend via HTTP
   */
  public loadUsers(): Observable<ApiResponse<UserProfile[]>> {
    this.isLoading.set(true);
    return this.http.get<ApiResponse<UserProfile[]>>(this.baseUrl).pipe(
      tap((res) => {
        if (res.success && Array.isArray(res.data)) {
          this.users.set(res.data);
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        console.warn('Error fetching users from Node/Express:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  /**
   * Register a new user via Node Express HTTP POST
   */
  public createUser(userData: {
    displayName: string;
    email: string;
    role: UserRole;
    estado: UserEstado;
    phone?: string;
  }): Observable<ApiResponse<UserProfile>> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<UserProfile>>(this.baseUrl, userData).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.update((list) => [res.data, ...list]);
          this.notify.success(`Usuario "${res.data.displayName}" creado en Node/Express con éxito`);
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return of({ success: false, data: {} as UserProfile, message: err.message });
      })
    );
  }

  /**
   * Update user status, role or information via Node Express HTTP PATCH
   */
  public updateUser(
    uid: string,
    changes: Partial<Pick<UserProfile, 'displayName' | 'email' | 'role' | 'estado' | 'phone'>>
  ): Observable<ApiResponse<UserProfile>> {
    return this.http.patch<ApiResponse<UserProfile>>(`${this.baseUrl}/${uid}`, changes).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.users.update((list) =>
            list.map((u) => (u.uid === uid ? { ...u, ...res.data } : u))
          );
          this.notify.success(`Usuario actualizado con éxito en Node/Express`);
        }
      }),
      catchError((err) => {
        return of({ success: false, data: {} as UserProfile, message: err.message });
      })
    );
  }

  /**
   * Delete or deactivate user via Node Express HTTP DELETE
   */
  public deleteUser(uid: string): Observable<ApiResponse<UserProfile>> {
    return this.http.delete<ApiResponse<UserProfile>>(`${this.baseUrl}/${uid}`).pipe(
      tap((res) => {
        if (res.success) {
          this.users.update((list) => list.filter((u) => u.uid !== uid));
          this.notify.info(`Usuario eliminado del servidor Node Express`);
        }
      }),
      catchError((err) => {
        return of({ success: false, data: {} as UserProfile, message: err.message });
      })
    );
  }
}
