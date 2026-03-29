const cloudinary = require('cloudinary').v2;
const crypto     = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_KEYS = [
  'logo','hero','about',
  'corp-1','social-1','brand-1','virtual-1','corp-2','social-2','prod-1','brand-2','corp-3',
  'corporate','social','activation','virtual','production','livestream',
  'team-1','team-2','team-3'
];

function requireAuth(event) {
  const token  = event.headers['x-admin-token'];
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return token && stored && token === stored;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const { key, dataUrl } = body;

    if (!key || !IMAGE_KEYS.includes(key)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image key' }) };
    }
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image data' }) };
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id: `neema-synergy/${key}`,
      overwrite: true,
      invalidate: true,
    });

    // Save URL to JSONBin so public site can read it
    const JSONBIN_URL = process.env.JSONBIN_URL;
    const JSONBIN_KEY = process.env.JSONBIN_API_KEY;
    if (JSONBIN_URL && JSONBIN_KEY) {
      const current = await fetch(JSONBIN_URL, {
        headers: { 'X-Master-Key': JSONBIN_KEY, 'X-Bin-Meta': 'false' }
      }).then(r => r.json()).catch(() => ({}));

      if (!current.images) current.images = {};
      current.images[key] = result.secure_url;

      await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
        body: JSON.stringify(current)
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: result.secure_url, key })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
