/**
 * Report a game result to the TEZ Points system.
 *
 * @param {string} gameType  - 'blackjack' | 'connect4' | 'war'
 * @param {string} result    - 'win' | 'lose' | 'push'
 * @param {object} details   - optional game-specific data (e.g. { isBlackjack: true, payout: 150 })
 * @returns {object|null}    - API response with pointsEarned, newPoints, newLevel, etc. or null if not logged in / error
 */
export async function reportGameResult(gameType, result, details = {}) {
  if (typeof window === 'undefined') return null;
  const playerId = localStorage.getItem('tez_player_id');
  if (!playerId) return null;

  try {
    const res = await fetch('/api/report-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, gameType, result, details }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    window.dispatchEvent(new CustomEvent('tez-result', { detail: data }));
    return data;
  } catch {
    return null;
  }
}
