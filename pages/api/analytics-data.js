export default async function handler(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const now = Date.now();
  const from = now - 30 * 24 * 60 * 60 * 1000;
  const filter = encodeURIComponent(JSON.stringify({}));

  const headers = { Authorization: `Bearer ${token}` };
  const base = `https://vercel.com/api/web/insights`;
  const params = `projectId=${projectId}&from=${from}&to=${now}&filter=${filter}`;

  const breakdown = (metric, limit = 8) =>
    fetch(`${base}/breakdown?${params}&metric=${metric}&limit=${limit}`, { headers }).then(r => r.json());

  try {
    const [stats, pages, countries, referrers, devices, browsers] = await Promise.all([
      fetch(`${base}/pageviews?${params}&limit=30`, { headers }).then(r => r.json()),
      breakdown('path', 8),
      breakdown('country', 8),
      breakdown('referrer', 8),
      breakdown('device', 5),
      breakdown('browser', 6),
    ]);

    res.status(200).json({ stats, pages, countries, referrers, devices, browsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
