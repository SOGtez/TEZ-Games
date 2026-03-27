import Head from 'next/head';
import Link from 'next/link';
import { version } from '../lib/version';

export default function Layout({ children, title = 'TEZ Games', hideChrome = false }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="TEZ Games — fun browser-based arcade games for everyone!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="min-h-screen font-nunito"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0d0618 55%, #07030f 100%)',
          color: 'white',
        }}
      >
        {/* Ambient glow orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-10%', left: '15%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '-8%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', left: '-5%',
            width: 450, height: 450, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
          }} />
        </div>

        {/* Header */}
        {!hideChrome && <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(13,6,24,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span
                className="text-3xl font-bold group-hover:scale-105 transition-transform duration-200 inline-block"
                style={{
                  fontFamily: "'Segoe UI', sans-serif",
                  background: 'linear-gradient(135deg, #fde047, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.05em',
                }}
              >
                TEZ
              </span>
              <span
                className="text-3xl font-light group-hover:scale-105 transition-transform duration-200 inline-block"
                style={{ fontFamily: "'Segoe UI', sans-serif", color: 'rgba(255,255,255,0.88)', letterSpacing: '0.08em' }}
              >
                Games
              </span>
              <span className="text-2xl animate-float ml-1">🎮</span>
            </Link>
            <nav>
              <Link
                href="/"
                className="font-semibold font-nunito transition-all duration-200"
                style={{ color: 'rgba(253,224,71,0.75)', fontSize: 15 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fde047'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(253,224,71,0.75)'}
              >
                All Games
              </Link>
            </nav>
          </div>
        </header>}

        <main className="max-w-6xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>

        {!hideChrome && (
          <footer
            className="py-8 font-nunito text-sm"
            style={{ color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 16, paddingRight: 16 }}
          >
            <p style={{ flex: 1, textAlign: 'center' }}>Made by SOGtez · Play, have fun, repeat!</p>
            <span style={{ fontSize: 10, color: '#666', opacity: 0.7, flexShrink: 0 }}>{version}</span>
          </footer>
        )}
      </div>
    </>
  );
}
