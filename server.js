const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const PORT = 3000;

// ---- STATIC FILES ----
app.use(express.static(path.join(__dirname)));
app.use('/pages',  express.static(path.join(__dirname, 'pages')));
app.use('/admin',  express.static(path.join(__dirname, 'admin')));
app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());

// ---- EXPLICIT PAGE ROUTES ----
['about', 'services', 'portfolio', 'contact'].forEach(page => {
  app.get('/' + page, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', page + '.html'));
  });
  app.get('/pages/' + page, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', page + '.html'));
  });
});

// ---- IMAGE SLOT → DESTINATION MAP ----
const IMAGE_DESTINATIONS = {
  'logo':      'images/logo.jpg',
  'hero':      'images/hero.jpg',
  'about':     'images/about.jpg',
  'corp-1':    'images/portfolio/corp-1.jpg',
  'social-1':  'images/portfolio/social-1.jpg',
  'brand-1':   'images/portfolio/brand-1.jpg',
  'virtual-1': 'images/portfolio/virtual-1.jpg',
  'corp-2':    'images/portfolio/corp-2.jpg',
  'social-2':  'images/portfolio/social-2.jpg',
  'prod-1':    'images/portfolio/prod-1.jpg',
  'brand-2':   'images/portfolio/brand-2.jpg',
  'corp-3':    'images/portfolio/corp-3.jpg',
  'corporate':  'images/services/corporate.jpg',
  'social':     'images/services/social.jpg',
  'activation': 'images/services/activation.jpg',
  'virtual':    'images/services/virtual.jpg',
  'production': 'images/services/production.jpg',
  'livestream': 'images/services/livestream.jpg',
  'team-1':    'images/team/team-1.jpg',
  'team-2':    'images/team/team-2.jpg',
  'team-3':    'images/team/team-3.jpg',
};

// ---- MULTER — store in memory, we write manually ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// ---- AUTH — password hash stored in a local file ----
const AUTH_FILE = path.join(__dirname, '.admin_auth');

function getStoredHash() {
  try { return fs.readFileSync(AUTH_FILE, 'utf8').trim(); } catch { return null; }
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

// ---- ROUTES ----

// Login
app.post('/admin/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const hash   = hashPassword(password);
  const stored = getStoredHash();

  if (!stored) {
    // First time — set the password
    fs.writeFileSync(AUTH_FILE, hash);
    return res.json({ success: true, firstTime: true });
  }

  if (hash === stored) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

// Auth middleware for protected routes
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  const stored = getStoredHash();
  if (!token || !stored || token !== stored) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Upload image
app.post('/admin/api/upload', requireAuth, upload.single('image'), (req, res) => {
  const { key } = req.body;
  if (!key || !IMAGE_DESTINATIONS[key]) {
    return res.status(400).json({ error: 'Invalid image key' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const dest    = path.join(__dirname, IMAGE_DESTINATIONS[key]);
  const destDir = path.dirname(dest);

  // Ensure directory exists
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  // Write file to disk
  fs.writeFileSync(dest, req.file.buffer);

  res.json({ success: true, path: '/' + IMAGE_DESTINATIONS[key] });
});

// Get list of uploaded images
app.get('/admin/api/images', requireAuth, (req, res) => {
  const result = {};
  Object.entries(IMAGE_DESTINATIONS).forEach(([key, filePath]) => {
    const full = path.join(__dirname, filePath);
    result[key] = fs.existsSync(full) ? '/' + filePath : null;
  });
  res.json(result);
});

// Delete image
app.delete('/admin/api/image/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  if (!IMAGE_DESTINATIONS[key]) {
    return res.status(400).json({ error: 'Invalid image key' });
  }
  const dest = path.join(__dirname, IMAGE_DESTINATIONS[key]);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Change password
app.post('/admin/api/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  fs.writeFileSync(AUTH_FILE, hashPassword(newPassword));
  res.json({ success: true });
});

// ---- START ----
app.listen(PORT, () => {
  console.log(`Neema Synergy server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/`);
});
