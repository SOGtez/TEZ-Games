import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerId, target } = req.body;
  if (!playerId || !target) return res.status(400).json({ error: 'missing' });

  const isFriendCode = /^TEZ-[A-Z0-9]{4}$/i.test(target.trim());

  let query = supabase.from('players').select('id, username');
  query = isFriendCode
    ? query.ilike('friend_code', target.trim())
    : query.ilike('username', target.trim());

  const { data: targetPlayer } = await query.maybeSingle();
  if (!targetPlayer) return res.status(404).json({ error: 'not_found' });
  if (targetPlayer.id === playerId) return res.status(400).json({ error: 'self' });

  // Check both directions for existing friendship/request
  const [{ data: f1 }, { data: f2 }] = await Promise.all([
    supabase.from('friendships').select('id, status')
      .eq('requester_id', playerId).eq('addressee_id', targetPlayer.id).maybeSingle(),
    supabase.from('friendships').select('id, status')
      .eq('requester_id', targetPlayer.id).eq('addressee_id', playerId).maybeSingle(),
  ]);

  const existing = f1 || f2;
  if (existing) {
    if (existing.status === 'accepted') return res.status(409).json({ error: 'already_friends' });
    return res.status(409).json({ error: 'request_exists' });
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: playerId, addressee_id: targetPlayer.id });

  if (error) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true, username: targetPlayer.username });
}
