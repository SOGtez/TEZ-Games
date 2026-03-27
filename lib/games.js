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
    slug: 'connect4',
    name: 'TEZ Connect 4',
    description: 'Drop your pieces and connect four in a row before your opponent does!',
    emoji: '🔴',
    accentColor: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
    modes: [
      { id: 'normal', label: 'Normal Mode', locked: false },
      { id: 'rumble', label: 'Rumble Mode', locked: true },
    ],
  },
];

export function getGameBySlug(slug) {
  return games.find((g) => g.slug === slug) || null;
}
