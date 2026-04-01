import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { tab = 'global', playerId } = req.query;

  if (tab === 'global') {
    const { data: top50, error } = await supabase
      .from('players')
      .select('id, username, level, tez_points, total_wins, total_games, country')
      .order('tez_points', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: 'server' });

    let userRank = null;
    if (playerId && !(top50 || []).find(p => p.id === playerId)) {
      const { data: userRow } = await supabase
        .from('players')
        .select('id, username, level, tez_points, total_wins, total_games, country')
        .eq('id', playerId)
        .single();

      if (userRow) {
        const { count } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true })
          .gt('tez_points', userRow.tez_points);
        userRank = { ...userRow, rank: (count || 0) + 1 };
      }
    }

    return res.status(200).json({ rows: top50 || [], userRank });
  }

  const gameType = tab;
  if (!['blackjack', 'connect4', 'war'].includes(gameType)) {
    return res.status(400).json({ error: 'invalid_tab' });
  }

  const { data: gameStats } = await supabase
    .from('game_stats')
    .select('player_id, result')
    .eq('game_type', gameType);

  if (!gameStats?.length) return res.status(200).json({ rows: [], userRank: null });

  const agg = {};
  for (const s of gameStats) {
    if (!agg[s.player_id]) agg[s.player_id] = { wins: 0, played: 0 };
    agg[s.player_id].played++;
    if (s.result === 'win') agg[s.player_id].wins++;
  }

  const sorted = Object.entries(agg)
    .sort((a, b) => b[1].wins - a[1].wins || b[1].played - a[1].played)
    .slice(0, 50);

  const playerIds = sorted.map(([id]) => id);
  const { data: players } = await supabase
    .from('players')
    .select('id, username, level, country')
    .in('id', playerIds);

  const playerMap = Object.fromEntries((players || []).map(p => [p.id, p]));
  const rows = sorted
    .map(([id, stats]) => ({ id, ...playerMap[id], wins: stats.wins, played: stats.played }))
    .filter(r => r.username);

  let userRank = null;
  if (playerId && !rows.find(r => r.id === playerId) && agg[playerId]) {
    const userStats = agg[playerId];
    const rank = Object.values(agg).filter(a => a.wins > userStats.wins).length + 1;
    const { data: userPlayer } = await supabase
      .from('players')
      .select('id, username, level, country')
      .eq('id', playerId)
      .single();
    if (userPlayer) userRank = { ...userPlayer, ...userStats, rank };
  }

  return res.status(200).json({ rows, userRank });
}
