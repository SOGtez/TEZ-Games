export function countryFlag(code) {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return '';
  const A = 65, OFFSET = 0x1F1E6;
  const u = code.toUpperCase();
  return String.fromCodePoint(OFFSET + u.charCodeAt(0) - A, OFFSET + u.charCodeAt(1) - A);
}
