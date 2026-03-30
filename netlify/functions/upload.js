const cloudinary = require('cloudinary').v2;
const https      = require('https');

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

function httpsGet(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

async function getImageMap() {
  const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/neema-synergy/image-map.json?t=${Date.now()}`;
  return httpsGet(url);
}

async function saveImageMap(map) {
  const json    = JSON.stringify(map);
  const base64  = Buffer.from(json).toString('base64');
  const dataUri = `data:application/json;base64,${base64}`;
  await cloudinary.uploader.upload(dataUri, {
    public_id:     'neema-synergy/image-map.json',
    resource_type: 'raw',
    overwrite:     true,
    invalidate:    true,
  });
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

    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id:  `neema-synergy/${key}`,
      overwrite:  true,
      invalidate: true,
    });

    const map = await getImageMap();
    map[key]  = result.secure_url;
    await saveImageMap(map);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: result.secure_url, key })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
