import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/types';

export interface SubscriptionsApiResponse {
  success: boolean;
  protocol?: string;
  count?: number;
  subscriptions: Subscription[];
  timestamp?: string;
}

export interface PlansApiResponse {
  success: boolean;
  count?: number;
  plans: SubscriptionPlan[];
}

export interface SingleSubscriptionApiResponse {
  success: boolean;
  message?: string;
  subscription: Subscription;
}

export interface DeleteSubscriptionApiResponse {
  success: boolean;
  message?: string;
  id: string;
}

export interface SubscriptionHttpLog {
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
export class SubscriptionHttpService {
  private http = inject(HttpClient);

  public subscriptions = signal<Subscription[]>([]);
  public plans = signal<SubscriptionPlan[]>([]);
  public isLoading = signal<boolean>(false);
  public lastHttpLog = signal<SubscriptionHttpLog | null>(null);
  public rawJsonResponse = signal<string>('');
  public error = signal<string | null>(null);

  private readonly API_BASE = '/api/subscriptions';

  /**
   * HTTP GET: Obtiene las suscripciones activas y registradas
   */
  public getSubscriptions(filter?: { status?: string; tier?: string }): Observable<SubscriptionsApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (filter?.status && filter.status !== 'all') {
      params = params.set('status', filter.status);
    }
    if (filter?.tier && filter.tier !== 'all') {
      params = params.set('tier', filter.tier);
    }

    return this.http.get<SubscriptionsApiResponse>(this.API_BASE, { params }).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        const list = res.subscriptions || [];
        this.subscriptions.set(list);
        this.isLoading.set(false);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'GET',
          endpoint: this.API_BASE,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `${list.length} suscripciones recibidas vía HTTP`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error al obtener suscripciones');
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP GET: Obtiene los planes y membresías disponibles
   */
  public getPlans(): Observable<PlansApiResponse> {
    const endpoint = `${this.API_BASE}/plans`;
    return this.http.get<PlansApiResponse>(endpoint).pipe(
      tap((res) => {
        if (res.plans) {
          this.plans.set(res.plans);
        }
      })
    );
  }

  /**
   * HTTP POST: Registra una nueva suscripción
   */
  public createSubscription(data: {
    userId?: string;
    userDisplayName: string;
    userEmail: string;
    planId: string;
    paymentMethod?: 'tarjeta' | 'bizum' | 'transferencia' | 'domiciliacion';
    notes?: string;
    startDate?: string;
    renewalDate?: string;
  }): Observable<SingleSubscriptionApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);

    return this.http.post<SingleSubscriptionApiResponse>(this.API_BASE, data).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.subscription) {
          this.subscriptions.update((list) => [res.subscription, ...list]);
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
          payloadSummary: `Suscripción creada: ${res.subscription?.userDisplayName} -> ${res.subscription?.planName}`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP PUT: Actualiza los detalles de una suscripción
   */
  public updateSubscription(
    id: string,
    data: Partial<Subscription>
  ): Observable<SingleSubscriptionApiResponse> {
    const start = performance.now();
    this.isLoading.set(true);
    const endpoint = `${this.API_BASE}/${id}`;

    return this.http.put<SingleSubscriptionApiResponse>(endpoint, data).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.subscription) {
          this.subscriptions.update((list) =>
            list.map((s) => (s.id === id ? res.subscription : s))
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
          payloadSummary: `Suscripción ${id} actualizada vía HTTP PUT`,
        });
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * HTTP PATCH: Modifica el estado de una suscripción
   */
  public updateStatus(id: string, status: SubscriptionStatus): Observable<SingleSubscriptionApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/${id}/status`;

    return this.http.patch<SingleSubscriptionApiResponse>(endpoint, { status }).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        if (res.subscription) {
          this.subscriptions.update((list) =>
            list.map((s) => (s.id === id ? { ...s, status } : s))
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
          payloadSummary: `Estado de suscripción cambiado a "${status}"`,
        });
      })
    );
  }

  /**
   * HTTP DELETE: Elimina / cancela una suscripción
   */
  public deleteSubscription(id: string): Observable<DeleteSubscriptionApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/${id}`;

    return this.http.delete<DeleteSubscriptionApiResponse>(endpoint).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        this.subscriptions.update((list) => list.filter((s) => s.id !== id));
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'DELETE',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: `Suscripción ${id} eliminada`,
        });
      })
    );
  }

  /**
   * HTTP POST: Restablece suscripciones de ejemplo
   */
  public resetToDefaults(): Observable<SubscriptionsApiResponse> {
    const start = performance.now();
    const endpoint = `${this.API_BASE}/reset`;

    return this.http.post<SubscriptionsApiResponse>(endpoint, {}).pipe(
      tap((res) => {
        const duration = Math.round(performance.now() - start);
        this.subscriptions.set(res.subscriptions || []);
        this.rawJsonResponse.set(JSON.stringify(res, null, 2));

        this.lastHttpLog.set({
          method: 'POST',
          endpoint,
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          payloadSummary: 'Suscripciones restablecidas con datos de prueba',
        });
      })
    );
  }

  /**
   * Carga inicial síncrona/reactiva
   */
  public loadInitialData() {
    this.getPlans().subscribe({
      next: () => this.getSubscriptions().subscribe(),
      error: () => this.getSubscriptions().subscribe(),
    });
  }
}
