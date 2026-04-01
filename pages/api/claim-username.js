import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username } = req.body;

  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'invalid' });
  const clean = username.trim();
  if (clean.length < 3 || clean.length > 16 || /\s/.test(clean) || !/^[a-zA-Z0-9_]+$/.test(clean)) {
    return res.status(400).json({ error: 'invalid' });
  }

  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .ilike('username', clean)
    .maybeSingle();

  if (existing) return res.status(409).json({ error: 'taken' });

  const { error } = await supabase.from('players').insert({ username: clean });
  if (error) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true, username: clean });
}
