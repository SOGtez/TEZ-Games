/**
 * Attaches paint_css to each player object.
 * @param {object} supabase - Supabase client
 * @param {Array} players - array of player objects with optional equipped_name_paint field
 * @returns {Array} same players but with paint_css field added
 */
export async function attachNamePaints(supabase, players) {
  if (!players || players.length === 0) return players;
  const ids = [...new Set(players.map(p => p.equipped_name_paint).filter(Boolean))];
  if (!ids.length) return players.map(p => ({ ...p, paint_css: null }));

  const { data: cosmetics } = await supabase
    .from('cosmetics')
    .select('id, css_value')
    .in('id', ids);

  const map = Object.fromEntries((cosmetics || []).map(c => [c.id, c.css_value]));

  return players.map(p => ({
    ...p,
    paint_css: p.equipped_name_paint ? (map[p.equipped_name_paint] || null) : null,
  }));
}
