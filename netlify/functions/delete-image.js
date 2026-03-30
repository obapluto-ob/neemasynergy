const cloudinary = require('cloudinary').v2;
const https      = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const key = event.path.split('/').pop();
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid key' }) };

  try {
    await cloudinary.uploader.destroy(`neema-synergy/${key}`, { invalidate: true });

    const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/neema-synergy/image-map.json?t=${Date.now()}`;
    const map = await httpsGet(url);
    delete map[key];
    await saveImageMap(map);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
