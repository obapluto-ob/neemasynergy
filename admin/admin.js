/* ============================================
   NEEMA SYNERGY — ADMIN PANEL JS
   Real server-backed image uploads
   ============================================ */

let AUTH_TOKEN = sessionStorage.getItem('nse_token') || null;

const PORTFOLIO_ITEMS = [
  { key: 'corp-1',    label: 'Annual Leadership Conference', category: 'Corporate'  },
  { key: 'social-1',  label: 'Luxury Wedding Gala',          category: 'Social'     },
  { key: 'brand-1',   label: 'Product Launch Activation',    category: 'Activation' },
  { key: 'virtual-1', label: 'Global Hybrid Summit',         category: 'Virtual'    },
  { key: 'corp-2',    label: 'AGM & Investor Day',           category: 'Corporate'  },
  { key: 'social-2',  label: 'Milestone Gala Dinner',        category: 'Social'     },
  { key: 'prod-1',    label: 'Concert Stage Production',     category: 'Production' },
  { key: 'brand-2',   label: 'Retail Pop-Up Experience',     category: 'Activation' },
  { key: 'corp-3',    label: 'Industry Awards Ceremony',     category: 'Corporate'  },
];

const SERVICES_ITEMS = [
  { key: 'corporate',  label: 'Corporate Events',       category: 'Service' },
  { key: 'social',     label: 'Social Events',          category: 'Service' },
  { key: 'activation', label: 'Brand Activations',      category: 'Service' },
  { key: 'virtual',    label: 'Virtual & Hybrid',       category: 'Service' },
  { key: 'production', label: 'Event Production',       category: 'Service' },
  { key: 'livestream', label: 'Livestream & Broadcast', category: 'Service' },
];

const TEAM_ITEMS = [
  { key: 'team-1', label: 'Neema W.', category: 'Founder & Creative Director' },
  { key: 'team-2', label: 'Brian O.', category: 'Head of Production'          },
  { key: 'team-3', label: 'Aisha M.', category: 'Senior Event Manager'        },
];

/* ---- AUTH ---- */
async function adminLogin() {
  const pw = document.getElementById('loginPassword').value.trim();
  if (!pw) return;

  const btn = document.querySelector('.btn-admin');
  btn.textContent = 'Logging in…';
  btn.disabled = true;

  try {
    const res  = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();

    if (data.success) {
      // Use hash of password as session token
      const hash = await sha256(pw);
      AUTH_TOKEN = hash;
      sessionStorage.setItem('nse_token', hash);
      showPanel();
      if (data.firstTime) showToast('Password set. Welcome to the admin panel!');
    } else {
      document.getElementById('loginError').textContent = data.error || 'Incorrect password.';
    }
  } catch {
    document.getElementById('loginError').textContent = 'Server error. Is the server running?';
  }

  btn.textContent = 'Login';
  btn.disabled = false;
}

function adminLogout() {
  AUTH_TOKEN = null;
  sessionStorage.removeItem('nse_token');
  document.getElementById('adminPanel').style.display  = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ---- SHOW PANEL ---- */
function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display  = 'flex';
  initAdmin();
}

/* ---- INIT ---- */
function initAdmin() {
  // tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('tab-' + item.dataset.tab).classList.add('active');
    });
  });

  buildGrid('portfolioGrid', PORTFOLIO_ITEMS);
  buildGrid('servicesGrid',  SERVICES_ITEMS);
  buildGrid('teamGrid',      TEAM_ITEMS);
  initDragDrop();
  loadExistingImages();
}

/* ---- LOAD EXISTING IMAGES FROM SERVER ---- */
async function loadExistingImages() {
  try {
    const res  = await fetch('/admin/api/images', {
      headers: { 'x-admin-token': AUTH_TOKEN }
    });
    const data = await res.json();
    Object.entries(data).forEach(([key, filePath]) => {
      if (filePath) applyImage(key, filePath + '?t=' + Date.now());
    });
  } catch {
    showToast('Could not load existing images', true);
  }
}

