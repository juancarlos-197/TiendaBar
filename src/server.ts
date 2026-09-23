import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware to parse JSON request bodies
app.use(express.json());

interface ServerUser {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'operador' | 'cliente';
  photoURL?: string;
  phone?: string;
  createdAt: string;
}

const initialUsers: ServerUser[] = [
  {
    id: 'usr_admin_1',
    displayName: 'J Alban',
    email: 'jalban.dacompsc@gmail.com',
    role: 'admin',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'usr_operador_1',
    displayName: 'Carlos Mendoza',
    email: 'carlos.mendoza@tiendabar.com',
    role: 'operador',
    phone: '+34 612 345 678',
    createdAt: '2026-09-05T10:30:00.000Z',
  },
  {
    id: 'usr_cliente_1',
    displayName: 'Sofía Herrera',
    email: 'sofia.herrera@correo.com',
    role: 'cliente',
    phone: '+34 689 456 123',
    createdAt: '2026-09-10T14:15:00.000Z',
  },
  {
    id: 'usr_cliente_2',
    displayName: 'Marcos Castro',
    email: 'marcos.castro@correo.com',
    role: 'cliente',
    phone: '+34 645 789 012',
    createdAt: '2026-09-14T16:45:00.000Z',
  },
  {
    id: 'usr_cliente_3',
    displayName: 'Lucía Vega',
    email: 'lucia.vega@correo.com',
    role: 'cliente',
    phone: '+34 633 901 234',
    createdAt: '2026-09-18T11:20:00.000Z',
  },
];

let usersStore: ServerUser[] = [...initialUsers];

// --- REST API for Users (HTTP GET, POST, PUT, DELETE) ---

// GET /api/users - returns the list of users with displayName, email, role
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    protocol: 'HTTP/REST',
    count: usersStore.length,
    users: usersStore,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/users/:id - get single user
app.get('/api/users/:id', (req, res) => {
  const user = usersStore.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }
  res.json({ success: true, user });
});

// POST /api/users - create new user with displayName, email, role
app.post('/api/users', (req, res) => {
  const { displayName, email, role, phone, photoURL } = req.body;

  if (!displayName || !email) {
    res.status(400).json({
      success: false,
      error: 'Campos obligatorios requeridos: displayName y email',
    });
    return;
  }

  const validRole: 'admin' | 'operador' | 'cliente' =
    role === 'admin' || role === 'operador' || role === 'cliente' ? role : 'cliente';

  const newUser: ServerUser = {
    id: 'usr_http_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    displayName: String(displayName).trim(),
    email: String(email).trim().toLowerCase(),
    role: validRole,
    phone: phone ? String(phone).trim() : undefined,
    photoURL: photoURL ? String(photoURL).trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  usersStore.unshift(newUser);

  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente vía HTTP POST',
    user: newUser,
  });
});

// PUT /api/users/:id - update user details / role
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = usersStore.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }

  const current = usersStore[index];
  const { displayName, email, role, phone, photoURL } = req.body;

  const validRole =
    role && (role === 'admin' || role === 'operador' || role === 'cliente')
      ? role
      : current.role;

  const updated: ServerUser = {
    ...current,
    displayName: displayName !== undefined ? String(displayName).trim() : current.displayName,
    email: email !== undefined ? String(email).trim().toLowerCase() : current.email,
    role: validRole,
    phone: phone !== undefined ? String(phone).trim() : current.phone,
    photoURL: photoURL !== undefined ? String(photoURL).trim() : current.photoURL,
  };

  usersStore[index] = updated;

  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente vía HTTP PUT',
    user: updated,
  });
});

// PATCH /api/users/:id/role - update role specifically
app.patch('/api/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || (role !== 'admin' && role !== 'operador' && role !== 'cliente')) {
    res.status(400).json({ success: false, error: 'Rol inválido. Debe ser: admin, operador o cliente' });
    return;
  }

  const index = usersStore.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }

  usersStore[index].role = role;

  res.json({
    success: true,
    message: `Rol actualizado a ${role} vía HTTP PATCH`,
    user: usersStore[index],
  });
});

