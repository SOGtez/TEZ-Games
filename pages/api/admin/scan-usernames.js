/**
 * One-time admin scan — finds existing usernames that violate the word filter.
 *
 * Usage:
 *   GET /api/admin/scan-usernames?secret=<ADMIN_SECRET>
 *
 * Returns:
 *   { total: N, flagged: [{ id, username }] }
 *
 * Set ADMIN_SECRET in your Vercel env vars before calling this endpoint.
 * Delete or disable this route once you've cleaned up flagged accounts.
 */

import { createClient } from '@supabase/supabase-js';
import { containsProfanity } from '../../../lib/wordFilter';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Require a secret to prevent public access
  const { secret } = req.query;
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Fetch all usernames (paginate in batches to handle large tables)
  const flagged = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('id, username')
      .range(from, from + batchSize - 1);

    if (error) return res.status(500).json({ error: 'db_error', detail: error.message });
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (containsProfanity(row.username)) {
        flagged.push({ id: row.id, username: row.username });
      }
    }

    if (data.length < batchSize) break;
    from += batchSize;
  }

  return res.status(200).json({ total: from + (flagged.length > 0 ? 1 : 0), flagged });
}
