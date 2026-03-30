import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('pageviews')
    .select('session_id')
    .gte('created_at', since)
    .not('session_id', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const unique = new Set(data.map(r => r.session_id)).size;
  res.status(200).json({ live: unique });
}
