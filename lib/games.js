export const games = [
  {
    slug: 'tez-blackjack',
    name: 'TEZ Blackjack',
    description: 'Beat the dealer without going over 21. Classic single-player card game.',
    emoji: '🃏',
    accentColor: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    modes: null,
  },
  {
    slug: 'uno',
    name: 'TEZ Uno',
    description: 'Match colors and numbers, play action cards, and be first to empty your hand.',
    emoji: '🎴',
    accentColor: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
    locked: true,
    modes: null,
  },
  {
    slug: 'war',
    name: 'TEZ War',
    description: 'Flip cards and battle for the whole deck in this classic game of chance.',
    emoji: '⚔️',
    accentColor: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    modes: null,
  },
  {
    slug: 'tictactoe',
    name: 'TEZ Tic Tac Toe',
    description: 'X vs O — get three in a row to win. Simple, fast, and surprisingly strategic.',
    emoji: '✖️',
    accentColor: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    locked: true,
    modes: null,
  },
  {
    slug: 'minesweeper',
    name: 'TEZ Minesweeper',
    description: 'Clear the board without hitting a mine. Use logic and nerve to survive.',
    emoji: '💣',
    accentColor: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    locked: true,
    modes: null,
  },
  {
    slug: 'connect4',
    name: 'TEZ Connect 4',
    description: 'Drop your pieces and connect four in a row before your opponent does!',
    emoji: '🔴',
    accentColor: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
    locked: true,
    modes: [
      { id: 'normal', label: 'Normal Mode', locked: false },
      { id: 'rumble', label: 'Rumble Mode', locked: true },
    ],
  },
];

export function getGameBySlug(slug) {
  return games.find((g) => g.slug === slug) || null;
}
