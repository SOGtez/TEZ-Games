import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerId, friendId } = req.body;
  if (!playerId || !friendId) return res.status(400).json({ error: 'missing' });

  await Promise.all([
    supabase.from('friendships').delete()
      .eq('requester_id', playerId).eq('addressee_id', friendId),
    supabase.from('friendships').delete()
      .eq('requester_id', friendId).eq('addressee_id', playerId),
  ]);

  return res.status(200).json({ ok: true });
}
