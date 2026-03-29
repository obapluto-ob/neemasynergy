const cloudinary = require('cloudinary').v2;

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
  if (!requireAuth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'neema-synergy/',
      max_results: 50,
    });

    const map = {};
    IMAGE_KEYS.forEach(key => { map[key] = null; });

    result.resources.forEach(r => {
      const key = r.public_id.replace('neema-synergy/', '');
      if (map.hasOwnProperty(key)) {
        map[key] = r.secure_url;
      }
    });

    return { statusCode: 200, body: JSON.stringify(map) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
