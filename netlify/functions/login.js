const crypto = require('crypto');
const https  = require('https');

function hash(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function httpsGet(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { password } = JSON.parse(event.body || '{}');
  if (!password) return { statusCode: 400, body: JSON.stringify({ error: 'Password required' }) };

  const inputHash = hash(password);

  // Check Cloudinary for updated password first
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const saved = await httpsGet(
    `https://res.cloudinary.com/${cloudName}/raw/upload/neema-synergy/admin-auth.json?t=${Date.now()}`
  );

  const storedHash = (saved && saved.hash) ? saved.hash : process.env.ADMIN_PASSWORD_HASH;

  if (!storedHash) return { statusCode: 500, body: JSON.stringify({ error: 'Admin not configured' }) };

  if (inputHash === storedHash) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
  return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) };
};
