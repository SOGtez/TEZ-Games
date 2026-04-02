import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { q, playerId } = req.query;
  if (!q || q.length < 2) return res.status(200).json({ results: [] });

  let query = supabase
    .from('players')
    .select('id, username, country, level, tez_points')
    .ilike('username', `%${q}%`)
    .limit(8);

  if (playerId) query = query.neq('id', playerId);

  const { data } = await query;
  return res.status(200).json({ results: data || [] });
}
