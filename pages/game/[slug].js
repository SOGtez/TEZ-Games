import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { games, getGameBySlug } from '../../lib/games';
import BlackjackGame from '../../components/games/BlackjackGame';
import Connect4Game from '../../components/games/Connect4Game';

const gameComponents = {
  blackjack: BlackjackGame,
  connect4: Connect4Game,
};

export async function getStaticPaths() {
  return {
    paths: games.map((g) => ({ params: { slug: g.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const game = getGameBySlug(params.slug);
  return { props: { game } };
}

export default function GamePage({ game }) {
  const [selectedMode, setSelectedMode] = useState(
    game.modes ? game.modes.find((m) => !m.locked)?.id : null
  );

  const GameComponent = gameComponents[game.slug];

  return (
    <Layout title={`${game.name} — TEZ Games`}>
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-pink-500 transition-colors duration-200 font-nunito"
        >
          ← Back to Games
        </Link>
      </div>

      {/* Game header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md flex-shrink-0"
          style={{ background: game.gradient }}
        >
          {game.emoji}
        </span>
        <div>
          <h1 className="font-fredoka text-4xl font-bold text-gray-800">{game.name}</h1>
          <p className="text-gray-500 font-nunito">{game.description}</p>
        </div>
      </div>

      {/* Mode selector (Connect 4) */}
      {game.modes && (
        <div className="flex gap-3 mb-8">
          {game.modes.map((mode) => (
            <button
              key={mode.id}
              disabled={mode.locked}
              onClick={() => !mode.locked && setSelectedMode(mode.id)}
              className={`relative px-5 py-2.5 rounded-xl font-nunito font-semibold text-sm transition-all duration-200 ${
                mode.locked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedMode === mode.id
                  ? 'text-white shadow-md scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500'
              }`}
              style={
                !mode.locked && selectedMode === mode.id
                  ? { background: game.gradient }
                  : {}
              }
            >
              {mode.locked && (
                <span className="mr-1.5">🔒</span>
              )}
              {mode.label}
              {mode.locked && (
                <span className="ml-2 bg-orange-400 text-white text-xs px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Game container */}
      <div className="w-full bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden p-6">
        {GameComponent ? (
          <GameComponent mode={selectedMode} />
        ) : (
          <div className="text-center py-20 text-gray-400 font-nunito text-lg">
            Game coming soon!
          </div>
        )}
      </div>
    </Layout>
  );
}
