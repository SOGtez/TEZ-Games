import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'invalid' });

  // Don't reveal whether the email exists — always return ok
  await supabase.auth.resetPasswordForEmail(email);

  return res.status(200).json({ ok: true });
}
