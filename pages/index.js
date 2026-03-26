import Layout from '../components/Layout';
import GameCard from '../components/GameCard';
import { games } from '../lib/games';

export default function Home() {
  return (
    <Layout title="TEZ Games — Play Now!">
      {/* Hero */}
      <section className="text-center mb-14 pt-6">
        <h1 className="font-fredoka text-6xl sm:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-4 leading-tight">
          Let's Play! 🎉
        </h1>
        <p className="font-nunito text-xl text-gray-500 max-w-xl mx-auto">
          Free browser games for everyone. No downloads, no accounts — just jump in and have fun!
        </p>

        {/* Decorative bubbles */}
        <div className="flex justify-center gap-4 mt-6 text-3xl">
          {['🃏', '🔴', '🎯', '⭐', '🎲'].map((emoji, i) => (
            <span
              key={i}
              className="animate-float"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </section>

      {/* Games Grid */}
      <section>
        <h2 className="font-fredoka text-3xl font-semibold text-purple-700 mb-6">
          🕹️ Games
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
