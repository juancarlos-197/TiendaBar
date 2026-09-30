import { Injectable, inject, signal, computed, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

const LOCAL_FAVORITES_KEY = 'nocturna_user_favorite_venues';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private fb = inject(FirebaseService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  public favoriteIds = signal<string[]>([]);
  public isLoading = signal<boolean>(false);

  public count = computed(() => this.favoriteIds().length);
  public hasFavorites = computed(() => this.favoriteIds().length > 0);

  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadLocalFavorites();
      
      // Reactive effect when user changes
      effect(() => {
        const user = this.auth.userProfile();
        this.setupFirestoreListener(user?.uid);
      });
    }
  }

  private getEffectiveUserId(userId?: string): string {
    return userId || this.auth.userProfile()?.uid || 'guest_clubber';
  }

  private loadLocalFavorites() {
    try {
      const saved = localStorage.getItem(LOCAL_FAVORITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.favoriteIds.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read local favorites:', e);
    }
  }

  private saveLocalFavorites(ids: string[]) {
    try {
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Could not save local favorites:', e);
    }
  }

  private setupFirestoreListener(userId?: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (!this.fb.firestore) return;

    const docId = this.getEffectiveUserId(userId);
    const docRef = doc(this.fb.firestore, 'userFavorites', docId);

    try {
      this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteIds = Array.isArray(data?.['barIds']) ? (data['barIds'] as string[]) : [];
          this.favoriteIds.set(remoteIds);
          this.saveLocalFavorites(remoteIds);
        } else if (this.favoriteIds().length > 0) {
          // If Firestore doc doesn't exist yet but user had local favorites, sync them up
          this.syncToFirestore(docId, this.favoriteIds());
        }
      }, (error) => {
        this.fb.handleError(error, OperationType.GET, `userFavorites/${docId}`);
      });
    } catch (err) {
      console.warn('Firestore favorites listener fallback:', err);
    }
  }

  private async syncToFirestore(docId: string, ids: string[]): Promise<void> {
    if (!this.fb.firestore) return;
    try {
      const docRef = doc(this.fb.firestore, 'userFavorites', docId);
      await setDoc(docRef, {
        userId: docId,
        barIds: ids,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      this.fb.handleError(err, OperationType.WRITE, `userFavorites/${docId}`);
    }
  }

  public isFavorite(venueId?: string): boolean {
    if (!venueId) return false;
    return this.favoriteIds().includes(venueId);
  }

  public async toggleFavorite(venueId: string, venueName?: string): Promise<boolean> {
    if (!venueId) return false;

    const current = this.favoriteIds();
    const isFav = current.includes(venueId);
    let updated: string[];

    if (isFav) {
      updated = current.filter(id => id !== venueId);
      this.notify.info(`Quitaste ${venueName || 'el local'} de tus favoritos.`);
    } else {
      updated = [...current, venueId];
      this.notify.success(`¡${venueName || 'Local'} guardado en tus favoritos! ♥`);
    }

    // Immediate optimistic local update
    this.favoriteIds.set(updated);
    this.saveLocalFavorites(updated);

    // Sync to Firestore
    if (this.fb.firestore) {
      const docId = this.getEffectiveUserId();
      try {
        await this.syncToFirestore(docId, updated);
      } catch (err) {
        console.warn('Could not sync favorite to Firestore, preserved locally:', err);
      }
    }

    return !isFav;
  }
}
