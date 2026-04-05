import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const EQUIPPED_COLUMNS = {
  name_paint: 'equipped_name_paint',
  banner: 'equipped_banner',
  skin: 'equipped_skin',
  badge: 'equipped_badge',
  frame: 'equipped_frame',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, cosmeticId, type, action } = req.body;
  if (!playerId || !cosmeticId || !type || !action) return res.status(400).json({ error: 'missing_params' });
  if (!EQUIPPED_COLUMNS[type]) return res.status(400).json({ error: 'invalid_type' });
  if (action !== 'equip' && action !== 'unequip') return res.status(400).json({ error: 'invalid_action' });

  // Verify player owns this cosmetic
  if (action === 'equip') {
    const { data: owned } = await supabase
      .from('player_cosmetics')
      .select('cosmetic_id')
      .eq('player_id', playerId)
      .eq('cosmetic_id', cosmeticId)
      .maybeSingle();
    if (!owned) return res.status(403).json({ error: 'not_owned' });
  }

  const column = EQUIPPED_COLUMNS[type];
  const value = action === 'equip' ? cosmeticId : null;

  const { error } = await supabase
    .from('players')
    .update({ [column]: value })
    .eq('id', playerId);

  if (error) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true, equipped: value });
}
