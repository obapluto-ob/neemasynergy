const { getStore } = require('@netlify/blobs');

function requireAuth(event) {
  const token  = event.headers['x-admin-token'];
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return token && stored && token === stored;
}

exports.handler = async (event) => {
  const store = getStore('site-settings');

  if (event.httpMethod === 'GET') {
    try {
      const settings = await store.get('settings', { type: 'json' }).catch(() => ({}));
      // Also merge in images from image store
      const imgStore = getStore('site-images');
      const images   = await imgStore.get('images', { type: 'json' }).catch(() => ({}));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ...(settings || {}), images: images || {} })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'POST') {
    if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    try {
      const current = await store.get('settings', { type: 'json' }).catch(() => ({}));
      const updates = JSON.parse(event.body || '{}');
      const merged  = Object.assign(current || {}, updates);
      await store.setJSON('settings', merged);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
