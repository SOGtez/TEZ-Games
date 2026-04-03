import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, gameMode = 'normal' } = req.body;
  if (!playerId) return res.status(400).json({ error: 'missing_player' });
  if (!['normal', 'rumble'].includes(gameMode)) return res.status(400).json({ error: 'invalid_mode' });

  // Verify player exists
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .single();
  if (!player) return res.status(404).json({ error: 'player_not_found' });

  // Generate a unique 4-char code (retry on collision)
  let code, inserted = false, lastInsertError = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateCode();
    const { error } = await supabase.from('game_rooms').insert({
      room_code: code,
      host_id: playerId,
      game_mode: gameMode,
      status: 'waiting',
    });
    if (!error) { inserted = true; break; }
    lastInsertError = error;
    if (!error.message?.includes('unique')) break; // non-collision error, stop retrying
  }

  if (!inserted) {
    console.error('[rooms/create] insert failed:', lastInsertError);
    return res.status(500).json({
      error: 'create_failed',
      detail: lastInsertError?.message,
      code: lastInsertError?.code,
    });
  }

  const { data: room, error: selectErr } = await supabase
    .from('game_rooms')
    .select('id, room_code')
    .eq('room_code', code)
    .single();

  if (!room) {
    console.error('[rooms/create] select after insert failed:', selectErr);
    return res.status(500).json({ error: 'create_failed', detail: selectErr?.message });
  }

  return res.status(200).json({ code: room.room_code, roomId: room.id });
}
