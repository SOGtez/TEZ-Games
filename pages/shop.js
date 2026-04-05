import Head from 'next/head';
import Layout from '../components/Layout';
import { useEffect, useRef } from 'react';

const PLACEHOLDER_ITEMS = [
  { icon: '🎨', label: 'Name Paints' },
  { icon: '🖼️', label: 'Profile Frames' },
  { icon: '🎮', label: 'Game Skins' },
  { icon: '⭐', label: 'Badges' },
  { icon: '🎁', label: 'Mystery Boxes' },
  { icon: '🏳️', label: 'Banners' },
];

export default function ShopPage() {
  return (
    <Layout title="TEZ Shop — Coming Soon">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 20px 80px', textAlign: 'center' }}>

        {/* Icon with pulse ring */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
          <div style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            border: '2px solid rgba(253,224,71,0.3)',
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
          <div style={{
            fontSize: 64,
            animation: 'float 3s ease-in-out infinite',
            display: 'block',
            lineHeight: 1,
          }}>🛍️</div>
        </div>

        {/* TEZ SHOP title */}
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 52,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 40%, #fde047 60%, #fbbf24 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 3s linear infinite',
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}>
          TEZ SHOP
        </div>

        {/* COMING SOON badge */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            display: 'inline-block',
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.9)',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))',
            border: '1px solid rgba(124,58,237,0.45)',
            borderRadius: 100,
            padding: '7px 24px',
          }}>
            COMING SOON
          </span>
        </div>

        {/* Teaser text */}
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 16,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.6,
          marginBottom: 48,
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Name paints, profile frames, game skins, mystery boxes, and more.
        </p>

        {/* Placeholder grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          maxWidth: 480,
          margin: '0 auto',
        }}>
          {PLACEHOLDER_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '22px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                filter: 'blur(0px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Blur overlay to hint at mystery */}
              <div style={{
                position: 'absolute', inset: 0,
                backdropFilter: 'blur(1px)',
                background: 'rgba(13,6,24,0.35)',
                borderRadius: 16,
                zIndex: 1,
              }} />
              <span style={{ fontSize: 28, position: 'relative', zIndex: 2, opacity: 0.4 }}>{item.icon}</span>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.04em',
                position: 'relative', zIndex: 2,
              }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom hint */}
        <div style={{
          marginTop: 48,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13,
          color: 'rgba(255,255,255,0.2)',
        }}>
          Earn TEZ Bucks by playing games — you'll need them when we launch 💰
        </div>
      </div>
    </Layout>
  );
}
