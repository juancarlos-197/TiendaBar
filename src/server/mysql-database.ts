export interface MysqlRole {
  id: number;
  nombre: 'ADMIN' | 'BAR_OWNER' | 'USER';
  descripcion: string;
}

export interface MysqlEstado {
  id: number;
  nombre: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';
  color: string;
}

export interface MysqlBarAfiliado {
  id: number;
  nombre: string;
  ciudad: string;
}

export interface MysqlUsuarioRow {
  id: number;
  uid: string;
  display_name: string;
  email: string;
  role_id: number;
  estado_id: number;
  bar_id: number | null;
  phone: string;
  photo_url: string;
  registro: string;
  created_at: string;
}

export interface MysqlUsuarioJoined {
  id: number;
  uid: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'BAR_OWNER' | 'USER';
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';
  registro: string;
  barAsignado: string | null;
  phone: string;
  photoUrl: string;
  roleId: number;
  estadoId: number;
  barId: number | null;
}

export interface MysqlAuditoriaRow {
  id: number;
  usuario_id: number;
  accion: string;
  detalles: string;
  created_at: string;
}

// Master tables data
const ROLES: MysqlRole[] = [
  { id: 1, nombre: 'ADMIN', descripcion: 'Administrador con acceso total a gestión' },
  { id: 2, nombre: 'BAR_OWNER', descripcion: 'Dueño de bar o establecimiento nocturno' },
  { id: 3, nombre: 'USER', descripcion: 'Cliente regular o VIP de la vida nocturna' }
];

const ESTADOS: MysqlEstado[] = [
  { id: 1, nombre: 'ACTIVO', color: '#10b981' },
  { id: 2, nombre: 'INACTIVO', color: '#71717a' },
  { id: 3, nombre: 'SUSPENDIDO', color: '#f43f5e' },
  { id: 4, nombre: 'PENDIENTE', color: '#f59e0b' }
];

const BARES: MysqlBarAfiliado[] = [
  { id: 1, nombre: 'El Sotareño VIP', ciudad: 'Popayán' },
  { id: 2, nombre: 'Club Eclipse Popayán', ciudad: 'Popayán' },
  { id: 3, nombre: 'Sky Rooftop Lounge', ciudad: 'Popayán' },
  { id: 4, nombre: 'La Clandestina Terraza', ciudad: 'Popayán' }
];

// Rich Relational Initial Rows for MySQL
const EJEMPLOS_RELACIONALES_INICIALES: MysqlUsuarioRow[] = [
  {
    id: 1,
    uid: 'mysql-usr-001',
    display_name: 'J. Albán (Admin Global)',
    email: 'jalban.dacompsc@gmail.com',
    role_id: 1, // ADMIN
    estado_id: 1, // ACTIVO
    bar_id: null,
    phone: '+57 312 456 7890',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    registro: '2026-08-15',
    created_at: '2026-08-15 14:30:00'
  },
  {
    id: 2,
    uid: 'mysql-usr-002',
    display_name: 'Carlos Mendoza (Dueño Sotareño)',
    email: 'propietario@sotareno.bar',
    role_id: 2, // BAR_OWNER
    estado_id: 1, // ACTIVO
    bar_id: 1, // El Sotareño VIP
    phone: '+57 310 987 6543',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    registro: '2026-08-20',
    created_at: '2026-08-20 18:45:00'
  },
  {
    id: 3,
    uid: 'mysql-usr-003',
    display_name: 'Marcos Varela (Club Eclipse)',
    email: 'marcos@eclipse.club',
    role_id: 2, // BAR_OWNER
    estado_id: 1, // ACTIVO
    bar_id: 2, // Club Eclipse
    phone: '+57 315 222 3344',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    registro: '2026-08-28',
    created_at: '2026-08-28 22:10:00'
  },
  {
    id: 4,
    uid: 'mysql-usr-004',
    display_name: 'Camila Ríos (Clubber VIP)',
    email: 'camila.rios@gmail.com',
    role_id: 3, // USER
    estado_id: 1, // ACTIVO
    bar_id: null,
    phone: '+57 318 555 1234',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    registro: '2026-09-02',
    created_at: '2026-09-02 20:00:00'
  },
  {
    id: 5,
    uid: 'mysql-usr-005',
    display_name: 'Andrés Felipe Gómez',
    email: 'andres.pipe@hotmail.com',
    role_id: 3, // USER
    estado_id: 3, // SUSPENDIDO
    bar_id: null,
    phone: '+57 301 777 8899',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    registro: '2026-09-12',
    created_at: '2026-09-12 11:20:00'
  },
  {
    id: 6,
    uid: 'mysql-usr-006',
    display_name: 'Valeria Mosquera',
    email: 'valeria.m@outlook.com',
    role_id: 3, // USER
    estado_id: 4, // PENDIENTE
    bar_id: null,
    phone: '+57 311 333 4455',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    registro: '2026-09-24',
    created_at: '2026-09-24 16:05:00'
  },
  {
    id: 7,
    uid: 'mysql-usr-007',
    display_name: 'Mateo Salazar (Bartender & DJ)',
    email: 'mateo.dj@nocturna.club',
    role_id: 3, // USER
    estado_id: 1, // ACTIVO
    bar_id: 3, // Sky Rooftop Lounge
    phone: '+57 314 999 1122',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    registro: '2026-09-28',
    created_at: '2026-09-28 21:40:00'
  },
  {
    id: 8,
    uid: 'mysql-usr-008',
    display_name: 'Diana Carvajal (Promotora VIP)',
    email: 'diana.vip@nocturna.club',
    role_id: 2, // BAR_OWNER
    estado_id: 1, // ACTIVO
    bar_id: 4, // La Clandestina Terraza
    phone: '+57 320 888 4433',
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    registro: '2026-09-29',
    created_at: '2026-09-29 19:15:00'
  }
];

