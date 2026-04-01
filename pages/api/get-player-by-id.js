import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const { data, error } = await supabase
    .from('players')
    .select('id, username, tez_points, level, total_games, total_wins, total_losses, current_streak, best_streak')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: 'server' });
  if (!data) return res.status(404).json({ error: 'not_found' });

  return res.status(200).json(data);
}
