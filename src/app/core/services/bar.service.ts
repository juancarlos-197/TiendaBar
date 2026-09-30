import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { NotificationService } from './notification.service';
import { Bar, BarEvent } from '../models/bar.model';

const INITIAL_BARS: Bar[] = [
  {
    id: 'bar-sotareno',
    name: 'El Sotareño - Bar Tradicional & Música en Vivo',
    description: 'Emblemático espacio bohemio y rumbero con más de 30 años de tradición. Madera rústica, coctelería clásica, trova, salsa brava y música en vivo los fines de semana.',
    address: 'Calle 5 # 7-18, Centro Histórico',
    city: 'Popayán',
    phone: '+57 312 456 7890',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    musicGenre: 'Salsa, Bolero, Son Cubano & Crossover',
    capacity: 180,
    rating: 4.8,
    openingHours: 'Mié - Sáb: 5:00 PM - 2:00 AM',
    active: true,
    ownerId: 'owner-sotareno-uid',
    features: ['Música en Vivo', 'Coctelería de Autor', 'Zona Fumadores', 'Mesas VIP'],
    dressCode: 'Casual elegante o bohemio',
    minAge: 18,
    mapUrl: 'https://maps.google.com/?q=Calle+5+Centro+Historico+Popayan',
    galleryUrls: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
    ],
    schedule: [
      { day: 'Miércoles', hours: '5:00 PM - 1:00 AM', isOpen: true },
      { day: 'Jueves', hours: '5:00 PM - 2:00 AM', isOpen: true },
      { day: 'Viernes', hours: '5:00 PM - 3:00 AM', isOpen: true },
      { day: 'Sábado', hours: '5:00 PM - 3:00 AM', isOpen: true },
      { day: 'Domingo', hours: 'Cerrado', isOpen: false }
    ]
  },
  {
    id: 'bar-eclipse',
    name: 'Club Eclipse - Electronic & Underground Room',
    description: 'Templo de la música electrónica con sistema de sonido Funktion-One, shows de luces láser envolventes y DJs residentes e internacionales en tornamesas.',
    address: 'Cra 9 # 14N-45, Barrio Bolívar',
    city: 'Popayán',
    phone: '+57 320 889 1122',
    imageUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=1200&q=80',
    musicGenre: 'Techno, Melodic House & Tech-House',
    capacity: 450,
    rating: 4.9,
    openingHours: 'Jue - Dom: 9:00 PM - 5:00 AM',
    active: true,
    ownerId: 'owner-eclipse-uid',
    features: ['Funktion-One Audio', 'Visuales LED 360', 'Barra VIP', 'Valet Parking'],
    dressCode: 'All Black / Clubbing Underground',
    minAge: 18,
    mapUrl: 'https://maps.google.com/?q=Cra+9+Barrio+Bolivar+Popayan',
    galleryUrls: [
      'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80'
    ],
    schedule: [
      { day: 'Jueves', hours: '9:00 PM - 3:00 AM', isOpen: true },
      { day: 'Viernes', hours: '9:00 PM - 5:00 AM', isOpen: true },
      { day: 'Sábado', hours: '9:00 PM - 5:00 AM', isOpen: true },
      { day: 'Domingo', hours: '8:00 PM - 2:00 AM', isOpen: true }
    ]
  },
  {
    id: 'bar-rooftop-360',
    name: 'Sky Lounge 360 Rooftop Bar',
    description: 'Vista panorámica sobre los techos coloniales de la ciudad, coctelería molecular de autor, tapas gourmet y ambientación Sunset & Deep House.',
    address: 'Carrera 4 # 3-22, Terraza Piso 5',
    city: 'Popayán',
    phone: '+57 315 990 4433',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
    musicGenre: 'Sunset Vibes, Deep House & Nu-Disco',
    capacity: 220,
    rating: 4.7,
    openingHours: 'Mar - Dom: 4:00 PM - 1:00 AM',
    active: true,
    ownerId: 'owner-sky-uid',
    features: ['Terraza al Aire Libre', 'Coctelería Molecular', 'Cocina de Tapas', 'DJ Sunset'],
    dressCode: 'Smart Casual / Cocktail Chic',
    minAge: 18,
    mapUrl: 'https://maps.google.com/?q=Carrera+4+Terraza+Piso+5+Popayan',
    galleryUrls: [
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80'
    ],
    schedule: [
      { day: 'Martes a Jueves', hours: '4:00 PM - 12:00 AM', isOpen: true },
      { day: 'Viernes y Sábado', hours: '4:00 PM - 2:00 AM', isOpen: true },
      { day: 'Domingo', hours: '3:00 PM - 10:00 PM', isOpen: true }
    ]
  },
  {
    id: 'bar-neon-discoteca',
    name: 'La Clandestina Club & Discoteca',
    description: 'La pista de baile más enérgica para amantes del reggaeton clásico, dancehall, afrobeat y rumba crossover. Dos salas con ambientes independientes.',
    address: 'Av. Panamericana # 8-30',
    city: 'Popayán',
    phone: '+57 301 223 7788',
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
    musicGenre: 'Urbano, Reggaetón, Afrobeat & Crossover',
    capacity: 600,
    rating: 4.6,
    openingHours: 'Vie - Sáb: 9:00 PM - 4:00 AM',
    active: true,
    ownerId: 'owner-clandestina-uid',
    features: ['2 Ambientes', 'Botellas VIP con Bengala', 'Show de Bailarines', 'Seguridad Privada'],
    dressCode: 'Urbano fiesta / Rumbero',
    minAge: 18,
    mapUrl: 'https://maps.google.com/?q=Av+Panamericana+Popayan',
    galleryUrls: [
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=1200&q=80'
    ],
    schedule: [
      { day: 'Viernes', hours: '9:00 PM - 4:00 AM', isOpen: true },
      { day: 'Sábado', hours: '9:00 PM - 4:00 AM', isOpen: true },
      { day: 'Domingo - Jueves', hours: 'Cerrado', isOpen: false }
    ]
  }
];

