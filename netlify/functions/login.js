const crypto = require('crypto');

function hash(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { password } = JSON.parse(event.body || '{}');
  if (!password) return { statusCode: 400, body: JSON.stringify({ error: 'Password required' }) };

  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return { statusCode: 500, body: JSON.stringify({ error: 'Admin not configured' }) };

  if (hash(password) === stored) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
  return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) };
};
