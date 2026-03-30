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
  loadSettings();
}

/* ---- LOAD EXISTING IMAGES FROM SERVER ---- */
async function loadExistingImages() {
  try {
    const res  = await fetch('/api/settings');
    const data = await res.json();
    const images = data.images || {};
    Object.entries(images).forEach(([key, url]) => {
      if (url) applyImage(key, url);
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
    const labelText = document.createElement('span');
    labelText.textContent = 'Upload Image';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:2;';
    fileInput.addEventListener('change', function () { handleUpload(this.files[0], item.key, labelText); });
    label.appendChild(labelText);
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
async function handleUpload(file, key, textEl) {
  if (!file) return;
  if (textEl) textEl.textContent = 'Uploading…';

  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl = e.target.result;
    try {
      const res  = await fetch('/admin/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': AUTH_TOKEN },
        body: JSON.stringify({ key, dataUrl })
      });
      const data = await res.json();
      if (data.success) {
        applyImage(key, data.url);
        showToast('Uploaded — ' + file.name);
      } else {
        showToast(data.error || 'Upload failed', true);
      }
    } catch {
      showToast('Upload failed — server error', true);
    }
    if (textEl) textEl.textContent = 'Upload Image';
  };
  reader.readAsDataURL(file);
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
    fetch('/admin/api/settings', { headers: { 'x-admin-token': AUTH_TOKEN } })
      .then(r => { if (r.ok) showPanel(); })
      .catch(() => {});
  }
});

/* ---- SETTINGS ---- */
async function loadSettings() {
  try {
    const res  = await fetch('/admin/api/settings', { headers: { 'x-admin-token': AUTH_TOKEN } });
    const data = await res.json();

    // Social
    if (data.instagram) document.getElementById('s-instagram').value = data.instagram;
    if (data.facebook)  document.getElementById('s-facebook').value  = data.facebook;
    if (data.linkedin)  document.getElementById('s-linkedin').value  = data.linkedin;
    if (data.twitter)   document.getElementById('s-twitter').value   = data.twitter;
    if (data.youtube)   document.getElementById('s-youtube').value   = data.youtube;

    // Contact
    if (data.email)    document.getElementById('s-email').value    = data.email;
    if (data.phone)    document.getElementById('s-phone').value    = data.phone;
    if (data.location) document.getElementById('s-location').value = data.location;
    if (data.hours)    document.getElementById('s-hours').value    = data.hours;

    // About
    if (data.tagline)      document.getElementById('s-tagline').value      = data.tagline;
    if (data.about1)       document.getElementById('s-about1').value       = data.about1;
    if (data.about2)       document.getElementById('s-about2').value       = data.about2;
    if (data.years)        document.getElementById('s-years').value        = data.years;
    if (data.events)       document.getElementById('s-events').value       = data.events;
    if (data.satisfaction) document.getElementById('s-satisfaction').value = data.satisfaction;
    if (data.clients)      document.getElementById('s-clients').value      = data.clients;

    // WhatsApp
    if (data.whatsapp)     document.getElementById('s-whatsapp').value      = data.whatsapp;
    if (data.whatsappMsg)  document.getElementById('s-whatsapp-msg').value  = data.whatsappMsg;
    if (data.whatsappShow !== undefined) document.getElementById('s-whatsapp-show').value = String(data.whatsappShow);

    // Maps
    if (data.mapsUrl) {
      document.getElementById('s-maps').value = data.mapsUrl;
      showMapsPreview(data.mapsUrl);
    }
  } catch {
    showToast('Could not load settings', true);
  }
}

async function saveSettings(section) {
  const payload = {};

  if (section === 'social') {
    payload.instagram = document.getElementById('s-instagram').value.trim();
    payload.facebook  = document.getElementById('s-facebook').value.trim();
    payload.linkedin  = document.getElementById('s-linkedin').value.trim();
    payload.twitter   = document.getElementById('s-twitter').value.trim();
    payload.youtube   = document.getElementById('s-youtube').value.trim();
  }
  if (section === 'contact') {
    payload.email    = document.getElementById('s-email').value.trim();
    payload.phone    = document.getElementById('s-phone').value.trim();
    payload.location = document.getElementById('s-location').value.trim();
    payload.hours    = document.getElementById('s-hours').value.trim();
  }
  if (section === 'about') {
    payload.tagline      = document.getElementById('s-tagline').value.trim();
    payload.about1       = document.getElementById('s-about1').value.trim();
    payload.about2       = document.getElementById('s-about2').value.trim();
    payload.years        = document.getElementById('s-years').value.trim();
    payload.events       = document.getElementById('s-events').value.trim();
    payload.satisfaction = document.getElementById('s-satisfaction').value.trim();
    payload.clients      = document.getElementById('s-clients').value.trim();
  }
  if (section === 'whatsapp') {
    payload.whatsapp     = document.getElementById('s-whatsapp').value.trim();
    payload.whatsappMsg  = document.getElementById('s-whatsapp-msg').value.trim();
    payload.whatsappShow = document.getElementById('s-whatsapp-show').value === 'true';
  }
  if (section === 'maps') {
    payload.mapsUrl = document.getElementById('s-maps').value.trim();
    showMapsPreview(payload.mapsUrl);
  }

  try {
    const res  = await fetch('/admin/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AUTH_TOKEN },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) showToast('Settings saved');
    else showToast('Save failed', true);
  } catch {
    showToast('Save failed — server error', true);
  }
}

function showMapsPreview(url) {
  const preview = document.getElementById('maps-preview');
  if (!preview || !url) return;
  preview.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = '100%';
  iframe.height = '300';
  iframe.style.border = '1px solid rgba(212,175,55,0.2)';
  iframe.allowFullscreen = true;
  preview.appendChild(iframe);
}
