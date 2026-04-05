import { createClient } from '@supabase/supabase-js';
import { generateFriendCode } from '../../lib/friendCode';
import { generateRecoveryCode } from '../../lib/recoveryCode';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const { data, error } = await supabase
    .from('players')
    .select('id, username, tez_points, tez_bucks, level, total_games, total_wins, total_losses, current_streak, best_streak, country, blackjack_balance, blackjack_biggest_win, auth_id, friend_code, last_login_bonus, recovery_code, equipped_name_paint')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: 'server' });
  if (!data) return res.status(404).json({ error: 'not_found' });

  // Backfill country for existing players who don't have one yet
  if (!data.country) {
    const country = req.headers['x-vercel-ip-country'] || null;
    if (country) {
      await supabase.from('players').update({ country }).eq('id', id);
      data.country = country;
    }
  }

  // Backfill friend_code for existing players who don't have one yet
  if (!data.friend_code) {
    const friend_code = generateFriendCode();
    await supabase.from('players').update({ friend_code }).eq('id', id);
    data.friend_code = friend_code;
  }

  if (!data.recovery_code) {
    const recovery_code = generateRecoveryCode();
    await supabase.from('players').update({ recovery_code }).eq('id', id);
    data.recovery_code = recovery_code;
  }

  // Daily login bonus — award 10 TEZ Bucks once per calendar day on site load.
  // Normalize to YYYY-MM-DD (column may return a full timestamp string).
  // Two separate conditional UPDATEs (null case vs. old-date case) avoid .or() filter
  // quirks — only one concurrent request can win the write.
  const today = new Date().toISOString().slice(0, 10);
  let dailyLoginBucks = 0;
  const storedBonus = data.last_login_bonus ? String(data.last_login_bonus).slice(0, 10) : null;
  if (storedBonus !== today) {
    const newBucks = (data.tez_bucks || 0) + 10;
    const bonusPayload = { tez_bucks: newBucks, last_login_bonus: today };
    let updateCount = 0;
    if (!data.last_login_bonus) {
      const { count } = await supabase
        .from('players')
        .update(bonusPayload, { count: 'exact' })
        .eq('id', id)
        .is('last_login_bonus', null);
      updateCount = count ?? 0;
    } else {
      const { count } = await supabase
        .from('players')
        .update(bonusPayload, { count: 'exact' })
        .eq('id', id)
        .lt('last_login_bonus', today);
      updateCount = count ?? 0;
    }
    if (updateCount > 0) {
      dailyLoginBucks = 10;
      data.tez_bucks = newBucks;
      data.last_login_bonus = today;
    }
  }

  // Attach name paint CSS
  if (data.equipped_name_paint) {
    const { data: cosmetic } = await supabase
      .from('cosmetics')
      .select('css_value')
      .eq('id', data.equipped_name_paint)
      .single();
    data.paint_css = cosmetic?.css_value || null;
  } else {
    data.paint_css = null;
  }

  return res.status(200).json({ ...data, dailyLoginBucks });
}
