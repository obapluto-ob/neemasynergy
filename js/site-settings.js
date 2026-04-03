/* ============================================
   NEEMA SYNERGY — SITE SETTINGS
   Loads settings from server and applies them
   ============================================ */

(function () {
  fetch('/api/settings')
    .then(r => r.json())
    .then(s => {
      if (s.siteUnlocked === false || s.siteUnlocked === 'false') {
        window.location.replace('/paywall.html');
        return;
      }
      applyContact(s);
      applySocial(s);
      applyAbout(s);
      applyWhatsApp(s);
      applyMaps(s);
    })
    .catch(() => {
      // If settings can't load, default to locked
      window.location.replace('/paywall.html');
    });

  function applyContact(s) {
    if (s.email) {
      document.querySelectorAll('[data-site="email"]').forEach(el => {
        el.textContent = s.email;
        if (el.tagName === 'A') el.href = 'mailto:' + s.email;
      });
    }
    if (s.phone) {
      document.querySelectorAll('[data-site="phone"]').forEach(el => {
        el.textContent = s.phone;
        if (el.tagName === 'A') el.href = 'tel:' + s.phone.replace(/\s/g, '');
      });
    }
    if (s.location) {
      document.querySelectorAll('[data-site="location"]').forEach(el => el.textContent = s.location);
    }
    if (s.hours) {
      document.querySelectorAll('[data-site="hours"]').forEach(el => el.textContent = s.hours);
    }
  }

  function applySocial(s) {
    const map = { instagram: 'IG', facebook: 'fb', linkedin: 'in', twitter: '𝕏', youtube: 'YT' };
    Object.entries(map).forEach(([key, label]) => {
      document.querySelectorAll(`[data-site="social-${key}"]`).forEach(el => {
        if (s[key]) { el.href = s[key]; el.style.display = ''; }
        else        { el.style.display = 'none'; }
      });
    });
  }

  function applyAbout(s) {
    if (s.tagline) document.querySelectorAll('[data-site="tagline"]').forEach(el => el.textContent = s.tagline);
    if (s.about1)  document.querySelectorAll('[data-site="about1"]').forEach(el => el.textContent = s.about1);
    if (s.about2)  document.querySelectorAll('[data-site="about2"]').forEach(el => el.textContent = s.about2);
    if (s.years)   document.querySelectorAll('[data-site="years"]').forEach(el => { el.textContent = s.years + '+'; el.dataset.target = s.years; });
    if (s.events)  document.querySelectorAll('[data-site="events"]').forEach(el => { el.textContent = s.events + '+'; el.dataset.target = s.events; });
    if (s.satisfaction) document.querySelectorAll('[data-site="satisfaction"]').forEach(el => { el.textContent = s.satisfaction + '%'; el.dataset.target = s.satisfaction; });
    if (s.clients) document.querySelectorAll('[data-site="clients"]').forEach(el => { el.textContent = s.clients + '+'; el.dataset.target = s.clients; });

    // Team names and roles — run after DOM ready
    const applyTeam = () => {
      ['team-1','team-2','team-3'].forEach(key => {
        if (s[key + '_name']) document.querySelectorAll('[data-team-name="' + key + '"]').forEach(el => el.textContent = s[key + '_name']);
        if (s[key + '_role']) document.querySelectorAll('[data-team-role="' + key + '"]').forEach(el => el.textContent = s[key + '_role']);
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTeam);
    } else {
      applyTeam();
    }
  }

  function applyWhatsApp(s) {
    const existing = document.getElementById('whatsapp-float');
    if (existing) existing.remove();
    // show if number exists and whatsappShow is not explicitly false
    if (!s.whatsapp) return;
    if (s.whatsappShow === false || s.whatsappShow === 'false') return;

    const msg = encodeURIComponent(s.whatsappMsg || "Hello! I'd like to enquire about your event services.");
    const url = `https://wa.me/${s.whatsapp}?text=${msg}`;

    const btn = document.createElement('a');
    btn.id        = 'whatsapp-float';
    btn.href      = url;
    btn.target    = '_blank';
    btn.rel       = 'noopener noreferrer';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
    btn.setAttribute('aria-label', 'Chat on WhatsApp');

    const style = document.createElement('style');
    style.textContent = `
      #whatsapp-float {
        position: fixed;
        bottom: 32px;
        right: 32px;
        width: 56px;
        height: 56px;
        background: #25D366;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(37,211,102,0.4);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #whatsapp-float:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 28px rgba(37,211,102,0.55);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(btn);
  }

  function applyMaps(s) {
    const container = document.getElementById('google-map');
    if (!container || !s.mapsUrl) return;
    const iframe = document.createElement('iframe');
    iframe.src             = s.mapsUrl;
    iframe.width           = '100%';
    iframe.height          = '100%';
    iframe.style.border    = 'none';
    iframe.allowFullscreen = true;
    iframe.loading         = 'lazy';
    container.appendChild(iframe);
  }
})();
