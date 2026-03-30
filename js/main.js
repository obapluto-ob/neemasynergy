/* ============================================
   NEEMA SYNERGY EVENTS — MAIN JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- SCROLL INDICATOR ---- */
  const heroScroll = document.querySelector('.hero-scroll');
  window.addEventListener('scroll', () => {
    if (heroScroll) {
      heroScroll.style.opacity = window.scrollY > 100 ? '0' : '1';
    }
  });

  /* ---- COPYRIGHT YEAR ---- */
  document.querySelectorAll('#copy-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---- NAVBAR SCROLL ---- */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  /* ---- ACTIVE NAV LINK ---- */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
  const observer  = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));

  /* ---- HAMBURGER MENU ---- */
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
  });
  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ---- PORTFOLIO FILTER ---- */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      portfolioItems.forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.style.display = show ? 'block' : 'none';
      });
    });
  });

  /* ---- SCROLL REVEAL ---- */
  const revealEls = document.querySelectorAll(
    '.service-card, .portfolio-item, .testimonial-card, .process-step, .stat'
  );
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });

  /* ---- CONTACT FORM ---- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Message Sent ✓';
        btn.style.background = '#2a7a2a';
        form.reset();
        setTimeout(() => {
          btn.textContent = 'Send Message';
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1200);
    });
  }

  /* ---- COUNTER ANIMATION ---- */
  const counters = document.querySelectorAll('.count-up');
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        let current  = 0;
        const step   = Math.ceil(target / 60);
        const timer  = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current + suffix;
        }, 25);
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => countObserver.observe(c));

});
