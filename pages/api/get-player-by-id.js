import { createClient } from '@supabase/supabase-js';
import { generateFriendCode } from '../../lib/friendCode';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const { data, error } = await supabase
    .from('players')
    .select('id, username, tez_points, tez_bucks, level, total_games, total_wins, total_losses, current_streak, best_streak, country, blackjack_balance, blackjack_biggest_win, auth_id, friend_code, last_login_bonus')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: 'server' });
  if (!data) return res.status(404).json({ error: 'not_found' });

  // Backfill country for existing players who don't have one yet
  if (!data.country) {
    const country = req.headers['x-vercel-ip-country'] || null;
    if (country) {
      await supabase.from('players').update({ country }).eq('id', id);
      data.country = country;
    }
  }

  // Backfill friend_code for existing players who don't have one yet
  if (!data.friend_code) {
    const friend_code = generateFriendCode();
    await supabase.from('players').update({ friend_code }).eq('id', id);
    data.friend_code = friend_code;
  }

  // Daily login bonus — award 10 TEZ Bucks once per calendar day on site load
  const today = new Date().toISOString().slice(0, 10);
  let dailyLoginBucks = 0;
  if (data.last_login_bonus !== today) {
    dailyLoginBucks = 10;
    data.tez_bucks = (data.tez_bucks || 0) + 10;
    data.last_login_bonus = today;
    await supabase.from('players').update({ tez_bucks: data.tez_bucks, last_login_bonus: today }).eq('id', id);
  }

  return res.status(200).json({ ...data, dailyLoginBucks });
}
