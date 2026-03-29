const { getStore } = require('@netlify/blobs');

function requireAuth(event) {
  const token  = event.headers['x-admin-token'];
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return token && stored && token === stored;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-token' } };
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const store    = getStore('site-settings');
    const existing = await store.get('settings', { type: 'json' }).catch(() => ({}));
    const data     = existing || {};

    if (event.httpMethod === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      if (!requireAuth(event)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      const updates = JSON.parse(event.body || '{}');
      const merged  = Object.assign(data, updates);
      await store.setJSON('settings', merged);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