/* ---- BUILD GRIDS ---- */
function buildGrid(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-admin-card';
    card.dataset.key = item.key;

    const preview = document.createElement('div');
    preview.className = 'card-preview';

    const img = document.createElement('img');
    img.src = '';
    img.alt = item.label;
    img.style.display = 'none';

    const noImg = document.createElement('div');
    noImg.className = 'no-image';
    noImg.textContent = item.label;
    const small = document.createElement('small');
    small.textContent = 'No image yet';
    noImg.appendChild(document.createElement('br'));
    noImg.appendChild(small);

    preview.appendChild(img);
    preview.appendChild(noImg);

    const info = document.createElement('div');
    info.className = 'card-info';
    const h4 = document.createElement('h4');
    h4.textContent = item.label;
    const span = document.createElement('span');
    span.textContent = item.category;
    info.appendChild(h4);
    info.appendChild(span);

    const label = document.createElement('label');
    label.className = 'card-upload-btn';
    label.textContent = 'Upload Image';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', function () { handleUpload(this.files[0], item.key, label); });
    label.appendChild(fileInput);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDelete(item.key, card));

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.appendChild(label);
    actions.appendChild(deleteBtn);

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

/* ---- UPLOAD HANDLER ---- */
async function handleUpload(file, key, btnEl) {
  if (!file) return;

  if (btnEl) { btnEl.textContent = 'Uploading…'; }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', key);

  try {
    const res  = await fetch('/admin/api/upload', {
      method: 'POST',
      headers: { 'x-admin-token': AUTH_TOKEN },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      applyImage(key, data.path + '?t=' + Date.now());
      showToast('Uploaded — ' + file.name);
    } else {
      showToast(data.error || 'Upload failed', true);
    }
  } catch {
    showToast('Upload failed — server error', true);
  }

  if (btnEl) { btnEl.textContent = 'Upload Image'; }
}

/* ---- DELETE HANDLER ---- */
async function handleDelete(key, card) {
  if (!confirm('Delete this image? This cannot be undone.')) return;

  try {
    const res  = await fetch('/admin/api/image/' + key, {
      method: 'DELETE',
      headers: { 'x-admin-token': AUTH_TOKEN }
    });
    const data = await res.json();

    if (data.success) {
      // reset card preview
      if (card) {
        const img   = card.querySelector('.card-preview img');
        const noImg = card.querySelector('.no-image');
        if (img)   { img.src = ''; img.style.display = 'none'; }
        if (noImg) { noImg.style.display = 'block'; }
      }
      // reset single preview (logo/hero/about)
      const preview = document.getElementById('preview-' + key);
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      showToast('Image deleted');
    } else {
      showToast(data.error || 'Delete failed', true);
    }
  } catch {
    showToast('Delete failed — server error', true);
  }
}

/* ---- APPLY IMAGE TO ADMIN UI ---- */
function applyImage(key, src) {
  // single preview (logo, hero, about)
  const preview = document.getElementById('preview-' + key);
  if (preview) {
    preview.src = src;
    preview.style.display = 'block';
  }

  // grid card
  const card = document.querySelector(`.portfolio-admin-card[data-key="${key}"]`);
  if (card) {
    const img   = card.querySelector('.card-preview img');
    const noImg = card.querySelector('.no-image');
    if (img)   { img.src = src; img.style.display = 'block'; }
    if (noImg) { noImg.style.display = 'none'; }
  }
}

/* ---- DRAG & DROP ---- */
function initDragDrop() {
  document.querySelectorAll('.upload-box').forEach(box => {
    box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('dragover'); });
    box.addEventListener('dragleave', () => box.classList.remove('dragover'));
    box.addEventListener('drop', e => {
      e.preventDefault();
      box.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      handleUpload(file, box.dataset.key, null);
    });
  });
}

/* ---- TOAST ---- */
function showToast(msg, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ---- WIRE UP BUTTONS ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.btn-admin').addEventListener('click', adminLogin);
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });

  // Auto login if session token exists
  if (AUTH_TOKEN) {
    fetch('/admin/api/images', { headers: { 'x-admin-token': AUTH_TOKEN } })
      .then(r => { if (r.ok) showPanel(); })
      .catch(() => {});
  }
});
