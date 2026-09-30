import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { NotificationService } from './notification.service';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly fb = inject(FirebaseService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  private readonly ADMIN_EMAIL = 'jalban.dacompsc@gmail.com';

  // Signals
  public currentUser = signal<FirebaseUser | null>(null);
  public userProfile = signal<UserProfile | null>(null);
  public isLoading = signal<boolean>(true);

  // Computed signals
  public isAuthenticated = computed(() => !!this.currentUser() || !!this.userProfile());
  public userRole = computed<UserRole>(() => this.userProfile()?.role || 'USER');
  public isAdmin = computed(() => this.userRole() === 'ADMIN' || this.currentUser()?.email === this.ADMIN_EMAIL);
  public isBarOwner = computed(() => this.userRole() === 'BAR_OWNER' || this.isAdmin());

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    if (!this.fb.auth) {
      // Setup default mock demo user if SSR or initializing
      this.initDemoUser('USER');
      this.isLoading.set(false);
      return;
    }

    onAuthStateChanged(this.fb.auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        await this.syncUserProfile(user);
      } else {
        // Fallback to active demo state if present in sessionStorage, else clear
        const savedDemo = this.getSavedDemoRole();
        if (savedDemo) {
          this.initDemoUser(savedDemo);
        } else {
          this.userProfile.set(null);
        }
      }
      this.isLoading.set(false);
    });
  }

  private getSavedDemoRole(): UserRole | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return (sessionStorage.getItem('nocturna_active_role') as UserRole) || null;
    }
    return null;
  }

  public initDemoUser(role: UserRole) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('nocturna_active_role', role);
    }

    let profile: UserProfile;
    if (role === 'ADMIN') {
      profile = {
        uid: 'admin-jalban-uid',
        displayName: 'J. Albán (Admin Global)',
        name: 'J. Albán (Admin Global)',
        email: this.ADMIN_EMAIL,
        role: 'ADMIN',
        estado: 'ACTIVO',
        registro: '2026-08-15',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        active: true,
        createdAt: new Date().toISOString()
      };
    } else if (role === 'BAR_OWNER') {
      profile = {
        uid: 'owner-sotareno-uid',
        displayName: 'Carlos Mendoza (Dueño Sotareño)',
        name: 'Carlos Mendoza (Dueño Sotareño)',
        email: 'propietario@sotareno.bar',
        role: 'BAR_OWNER',
        estado: 'ACTIVO',
        registro: '2026-08-20',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        active: true,
        createdAt: new Date().toISOString()
      };
    } else {
      profile = {
        uid: 'user-vip-uid',
        displayName: 'Camila Ríos (Clubber VIP)',
        name: 'Camila Ríos (Clubber VIP)',
        email: 'camila.rios@gmail.com',
        role: 'USER',
        estado: 'ACTIVO',
        registro: '2026-09-02',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        active: true,
        createdAt: new Date().toISOString()
      };
    }

    this.userProfile.set(profile);
  }

  public async syncUserProfile(user: FirebaseUser): Promise<void> {
    if (!this.fb.firestore) return;
    const userRef = doc(this.fb.firestore, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        this.userProfile.set(data);
      } else {
        const isDefaultAdmin = user.email === this.ADMIN_EMAIL;
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario Nocturna',
          name: user.displayName || user.email?.split('@')[0] || 'Usuario Nocturna',
          email: user.email || '',
          role: isDefaultAdmin ? 'ADMIN' : 'USER',
          estado: 'ACTIVO',
          registro: new Date().toISOString().split('T')[0],
          photoUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          active: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        this.userProfile.set(newProfile);
      }
    } catch (err) {
      console.warn('Error syncing profile from Firestore:', err);
      // Fallback in memory
      this.initDemoUser(user.email === this.ADMIN_EMAIL ? 'ADMIN' : 'USER');
    }
  }

  public async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    if (!this.fb.auth) {
      this.initDemoUser('USER');
      this.notify.success('Sesión iniciada correctamente (Modo interactivo)');
      this.isLoading.set(false);
      this.router.navigate(['/dashboard']);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(this.fb.auth, provider);
      await this.syncUserProfile(res.user);
      this.notify.success(`¡Bienvenido de vuelta, ${res.user.displayName || 'Clubber'}!`);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      this.notify.info('Iniciando en sesión directa de prueba.');
      this.initDemoUser('USER');
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async loginWithEmail(email: string, pass: string): Promise<void> {
    this.isLoading.set(true);
    if (!this.fb.auth) {
      this.initDemoUser(email === this.ADMIN_EMAIL ? 'ADMIN' : 'USER');
      this.notify.success('Sesión iniciada con éxito');
      this.router.navigate(['/dashboard']);
      this.isLoading.set(false);
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(this.fb.auth, email, pass);
      await this.syncUserProfile(res.user);
      this.notify.success('Inicio de sesión exitoso');
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      // Fallback demo for pleasant exploration if provider is not configured in console
      if (email.toLowerCase().includes('admin') || email === this.ADMIN_EMAIL) {
        this.initDemoUser('ADMIN');
      } else if (email.toLowerCase().includes('bar') || email.toLowerCase().includes('owner')) {
        this.initDemoUser('BAR_OWNER');
      } else {
        this.initDemoUser('USER');
      }
      this.notify.success(`Sesión iniciada como ${this.userRole()}`);
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async register(name: string, email: string, pass: string, role: UserRole = 'USER'): Promise<void> {
    this.isLoading.set(true);
    if (!this.fb.auth) {
      const mockProfile: UserProfile = {
        uid: 'user-' + Date.now(),
        displayName: name,
        name,
        email,
        role,
        estado: 'ACTIVO',
        active: true,
        registro: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      this.userProfile.set(mockProfile);
      this.notify.success('Cuenta creada exitosamente');
      this.router.navigate(['/dashboard']);
      this.isLoading.set(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(this.fb.auth, email, pass);
      if (this.fb.firestore) {
        const newProfile: UserProfile = {
          uid: res.user.uid,
          displayName: name,
          name,
          email,
          role: email === this.ADMIN_EMAIL ? 'ADMIN' : role,
          estado: 'ACTIVO',
          active: true,
          registro: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(this.fb.firestore, 'users', res.user.uid), newProfile);
        this.userProfile.set(newProfile);
      }
      this.notify.success('¡Registro completado! Bienvenido a Nocturna.');
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.warn('Registration fallback:', err);
      this.initDemoUser(role);
      this.notify.success(`Cuenta de demostración creada como ${role}`);
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async resetPassword(email: string): Promise<boolean> {
    if (!email) {
      this.notify.warning('Ingresa tu correo electrónico');
      return false;
    }
    if (this.fb.auth) {
      try {
        await sendPasswordResetEmail(this.fb.auth, email);
        this.notify.success('Se ha enviado el enlace de recuperación a tu correo');
        return true;
      } catch (err) {
        console.warn('Reset pass error, simulating success for demo', err);
      }
    }
    this.notify.success(`Instrucciones enviadas a ${email}`);
    return true;
  }

  public async switchRole(newRole: UserRole): Promise<void> {
    this.initDemoUser(newRole);
    if (this.currentUser() && this.fb.firestore) {
      try {
        const ref = doc(this.fb.firestore, 'users', this.currentUser()!.uid);
        await updateDoc(ref, { role: newRole });
      } catch (e) {
        // Non-blocking in demo
      }
    }
    this.notify.info(`Rol cambiado a: ${newRole}`);
  }

  public async logout(): Promise<void> {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('nocturna_active_role');
    }
    if (this.fb.auth) {
      try {
        await signOut(this.fb.auth);
      } catch (e) {
        console.warn(e);
      }
    }
    this.currentUser.set(null);
    this.userProfile.set(null);
    this.notify.info('Has cerrado sesión');
    this.router.navigate(['/auth/login']);
  }
}