const INITIAL_EVENTS: BarEvent[] = [
  {
    id: 'event-1',
    barId: 'bar-sotareno',
    barName: 'El Sotareño',
    title: 'Noche de Bohemia, Boleros & Salsa Brava en Vivo',
    description: 'Presentación estelar del Septeto Tradicional Caucano interpretando clásicos de Ismael Rivera, Héctor Lavoe y Benny Moré.',
    date: '2026-10-03',
    time: '20:30',
    coverPrice: 25000,
    ticketStock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    active: true,
    djOrArtist: 'Septeto Caucano'
  },
  {
    id: 'event-2',
    barId: 'bar-eclipse',
    barName: 'Club Eclipse',
    title: 'Underground Odyssey: Dark Techno Showcase',
    description: 'Sesión continua de 7 horas con artistas de la escena underground. Mapping reactivo e iluminación láser de alta potencia.',
    date: '2026-10-09',
    time: '22:00',
    coverPrice: 45000,
    ticketStock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    active: true,
    djOrArtist: 'DJ Vexler (Berlin) + Residentes'
  },
  {
    id: 'event-3',
    barId: 'bar-neon-discoteca',
    barName: 'La Clandestina Club',
    title: 'Perreo Old School: Fiesta Clásicos 2000s',
    description: 'La noche definitiva de clásicos de Wisin & Yandel, Don Omar, Tego Calderón y Daddy Yankee. Botella de bienvenida a grupos de 5 personas.',
    date: '2026-10-10',
    time: '21:00',
    coverPrice: 30000,
    ticketStock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    active: true,
    djOrArtist: 'DJ Flow Caucano'
  },
  {
    id: 'event-4',
    barId: 'bar-rooftop-360',
    barName: 'Sky Lounge 360',
    title: 'Sunset Ritual: Deep House & Molecular Cocktails',
    description: 'Tardeo exclusivo desde las 4:30 PM para ver el atardecer sobre Popayán con degustación de cocteles gin & tonic artesanales.',
    date: '2026-10-11',
    time: '16:30',
    coverPrice: 35000,
    ticketStock: 95,
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    active: true,
    djOrArtist: 'Melodic Sunsets Trio'
  }
];

@Injectable({
  providedIn: 'root'
})
export class BarService {
  private readonly fb = inject(FirebaseService);
  private readonly notify = inject(NotificationService);

