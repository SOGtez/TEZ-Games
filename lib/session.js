/**
 * Session persistence helpers — writes to both localStorage AND a 1-year cookie
 * so a cleared localStorage can be recovered from the cookie and vice versa.
 */

const COOKIE_NAME = 'tez_session';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function setCookie(username, id) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(`${username}|${id}`)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function getCookieSession() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  const val = decodeURIComponent(match[1]);
  const pipe = val.indexOf('|');
  if (pipe < 1) return null;
  return { username: val.slice(0, pipe), id: val.slice(pipe + 1) };
}

function deleteCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}

function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

/**
 * Save session to both localStorage and cookie.
 */
export function saveSession(username, id) {
  lsSet('tez_username', username);
  lsSet('tez_player_id', id);
  setCookie(username, id);
}

/**
 * Load session from localStorage (preferred) or cookie (fallback).
 * Re-syncs whichever layer was missing.
 * Returns { username, id } or null.
 */
export function loadSession() {
  const lsUsername = lsGet('tez_username');
  const lsId = lsGet('tez_player_id');

  if (lsUsername && lsId) {
    setCookie(lsUsername, lsId); // keep cookie in sync
    return { username: lsUsername, id: lsId };
  }

  const cookie = getCookieSession();
  if (cookie?.username && cookie?.id) {
    lsSet('tez_username', cookie.username);
    lsSet('tez_player_id', cookie.id);
    return { username: cookie.username, id: cookie.id };
  }

  return null;
}

/**
 * Clear session from both localStorage and cookie.
 */
export function clearSession() {
  lsRemove('tez_username');
  lsRemove('tez_player_id');
  deleteCookie();
}
