import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, email, password } = req.body;
  if (!playerId || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'invalid' });
  }

  // Create Supabase auth user
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
  if (authErr) {
    const msg = authErr.message?.toLowerCase() || '';
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return res.status(409).json({ error: 'email_taken' });
    }
    return res.status(500).json({ error: 'server' });
  }

  const uid = authData.user?.id;
  if (!uid) return res.status(500).json({ error: 'server' });

  // Link auth_id to existing player
  const { error: updateErr } = await supabase
    .from('players')
    .update({ auth_id: uid })
    .eq('id', playerId);

  if (updateErr) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true });
}
