/* ============================================
   NEEMA SYNERGY — IMAGE RESTORE
   Images are real files on disk — just set src
   ============================================ */

(function () {
  const images = {
    'hero':      { sel: ['#hero-img'],                                    path: '/images/hero.jpg'                    },
    'about':     { sel: ['#about .about-image-frame img'],                path: '/images/about.jpg'                   },
    'logo':      { sel: ['#nav-logo-img', 'footer .nav-logo img'],        path: '/images/logo.jpg'                    },
    'corp-1':    { sel: ['img[alt="Annual Leadership Conference"]'],       path: '/images/portfolio/corp-1.jpg'        },
    'social-1':  { sel: ['img[alt="Luxury Wedding Gala"]'],               path: '/images/portfolio/social-1.jpg'      },
    'brand-1':   { sel: ['img[alt="Product Launch Activation"]'],         path: '/images/portfolio/brand-1.jpg'       },
    'virtual-1': { sel: ['img[alt="Global Hybrid Summit"]'],              path: '/images/portfolio/virtual-1.jpg'     },
    'corp-2':    { sel: ['img[alt="AGM & Investor Day"]'],                path: '/images/portfolio/corp-2.jpg'        },
    'social-2':  { sel: ['img[alt="Milestone Gala Dinner"]'],             path: '/images/portfolio/social-2.jpg'      },
    'prod-1':    { sel: ['img[alt="Concert Stage Production"]'],          path: '/images/portfolio/prod-1.jpg'        },
    'brand-2':   { sel: ['img[alt="Retail Pop-Up Experience"]'],          path: '/images/portfolio/brand-2.jpg'       },
    'corp-3':    { sel: ['img[alt="Industry Awards Ceremony"]'],          path: '/images/portfolio/corp-3.jpg'        },
    'corporate':  { sel: ['img[alt="Corporate Events"]'],                 path: '/images/services/corporate.jpg'      },
    'social':     { sel: ['img[alt="Social Events"]'],                    path: '/images/services/social.jpg'         },
    'activation': { sel: ['img[alt="Brand Activations"]'],               path: '/images/services/activation.jpg'     },
    'virtual':    { sel: ['img[alt="Virtual Events"]'],                   path: '/images/services/virtual.jpg'        },
    'production': { sel: ['img[alt="Event Production"]'],                 path: '/images/services/production.jpg'     },
    'livestream': { sel: ['img[alt="Livestream"]'],                       path: '/images/services/livestream.jpg'     },
    'team-1':    { sel: ['img[alt="Neema W."]'],                          path: '/images/team/team-1.jpg'             },
    'team-2':    { sel: ['img[alt="Brian O."]'],                          path: '/images/team/team-2.jpg'             },
    'team-3':    { sel: ['img[alt="Aisha M."]'],                          path: '/images/team/team-3.jpg'             },
  };

  function applyAll() {
    Object.values(images).forEach(({ sel, path }) => {
      sel.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.src = path;
          el.style.display = 'block';
          el.onerror = function () {
            this.style.display = 'none';
            const parent = this.parentElement;
            if (parent) parent.classList.remove('has-image');
          };
          el.onload = function () {
            this.style.display = 'block';
            const parent = this.parentElement;
            if (parent) parent.classList.add('has-image');
            const item = this.closest('.portfolio-item');
            if (item) item.classList.add('has-image');
          };
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();
