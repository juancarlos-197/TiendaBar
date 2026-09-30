import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { mysqlEngine } from './server/mysql-database';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Express JSON body parser for API requests
app.use(express.json());

// In-Memory store for Users backed by Node & Express
interface ServerUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'BAR_OWNER' | 'USER';
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'PENDIENTE';
  registro: string;
  photoUrl?: string;
  phone?: string;
}

const usersDatabase: ServerUser[] = [
  {
    uid: 'usr-admin-001',
    displayName: 'J. Albán (Admin Global)',
    email: 'jalban.dacompsc@gmail.com',
    role: 'ADMIN',
    estado: 'ACTIVO',
    registro: '2026-08-15',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '+57 312 456 7890'
  },
  {
    uid: 'usr-owner-002',
    displayName: 'Carlos Mendoza',
    email: 'propietario@sotareno.bar',
    role: 'BAR_OWNER',
    estado: 'ACTIVO',
    registro: '2026-08-20',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    phone: '+57 310 987 6543'
  },
  {
    uid: 'usr-owner-003',
    displayName: 'Marcos Varela (Club Eclipse)',
    email: 'marcos@eclipse.club',
    role: 'BAR_OWNER',
    estado: 'ACTIVO',
    registro: '2026-08-28',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    phone: '+57 315 222 3344'
  },
  {
    uid: 'usr-client-004',
    displayName: 'Camila Ríos',
    email: 'camila.rios@gmail.com',
    role: 'USER',
    estado: 'ACTIVO',
    registro: '2026-09-02',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    phone: '+57 318 555 1234'
  },
  {
    uid: 'usr-client-005',
    displayName: 'Andrés Felipe Gómez',
    email: 'andres.pipe@hotmail.com',
    role: 'USER',
    estado: 'SUSPENDIDO',
    registro: '2026-09-12',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    phone: '+57 301 777 8899'
  },
  {
    uid: 'usr-client-006',
    displayName: 'Valeria Mosquera',
    email: 'valeria.m@outlook.com',
    role: 'USER',
    estado: 'PENDIENTE',
    registro: '2026-09-24',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    phone: '+57 311 333 4455'
  }
];

// --- Node Express Rest API Endpoints ---
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    count: usersDatabase.length,
    data: usersDatabase
  });
});

app.post('/api/users', (req, res): void => {
  const { displayName, email, role, estado, phone, photoUrl } = req.body;
  if (!displayName || !email) {
    res.status(400).json({ success: false, message: 'displayName y email son requeridos.' });
    return;
  }

  const newUser: ServerUser = {
    uid: 'usr-' + Math.random().toString(36).substring(2, 9),
    displayName,
    email,
    role: role || 'USER',
    estado: estado || 'ACTIVO',
    registro: new Date().toISOString().split('T')[0],
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    phone: phone || ''
  };

  usersDatabase.unshift(newUser);
  res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', data: newUser });
  return;
});

app.patch('/api/users/:uid', (req, res): void => {
  const { uid } = req.params;
  const index = usersDatabase.findIndex(u => u.uid === uid);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return;
  }

  const current = usersDatabase[index];
  const updated: ServerUser = {
    ...current,
    ...(req.body.displayName !== undefined && { displayName: req.body.displayName }),
    ...(req.body.email !== undefined && { email: req.body.email }),
    ...(req.body.role !== undefined && { role: req.body.role }),
    ...(req.body.estado !== undefined && { estado: req.body.estado }),
    ...(req.body.phone !== undefined && { phone: req.body.phone }),
    ...(req.body.photoUrl !== undefined && { photoUrl: req.body.photoUrl })
  };

  usersDatabase[index] = updated;
  res.json({ success: true, message: 'Usuario actualizado correctamente', data: updated });
  return;
});

app.delete('/api/users/:uid', (req, res): void => {
  const { uid } = req.params;
  const index = usersDatabase.findIndex(u => u.uid === uid);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return;
  }

  const removed = usersDatabase.splice(index, 1);
  res.json({ success: true, message: 'Usuario eliminado del sistema', data: removed[0] });
  return;
});

// --- MySQL Relational Database Endpoints ---
app.get('/api/mysql/users', (req, res): void => {
  const result = mysqlEngine.getJoinedUsers();
  res.json({
    success: true,
    engine: 'MySQL 8.0 (InnoDB)',
    query: result.query,
    count: result.count,
    data: result.rows
  });
  return;
});

app.post('/api/mysql/users', (req, res): void => {
  const { displayName, email, role, estado, phone, barId } = req.body;
  if (!displayName || !email) {
    res.status(400).json({ success: false, message: 'displayName y email son obligatorios en MySQL' });
    return;
  }

  const result = mysqlEngine.insertUser({
    displayName,
    email,
    role: role || 'USER',
    estado: estado || 'ACTIVO',
    phone,
    barId: barId ? Number(barId) : null
  });

  res.status(201).json({
    success: true,
    message: 'Usuario insertado en tabla relacional usuarios (MySQL)',
    query: result.query,
    data: result.row
  });
  return;
});

app.patch('/api/mysql/users/:id', (req, res): void => {
  const id = Number(req.params.id);
  const result = mysqlEngine.updateUser(id, req.body);
  if (!result) {
    res.status(404).json({ success: false, message: 'Registro no encontrado en tabla usuarios' });
    return;
  }

  res.json({
    success: true,
    message: 'Registro relacional actualizado con éxito',
    query: result.query,
    data: result.row
  });
  return;
});

app.delete('/api/mysql/users/:id', (req, res): void => {
  const id = Number(req.params.id);
  const result = mysqlEngine.deleteUser(id);
  if (!result.deleted) {
    res.status(404).json({ success: false, message: 'Registro no encontrado para eliminar' });
    return;
  }

  res.json({
    success: true,
    message: 'Registro eliminado físicamente de MySQL',
    query: result.query
  });
  return;
});

app.post('/api/mysql/seed', (req, res): void => {
  const result = mysqlEngine.seedDatabase();
  res.json({
    success: true,
    message: 'Base de datos MySQL poblada con 8 ejemplos relacionales y claves foráneas',
    query: result.query,
    count: result.count
  });
  return;
});

app.get('/api/mysql/schema', (req, res): void => {
  res.json({
    success: true,
    database: 'nocturna_db',
    ddl: mysqlEngine.getDdlScript(),
    auditoria: mysqlEngine.getAuditoria(),
    bares: mysqlEngine.getBares()
  });
  return;
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
