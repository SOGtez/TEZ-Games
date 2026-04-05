import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { playerId } = req.query;
  if (!playerId) return res.status(400).json({ error: 'missing_playerId' });

  // Get player's equipped items
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('equipped_name_paint, equipped_banner, equipped_skin, equipped_badge, equipped_frame')
    .eq('id', playerId)
    .single();

  if (playerErr || !player) return res.status(404).json({ error: 'not_found' });

  // Get owned cosmetic IDs
  const { data: owned, error: ownedErr } = await supabase
    .from('player_cosmetics')
    .select('cosmetic_id, acquired_at')
    .eq('player_id', playerId)
    .order('acquired_at', { ascending: false });

  if (ownedErr) return res.status(500).json({ error: 'server' });

  let items = [];
  if (owned && owned.length > 0) {
    const cosmeticIds = owned.map(o => o.cosmetic_id);
    const { data: cosmetics } = await supabase
      .from('cosmetics')
      .select('id, type, name, description, rarity, icon')
      .in('id', cosmeticIds);

    const cosmeticMap = Object.fromEntries((cosmetics || []).map(c => [c.id, c]));
    items = owned.map(row => ({
      cosmetic_id: row.cosmetic_id,
      acquired_at: row.acquired_at,
      ...(cosmeticMap[row.cosmetic_id] || {}),
    }));
  }

  return res.status(200).json({
    items,
    equipped: {
      equipped_name_paint: player.equipped_name_paint,
      equipped_banner: player.equipped_banner,
      equipped_skin: player.equipped_skin,
      equipped_badge: player.equipped_badge,
      equipped_frame: player.equipped_frame,
    },
  });
}