  public bars = signal<Bar[]>(INITIAL_BARS);
  public events = signal<BarEvent[]>(INITIAL_EVENTS);
  public loading = signal<boolean>(false);

  constructor() {
    this.fetchBars();
    this.fetchEvents();
  }

  public async fetchBars(): Promise<void> {
    if (!this.fb.firestore) return;
    try {
      this.loading.set(true);
      const querySnap = await getDocs(collection(this.fb.firestore, 'bars'));
      if (!querySnap.empty) {
        const loadedBars: Bar[] = [];
        querySnap.forEach(docSnap => {
          loadedBars.push({ id: docSnap.id, ...(docSnap.data() as Bar) });
        });
        this.bars.set(loadedBars);
      } else {
        // Seed initial bars
        this.seedInitialBars();
      }
    } catch (err) {
      console.warn('Bars fetch fallback to defaults:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async seedInitialBars() {
    if (!this.fb.firestore) return;
    try {
      for (const bar of INITIAL_BARS) {
        await addDoc(collection(this.fb.firestore, 'bars'), bar);
      }
    } catch (e) {
      console.warn('Seeding bars warning:', e);
    }
  }

  public async fetchEvents(): Promise<void> {
    if (!this.fb.firestore) return;
    try {
      const snap = await getDocs(collection(this.fb.firestore, 'events'));
      if (!snap.empty) {
        const list: BarEvent[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as BarEvent) }));
        this.events.set(list);
      } else {
        for (const ev of INITIAL_EVENTS) {
          await addDoc(collection(this.fb.firestore, 'events'), ev);
        }
      }
    } catch (err) {
      console.warn('Events fetch fallback:', err);
    }
  }

  public getBarById(id: string): Bar | undefined {
    return this.bars().find(b => b.id === id);
  }

  public async createBar(barData: Omit<Bar, 'id'>): Promise<Bar> {
    this.loading.set(true);
    const newBar: Bar = {
      ...barData,
      id: 'bar-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    if (this.fb.firestore) {
      try {
        const docRef = await addDoc(collection(this.fb.firestore, 'bars'), newBar);
        newBar.id = docRef.id;
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, 'bars');
      }
    }

    this.bars.update(list => [newBar, ...list]);
    this.notify.success(`Bar "${newBar.name}" registrado con éxito`);
    this.loading.set(false);
    return newBar;
  }

  public async updateBar(id: string, updates: Partial<Bar>): Promise<void> {
    if (this.fb.firestore) {
      try {
        await updateDoc(doc(this.fb.firestore, 'bars', id), updates);
      } catch (err) {
        this.fb.handleError(err, OperationType.UPDATE, `bars/${id}`);
      }
    }
    this.bars.update(list => list.map(b => b.id === id ? { ...b, ...updates } : b));
    this.notify.success('Información del bar actualizada');
  }

  public async deleteBar(id: string): Promise<void> {
    if (this.fb.firestore) {
      try {
        await deleteDoc(doc(this.fb.firestore, 'bars', id));
      } catch (err) {
        this.fb.handleError(err, OperationType.DELETE, `bars/${id}`);
      }
    }
    this.bars.update(list => list.filter(b => b.id !== id));
    this.notify.info('Bar eliminado');
  }

  public async createEvent(eventData: Omit<BarEvent, 'id'>): Promise<BarEvent> {
    const newEvent: BarEvent = {
      ...eventData,
      id: 'event-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    if (this.fb.firestore) {
      try {
        const docRef = await addDoc(collection(this.fb.firestore, 'events'), newEvent);
        newEvent.id = docRef.id;
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, 'events');
      }
    }

    this.events.update(list => [newEvent, ...list]);
    this.notify.success(`Evento "${newEvent.title}" publicado`);
    return newEvent;
  }

  public buyTicket(eventId: string, qty: number = 1): boolean {
    const event = this.events().find(e => e.id === eventId);
    if (!event) return false;
    if (event.ticketStock < qty) {
      this.notify.error('No hay suficientes boletas disponibles');
      return false;
    }

    this.events.update(list =>
      list.map(e => e.id === eventId ? { ...e, ticketStock: e.ticketStock - qty } : e)
    );
    this.notify.success(`¡Has reservado ${qty} entrada(s) para "${event.title}"! Mostrando pase digital.`);
    return true;
  }
}
