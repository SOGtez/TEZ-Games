import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId } = req.body;
  if (!code || !playerId) return res.status(400).json({ error: 'missing_params' });

  const upperCode = code.toUpperCase().trim();

  const { data: room } = await supabase
    .from('game_rooms')
    .select('id, host_id, game_mode, status, created_at')
    .eq('room_code', upperCode)
    .single();

  if (!room) return res.status(404).json({ error: 'not_found' });
  if (room.status !== 'waiting') return res.status(409).json({ error: 'room_full' });
  if (room.host_id === playerId) return res.status(409).json({ error: 'own_room' });

  // Expire rooms older than 10 minutes
  const ageMs = Date.now() - new Date(room.created_at).getTime();
  if (ageMs > 10 * 60 * 1000) return res.status(410).json({ error: 'expired' });

  // Mark room as playing
  const { error: updateErr } = await supabase
    .from('game_rooms')
    .update({ guest_id: playerId, status: 'playing' })
    .eq('id', room.id)
    .eq('status', 'waiting');

  if (updateErr) return res.status(500).json({ error: 'join_failed' });

  // Fetch host info
  const { data: host } = await supabase
    .from('players')
    .select('username, level, country')
    .eq('id', room.host_id)
    .single();

  return res.status(200).json({
    roomId: room.id,
    gameMode: room.game_mode,
    hostId: room.host_id,
    hostUsername: host?.username || 'Player',
    hostLevel: host?.level || 'Rookie',
    hostCountry: host?.country || null,
  });
}
