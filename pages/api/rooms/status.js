import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'missing_room' });

  const { data: room } = await supabase
    .from('game_rooms')
    .select('id, status, game_mode, host_id, guest_id')
    .eq('id', roomId)
    .single();

  if (!room) return res.status(404).json({ error: 'not_found' });

  let guestUsername = null, guestLevel = null, guestCountry = null;
  let guestPaintCss = null;
  if (room.guest_id) {
    const { data: guest } = await supabase
      .from('players')
      .select('username, level, country, equipped_name_paint')
      .eq('id', room.guest_id)
      .single();
    guestUsername = guest?.username || 'Player';
    guestLevel = guest?.level || 'Rookie';
    guestCountry = guest?.country || null;
    if (guest?.equipped_name_paint) {
      const { data: paintCosmetic } = await supabase
        .from('cosmetics').select('css_value').eq('id', guest.equipped_name_paint).single();
      guestPaintCss = paintCosmetic?.css_value || null;
    }
  }

  return res.status(200).json({
    status: room.status,
    gameMode: room.game_mode,
    guestId: room.guest_id,
    guestUsername,
    guestLevel,
    guestCountry,
    guestPaintCss: room.guest_id ? guestPaintCss : null,
  });
}
