import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function getBrowser(ua) {
  if (/SamsungBrowser/i.test(ua)) return 'Samsung';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'Other';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { page, referrer } = req.body;
  const country = req.headers['x-vercel-ip-country'] || null;
  const ua = req.headers['user-agent'] || '';
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  const browser = getBrowser(ua);

  await supabase.from('pageviews').insert({ page, referrer: referrer || null, country, device, browser });

  res.status(200).json({ ok: true });
}
