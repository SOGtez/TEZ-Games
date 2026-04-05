import { createClient } from '@supabase/supabase-js';
import { generateFriendCode } from '../../lib/friendCode';
import { generateRecoveryCode } from '../../lib/recoveryCode';
import { containsProfanity } from '../../lib/wordFilter';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, playerId } = req.body;

  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'invalid' });
  const clean = username.trim();
  if (clean.length < 3 || clean.length > 16 || /\s/.test(clean) || !/^[a-zA-Z0-9_]+$/.test(clean)) {
    return res.status(400).json({ error: 'invalid' });
  }
  if (containsProfanity(clean)) return res.status(400).json({ error: 'profanity' });

  // Check if name is taken by someone else
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .ilike('username', clean)
    .maybeSingle();

  if (existing && existing.id !== playerId) return res.status(409).json({ error: 'taken' });

  const country = req.headers['x-vercel-ip-country'] || null;

  if (playerId) {
    // Update existing player's username (and country if not yet set)
    const update = { username: clean };
    if (country) update.country = country;
    const { error } = await supabase
      .from('players')
      .update(update)
      .eq('id', playerId);
    if (error) return res.status(500).json({ error: 'server' });
    return res.status(200).json({ ok: true, username: clean, id: playerId });
  }

  // New player — insert
  const { data, error } = await supabase
    .from('players')
    .insert({ username: clean, friend_code: generateFriendCode(), recovery_code: generateRecoveryCode(), ...(country ? { country } : {}) })
    .select('id')
    .single();
  if (error) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ ok: true, username: clean, id: data.id });
}
