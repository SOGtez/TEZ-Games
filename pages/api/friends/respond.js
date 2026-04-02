import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerId, friendshipId, action } = req.body;
  if (!playerId || !friendshipId || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'invalid' });
  }

  // Verify this player is the addressee of the request
  const { data: row } = await supabase
    .from('friendships')
    .select('id')
    .eq('id', friendshipId)
    .eq('addressee_id', playerId)
    .maybeSingle();

  if (!row) return res.status(404).json({ error: 'not_found' });

  if (action === 'accept') {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  } else {
    await supabase.from('friendships').delete().eq('id', friendshipId);
  }

  return res.status(200).json({ ok: true });
}
