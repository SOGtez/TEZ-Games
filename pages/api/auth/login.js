import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'invalid' });

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) return res.status(401).json({ error: 'invalid_credentials' });

  const uid = authData.user?.id;
  if (!uid) return res.status(500).json({ error: 'server' });

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, username')
    .eq('auth_id', uid)
    .single();

  if (playerErr || !player) return res.status(404).json({ error: 'not_found' });

  return res.status(200).json({ ok: true, username: player.username, id: player.id });
}
