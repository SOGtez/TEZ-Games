const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateFriendCode() {
  let code = 'TEZ-';
  for (let i = 0; i < 4; i++) code += CHARS[Math.floor(Math.random() * 36)];
  return code;
}
