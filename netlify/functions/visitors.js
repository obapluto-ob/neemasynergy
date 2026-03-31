const cloudinary = require('cloudinary').v2;
const https      = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

async function getData(filename) {
  const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/neema-synergy/${filename}?t=${Date.now()}`;
  const result = await httpsGet(url);
  return result || {};
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
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { visitorId, page } = JSON.parse(event.body || '{}');
      if (!visitorId) return { statusCode: 400, body: JSON.stringify({ error: 'No visitor ID' }) };

      const stats = await getData('visitor-stats.json');

      // Init structure
      if (!stats.totalVisits)   stats.totalVisits   = 0;
      if (!stats.uniqueVisitors) stats.uniqueVisitors = 0;
      if (!stats.visitors)      stats.visitors      = {};
      if (!stats.pageViews)     stats.pageViews     = {};
      if (!stats.dailyVisits)   stats.dailyVisits   = {};
      if (!stats.recentVisits)  stats.recentVisits  = [];

      const today    = new Date().toISOString().split('T')[0];
      const now      = new Date().toISOString();
      const isNew    = !stats.visitors[visitorId];
      const lastVisit = stats.visitors[visitorId]?.lastVisit;

      // Always increment total visits
      stats.totalVisits++;

      // Count unique visitors
      if (isNew) {
        stats.uniqueVisitors++;
        stats.visitors[visitorId] = { firstVisit: now, lastVisit: now, visits: 1 };
      } else {
        stats.visitors[visitorId].lastVisit = now;
        stats.visitors[visitorId].visits++;
      }

      // Daily visits
      stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;

      // Page views
      const pg = page || '/';
      stats.pageViews[pg] = (stats.pageViews[pg] || 0) + 1;

      // Recent visits log (keep last 20)
      stats.recentVisits.unshift({ visitorId: visitorId.slice(0, 8), page: pg, time: now, isNew });
      if (stats.recentVisits.length > 20) stats.recentVisits = stats.recentVisits.slice(0, 20);

      // Keep visitors object lean — only store last 10,000
      const visitorKeys = Object.keys(stats.visitors);
      if (visitorKeys.length > 10000) {
        const oldest = visitorKeys.sort((a, b) =>
          new Date(stats.visitors[a].lastVisit) - new Date(stats.visitors[b].lastVisit)
        ).slice(0, visitorKeys.length - 10000);
        oldest.forEach(k => delete stats.visitors[k]);
      }

      await saveData('visitor-stats.json', stats);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, isNew, totalVisits: stats.totalVisits, uniqueVisitors: stats.uniqueVisitors })
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const stats = await getData('visitor-stats.json');
      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
