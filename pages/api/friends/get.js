import { createClient } from '@supabase/supabase-js';
import { attachNamePaints } from '../../../lib/attachPaints';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const PLAYER_FIELDS = 'id, username, country, level, tez_points, total_wins, total_games, equipped_name_paint';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { playerId } = req.query;
  if (!playerId) return res.status(400).json({ error: 'missing' });

  const { data: rows } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${playerId},addressee_id.eq.${playerId}`);

  if (!rows || rows.length === 0) {
    return res.status(200).json({ friends: [], incoming: [], outgoing: [] });
  }

  const otherIds = [...new Set(rows.map(r =>
    r.requester_id === playerId ? r.addressee_id : r.requester_id
  ))];

  const { data: players } = await supabase
    .from('players')
    .select(PLAYER_FIELDS)
    .in('id', otherIds);

  const playerMap = {};
  (players || []).forEach(p => { playerMap[p.id] = p; });

  const friends = [], incoming = [], outgoing = [];

  for (const row of rows) {
    const otherId = row.requester_id === playerId ? row.addressee_id : row.requester_id;
    const other = playerMap[otherId];
    if (!other) continue;
    if (row.status === 'accepted') {
      friends.push(other);
    } else if (row.status === 'pending') {
      if (row.addressee_id === playerId) {
        incoming.push({ id: row.id, requester: other });
      } else {
        outgoing.push({ id: row.id, addressee: other });
      }
    }
  }

  const [paintedFriends, paintedIncoming] = await Promise.all([
    attachNamePaints(supabase, friends),
    attachNamePaints(supabase, incoming.map(i => i.requester)),
  ]);
  const paintedIncomingFull = incoming.map((item, idx) => ({ ...item, requester: paintedIncoming[idx] }));
  return res.status(200).json({ friends: paintedFriends, incoming: paintedIncomingFull, outgoing });
}
