import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'missing_room' });

  await supabase
    .from('game_rooms')
    .update({ status: 'finished' })
    .eq('id', roomId);

  return res.status(200).json({ ok: true });
}
