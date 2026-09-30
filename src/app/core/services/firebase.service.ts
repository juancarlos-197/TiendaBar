import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import {
  Firestore,
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import { environment } from '../../../environments/environment';

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
  providedIn: 'root'
})
export class FirebaseService {
  private readonly platformId = inject(PLATFORM_ID);
  public app: FirebaseApp | null = null;
  public firestore: Firestore | null = null;
  public auth: Auth | null = null;
  public isInitialized = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFirebase();
    }
  }

  private initFirebase() {
    try {
      const apps = getApps();
      this.app = apps.length ? apps[0] : initializeApp(environment.firebase);
      
      // CRITICAL: Must pass database ID as per firebase-applet-config
      this.firestore = getFirestore(this.app, environment.firebase.firestoreDatabaseId);
      this.auth = getAuth(this.app);
      this.isInitialized = true;
      
      // Test server connection as mandated
      this.testConnection();
    } catch (err) {
      console.warn('Firebase initialization error in browser:', err);
    }
  }

  public async testConnection(): Promise<void> {
    if (!this.firestore) return;
    try {
      await getDocFromServer(doc(this.firestore, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }

  public handleError(error: unknown, operationType: OperationType, path: string | null): never {
    const authUser = this.auth?.currentUser;
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: authUser?.uid,
        email: authUser?.email,
        emailVerified: authUser?.emailVerified,
        isAnonymous: authUser?.isAnonymous,
        tenantId: authUser?.tenantId,
        providerInfo: authUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}
