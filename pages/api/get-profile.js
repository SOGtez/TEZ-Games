import { createClient } from '@supabase/supabase-js';
import { attachNamePaints } from '../../lib/attachPaints';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id, username } = req.query;
  if (!id && !username) return res.status(400).json({ error: 'missing_param' });

  let query = supabase
    .from('players')
    .select('id, username, tez_points, level, total_games, total_wins, total_losses, current_streak, best_streak, created_at, country, blackjack_biggest_win, equipped_name_paint');

  if (id) query = query.eq('id', id);
  else query = query.ilike('username', username);

  const { data: player, error: playerErr } = await query.single();

  if (playerErr || !player) return res.status(404).json({ error: 'not_found' });

  const [playerWithPaint] = await attachNamePaints(supabase, [player]);
  const playerData = playerWithPaint;

  const { data: gameStats } = await supabase
    .from('game_stats')
    .select('game_type, result, points_earned, created_at')
    .eq('player_id', playerData.id)
    .order('created_at', { ascending: false });

  const stats = gameStats || [];

  const perGame = {};
  for (const game of ['blackjack', 'connect4', 'war']) {
    const gs = stats.filter(s => s.game_type === game);
    perGame[game] = {
      played: gs.length,
      wins: gs.filter(s => s.result === 'win').length,
      losses: gs.filter(s => s.result === 'lose').length,
      pushes: gs.filter(s => s.result === 'push').length,
    };
  }
  perGame.blackjack.biggestWin = playerData.blackjack_biggest_win || 0;

  return res.status(200).json({
    player: playerData,
    perGame,
    recent: stats.slice(0, 10),
  });
}
