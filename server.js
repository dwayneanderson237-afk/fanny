const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 5173;
const debugAdmin = process.env.DEBUG_ADMIN === '1';
const allowPasswordless = process.env.ADMIN_PASSWORDLESS === 'true';

const logAdmin = (...args) => {
  if (debugAdmin) {
    // eslint-disable-next-line no-console
    console.log('[admin]', ...args);
  }
};

const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const contentPath = path.join(dataDir, 'content.json');
const adminPath = path.join(dataDir, 'admin.json');
const dashboardPath = path.join(dataDir, 'dashboard.json');
const uploadsDir = path.join(rootDir, 'uploads');

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const ensureAdmin = () => {
  ensureDataDir();
  if (!fs.existsSync(adminPath)) {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'bites123';
    const passwordHash = bcrypt.hashSync(password, 10);
    fs.writeFileSync(
      adminPath,
      JSON.stringify({ username, passwordHash }, null, 2),
      'utf8'
    );
  }
};

const ensureDashboard = () => {
  ensureDataDir();
  if (!fs.existsSync(dashboardPath)) {
    const defaultDashboard = {
      orders: [],
      inventory: [],
    };
    fs.writeFileSync(dashboardPath, JSON.stringify(defaultDashboard, null, 2), 'utf8');
  }
};

const readAdmin = () => {
  ensureAdmin();
  return JSON.parse(fs.readFileSync(adminPath, 'utf8'));
};

const readContent = () => {
  ensureDataDir();
  if (!fs.existsSync(contentPath)) {
    throw new Error('content.json is missing.');
  }
  return JSON.parse(fs.readFileSync(contentPath, 'utf8'));
};

const readDashboard = () => {
  ensureDashboard();
  return JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
};

const writeDashboard = (data) => {
  ensureDashboard();
  fs.writeFileSync(dashboardPath, JSON.stringify(data, null, 2), 'utf8');
};

const writeContent = (content) => {
  ensureDataDir();
  fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
};

app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fannys-bites-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use('/uploads', express.static(uploadsDir));

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext || ''}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed.'));
    }
  },
});

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
    return;
  }
  res.status(401).json({ ok: false, error: 'Unauthorized' });
};

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    if (!username) {
      res.status(400).json({ ok: false, error: 'Missing username' });
      return;
    }
  }

  const admin = readAdmin();
  const normalizedUser = String(username).trim().toLowerCase();
  const storedUser = String(admin.username).trim().toLowerCase();

  if (normalizedUser !== storedUser) {
    logAdmin('Login failed: user mismatch', { username: normalizedUser });
    res.status(401).json({ ok: false, error: 'Invalid credentials' });
    return;
  }

  if (allowPasswordless && !password) {
    logAdmin('Login success (passwordless)', { username: normalizedUser });
    req.session.user = admin.username;
    res.json({ ok: true, user: admin.username });
    return;
  }

  const valid = bcrypt.compareSync(String(password), admin.passwordHash);
  if (!valid) {
    logAdmin('Login failed: bad password', { username: normalizedUser });
    res.status(401).json({ ok: false, error: 'Invalid credentials' });
    return;
  }

  req.session.user = admin.username;
  logAdmin('Login success', { username: normalizedUser });
  res.json({ ok: true, user: admin.username });
});

app.post('/api/admin/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
    return;
  }
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  res.json({ ok: true, user: req.session?.user || null });
});

app.get('/api/content', (_req, res) => {
  try {
    const content = readContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/admin/content', requireAuth, (_req, res) => {
  try {
    const content = readContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/admin/dashboard', requireAuth, (_req, res) => {
  try {
    const dashboard = readDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/admin/content', requireAuth, (req, res) => {
  try {
    writeContent(req.body);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/admin/orders/:id', requireAuth, (req, res) => {
  try {
    const dashboard = readDashboard();
    const orderId = req.params.id;
    const order = (dashboard.orders || []).find((item) => item.id === orderId);
    if (!order) {
      res.status(404).json({ ok: false, error: 'Order not found.' });
      return;
    }
    const updates = req.body || {};
    if (updates.status) {
      const status = String(updates.status || '').trim();
      const validStatuses = new Set(['ready', 'prep', 'delivered']);
      if (!validStatuses.has(status)) {
        res.status(400).json({ ok: false, error: 'Invalid status.' });
        return;
      }
      order.status = status;
    }
    if (typeof updates.customer === 'string') order.customer = updates.customer;
    if (Array.isArray(updates.items)) order.items = updates.items;
    if (typeof updates.pickup === 'string') order.pickup = updates.pickup;
    if (typeof updates.date === 'string') order.date = updates.date;
    if (typeof updates.total === 'number') order.total = updates.total;
    writeDashboard(dashboard);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/orders', requireAuth, (req, res) => {
  try {
    const dashboard = readDashboard();
    const body = req.body || {};
    const order = {
      id: String(body.id || `FNY-${Math.floor(1000 + Math.random() * 9000)}`),
      customer: String(body.customer || 'New Customer'),
      items: Array.isArray(body.items) ? body.items : [],
      pickup: String(body.pickup || ''),
      status: String(body.status || 'prep'),
      date: String(body.date || ''),
      total: typeof body.total === 'number' ? body.total : 0,
    };
    dashboard.orders = dashboard.orders || [];
    dashboard.orders.unshift(order);
    writeDashboard(dashboard);
    res.json({ ok: true, order });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/admin/orders/:id', requireAuth, (req, res) => {
  try {
    const dashboard = readDashboard();
    const orderId = req.params.id;
    const originalLength = (dashboard.orders || []).length;
    dashboard.orders = (dashboard.orders || []).filter((item) => item.id !== orderId);
    if (dashboard.orders.length === originalLength) {
      res.status(404).json({ ok: false, error: 'Order not found.' });
      return;
    }
    writeDashboard(dashboard);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ ok: false, error: 'File too large. Max 10MB.' });
        return;
      }
      res.status(400).json({ ok: false, error: err.message || 'Upload failed.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'No file uploaded.' });
      return;
    }
    res.json({ ok: true, url: `/uploads/${req.file.filename}` });
  });
});

app.use(express.static(rootDir));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fanny's Bites server running at http://localhost:${port}`);
});
