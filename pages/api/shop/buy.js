import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, cosmeticId } = req.body;
  if (!playerId || !cosmeticId) return res.status(400).json({ error: 'missing_params' });

  // Get cosmetic price
  const { data: cosmetic, error: cosErr } = await supabase
    .from('cosmetics')
    .select('id, name, price_tb')
    .eq('id', cosmeticId)
    .single();
  if (cosErr || !cosmetic) return res.status(404).json({ error: 'not_found' });

  // Get player balance
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, tez_bucks')
    .eq('id', playerId)
    .single();
  if (playerErr || !player) return res.status(404).json({ error: 'player_not_found' });

  // Check already owned
  const { data: existing } = await supabase
    .from('player_cosmetics')
    .select('cosmetic_id')
    .eq('player_id', playerId)
    .eq('cosmetic_id', cosmeticId)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'already_owned' });

  // Check balance
  if ((player.tez_bucks || 0) < cosmetic.price_tb) {
    return res.status(402).json({ error: 'insufficient_funds', need: cosmetic.price_tb, have: player.tez_bucks });
  }

  // Deduct TB and add cosmetic in a two-step operation
  const newBucks = player.tez_bucks - cosmetic.price_tb;

  const { error: deductErr } = await supabase
    .from('players')
    .update({ tez_bucks: newBucks })
    .eq('id', playerId);
  if (deductErr) return res.status(500).json({ error: 'server' });

  const { error: insertErr } = await supabase
    .from('player_cosmetics')
    .insert({ player_id: playerId, cosmetic_id: cosmeticId });
  if (insertErr) {
    // Refund on failure
    await supabase.from('players').update({ tez_bucks: player.tez_bucks }).eq('id', playerId);
    return res.status(500).json({ error: 'server' });
  }

  return res.status(200).json({ ok: true, newBucks, cosmeticName: cosmetic.name });
}
