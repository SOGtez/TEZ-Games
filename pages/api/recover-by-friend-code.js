import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'missing_code' });

  const { data, error } = await supabase
    .from('players')
    .select('id, username, auth_id')
    .ilike('friend_code', code.trim().toUpperCase())
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'server' });
  if (!data) return res.status(404).json({ error: 'not_found' });

  return res.status(200).json({ id: data.id, username: data.username, hasEmail: !!data.auth_id });
}
