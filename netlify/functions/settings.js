// Settings are stored in Netlify Blobs or env variable SITE_SETTINGS (JSON string)
// For simplicity we use a JSONBin.io free bin as persistent storage

const JSONBIN_URL = process.env.JSONBIN_URL;
const JSONBIN_KEY = process.env.JSONBIN_API_KEY;

function requireAuth(event) {
  const token  = event.headers['x-admin-token'];
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return token && stored && token === stored;
}

async function fetchSettings() {
  if (!JSONBIN_URL || !JSONBIN_KEY) return {};
  const res = await fetch(JSONBIN_URL, {
    headers: { 'X-Master-Key': JSONBIN_KEY, 'X-Bin-Meta': 'false' }
  });
  return res.ok ? res.json() : {};
}

async function saveSettings(data) {
  if (!JSONBIN_URL || !JSONBIN_KEY) return false;
  const res = await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY,
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

exports.handler = async (event) => {
  // Public GET — site pages can read settings
  if (event.httpMethod === 'GET') {
    const settings = await fetchSettings();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    };
  }

  // POST — admin only
  if (event.httpMethod === 'POST') {
    if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    const current  = await fetchSettings();
    const updates  = JSON.parse(event.body || '{}');
    const merged   = Object.assign(current, updates);
    const ok       = await saveSettings(merged);
    return {
      statusCode: ok ? 200 : 500,
      body: JSON.stringify(ok ? { success: true } : { error: 'Failed to save' })
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
