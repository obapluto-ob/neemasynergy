const cloudinary = require('cloudinary').v2;
const { getStore } = require('@netlify/blobs');

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
    const { key, dataUrl } = JSON.parse(event.body || '{}');

    if (!key || !IMAGE_KEYS.includes(key)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image key' }) };
    }
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image data' }) };
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id: `neema-synergy/${key}`,
      overwrite: true,
      invalidate: true,
    });

    // Save URL to Netlify Blobs
    const store    = getStore('site-images');
    const existing = await store.get('images', { type: 'json' }).catch(() => ({}));
    const updated  = Object.assign(existing || {}, { [key]: result.secure_url });
    await store.setJSON('images', updated);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: result.secure_url, key })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
