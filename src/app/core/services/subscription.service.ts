import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SubscriptionPlan, UserSubscription } from '../models/subscription.model';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    name: 'Clubber Free',
    price: 0,
    interval: 'monthly',
    badge: 'GRATUITO',
    colorTheme: 'zinc',
    active: true,
    features: [
      'Explora bares y discotecas asociadas',
      'Acceso al catálogo de música y playlists públicas',
      'Pedidos directos a la mesa con QR',
      'Notificaciones de próximos eventos'
    ]
  },
  {
    id: 'plan-silver',
    name: 'VIP Silver Night',
    price: 39000,
    interval: 'monthly',
    badge: 'MÁS POPULAR',
    popular: true,
    colorTheme: 'fuchsia',
    active: true,
    features: [
      'Entrada preferencial sin fila (Fila Express VIP)',
      '2 Covers gratuitos por mes en bares asociados',
      '15% de descuento en botellas seleccionadas',
      'Cóctel de cortesía en el mes de tu cumpleaños',
      'Acceso a playlists exclusivas de DJs residentes'
    ]
  },
  {
    id: 'plan-black',
    name: 'Black Diamond Clubber',
    price: 89000,
    interval: 'monthly',
    badge: 'EXPERIENCIA TOTAL',
    colorTheme: 'amber',
    active: true,
    features: [
      'Entrada ilimitada sin cover en todos los clubes asociados',
      'Acceso a Palcos VIP y backstage con DJs',
      '25% de descuento en botellas y licores premium',
      'Reserva de mesa garantizada sin consumo mínimo previo',
      'Conserje nocturno personal para reservas directas por WhatsApp',
      'Invitación a fiestas clandestinas secretas'
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly fb = inject(FirebaseService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  public plans = signal<SubscriptionPlan[]>(PLANS);
  public currentSubscription = signal<UserSubscription | null>({
    userId: 'user-vip-uid',
    userEmail: 'camila.rios@gmail.com',
    planId: 'plan-silver',
    planName: 'VIP Silver Night',
    status: 'ACTIVE',
    price: 39000,
    startDate: '2026-09-01',
    nextBillingDate: '2026-10-01',
    perks: ['Fila Express', '2 Covers libres', '15% Descuento Botellas']
  });

  constructor() {
    this.checkUserSubscription();
  }

  private async checkUserSubscription() {
    // If authenticated in Firestore, fetch document
    const user = this.auth.userProfile();
    if (!user || !this.fb.firestore) return;

    try {
      const snap = await getDocs(collection(this.fb.firestore, 'subscriptions'));
      if (!snap.empty) {
        snap.forEach(d => {
          const data = d.data() as UserSubscription;
          if (data.userId === user.uid) {
            this.currentSubscription.set(data);
          }
        });
      }
    } catch (e) {
      console.warn('Subscription fetch:', e);
    }
  }

  public async subscribeToPlan(plan: SubscriptionPlan): Promise<void> {
    const user = this.auth.userProfile();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const newSub: UserSubscription = {
      userId: user?.uid || 'user-active',
      userEmail: user?.email || 'clubber@nocturna.club',
      planId: plan.id,
      planName: plan.name,
      status: 'ACTIVE',
      price: plan.price,
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: nextMonth.toISOString().split('T')[0],
      perks: plan.features
    };

    if (this.fb.firestore) {
      try {
        await setDoc(doc(this.fb.firestore, 'subscriptions', newSub.userId), newSub);
      } catch (err) {
        console.warn('Subscription sync:', err);
      }
    }

    this.currentSubscription.set(newSub);
    this.notify.success(`¡Felicidades! Ahora tienes membresía activa en: ${plan.name}`, 'Pase VIP Activado');
  }

  public async cancelSubscription(): Promise<void> {
    const current = this.currentSubscription();
    if (!current) return;

    const updated: UserSubscription = {
      ...current,
      status: 'CANCELLED'
    };

    if (this.fb.firestore) {
      try {
        await updateDoc(doc(this.fb.firestore, 'subscriptions', current.userId), { status: 'CANCELLED' });
      } catch (e) {
        console.warn(e);
      }
    }

    this.currentSubscription.set(updated);
    this.notify.info('Tu suscripción ha sido cancelada para el siguiente periodo');
  }
}
