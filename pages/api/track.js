import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { page, referrer } = req.body;
  const country = req.headers['x-vercel-ip-country'] || null;
  const ua = req.headers['user-agent'] || '';
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop';

  await supabase.from('pageviews').insert({ page, referrer: referrer || null, country, device });

  res.status(200).json({ ok: true });
}
