import Layout from '../components/Layout';
import GameCard from '../components/GameCard';
import { games } from '../lib/games';

export default function Home() {
  return (
    <Layout title="TEZ Games — Play Now!">
      {/* Hero */}
      <section className="text-center mb-16 pt-10 hero-fade">
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(253,224,71,0.08)',
          border: '1px solid rgba(253,224,71,0.2)',
          borderRadius: 100, padding: '6px 18px',
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 12, color: '#fde047', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Free · No Accounts · Play Instantly
          </span>
        </div>

        <h1
          className="font-fredoka font-bold mb-5 leading-tight shimmer-text"
          style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
        >
          TEZ Games
        </h1>

        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.5)',
          maxWidth: 480, margin: '0 auto 32px',
          fontFamily: 'Nunito, sans-serif', lineHeight: 1.6,
        }}>
          Browser-based arcade games built for fun. Pick a game, jump in, and play.
        </p>

        {/* Floating emojis */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 30 }}>
          {['🃏', '🔴', '🎯', '⭐', '🎲'].map((emoji, i) => (
            <span
              key={i}
              className="animate-float"
              style={{
                animationDelay: `${i * 0.4}s`,
                filter: 'drop-shadow(0 0 8px rgba(253,224,71,0.3))',
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{
        height: 1, marginBottom: 40,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
      }} />

      {/* Games Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h2
            className="font-fredoka font-semibold"
            style={{ fontSize: 26, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.03em' }}
          >
            🕹️ Games
          </h2>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)',
          }} />
          <span style={{
            fontSize: 12, color: 'rgba(253,224,71,0.6)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {games.length} games
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, i) => (
            <GameCard key={game.slug} game={game} index={i} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
