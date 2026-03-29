import { useState, useEffect } from 'react';
import Head from 'next/head';

const PIN = '1234';

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 140,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 36, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif",
        background: 'linear-gradient(135deg, #fde047, #f59e0b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4, fontFamily: 'Nunito, sans-serif' }}>{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/analytics-data')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={{ color: '#ef4444', fontFamily: 'Nunito, sans-serif', fontSize: 14, textAlign: 'center', padding: 40 }}>
      Error: {error}
    </div>
  );

  if (!data) return (
    <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Nunito, sans-serif', fontSize: 14, textAlign: 'center', padding: 40 }}>
      Loading...
    </div>
  );

  // Parse stats — Vercel returns { data: [...] } with daily buckets
  const pageviews = data.stats?.data?.reduce((sum, d) => sum + (d.total ?? 0), 0) ?? null;
  const visitors = data.stats?.data?.reduce((sum, d) => sum + (d.unique ?? 0), 0) ?? null;
  const topPages = data.breakdown?.data ?? [];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          fontSize: 28, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif",
          background: 'linear-gradient(135deg, #fde047, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}>TEZ Analytics</div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Nunito, sans-serif' }}>Last 30 days</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Page Views" value={pageviews?.toLocaleString()} />
        <StatCard label="Unique Visitors" value={visitors?.toLocaleString()} />
      </div>

      {/* Top pages */}
      {topPages.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Top Pages
          </div>
          {topPages.map((page, i) => {
            const max = topPages[0]?.total ?? 1;
            const pct = Math.round(((page.total ?? 0) / max) * 100);
            return (
              <div key={i} style={{ marginBottom: i < topPages.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Nunito, sans-serif' }}>
                    {page.key || '/'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Nunito, sans-serif' }}>
                    {(page.total ?? 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                  <div style={{
                    height: 4, borderRadius: 2, width: `${pct}%`,
                    background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, PIN.length);
    setPin(v);
    if (v.length === PIN.length) {
      if (v === PIN) {
        setUnlocked(true);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 500);
      }
    }
  };

  return (
    <>
      <Head><title>TEZ Analytics</title></Head>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake { animation: shake 0.4s ease; }
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0d0618 55%, #07030f 100%)',
        color: 'white',
        paddingTop: unlocked ? 48 : 0,
        display: unlocked ? 'block' : 'flex',
        alignItems: unlocked ? undefined : 'center',
        justifyContent: unlocked ? undefined : 'center',
      }}>
        {!unlocked ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 36, marginBottom: 8,
              background: 'linear-gradient(135deg, #fde047, #f59e0b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: '0.05em',
            }}>TEZ</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32, fontFamily: 'Nunito, sans-serif' }}>
              Enter PIN to continue
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={handleChange}
              autoFocus
              placeholder="••••"
              className={shake ? 'shake' : ''}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${shake ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12, color: 'white', fontSize: 24,
                letterSpacing: '0.3em', padding: '12px 24px',
                width: 140, textAlign: 'center', outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </>
  );
}
