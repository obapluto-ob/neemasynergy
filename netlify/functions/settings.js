const { getStore } = require('@netlify/blobs');

function requireAuth(event) {
  const token  = event.headers['x-admin-token'];
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return token && stored && token === stored;
}

async function safeGet(store, key) {
  try { return await store.get(key, { type: 'json' }) || {}; } catch { return {}; }
}

async function safeSet(store, key, value) {
  try { await store.setJSON(key, value); return true; } catch { return false; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-token' } };
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod === 'GET') {
    try {
      const store    = getStore('site-settings');
      const imgStore = getStore('site-images');
      const settings = await safeGet(store, 'settings');
      const images   = await safeGet(imgStore, 'images');
      return { statusCode: 200, headers, body: JSON.stringify({ ...settings, images }) };
    } catch (err) {
      return { statusCode: 200, headers, body: JSON.stringify({ images: {} }) };
    }
  }

  if (event.httpMethod === 'POST') {
    if (!requireAuth(event)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    try {
      const store   = getStore('site-settings');
      const current = await safeGet(store, 'settings');
      const updates = JSON.parse(event.body || '{}');
      const merged  = Object.assign(current, updates);
      const saved   = await safeSet(store, 'settings', merged);
      return { statusCode: 200, headers, body: JSON.stringify({ success: saved }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
