import { useState } from 'react';
import Link from 'next/link';

export default function GameCard({ game, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const locked = !!game.locked;

  return (
    <Link
      href={locked ? '#' : `/game/${game.slug}`}
      className="block"
      style={{ animationDelay: `${index * 0.1}s`, pointerEvents: locked ? 'none' : 'auto' }}
      onClick={e => locked && e.preventDefault()}
    >
      <style>{`
        @keyframes card-glow-${index} {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 15px ${game.accentColor}1A; }
          50%       { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 30px ${game.accentColor}3B; }
        }
      `}</style>
      <div
        onMouseEnter={() => !locked && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          cursor: locked ? 'default' : 'pointer',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.35s ease-in-out, box-shadow 0.35s ease-in-out, border-color 0.3s ease',
          boxShadow: hovered ? undefined : '0 8px 30px rgba(0,0,0,0.4)',
          animation: hovered ? `card-glow-${index} 2.16s ease-in-out 0.35s infinite` : 'none',
          willChange: 'transform, box-shadow',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? game.accentColor + '80' : 'rgba(255,255,255,0.08)'}`,
          backdropFilter: 'blur(12px)',
          filter: locked ? 'grayscale(0.7) brightness(0.6)' : 'none',
        }}
      >
        {/* Gradient thumbnail */}
        <div style={{
          height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 72, background: game.gradient, position: 'relative', overflow: 'hidden',
        }}>
          <span style={{
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
            display: 'inline-block',
            filter: hovered ? 'drop-shadow(0 0 16px rgba(255,255,255,0.5))' : 'none',
          }}>
            {game.emoji}
          </span>
          {/* Shine overlay on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px 18px' }}>
          <h3 style={{
            fontFamily: 'Fredoka, sans-serif', fontWeight: 600,
            fontSize: 20, color: 'white', marginBottom: 4, letterSpacing: '0.01em',
          }}>
            {game.name}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5, fontFamily: 'Nunito, sans-serif' }}>
            {game.description}
          </p>
        </div>

        {/* BETA badge (always visible) */}
        {!locked && game.beta && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
            color: 'white', fontSize: 10, fontWeight: 800,
            padding: '3px 10px', borderRadius: 20,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            boxShadow: '0 2px 10px rgba(239,68,68,0.4)',
            fontFamily: 'Nunito, sans-serif',
          }}>
            BETA
          </div>
        )}

        {/* Play badge (unlocked only) */}
        {!locked && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: game.accentColor,
            color: 'white', fontSize: 11, fontWeight: 700,
            padding: '4px 12px', borderRadius: 20,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(-6px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            boxShadow: `0 4px 12px ${game.accentColor}66`,
            fontFamily: 'Nunito, sans-serif',
            letterSpacing: '0.05em',
          }}>
            Play →
          </div>
        )}

        {/* Lock badge (locked only) */}
        {locked && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
            fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🔒 Coming Soon
          </div>
        )}

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: game.gradient,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }} />
      </div>
    </Link>
  );
}
