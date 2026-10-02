import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { NotificationService } from './notification.service';
import { UserProfile, UserRole, UserEstado } from '../models/user.model';

export const EJEMPLOS_USUARIOS_FIRESTORE: UserProfile[] = [
  {
    uid: 'usr-ejemplo-001',
    displayName: 'J. Albán (Admin Global)',
    name: 'J. Albán (Admin Global)',
    email: 'jalban.dacompsc@gmail.com',
    role: 'ADMIN',
    estado: 'ACTIVO',
    registro: '2026-08-15',
    active: true,
    phone: '+57 312 456 7890',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  }
];

@Injectable({
  providedIn: 'root'
})
export class UserFirestoreService {
  private fb = inject(FirebaseService);
  private notify = inject(NotificationService);

  public users = signal<UserProfile[]>([]);
  public isLoading = signal<boolean>(false);
  public isFirestoreConnected = signal<boolean>(false);
  private unsubscribeListener: Unsubscribe | null = null;

  constructor() {
    this.initFirestoreSync();
  }

  /**
   * Initializes real-time listener with Cloud Firestore collection 'users'
   */
  public initFirestoreSync() {
    if (!this.fb.firestore) {
      // Fallback in-memory demo data
      this.users.set(EJEMPLOS_USUARIOS_FIRESTORE);
      return;
    }

    this.isLoading.set(true);
    const usersCol = collection(this.fb.firestore, 'users');

    try {
      this.unsubscribeListener = onSnapshot(
        usersCol,
        (snapshot) => {
          this.isFirestoreConnected.set(true);
          this.isLoading.set(false);

          if (snapshot.empty) {
            // Auto seed examples in Firestore so the user has immediate data
            this.seedExampleUsers(false);
          } else {
            const list: UserProfile[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              list.push({
                uid: d.id,
                displayName: data['displayName'] || data['name'] || 'Usuario',
                name: data['name'] || data['displayName'] || 'Usuario',
                email: data['email'] || '',
                role: (data['role'] as UserRole) || 'USER',
                estado: (data['estado'] as UserEstado) || (data['active'] ? 'ACTIVO' : 'INACTIVO'),
                registro: data['registro'] || data['createdAt']?.split('T')[0] || '2026-09-01',
                active: data['active'] ?? (data['estado'] === 'ACTIVO'),
                phone: data['phone'] || '',
                photoUrl: data['photoUrl'] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                createdAt: data['createdAt']
              });
            });

            // Sort by registration date descending
            list.sort((a, b) => (b.registro > a.registro ? 1 : -1));
            this.users.set(list);
          }
        },
        (error) => {
          this.isLoading.set(false);
          console.warn('Firestore users onSnapshot error:', error);
          this.fb.handleError(error, OperationType.GET, 'users');
          // Fallback to local examples on error
          if (this.users().length === 0) {
            this.users.set(EJEMPLOS_USUARIOS_FIRESTORE);
          }
        }
      );
    } catch (err) {
      this.isLoading.set(false);
      console.warn('Listener setup error:', err);
      this.users.set(EJEMPLOS_USUARIOS_FIRESTORE);
    }
  }

  /**
   * Seeds realistic sample users directly into Cloud Firestore
   */
  public async seedExampleUsers(notifyUser = true): Promise<void> {
    if (!this.fb.firestore) {
      this.users.set(EJEMPLOS_USUARIOS_FIRESTORE);
      if (notifyUser) {
        this.notify.info('Ejemplos de usuarios cargados localmente (Modo sin conexión).');
      }
      return;
    }

    this.isLoading.set(true);
    try {
      for (const ejemplo of EJEMPLOS_USUARIOS_FIRESTORE) {
        const docRef = doc(this.fb.firestore, 'users', ejemplo.uid);
        await setDoc(docRef, {
          uid: ejemplo.uid,
          displayName: ejemplo.displayName,
          name: ejemplo.name,
          email: ejemplo.email,
          role: ejemplo.role,
          estado: ejemplo.estado,
          registro: ejemplo.registro,
          active: ejemplo.estado === 'ACTIVO',
          phone: ejemplo.phone || '',
          photoUrl: ejemplo.photoUrl,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      this.isLoading.set(false);
      if (notifyUser) {
        this.notify.success(
          `¡${EJEMPLOS_USUARIOS_FIRESTORE.length} usuarios de ejemplo guardados exitosamente en Firestore!`,
          'Base de Datos No Relacional'
        );
      }
    } catch (err) {
      this.isLoading.set(false);
      console.warn('Error seeding users to Firestore:', err);
      this.fb.handleError(err, OperationType.WRITE, 'users');
    }
  }

  /**
   * Creates a user in Firestore
   */
  public async createUser(user: {
    displayName: string;
    email: string;
    role: UserRole;
    estado: UserEstado;
    phone?: string;
  }): Promise<void> {
    const uid = 'usr-' + Math.random().toString(36).substring(2, 9);
    const newDoc: UserProfile = {
      uid,
      displayName: user.displayName,
      name: user.displayName,
      email: user.email,
      role: user.role,
      estado: user.estado,
      active: user.estado === 'ACTIVO',
      registro: new Date().toISOString().split('T')[0],
      phone: user.phone || '',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };

    if (this.fb.firestore) {
      try {
        const docRef = doc(this.fb.firestore, 'users', uid);
        await setDoc(docRef, newDoc);
        this.notify.success(`Usuario "${user.displayName}" creado en Cloud Firestore`);
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, `users/${uid}`);
      }
    } else {
      this.users.update((list) => [newDoc, ...list]);
      this.notify.success(`Usuario creado localmente`);
    }
  }

  /**
   * Updates user fields in Firestore
   */
  public async updateUser(
    uid: string,
    changes: Partial<Pick<UserProfile, 'displayName' | 'email' | 'role' | 'estado' | 'phone'>>
  ): Promise<void> {
    const patchData: Record<string, unknown> = { ...changes };
    if (changes.displayName) {
      patchData['name'] = changes.displayName;
    }
    if (changes.estado) {
      patchData['active'] = changes.estado === 'ACTIVO';
    }
    patchData['updatedAt'] = new Date().toISOString();

    if (this.fb.firestore) {
      try {
        const docRef = doc(this.fb.firestore, 'users', uid);
        await updateDoc(docRef, patchData);
        this.notify.success(`Usuario actualizado en Firestore`);
      } catch (err) {
        this.fb.handleError(err, OperationType.UPDATE, `users/${uid}`);
      }
    } else {
      this.users.update((list) =>
        list.map((u) => (u.uid === uid ? { ...u, ...changes } : u))
      );
      this.notify.success(`Usuario actualizado localmente`);
    }
  }

  /**
   * Deletes a user document from Firestore
   */
  public async deleteUser(uid: string): Promise<void> {
    if (this.fb.firestore) {
      try {
        const docRef = doc(this.fb.firestore, 'users', uid);
        await deleteDoc(docRef);
        this.notify.info(`Usuario eliminado de Cloud Firestore`);
      } catch (err) {
        this.fb.handleError(err, OperationType.DELETE, `users/${uid}`);
      }
    } else {
      this.users.update((list) => list.filter((u) => u.uid !== uid));
      this.notify.info(`Usuario eliminado`);
    }
  }
}
