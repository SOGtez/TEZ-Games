import { useState } from 'react';
import Head from 'next/head';

const PIN = '1234';
const DASHBOARD_URL = 'https://vercel.com/sogtez/tez-games/analytics';

export default function AnalyticsGate() {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, PIN.length);
    setValue(v);
    if (v.length === PIN.length) {
      if (v === PIN) {
        window.location.href = DASHBOARD_URL;
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setValue(''); }, 500);
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
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0d0618 55%, #07030f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 36, marginBottom: 8,
            background: 'linear-gradient(135deg, #fde047, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: '0.05em',
          }}>
            TEZ
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>
            Enter PIN to continue
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            autoFocus
            placeholder="••••"
            className={shake ? 'shake' : ''}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${shake ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 12,
              color: 'white',
              fontSize: 24,
              letterSpacing: '0.3em',
              padding: '12px 24px',
              width: 140,
              textAlign: 'center',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>
    </>
  );
}
