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

async function saveData(filename, data) {
  const json    = JSON.stringify(data);
  const base64  = Buffer.from(json).toString('base64');
  const dataUri = `data:application/json;base64,${base64}`;
  await cloudinary.uploader.upload(dataUri, {
    public_id:     `neema-synergy/${filename}`,
    resource_type: 'raw',
    overwrite:     true,
    invalidate:    true,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const { newPasswordHash } = JSON.parse(event.body || '{}');
    if (!newPasswordHash || newPasswordHash.length !== 64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid password hash' }) };
    }

    // Save new hash to Cloudinary
    await saveData('admin-auth.json', { hash: newPasswordHash });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
