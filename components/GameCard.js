import { useState } from 'react';
import Link from 'next/link';

export default function GameCard({ game, index = 0 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/game/${game.slug}`} className="block" style={{ animationDelay: `${index * 0.1}s` }}>
      <style>{`
        @keyframes pulse-glow-${index} {
          0%, 100% { box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 30px ${game.accentColor}33; }
          50%       { box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 60px ${game.accentColor}77; }
        }
      `}</style>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease',
          boxShadow: hovered ? undefined : '0 8px 30px rgba(0,0,0,0.4)',
          animation: hovered ? `pulse-glow-${index} 1.8s ease-in-out infinite` : 'none',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? game.accentColor + '80' : 'rgba(255,255,255,0.08)'}`,
          backdropFilter: 'blur(12px)',
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

        {/* Play badge */}
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
