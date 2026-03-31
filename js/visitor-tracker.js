/* ============================================
   NEEMA SYNERGY — VISITOR TRACKER
   - Generates unique device ID stored in localStorage
   - Tracks every visit (total) and unique visitors
   - Remembers device across visits
   ============================================ */

(function () {
  // Generate or retrieve unique visitor ID
  function getVisitorId() {
    let id = localStorage.getItem('nse_vid');
    if (!id) {
      // Generate a random unique ID for this device
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('nse_vid', id);
    }
    return id;
  }

  const visitorId = getVisitorId();
  const page      = window.location.pathname;

  // Send visit to server
  fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, page })
  }).catch(() => {});
})();
