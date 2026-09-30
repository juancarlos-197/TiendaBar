export type UserRole = 'ADMIN' | 'BAR_OWNER' | 'USER';
export type UserEstado = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';

export interface UserProfile {
  uid: string;
  displayName: string;
  name: string;
  email: string;
  role: UserRole;
  estado: UserEstado;
  active: boolean;
  registro: string;
  createdAt?: string;
  photoUrl?: string;
  phone?: string;
}
