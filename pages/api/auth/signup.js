import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body;
  const clean = (username || '').trim();

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(clean)) return res.status(400).json({ error: 'invalid_username' });
  if (!email || !password || password.length < 6) return res.status(400).json({ error: 'invalid' });

  // Check username not taken
  const { data: existing } = await supabase
    .from('players').select('id').ilike('username', clean).maybeSingle();
  if (existing) return res.status(409).json({ error: 'taken' });

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

  // Create player record
  const country = req.headers['x-vercel-ip-country'] || null;
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({ username: clean, auth_id: uid, ...(country ? { country } : {}) })
    .select('id')
    .single();

  if (playerErr) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true, username: clean, id: player.id });
}
