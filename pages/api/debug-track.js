import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(200).json({ error: 'Missing env vars', url: !!url, key: !!key });
  }

  const supabase = createClient(url, key);
  const { error } = await supabase
    .from('pageviews')
    .insert({ page: '/debug-test', referrer: null, country: 'US', device: 'Desktop', browser: 'Chrome' });

  res.status(200).json({ ok: !error, error: error?.message ?? null });
}
