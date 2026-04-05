// Unambiguous chars: no 0/O, 1/I/L
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRecoveryCode() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return `${group()}-${group()}-${group()}-${group()}`;
}
