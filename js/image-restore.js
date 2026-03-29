/* ============================================
   NEEMA SYNERGY — IMAGE RESTORE
   Loads image URLs from /api/settings (Cloudinary)
   ============================================ */

(function () {
  const selectors = {
    'logo':      ['#nav-logo-img', 'footer .nav-logo img'],
    'hero':      ['#hero-img'],
    'about':     ['#about .about-image-frame img', '.about-image-frame img'],
    'corp-1':    ['img[alt="Annual Leadership Conference"]'],
    'social-1':  ['img[alt="Luxury Wedding Gala"]'],
    'brand-1':   ['img[alt="Product Launch Activation"]'],
    'virtual-1': ['img[alt="Global Hybrid Summit"]'],
    'corp-2':    ['img[alt="AGM & Investor Day"]'],
    'social-2':  ['img[alt="Milestone Gala Dinner"]'],
    'prod-1':    ['img[alt="Concert Stage Production"]'],
    'brand-2':   ['img[alt="Retail Pop-Up Experience"]'],
    'corp-3':    ['img[alt="Industry Awards Ceremony"]'],
    'corporate':  ['img[alt="Corporate Events"]'],
    'social':     ['img[alt="Social Events"]'],
    'activation': ['img[alt="Brand Activations"]'],
    'virtual':    ['img[alt="Virtual Events"]'],
    'production': ['img[alt="Event Production"]'],
    'livestream': ['img[alt="Livestream"]'],
    'team-1':    ['img[alt="Neema W."]'],
    'team-2':    ['img[alt="Brian O."]'],
    'team-3':    ['img[alt="Aisha M."]'],
  };

  function applyImages(map) {
    Object.entries(map).forEach(([key, url]) => {
      if (!url || !selectors[key]) return;
      selectors[key].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.src = url;
          el.style.display = 'block';
          el.onerror = function () {
            this.style.display = 'none';
            const parent = this.parentElement;
            if (parent) parent.classList.remove('has-image');
          };
          el.onload = function () {
            this.style.display = 'block';
            if (this.parentElement) this.parentElement.classList.add('has-image');
            const item = this.closest('.portfolio-item');
            if (item) item.classList.add('has-image');
          };
        });
      });
    });
  }

  function run() {
    // Try server API first (works locally and on Netlify)
    fetch('/admin/api/images')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(applyImages)
      .catch(() => {
        // Fallback: try public settings for Cloudinary URLs
        fetch('/api/settings')
          .then(r => r.json())
          .then(s => { if (s.images) applyImages(s.images); })
          .catch(() => {});
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