class MysqlRelationalEngine {
  private usuarios: MysqlUsuarioRow[] = [...EJEMPLOS_RELACIONALES_INICIALES];
  private roles: MysqlRole[] = [...ROLES];
  private estados: MysqlEstado[] = [...ESTADOS];
  private bares: MysqlBarAfiliado[] = [...BARES];
  private auditoria: MysqlAuditoriaRow[] = [];
  private nextId = 9;
  private nextAuditoriaId = 1;

  constructor() {
    this.logAuditoria(1, 'INICIALIZACION', 'Base de datos relacional MySQL inicializada con claves foráneas');
  }

  private logAuditoria(usuarioId: number, accion: string, detalles: string) {
    this.auditoria.unshift({
      id: this.nextAuditoriaId++,
      usuario_id: usuarioId,
      accion,
      detalles,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  }

  /**
   * Simulates:
   * SELECT
   *   u.id, u.uid, u.display_name, u.email,
   *   r.nombre AS role, e.nombre AS estado,
   *   b.nombre AS bar_asignado,
   *   u.phone, u.photo_url, u.registro
   * FROM usuarios u
   * INNER JOIN roles r ON u.role_id = r.id
   * INNER JOIN estados e ON u.estado_id = e.id
   * LEFT JOIN bares_afiliados b ON u.bar_id = b.id
   * ORDER BY u.id ASC;
   */
  public getJoinedUsers(): {
    query: string;
    count: number;
    rows: MysqlUsuarioJoined[];
  } {
    const executedSql = `
SELECT 
  u.id, 
  u.uid, 
  u.display_name AS displayName, 
  u.email, 
  r.nombre AS role, 
  e.nombre AS estado, 
  b.nombre AS barAsignado, 
  u.phone, 
  u.photo_url AS photoUrl, 
  u.registro,
  u.role_id AS roleId,
  u.estado_id AS estadoId,
  u.bar_id AS barId
FROM usuarios u
INNER JOIN roles r ON u.role_id = r.id
INNER JOIN estados e ON u.estado_id = e.id
LEFT JOIN bares_afiliados b ON u.bar_id = b.id
ORDER BY u.id ASC;`.trim();

    const joined: MysqlUsuarioJoined[] = this.usuarios.map(u => {
      const roleObj = this.roles.find(r => r.id === u.role_id) || this.roles[2];
      const estadoObj = this.estados.find(e => e.id === u.estado_id) || this.estados[0];
      const barObj = u.bar_id ? this.bares.find(b => b.id === u.bar_id) : null;

      return {
        id: u.id,
        uid: u.uid,
        displayName: u.display_name,
        email: u.email,
        role: roleObj.nombre,
        estado: estadoObj.nombre,
        registro: u.registro,
        barAsignado: barObj ? barObj.nombre : null,
        phone: u.phone,
        photoUrl: u.photo_url,
        roleId: u.role_id,
        estadoId: u.estado_id,
        barId: u.bar_id
      };
    });

    return {
      query: executedSql,
      count: joined.length,
      rows: joined
    };
  }

  /**
   * Relational INSERT with Foreign Key checks
   */
  public insertUser(data: {
    displayName: string;
    email: string;
    role: 'ADMIN' | 'BAR_OWNER' | 'USER';
    estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';
    phone?: string;
    barId?: number | null;
  }): { query: string; row: MysqlUsuarioJoined } {
    // Resolve Foreign Keys
    const roleRecord = this.roles.find(r => r.nombre === data.role) || this.roles[2];
    const estadoRecord = this.estados.find(e => e.nombre === data.estado) || this.estados[0];
    const barId = data.barId && this.bares.some(b => b.id === data.barId) ? data.barId : null;

    const newId = this.nextId++;
    const uid = 'mysql-usr-' + String(newId).padStart(3, '0');
    const registro = new Date().toISOString().split('T')[0];
    const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRow: MysqlUsuarioRow = {
      id: newId,
      uid,
      display_name: data.displayName,
      email: data.email,
      role_id: roleRecord.id,
      estado_id: estadoRecord.id,
      bar_id: barId,
      phone: data.phone || '',
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      registro,
      created_at: createdAt
    };

    this.usuarios.push(newRow);
    this.logAuditoria(newId, 'INSERT_USUARIO', `Creación de usuario con role_id=${roleRecord.id} (${roleRecord.nombre}) y estado_id=${estadoRecord.id}`);

    const sqlQuery = `
INSERT INTO usuarios (uid, display_name, email, role_id, estado_id, bar_id, phone, photo_url, registro, created_at)
VALUES ('${uid}', '${data.displayName}', '${data.email}', ${roleRecord.id}, ${estadoRecord.id}, ${barId || 'NULL'}, '${data.phone || ''}', '${newRow.photo_url}', '${registro}', '${createdAt}');`.trim();

    const barObj = barId ? this.bares.find(b => b.id === barId) : null;
    const joined: MysqlUsuarioJoined = {
      id: newRow.id,
      uid: newRow.uid,
      displayName: newRow.display_name,
      email: newRow.email,
      role: roleRecord.nombre,
      estado: estadoRecord.nombre,
      registro: newRow.registro,
      barAsignado: barObj ? barObj.nombre : null,
      phone: newRow.phone,
      photoUrl: newRow.photo_url,
      roleId: newRow.role_id,
      estadoId: newRow.estado_id,
      barId: newRow.bar_id
    };

    return {
      query: sqlQuery,
      row: joined
    };
  }

  /**
   * Relational UPDATE with Foreign Key verification
   */
  public updateUser(
    id: number,
    changes: {
      displayName?: string;
      email?: string;
      role?: 'ADMIN' | 'BAR_OWNER' | 'USER';
      estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';
      phone?: string;
      barId?: number | null;
    }
  ): { query: string; row: MysqlUsuarioJoined } | null {
    const idx = this.usuarios.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const row = this.usuarios[idx];

    if (changes.displayName !== undefined) row.display_name = changes.displayName;
    if (changes.email !== undefined) row.email = changes.email;
    if (changes.phone !== undefined) row.phone = changes.phone;

    if (changes.role !== undefined) {
      const r = this.roles.find(role => role.nombre === changes.role);
      if (r) row.role_id = r.id;
    }

    if (changes.estado !== undefined) {
      const e = this.estados.find(est => est.nombre === changes.estado);
      if (e) row.estado_id = e.id;
    }

    if (changes.barId !== undefined) {
      row.bar_id = changes.barId;
    }

    this.usuarios[idx] = row;
    this.logAuditoria(id, 'UPDATE_USUARIO', `Actualización de campos relacionales del usuario ID ${id}`);

    const sqlQuery = `
UPDATE usuarios 
SET 
  display_name = '${row.display_name}',
  email = '${row.email}',
  role_id = ${row.role_id},
  estado_id = ${row.estado_id},
  bar_id = ${row.bar_id || 'NULL'},
  phone = '${row.phone}'
WHERE id = ${id};`.trim();

    const roleObj = this.roles.find(r => r.id === row.role_id) || this.roles[2];
    const estadoObj = this.estados.find(e => e.id === row.estado_id) || this.estados[0];
    const barObj = row.bar_id ? this.bares.find(b => b.id === row.bar_id) : null;

    return {
      query: sqlQuery,
      row: {
        id: row.id,
        uid: row.uid,
        displayName: row.display_name,
        email: row.email,
        role: roleObj.nombre,
        estado: estadoObj.nombre,
        registro: row.registro,
        barAsignado: barObj ? barObj.nombre : null,
        phone: row.phone,
        photoUrl: row.photo_url,
        roleId: row.role_id,
        estadoId: row.estado_id,
        barId: row.bar_id
      }
    };
  }

  /**
   * Relational DELETE with foreign key audit log
   */
  public deleteUser(id: number): { query: string; deleted: boolean } {
    const idx = this.usuarios.findIndex(u => u.id === id);
    if (idx === -1) return { query: `DELETE FROM usuarios WHERE id = ${id};`, deleted: false };

    this.usuarios.splice(idx, 1);
    this.logAuditoria(id, 'DELETE_USUARIO', `Eliminación física del registro con clave primaria ID ${id}`);

    return {
      query: `DELETE FROM usuarios WHERE id = ${id};`,
      deleted: true
    };
  }

  /**
   * Resets and seeds example data in MySQL
   */
  public seedDatabase(): { query: string; count: number } {
    this.usuarios = JSON.parse(JSON.stringify(EJEMPLOS_RELACIONALES_INICIALES));
    this.nextId = 9;
    this.logAuditoria(0, 'SEED_EJEMPLOS', 'Poblado completo de tablas relacionales con 8 ejemplos de usuarios');

    return {
      query: `
-- SEED DE TABLAS RELACIONALES MYSQL
TRUNCATE TABLE usuarios;
INSERT INTO usuarios (id, uid, display_name, email, role_id, estado_id, bar_id, phone, photo_url, registro)
VALUES
  (1, 'mysql-usr-001', 'J. Albán (Admin Global)', 'jalban.dacompsc@gmail.com', 1, 1, NULL, '+57 312 456 7890', '...', '2026-08-15'),
  (2, 'mysql-usr-002', 'Carlos Mendoza (Dueño Sotareño)', 'propietario@sotareno.bar', 2, 1, 1, '+57 310 987 6543', '...', '2026-08-20'),
  (3, 'mysql-usr-003', 'Marcos Varela (Club Eclipse)', 'marcos@eclipse.club', 2, 1, 2, '+57 315 222 3344', '...', '2026-08-28'),
  (4, 'mysql-usr-004', 'Camila Ríos (Clubber VIP)', 'camila.rios@gmail.com', 3, 1, NULL, '+57 318 555 1234', '...', '2026-09-02'),
  (5, 'mysql-usr-005', 'Andrés Felipe Gómez', 'andres.pipe@hotmail.com', 3, 3, NULL, '+57 301 777 8899', '...', '2026-09-12'),
  (6, 'mysql-usr-006', 'Valeria Mosquera', 'valeria.m@outlook.com', 3, 4, NULL, '+57 311 333 4455', '...', '2026-09-24'),
  (7, 'mysql-usr-007', 'Mateo Salazar (Bartender & DJ)', 'mateo.dj@nocturna.club', 3, 1, 3, '+57 314 999 1122', '...', '2026-09-28'),
  (8, 'mysql-usr-008', 'Diana Carvajal (Promotora VIP)', 'diana.vip@nocturna.club', 2, 1, 4, '+57 320 888 4433', '...', '2026-09-29');`.trim(),
      count: this.usuarios.length
    };
  }

  /**
   * Returns MySQL DDL schema
   */
  public getDdlScript(): string {
    return `
-- =======================================================
-- ESQUEMA RELACIONAL MYSQL - NOCTURNA PLATFORM
-- Motor de Almacenamiento: InnoDB (Transaccional / FK)
-- Cotejamiento: utf8mb4_unicode_ci
-- =======================================================

CREATE DATABASE IF NOT EXISTS nocturna_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nocturna_db;

-- 1. Tabla de Catálogo: Roles (1:N con usuarios)
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  INDEX idx_roles_nombre (nombre)
) ENGINE=InnoDB;

-- 2. Tabla de Catálogo: Estados (1:N con usuarios)
CREATE TABLE IF NOT EXISTS estados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL,
  INDEX idx_estados_nombre (nombre)
) ENGINE=InnoDB;

-- 3. Tabla Entidad: Bares Afiliados (1:N con usuarios administradores)
CREATE TABLE IF NOT EXISTS bares_afiliados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(80) NOT NULL DEFAULT 'Popayán'
) ENGINE=InnoDB;

-- 4. Tabla Principal: Usuarios con Integridad Referencial
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  role_id INT NOT NULL,
  estado_id INT NOT NULL,
  bar_id INT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  registro DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Restricciones de Clave Foránea (FK)
  CONSTRAINT fk_usuario_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_usuario_estado
    FOREIGN KEY (estado_id) REFERENCES estados(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_usuario_bar
    FOREIGN KEY (bar_id) REFERENCES bares_afiliados(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_usuarios_email (email),
  INDEX idx_usuarios_role_id (role_id),
  INDEX idx_usuarios_estado_id (estado_id)
) ENGINE=InnoDB;

-- 5. Tabla de Auditoría: Bitácora de Operaciones SQL
CREATE TABLE IF NOT EXISTS auditoria_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  accion VARCHAR(50) NOT NULL,
  detalles TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;`.trim();
  }

  public getAuditoria(): MysqlAuditoriaRow[] {
    return this.auditoria.slice(0, 20);
  }

  public getBares(): MysqlBarAfiliado[] {
    return this.bares;
  }
}

export const mysqlEngine = new MysqlRelationalEngine();
