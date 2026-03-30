/* ============================================
   NEEMA SYNERGY — CONTACT FORM
   Uses EmailJS — free, no backend needed
   Client sets up at emailjs.com
   ============================================ */

(function () {
  fetch('/api/settings')
    .then(r => r.json())
    .then(s => {
      if (s.emailjsPublicKey)  emailjs.init(s.emailjsPublicKey);
      if (s.emailjsServiceId)  window._ejsService  = s.emailjsServiceId;
      if (s.emailjsTemplateId) window._ejsTemplate = s.emailjsTemplateId;
    })
    .catch(() => {});

  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const serviceId  = window._ejsService;
    const templateId = window._ejsTemplate;

    if (!serviceId || !templateId) {
      showFormMsg('Contact form not configured yet. Please call or WhatsApp us directly.', false);
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    const params = {
      from_name:   form.firstName.value + ' ' + form.lastName.value,
      from_email:  form.email.value,
      phone:       form.phone.value,
      service:     form.service.value,
      event_date:  form.eventDate.value,
      guest_count: form.guestCount.value,
      message:     form.message.value,
    };

    try {
      await emailjs.send(serviceId, templateId, params);
      showFormMsg('Message sent! We will get back to you within 24 hours.', true);
      form.reset();
    } catch (err) {
      showFormMsg('Failed to send. Please try again or contact us directly.', false);
    }

    btn.textContent = originalText;
    btn.disabled = false;
  });

  function showFormMsg(msg, success) {
    let el = document.getElementById('form-message');
    if (!el) {
      el = document.createElement('p');
      el.id = 'form-message';
      el.style.cssText = 'padding:14px;font-size:0.85rem;font-weight:600;margin-top:8px;text-align:center;';
      document.getElementById('contactForm').appendChild(el);
    }
    el.textContent = msg;
    el.style.background = success ? 'rgba(45,122,45,0.15)' : 'rgba(160,32,32,0.15)';
    el.style.color       = success ? '#4caf50' : '#e05555';
    el.style.border      = success ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(224,85,85,0.3)';
    setTimeout(() => { if (el) el.textContent = ''; }, 6000);
  }
})();
