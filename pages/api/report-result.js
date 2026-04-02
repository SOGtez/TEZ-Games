import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const LEVELS = [
  [25000, 'GOAT'],
  [10000, 'Legend'],
  [5000,  'Master'],
  [2000,  'Champion'],
  [500,   'Competitor'],
  [100,   'Player'],
  [0,     'Rookie'],
];

function getLevel(points) {
  for (const [threshold, name] of LEVELS) {
    if (points >= threshold) return name;
  }
  return 'Rookie';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, gameType, result, details } = req.body;
  if (!playerId || !gameType || !result) return res.status(400).json({ error: 'invalid' });
  if (!['win', 'lose', 'push'].includes(result)) return res.status(400).json({ error: 'invalid_result' });
  if (!['blackjack', 'connect4', 'war'].includes(gameType)) return res.status(400).json({ error: 'invalid_game' });

  // Fetch current player stats
  const { data: player, error: fetchErr } = await supabase
    .from('players')
    .select('tez_points, tez_bucks, level, daily_bonus_date, last_login_bonus, total_games, total_wins, total_losses, current_streak, best_streak, blackjack_biggest_win')
    .eq('id', playerId)
    .single();

  if (fetchErr || !player) return res.status(404).json({ error: 'player_not_found' });

  // Calculate new streak
  let newStreak = player.current_streak;
  if (result === 'win') newStreak = player.current_streak + 1;
  else if (result === 'lose') newStreak = 0;
  const newBestStreak = Math.max(player.best_streak, newStreak);

  const today = new Date().toISOString().slice(0, 10);

  // Calculate TP
  let tp = result === 'win' ? 10 : result === 'lose' ? 2 : 3;
  if (result === 'win' && details?.isBlackjack) tp = 15;
  if (result === 'win' && newStreak >= 2) tp += 5;

  // TP daily bonus
  const dailyBonus = player.daily_bonus_date !== today;
  if (dailyBonus) tp += 5;

  const newPoints = player.tez_points + tp;
  const newLevel = getLevel(newPoints);

  // Calculate TEZ Bucks
  let bucks = result === 'win' ? 5 : result === 'lose' ? 1 : 2;
  if (result === 'win' && details?.isBlackjack) bucks += 10;
  if (result === 'win' && newStreak >= 2) bucks += 3;

  // Bucks daily login bonus
  const storedBucksBonus = player.last_login_bonus ? String(player.last_login_bonus).slice(0, 10) : null;
  const dailyBucksBonus = storedBucksBonus !== today;
  if (dailyBucksBonus) bucks += 10;

  const newBucks = (player.tez_bucks || 0) + bucks;

  // Insert into game_stats
  const { error: statsErr } = await supabase.from('game_stats').insert({
    player_id: playerId,
    game_type: gameType,
    result,
    points_earned: tp,
    details: details || null,
  });
  if (statsErr) return res.status(500).json({ error: 'stats_insert_failed' });

  // Update player row
  const updatePayload = {
    tez_points: newPoints,
    tez_bucks: newBucks,
    level: newLevel,
    total_games: player.total_games + 1,
    total_wins: player.total_wins + (result === 'win' ? 1 : 0),
    total_losses: player.total_losses + (result === 'lose' ? 1 : 0),
    current_streak: newStreak,
    best_streak: newBestStreak,
  };
  if (dailyBonus) updatePayload.daily_bonus_date = today;
  if (dailyBucksBonus) updatePayload.last_login_bonus = today;
  if (gameType === 'blackjack') {
    if (details?.balance !== undefined) updatePayload.blackjack_balance = details.balance;
    if (details?.biggestWin !== undefined) {
      updatePayload.blackjack_biggest_win = Math.max(player.blackjack_biggest_win || 0, details.biggestWin);
    }
  }

  const { error: updateErr } = await supabase
    .from('players')
    .update(updatePayload)
    .eq('id', playerId);

  if (updateErr) return res.status(500).json({ error: 'update_failed' });

  return res.status(200).json({
    ok: true,
    pointsEarned: tp,
    dailyBonus,
    newPoints,
    newLevel,
    previousLevel: player.level,
    newStreak,
    bucksEarned: bucks,
    dailyBucksBonus,
    newBucks,
  });
}
