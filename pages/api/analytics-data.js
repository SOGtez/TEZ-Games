import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from('pageviews')
    .select('page, referrer, country, device, created_at')
    .gte('created_at', since);

  if (error) return res.status(500).json({ error: error.message });

  const total = rows.length;

  const tally = (field) => {
    const counts = {};
    rows.forEach(r => {
      const key = r[field] || '(direct)';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  // Build daily buckets for last 30 days
  const daily = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  rows.forEach(r => {
    const key = r.created_at.slice(0, 10);
    if (key in daily) daily[key]++;
  });
  const dailyData = Object.entries(daily).map(([date, total]) => ({ date, total }));

  res.status(200).json({
    total,
    daily: dailyData,
    pages: tally('page'),
    countries: tally('country'),
    devices: tally('device'),
    referrers: tally('referrer'),
  });
}
