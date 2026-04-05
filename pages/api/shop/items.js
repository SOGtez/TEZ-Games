import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { type } = req.query;

  let query = supabase
    .from('cosmetics')
    .select('id, type, name, description, price_tb, rarity')
    .order('price_tb', { ascending: true });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'server' });

  return res.status(200).json({ items: data || [] });
}
