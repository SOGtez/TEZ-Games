export default async function handler(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const now = Date.now();
  const from = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  const filter = JSON.stringify({});

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const base = `https://vercel.com/api/web/insights`;
  const params = `projectId=${projectId}&from=${from}&to=${now}&filter=${encodeURIComponent(filter)}`;

  try {
    const [statsRes, breakdownRes] = await Promise.all([
      fetch(`${base}/pageviews?${params}&limit=30`, { headers }),
      fetch(`${base}/breakdown?${params}&metric=path&limit=8`, { headers }),
    ]);

    const stats = await statsRes.json();
    const breakdown = await breakdownRes.json();

    res.status(200).json({ stats, breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