// DELETE /api/users/:id - delete user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = usersStore.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }

  const removed = usersStore.splice(index, 1)[0];
  res.json({
    success: true,
    message: `Usuario ${removed.displayName} eliminado vía HTTP DELETE`,
    id: removed.id,
  });
});

// POST /api/users/reset - reset to initial demo users
app.post('/api/users/reset', (_req, res) => {
  usersStore = [...initialUsers];
  res.json({
    success: true,
    message: 'Usuarios restablecidos a la lista predeterminada',
    users: usersStore,
  });
});

// ==========================================
// --- REST API for Subscriptions (HTTP) ---
// ==========================================

interface ServerSubscriptionPlan {
  id: string;
  tier: 'basico_bar' | 'club_gourmet' | 'vip_coleccionista' | 'sommelier_premium';
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  maxActiveLoans: number;
  discountPercentage: number;
  badgeColor: string;
}

interface ServerSubscription {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  planId: string;
  planName: string;
  tier: 'basico_bar' | 'club_gourmet' | 'vip_coleccionista' | 'sommelier_premium';
  priceMonthly: number;
  status: 'activa' | 'pausada' | 'cancelada' | 'expirada';
  startDate: string;
  renewalDate: string;
  paymentMethod: 'tarjeta' | 'bizum' | 'transferencia' | 'domiciliacion';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const subscriptionPlans: ServerSubscriptionPlan[] = [
  {
    id: 'plan_basico',
    tier: 'basico_bar',
    name: 'Pase Amigo Bar',
    priceMonthly: 14.99,
    description: 'Ideal para entusiastas que visitan con frecuencia el bar y solicitan catas.',
    features: [
      '10% de descuento en barra y copas',
      'Hasta 2 préstamos de cristalería o botellas simultáneas',
      'Copa de bienvenida al mes',
      'Plazo de préstamo estándar (7 días)',
    ],
    maxActiveLoans: 2,
    discountPercentage: 10,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'plan_gourmet',
    tier: 'club_gourmet',
    name: 'Club Gourmet Tienda & Bar',
    priceMonthly: 29.99,
    description: 'Para clientes que disfrutan tanto de productos de tienda como de la experiencia de bar.',
    features: [
      '15% de descuento en tienda gourmet y bar',
      'Hasta 4 préstamos simultáneos sin depósito de fianza',
      'Acceso mensual a 1 botella de edición especial del mes',
      'Plazo de préstamo extendido (14 días)',
      'Invitación a degustaciones trimestrales',
    ],
    maxActiveLoans: 4,
    discountPercentage: 15,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'plan_vip',
    tier: 'vip_coleccionista',
    name: 'VIP Coleccionista & Maridaje',
    priceMonthly: 49.99,
    description: 'Acceso total y prioritario a vinos de guarda, licores premium y lotes de tienda.',
    features: [
      '20% de descuento en todos los artículos',
      'Hasta 8 préstamos simultáneos con plazo de 30 días',
      'Reserva anticipada de botellas y productos antes de salir a la venta',
      'Degustación privada mensual para 2 personas',
      'Mesa preferencial garantizada en el bar',
    ],
    maxActiveLoans: 8,
    discountPercentage: 20,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'plan_sommelier',
    tier: 'sommelier_premium',
    name: 'Membresía Sommelier Selección',
    priceMonthly: 79.99,
    description: 'La máxima experiencia para sommeliers, coleccionistas y empresas gastronómicas.',
    features: [
      '25% de descuento absoluto en tienda y bar',
      'Préstamos ilimitados de stock con seguro incluido',
      'Espacio privado reservado en cava climatizada',
      'Asesoría personalizada con el Sommelier principal',
      'Caja degustación exclusiva entregada cada mes',
    ],
    maxActiveLoans: 99,
    discountPercentage: 25,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

const initialSubscriptions: ServerSubscription[] = [
  {
    id: 'sub_001',
    userId: 'usr_cliente_1',
    userDisplayName: 'Sofía Herrera',
    userEmail: 'sofia.herrera@correo.com',
    planId: 'plan_gourmet',
    planName: 'Club Gourmet Tienda & Bar',
    tier: 'club_gourmet',
    priceMonthly: 29.99,
    status: 'activa',
    startDate: '2026-08-15',
    renewalDate: '2026-10-15',
    paymentMethod: 'tarjeta',
    notes: 'Suscripción preferente con renovación automática activada.',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'sub_002',
    userId: 'usr_operador_1',
    userDisplayName: 'Carlos Mendoza',
    userEmail: 'carlos.mendoza@tiendabar.com',
    planId: 'plan_vip',
    planName: 'VIP Coleccionista & Maridaje',
    tier: 'vip_coleccionista',
    priceMonthly: 49.99,
    status: 'activa',
    startDate: '2026-07-01',
    renewalDate: '2026-10-01',
    paymentMethod: 'domiciliacion',
    notes: 'Miembro VIP y asesor de maridaje.',
    createdAt: '2026-07-01T09:30:00.000Z',
    updatedAt: '2026-09-01T09:30:00.000Z',
  },
  {
    id: 'sub_003',
    userId: 'usr_cliente_2',
    userDisplayName: 'Marcos Castro',
    userEmail: 'marcos.castro@correo.com',
    planId: 'plan_basico',
    planName: 'Pase Amigo Bar',
    tier: 'basico_bar',
    priceMonthly: 14.99,
    status: 'pausada',
    startDate: '2026-06-10',
    renewalDate: '2026-09-30',
    paymentMethod: 'bizum',
    notes: 'Pausado por viaje durante el mes.',
    createdAt: '2026-06-10T14:15:00.000Z',
    updatedAt: '2026-09-10T14:15:00.000Z',
  },
  {
    id: 'sub_004',
    userId: 'usr_cliente_3',
    userDisplayName: 'Lucía Vega',
    userEmail: 'lucia.vega@correo.com',
    planId: 'plan_sommelier',
    planName: 'Membresía Sommelier Selección',
    tier: 'sommelier_premium',
    priceMonthly: 79.99,
    status: 'activa',
    startDate: '2026-09-01',
    renewalDate: '2026-10-20',
    paymentMethod: 'tarjeta',
    notes: 'Cava reservada compartimento B-4.',
    createdAt: '2026-09-01T11:20:00.000Z',
    updatedAt: '2026-09-01T11:20:00.000Z',
  },
];

let subscriptionsStore: ServerSubscription[] = [...initialSubscriptions];

// GET /api/subscriptions/plans - list available plans
app.get('/api/subscriptions/plans', (_req, res) => {
  res.json({
    success: true,
    count: subscriptionPlans.length,
    plans: subscriptionPlans,
  });
});

// GET /api/subscriptions - list all subscriptions
app.get('/api/subscriptions', (req, res) => {
  const { status, tier } = req.query;
  let list = [...subscriptionsStore];

  if (status && typeof status === 'string') {
    list = list.filter((s) => s.status === status);
  }
  if (tier && typeof tier === 'string') {
    list = list.filter((s) => s.tier === tier);
  }

  res.json({
    success: true,
    protocol: 'HTTP/REST',
    count: list.length,
    subscriptions: list,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/subscriptions/:id - get single subscription
app.get('/api/subscriptions/:id', (req, res) => {
  const sub = subscriptionsStore.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
    return;
  }
  res.json({ success: true, subscription: sub });
});

// POST /api/subscriptions - create new subscription
app.post('/api/subscriptions', (req, res) => {
  const {
    userId,
    userDisplayName,
    userEmail,
    planId,
    paymentMethod,
    notes,
    startDate,
    renewalDate,
  } = req.body;

  if (!userDisplayName || !userEmail || !planId) {
    res.status(400).json({
      success: false,
      error: 'Campos requeridos: userDisplayName, userEmail y planId',
    });
    return;
  }

  const plan = subscriptionPlans.find((p) => p.id === planId) || subscriptionPlans[0];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Default renewal in 30 days
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const defaultRenewal = nextMonth.toISOString().split('T')[0];

  const newSub: ServerSubscription = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: userId || 'usr_' + Math.random().toString(36).substring(2, 6),
    userDisplayName: String(userDisplayName).trim(),
    userEmail: String(userEmail).trim().toLowerCase(),
    planId: plan.id,
    planName: plan.name,
    tier: plan.tier,
    priceMonthly: plan.priceMonthly,
    status: 'activa',
    startDate: startDate || todayStr,
    renewalDate: renewalDate || defaultRenewal,
    paymentMethod: paymentMethod || 'tarjeta',
    notes: notes ? String(notes).trim() : undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  subscriptionsStore.unshift(newSub);

  res.status(201).json({
    success: true,
    message: `Suscripción al plan "${plan.name}" creada exitosamente vía HTTP POST`,
    subscription: newSub,
  });
});

// PUT /api/subscriptions/:id - update full subscription
app.put('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const index = subscriptionsStore.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
    return;
  }

  const current = subscriptionsStore[index];
  const { planId, status, renewalDate, paymentMethod, notes, userDisplayName, userEmail } = req.body;

  let plan = subscriptionPlans.find((p) => p.id === planId);
  if (!plan) {
    plan = subscriptionPlans.find((p) => p.id === current.planId) || subscriptionPlans[0];
  }

  const updated: ServerSubscription = {
    ...current,
    planId: plan.id,
    planName: plan.name,
    tier: plan.tier,
    priceMonthly: plan.priceMonthly,
    status: status || current.status,
    renewalDate: renewalDate || current.renewalDate,
    paymentMethod: paymentMethod || current.paymentMethod,
    notes: notes !== undefined ? String(notes).trim() : current.notes,
    userDisplayName: userDisplayName ? String(userDisplayName).trim() : current.userDisplayName,
    userEmail: userEmail ? String(userEmail).trim().toLowerCase() : current.userEmail,
    updatedAt: new Date().toISOString(),
  };

  subscriptionsStore[index] = updated;

  res.json({
    success: true,
    message: 'Suscripción actualizada exitosamente vía HTTP PUT',
    subscription: updated,
  });
});

// PATCH /api/subscriptions/:id/status - change subscription status
app.patch('/api/subscriptions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'activa' && status !== 'pausada' && status !== 'cancelada' && status !== 'expirada')) {
    res.status(400).json({
      success: false,
      error: 'Estado inválido. Debe ser: activa, pausada, cancelada o expirada',
    });
    return;
  }

  const index = subscriptionsStore.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
    return;
  }

  subscriptionsStore[index].status = status;
  subscriptionsStore[index].updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Estado de suscripción cambiado a "${status}" vía HTTP PATCH`,
    subscription: subscriptionsStore[index],
  });
});

// DELETE /api/subscriptions/:id - cancel and remove subscription
app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const index = subscriptionsStore.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
    return;
  }

  const removed = subscriptionsStore.splice(index, 1)[0];
  res.json({
    success: true,
    message: `Suscripción de ${removed.userDisplayName} eliminada vía HTTP DELETE`,
    id: removed.id,
  });
});

// POST /api/subscriptions/reset - reset to sample subscriptions
app.post('/api/subscriptions/reset', (_req, res) => {
  subscriptionsStore = [...initialSubscriptions];
  res.json({
    success: true,
    message: 'Suscripciones restablecidas a los datos de prueba',
    subscriptions: subscriptionsStore,
  });
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
