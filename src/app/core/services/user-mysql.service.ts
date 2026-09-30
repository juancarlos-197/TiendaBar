import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { UserRole, UserEstado } from '../models/user.model';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

export interface MysqlUser {
  id: number;
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  estado: UserEstado;
  registro: string;
  barAsignado: string | null;
  phone: string;
  photoUrl: string;
  roleId: number;
  estadoId: number;
  barId: number | null;
}

export interface MysqlSchemaResponse {
  success: boolean;
  database: string;
  ddl: string;
  auditoria: { id: number; usuario_id: number; accion: string; detalles: string; created_at: string }[];
  bares: { id: number; nombre: string; ciudad: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class UserMysqlService {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);

  private baseUrl = environment.apiUrl + '/mysql';

  public users = signal<MysqlUser[]>([]);
  public lastQuery = signal<string>('');
  public ddlScript = signal<string>('');
  public isLoading = signal<boolean>(false);
  public isConnected = signal<boolean>(true);

  constructor() {
    this.loadUsers().subscribe();
    this.loadSchema().subscribe();
  }

  /**
   * Runs the relational SELECT JOIN query to fetch users with role, status and assigned bar
   */
  public loadUsers(): Observable<{ success: boolean; query?: string; data?: MysqlUser[] }> {
    this.isLoading.set(true);
    return this.http.get<{ success: boolean; query?: string; data?: MysqlUser[] }>(`${this.baseUrl}/users`).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
          if (res.query) this.lastQuery.set(res.query);
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        console.warn('Error fetching users from MySQL:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  /**
   * Executes a relational INSERT query into the 'usuarios' table
   */
  public createUser(user: {
    displayName: string;
    email: string;
    role: UserRole;
    estado: UserEstado;
    phone?: string;
    barId?: number | null;
  }): Observable<{ success: boolean; query?: string; data?: MysqlUser }> {
    this.isLoading.set(true);
    return this.http.post<{ success: boolean; query?: string; data?: MysqlUser }>(`${this.baseUrl}/users`, user).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.update((list) => [...list, res.data!]);
          if (res.query) this.lastQuery.set(res.query);
          this.notify.success(`Registro relacional insertado en MySQL (ID: ${res.data.id})`, 'MySQL InnoDB');
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return of({ success: false, message: err.message });
      })
    );
  }

  /**
   * Executes a relational UPDATE query on the 'usuarios' table
   */
  public updateUser(
    id: number,
    changes: {
      displayName?: string;
      email?: string;
      role?: UserRole;
      estado?: UserEstado;
      phone?: string;
      barId?: number | null;
    }
  ): Observable<{ success: boolean; query?: string; data?: MysqlUser }> {
    return this.http.patch<{ success: boolean; query?: string; data?: MysqlUser }>(`${this.baseUrl}/users/${id}`, changes).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.users.update((list) =>
            list.map((u) => (u.id === id ? res.data! : u))
          );
          if (res.query) this.lastQuery.set(res.query);
          this.notify.success(`Registro ID ${id} actualizado en MySQL con éxito`, 'MySQL InnoDB');
        }
      }),
      catchError((err) => {
        return of({ success: false, message: err.message });
      })
    );
  }

  /**
   * Executes a relational DELETE query on the 'usuarios' table
   */
  public deleteUser(id: number): Observable<{ success: boolean; query?: string }> {
    return this.http.delete<{ success: boolean; query?: string }>(`${this.baseUrl}/users/${id}`).pipe(
      tap((res) => {
        if (res.success) {
          this.users.update((list) => list.filter((u) => u.id !== id));
          if (res.query) this.lastQuery.set(res.query);
          this.notify.info(`Registro ID ${id} eliminado de la base de datos MySQL`);
        }
      }),
      catchError((err) => {
        return of({ success: false, message: err.message });
      })
    );
  }

  /**
   * Resets and populates the MySQL relational tables with 8 rich examples
   */
  public seedExampleUsers(): Observable<{ success: boolean; query?: string; count?: number }> {
    this.isLoading.set(true);
    return this.http.post<{ success: boolean; query?: string; count?: number }>(`${this.baseUrl}/seed`, {}).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (res.success) {
          if (res.query) this.lastQuery.set(res.query);
          this.loadUsers().subscribe();
          this.notify.success(
            `¡Tablas relacionales MySQL pobladas con ${res.count || 8} ejemplos y claves foráneas!`,
            'MySQL Relacional'
          );
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return of({ success: false });
      })
    );
  }

  /**
   * Retrieves the DDL script (CREATE TABLE, CONSTRAINTS)
   */
  public loadSchema(): Observable<MysqlSchemaResponse> {
    return this.http.get<MysqlSchemaResponse>(`${this.baseUrl}/schema`).pipe(
      tap((res) => {
        if (res.success && res.ddl) {
          this.ddlScript.set(res.ddl);
        }
      }),
      catchError(() => of({ success: false, database: 'nocturna_db', ddl: '', auditoria: [], bares: [] }))
    );
  }
}
