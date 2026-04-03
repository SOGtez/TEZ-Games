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
  let code, inserted = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateCode();
    const { error } = await supabase.from('game_rooms').insert({
      code,
      host_id: playerId,
      game_mode: gameMode,
      status: 'waiting',
    });
    if (!error) { inserted = true; break; }
    if (!error.message?.includes('unique')) break; // non-collision error
  }

  if (!inserted) return res.status(500).json({ error: 'create_failed' });

  const { data: room } = await supabase
    .from('game_rooms')
    .select('id, code')
    .eq('code', code)
    .single();

  return res.status(200).json({ code: room.code, roomId: room.id });
}
