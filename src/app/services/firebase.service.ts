import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocFromServer,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { Item, Loan, Movement, UserRecord, UserRole } from '../models/types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private platformId = inject(PLATFORM_ID);
  public isBrowser = isPlatformBrowser(this.platformId);

  public app: FirebaseApp | null = null;
  public auth: Auth | null = null;
  public db: Firestore | null = null;

  // Reactive state
  public currentUser = signal<FirebaseUser | null>(null);
  public currentUserProfile = signal<UserRecord | null>(null);
  public isAuthLoading = signal<boolean>(true);

  public items = signal<Item[]>([]);
  public loans = signal<Loan[]>([]);
  public users = signal<UserRecord[]>([]);
  public movements = signal<Movement[]>([]);
  public isDataLoading = signal<boolean>(false);

  private unsubscribes: Unsubscribe[] = [];

  constructor() {
    if (this.isBrowser) {
      this.initFirebase();
    } else {
      this.isAuthLoading.set(false);
    }
  }

  private initFirebase() {
    try {
      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
      this.auth = getAuth(this.app);

      // Validate connection to firestore test document as requested by skill
      this.testConnection();

      // Setup auth state listener
      onAuthStateChanged(this.auth, async (user) => {
        this.currentUser.set(user);
        if (user) {
          await this.syncUserProfile(user);
          this.subscribeToRealtimeData();
        } else {
          this.currentUserProfile.set(null);
          this.clearSubscriptions();
          // Fallback demo/public data if desired or keep ready
          this.subscribeToRealtimeData();
        }
        this.isAuthLoading.set(false);
      });
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      this.isAuthLoading.set(false);
    }
  }

  private async testConnection() {
    if (!this.db) return;
    try {
      await getDocFromServer(doc(this.db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }

  public handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
    const authUser = this.auth?.currentUser;
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: authUser?.uid,
        email: authUser?.email,
        emailVerified: authUser?.emailVerified,
        isAnonymous: authUser?.isAnonymous,
        tenantId: authUser?.tenantId,
        providerInfo:
          authUser?.providerData?.map((provider) => ({
            providerId: provider.providerId,
            email: provider.email,
          })) || [],
      },
      operationType,
      path,
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  private async syncUserProfile(user: FirebaseUser): Promise<UserRecord> {
    if (!this.db) throw new Error('Firestore not initialized');
    const userDocRef = doc(this.db, 'users', user.uid);
    const path = `users/${user.uid}`;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserRecord;
        this.currentUserProfile.set(data);
        return data;
      } else {
        // Automatically give admin role if user email is jalban.dacompsc@gmail.com
        const isAdmin = user.email?.toLowerCase() === 'jalban.dacompsc@gmail.com';
        const newProfile: UserRecord = {
          id: user.uid,
          email: user.email || 'sin-correo@sistema.local',
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          role: isAdmin ? 'admin' : 'operador',
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        this.currentUserProfile.set(newProfile);
        return newProfile;
      }
    } catch (err) {
      this.handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // --- Real-time Firestore Subscriptions ---
  public subscribeToRealtimeData() {
    if (!this.db) return;
    this.clearSubscriptions();
    this.isDataLoading.set(true);

    // 1. Items subscription
    const itemsPath = 'items';
    try {
      const unsubItems = onSnapshot(
        collection(this.db, itemsPath),
        (snapshot) => {
          const loadedItems: Item[] = [];
          snapshot.forEach((d) => loadedItems.push({ ...(d.data() as Item), id: d.id }));
          loadedItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          this.items.set(loadedItems);
          this.isDataLoading.set(false);
          // Check if database is empty to optionally seed initial items
          if (loadedItems.length === 0) {
            this.seedSampleDataIfNeeded();
          }
        },
        (error) => {
          this.handleFirestoreError(error, OperationType.GET, itemsPath);
        }
      );
      this.unsubscribes.push(unsubItems);
    } catch (e) {
      console.error('Subscription error for items:', e);
    }

    // 2. Loans subscription
    const loansPath = 'loans';
    try {
      const unsubLoans = onSnapshot(
        collection(this.db, loansPath),
        (snapshot) => {
          const loadedLoans: Loan[] = [];
          const nowIsoDate = new Date().toISOString().split('T')[0];
          snapshot.forEach((d) => {
            const loan = { ...(d.data() as Loan), id: d.id };
            // Recalculate if status is active but past due date
            if (loan.status === 'activo' && loan.dueDate < nowIsoDate) {
              loan.status = 'vencido';
            }
            loadedLoans.push(loan);
          });
          loadedLoans.sort((a, b) => (b.loanDate || '').localeCompare(a.loanDate || ''));
          this.loans.set(loadedLoans);
        },
        (error) => {
          this.handleFirestoreError(error, OperationType.GET, loansPath);
        }
      );
      this.unsubscribes.push(unsubLoans);
    } catch (e) {
      console.error('Subscription error for loans:', e);
    }

    // 3. Users subscription
    const usersPath = 'users';
    try {
      const unsubUsers = onSnapshot(
        collection(this.db, usersPath),
        (snapshot) => {
          const loadedUsers: UserRecord[] = [];
          snapshot.forEach((d) => loadedUsers.push({ ...(d.data() as UserRecord), id: d.id }));
          this.users.set(loadedUsers);
        },
        (error) => {
          this.handleFirestoreError(error, OperationType.GET, usersPath);
        }
      );
      this.unsubscribes.push(unsubUsers);
    } catch (e) {
      console.error('Subscription error for users:', e);
    }

    // 4. Movements subscription
    const movementsPath = 'movements';
    try {
      const q = query(collection(this.db, movementsPath), orderBy('timestamp', 'desc'), limit(30));
      const unsubMovements = onSnapshot(
        q,
        (snapshot) => {
          const loadedMovements: Movement[] = [];
          snapshot.forEach((d) => loadedMovements.push({ ...(d.data() as Movement), id: d.id }));
          this.movements.set(loadedMovements);
        },
        (error) => {
          this.handleFirestoreError(error, OperationType.GET, movementsPath);
        }
      );
      this.unsubscribes.push(unsubMovements);
    } catch (e) {
      console.error('Subscription error for movements:', e);
    }
  }

  private clearSubscriptions() {
    this.unsubscribes.forEach((unsub) => unsub());
    this.unsubscribes = [];
  }

  // --- Authentication methods ---
  public async registerWithEmail(email: string, pass: string, name: string, role: UserRole = 'operador') {
    if (!this.auth || !this.db) throw new Error('Firebase no está disponible');
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    const userProfile: UserRecord = {
      id: user.uid,
      email: user.email!,
      displayName: name,
      role: email.toLowerCase() === 'jalban.dacompsc@gmail.com' ? 'admin' : role,
      createdAt: new Date().toISOString(),
    };

    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(this.db, 'users', user.uid), userProfile);
      this.currentUserProfile.set(userProfile);
      await this.recordMovement({
        type: 'item_created',
        title: 'Nuevo Usuario Registrado',
        description: `Usuario ${name} (${email}) registrado con rol ${userProfile.role}`,
        performedBy: name,
      });
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, path);
    }
    return userProfile;
  }

  public async loginWithEmail(email: string, pass: string) {
    if (!this.auth) throw new Error('Firebase Auth no disponible');
    const userCred = await signInWithEmailAndPassword(this.auth, email, pass);
    if (this.db) {
      await this.syncUserProfile(userCred.user);
    }
    return userCred.user;
  }

  public async loginWithGoogle() {
    if (!this.auth || !this.db) throw new Error('Firebase Auth no disponible');
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(this.auth, provider);
    await this.syncUserProfile(userCred.user);
    return userCred.user;
  }

  public async sendPasswordReset(email: string) {
    if (!this.auth) throw new Error('Firebase Auth no disponible');
    await sendPasswordResetEmail(this.auth, email);
  }

  public async logout() {
    if (!this.auth) return;
    await signOut(this.auth);
    this.currentUser.set(null);
    this.currentUserProfile.set(null);
  }

  // --- Inventory Items Operations ---
  public async addItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const path = 'items';
    const id = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newItem: Item = {
      ...itemData,
      id,
      availableCopies: Number(itemData.availableCopies),
      totalCopies: Number(itemData.totalCopies),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(this.db, 'items', id), newItem);
      await this.recordMovement({
        type: 'item_created',
        title: `Alta en ${newItem.type === 'bar' ? 'Bar' : 'Tienda'}: ${newItem.title}`,
        description: `${newItem.availableCopies} ejemplares/unidades registradas (${newItem.category} - ${newItem.author})`,
        performedBy: this.currentUserProfile()?.displayName || this.currentUser()?.email || 'Operador',
        relatedId: id,
      });
      return newItem;
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
    }
  }

  public async updateItem(id: string, updates: Partial<Item>) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const path = `items/${id}`;
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(this.db, 'items', id), payload);
      await this.recordMovement({
        type: 'item_updated',
        title: `Actualización: ${updates.title || 'Artículo ' + id}`,
        description: `Modificación de datos o existencias en el inventario`,
        performedBy: this.currentUserProfile()?.displayName || this.currentUser()?.email || 'Operador',
        relatedId: id,
      });
    } catch (err) {
      this.handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  public async deleteItem(id: string, title?: string) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const path = `items/${id}`;
    try {
      await deleteDoc(doc(this.db, 'items', id));
      await this.recordMovement({
        type: 'item_deleted',
        title: `Baja de inventario: ${title || id}`,
        description: `El artículo ha sido eliminado del catálogo`,
        performedBy: this.currentUserProfile()?.displayName || this.currentUser()?.email || 'Operador',
        relatedId: id,
      });
    } catch (err) {
      this.handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Loans Operations ---
  public async createLoan(params: {
    itemId: string;
    userId: string;
    userName: string;
    userEmail: string;
    loanDate: string;
    dueDate: string;
    notes?: string;
  }) {
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Find the item to check stock
    const item = this.items().find((i) => i.id === params.itemId);
    if (!item) throw new Error('El artículo seleccionado no existe');
    if (item.availableCopies <= 0) {
      throw new Error(`No hay unidades disponibles de "${item.title}". Stock actual: 0.`);
    }

    const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const isOverdueAlready = params.dueDate < today;

    const newLoan: Loan = {
      id: loanId,
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      itemCoverUrl: item.coverUrl,
      itemIsbn: item.isbn,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      loanDate: params.loanDate || today,
      dueDate: params.dueDate,
      status: isOverdueAlready ? 'vencido' : 'activo',
      notes: params.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const loanPath = `loans/${loanId}`;
    try {
      // 1. Create loan
      await setDoc(doc(this.db, 'loans', loanId), newLoan);

      // 2. Decrement available copies
      const newAvailable = Math.max(0, item.availableCopies - 1);
      await updateDoc(doc(this.db, 'items', item.id), {
        availableCopies: newAvailable,
        updatedAt: nowIso,
      });

      // 3. Record movement
      await this.recordMovement({
        type: 'loan_created',
        title: `Préstamo Registrado: ${item.title}`,
        description: `Entregado a ${params.userName} (${params.userEmail}). Vence el ${params.dueDate}`,
        performedBy: this.currentUserProfile()?.displayName || this.currentUser()?.email || 'Operador',
        relatedId: loanId,
      });

      return newLoan;
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, loanPath);
    }
  }

  public async returnLoan(loanId: string, notes?: string) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const loan = this.loans().find((l) => l.id === loanId);
    if (!loan) throw new Error('El préstamo no fue encontrado');
    if (loan.status === 'devuelto') throw new Error('Este préstamo ya fue marcado como devuelto');

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const loanPath = `loans/${loanId}`;
    try {
      // 1. Update loan status to 'devuelto'
      await updateDoc(doc(this.db, 'loans', loanId), {
        status: 'devuelto',
        returnDate: today,
        notes: notes ? `${loan.notes ? loan.notes + ' | ' : ''}${notes}` : loan.notes,
        updatedAt: nowIso,
      });

      // 2. Re-increment available copies on the item
      const item = this.items().find((i) => i.id === loan.itemId);
      if (item) {
        const restoredCopies = Math.min(item.totalCopies, item.availableCopies + 1);
        await updateDoc(doc(this.db, 'items', item.id), {
          availableCopies: restoredCopies,
          updatedAt: nowIso,
        });
      }

      // 3. Record movement
      await this.recordMovement({
        type: 'loan_returned',
        title: `Devolución Completada: ${loan.itemTitle}`,
        description: `Devuelto por ${loan.userName}. Reintegrado al stock disponible de ${loan.itemType === 'bar' ? 'Bar' : 'Tienda'}.`,
        performedBy: this.currentUserProfile()?.displayName || this.currentUser()?.email || 'Operador',
        relatedId: loanId,
      });
    } catch (err) {
      this.handleFirestoreError(err, OperationType.UPDATE, loanPath);
    }
  }

  // --- Users & Roles Management ---
  public async updateUserRole(userId: string, newRole: UserRole) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const userPath = `users/${userId}`;
    try {
      await updateDoc(doc(this.db, 'users', userId), { role: newRole });
      await this.recordMovement({
        type: 'item_updated',
        title: `Rol Actualizado`,
        description: `Se cambió el rol del usuario a "${newRole}"`,
        performedBy: this.currentUserProfile()?.displayName || 'Admin',
        relatedId: userId,
      });
    } catch (err) {
      this.handleFirestoreError(err, OperationType.UPDATE, userPath);
    }
  }

  public async deleteUser(userId: string) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const userPath = `users/${userId}`;
    try {
      await deleteDoc(doc(this.db, 'users', userId));
    } catch (err) {
      this.handleFirestoreError(err, OperationType.DELETE, userPath);
    }
  }

  // --- Audit / Movement Logger ---
  public async recordMovement(params: {
    type: Movement['type'];
    title: string;
    description: string;
    performedBy: string;
    relatedId?: string;
  }) {
    if (!this.db) return;
    const moveId = 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const movement: Movement = {
      id: moveId,
      type: params.type,
      title: params.title,
      description: params.description,
      performedBy: params.performedBy,
      timestamp: new Date().toISOString(),
      relatedId: params.relatedId,
    };
    try {
      await setDoc(doc(this.db, 'movements', moveId), movement);
    } catch (err) {
      console.warn('Failed to record movement:', err);
    }
  }

  // --- Initial Data Seeder for Tienda & Bar ---
  public async seedSampleDataIfNeeded() {
    // Only seed if there are genuinely 0 items
    if (this.items().length > 0) return;
    await this.seedFullDemoData();
  }

  public async seedFullDemoData() {
    if (!this.db) return;

    const sampleItems: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // BAR
      {
        type: 'bar',
        title: 'Gin Hendrick’s Orbium Edición Botánica',
        author: 'Hendrick’s Gin Distillery',
        category: 'Destilados & Ginebras',
        isbn: 'BAR-GIN-849102',
        availableCopies: 4,
        totalCopies: 6,
        coverUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
        description: 'Ginebra infusionada con quinina, ajenjo y flor de loto. Especial para coctelería de autor.',
        location: 'Vitrina Bar Principal - Nivel 2',
        price: 45.0,
      },
      {
        type: 'bar',
        title: 'Set Coctelería Boston Profesional Acero Cobre',
        author: 'BarCraft Artisans',
        category: 'Cristalería & Menaje',
        isbn: 'BAR-EQP-001294',
        availableCopies: 2,
        totalCopies: 5,
        coverUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        description: 'Kit completo de barware para bartenders: coctelera boston, colador julep, jigger doble y cuchara trenzada.',
        location: 'Armario Utensilios Bar - Caja 04',
        price: 85.0,
      },
      {
        type: 'bar',
        title: 'Vino Tinto Gran Reserva Malbec 2018',
        author: 'Bodega Catena Zapata',
        category: 'Vinos & Licores',
        isbn: 'BAR-VIN-990312',
        availableCopies: 8,
        totalCopies: 12,
        coverUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
        description: 'Crianza en barricas de roble francés durante 24 meses. Notas a moras, cacao y vainilla.',
        location: 'Cava Climatizada - Estante 3B',
        price: 68.0,
      },
      {
        type: 'bar',
        title: 'Whisky Single Malt Macallan 12 Años Double Cask',
        author: 'The Macallan Distillery',
        category: 'Destilados & Whiskies',
        isbn: 'BAR-WHI-771239',
        availableCopies: 1,
        totalCopies: 3,
        coverUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&auto=format&fit=crop&q=80',
        description: 'Madurado en barricas seleccionadas de roble americano y europeo sazonadas con jerez.',
        location: 'Vitrina de Seguridad Bar',
        price: 95.0,
      },
      // TIENDA
      {
        type: 'tienda',
        title: 'La Guía Definitiva del Sommelier Moderno',
        author: 'François Dupuis & Ferran Adrià',
        category: 'Libros & Enología',
        isbn: '978-84-415-4201-9',
        availableCopies: 3,
        totalCopies: 5,
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
        description: 'Manual de cata, maridaje y gestión de bodega para profesionales y amantes del vino.',
        location: 'Tienda - Estantería Libros 1A',
        price: 34.5,
      },
      {
        type: 'tienda',
        title: 'Juego de Copas Riedel Vinum Burdeos (Pack 4)',
        author: 'Riedel Crystal Austria',
        category: 'Cristalería & Menaje',
        isbn: 'TND-RIE-402911',
        availableCopies: 1,
        totalCopies: 4,
        coverUrl: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&auto=format&fit=crop&q=80',
        description: 'Copas de cristal fino calibradas para potenciar aromas y taninos de vinos tintos con cuerpo.',
        location: 'Tienda - Vitrina Cristal 2',
        price: 110.0,
      },
      {
        type: 'tienda',
        title: 'Delantal de Cuero Premium & Denim para Barista y Bartender',
        author: 'Craftsman Studio Barcelona',
        category: 'Merchandising & Textil',
        isbn: 'TND-APR-558291',
        availableCopies: 5,
        totalCopies: 8,
        coverUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
        description: 'Delantal resistente con correas cruzadas de cuero genuino, bolsillos porta-herramientas y remaches reforzados.',
        location: 'Tienda - Perchero Textil',
        price: 52.0,
      },
      {
        type: 'tienda',
        title: 'Enciclopedia de Cócteles Clásicos & Contemporáneos',
        author: 'David Wondrich',
        category: 'Libros & Coctelería',
        isbn: '978-0-19-931068-5',
        availableCopies: 4,
        totalCopies: 6,
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        description: 'Historia detallada, recetas originales y técnicas avanzadas de coctelería internacional.',
        location: 'Tienda - Estantería Libros 1B',
        price: 42.0,
      },
    ];

    try {
      const addedItemIds: { id: string; title: string; type: 'tienda' | 'bar'; coverUrl: string; isbn: string }[] = [];

      for (const item of sampleItems) {
        const id = 'item_' + Math.random().toString(36).substring(2, 9);
        const now = new Date().toISOString();
        const fullItem: Item = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(this.db, 'items', id), fullItem);
        addedItemIds.push({
          id,
          title: item.title,
          type: item.type,
          coverUrl: item.coverUrl,
          isbn: item.isbn,
        });
      }

      // Sample users for demo
      const sampleUsers: UserRecord[] = [
        {
          id: 'user_carlos_m',
          displayName: 'Carlos Mendoza Ruiz',
          email: 'carlos.mendoza@empresa.com',
          role: 'operador',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user_valeria_g',
          displayName: 'Valeria Gómez Salcedo',
          email: 'valeria.sommelier@bodega.com',
          role: 'cliente',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user_andres_p',
          displayName: 'Andrés Paredes Silva',
          email: 'andres.bartender@coctel.com',
          role: 'cliente',
          createdAt: new Date().toISOString(),
        },
      ];

      for (const u of sampleUsers) {
        await setDoc(doc(this.db, 'users', u.id), u);
      }

      // Sample Loans (including active, OVERDUE, and returned for testing visual alerts!)
      const today = new Date();
      const pastDate1 = new Date(today);
      pastDate1.setDate(today.getDate() - 10);
      const overdueLimit = new Date(today);
      overdueLimit.setDate(today.getDate() - 3); // 3 days overdue!

      const pastDate2 = new Date(today);
      pastDate2.setDate(today.getDate() - 4);
      const nearDueLimit = new Date(today);
      nearDueLimit.setDate(today.getDate() + 1); // 1 day remaining!

      const pastDate3 = new Date(today);
      pastDate3.setDate(today.getDate() - 2);
      const futureDueLimit = new Date(today);
      futureDueLimit.setDate(today.getDate() + 8); // 8 days remaining!

      const sampleLoans: Loan[] = [
        // 1. OVERDUE LOAN (Alerta visual roja para probar inmediatamente)
        {
          id: 'loan_sample_overdue_1',
          itemId: addedItemIds[1]?.id || 'item_1',
          itemTitle: addedItemIds[1]?.title || 'Set Coctelería Boston Profesional Acero Cobre',
          itemType: addedItemIds[1]?.type || 'bar',
          itemCoverUrl: addedItemIds[1]?.coverUrl,
          itemIsbn: addedItemIds[1]?.isbn,
          userId: 'user_andres_p',
          userName: 'Andrés Paredes Silva',
          userEmail: 'andres.bartender@coctel.com',
          loanDate: pastDate1.toISOString().split('T')[0],
          dueDate: overdueLimit.toISOString().split('T')[0],
          status: 'vencido',
          notes: 'Préstamo para evento especial de coctelería en terraza VIP.',
          createdAt: pastDate1.toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // 2. NEAR DUE LOAN (Alerta visual ámbar)
        {
          id: 'loan_sample_act_1',
          itemId: addedItemIds[4]?.id || 'item_4',
          itemTitle: addedItemIds[4]?.title || 'La Guía Definitiva del Sommelier Moderno',
          itemType: addedItemIds[4]?.type || 'tienda',
          itemCoverUrl: addedItemIds[4]?.coverUrl,
          itemIsbn: addedItemIds[4]?.isbn,
          userId: 'user_valeria_g',
          userName: 'Valeria Gómez Salcedo',
          userEmail: 'valeria.sommelier@bodega.com',
          loanDate: pastDate2.toISOString().split('T')[0],
          dueDate: nearDueLimit.toISOString().split('T')[0],
          status: 'activo',
          notes: 'Consulta para examen de certificación de cata.',
          createdAt: pastDate2.toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // 3. REGULAR ACTIVE LOAN
        {
          id: 'loan_sample_act_2',
          itemId: addedItemIds[0]?.id || 'item_0',
          itemTitle: addedItemIds[0]?.title || 'Gin Hendrick’s Orbium Edición Botánica',
          itemType: addedItemIds[0]?.type || 'bar',
          itemCoverUrl: addedItemIds[0]?.coverUrl,
          itemIsbn: addedItemIds[0]?.isbn,
          userId: 'user_carlos_m',
          userName: 'Carlos Mendoza Ruiz',
          userEmail: 'carlos.mendoza@empresa.com',
          loanDate: pastDate3.toISOString().split('T')[0],
          dueDate: futureDueLimit.toISOString().split('T')[0],
          status: 'activo',
          notes: 'Muestra para cata guiada con clientes corporativos.',
          createdAt: pastDate3.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const loan of sampleLoans) {
        await setDoc(doc(this.db, 'loans', loan.id), loan);
      }

      // Initial Movements log
      await this.recordMovement({
        type: 'loan_created',
        title: 'Préstamo Demorado (Vencido)',
        description: `Set Coctelería Boston asignado a Andrés Paredes (Fecha límite excedida)`,
        performedBy: 'Sistema Central',
      });
      await this.recordMovement({
        type: 'item_created',
        title: 'Inventario Inicial Configurado',
        description: 'Carga inicial de 8 productos destacados para Tienda y Bar',
        performedBy: 'Administrador',
      });
    } catch (e) {
      console.error('Error seeding data:', e);
    }
  }
}
