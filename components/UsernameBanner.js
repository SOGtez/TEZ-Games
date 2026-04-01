import { useState } from 'react';
import { useUser } from '../pages/_app';

export default function UsernameBanner() {
  const { setUsername } = useUser();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (v) => /^[a-zA-Z0-9_]{3,16}$/.test(v);

  const handleClaim = async () => {
    const clean = input.trim();
    if (!validate(clean)) {
      setError('3–16 characters, letters, numbers and _ only');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/claim-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsername(clean);
      } else if (data.error === 'taken') {
        setError(`"${clean}" is already taken — try another`);
      } else if (data.error === 'invalid') {
        setError('3–16 characters, letters, numbers and _ only');
      } else {
        setError('Something went wrong, try again');
      }
    } catch {
      setError('Something went wrong, try again');
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(236,72,153,0.08) 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: '1 1 180px', minWidth: 0 }}>
        👤 Pick a username to track your stats and compete on leaderboards
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleClaim()}
          placeholder="YourUsername"
          maxLength={16}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 8, padding: '6px 12px',
            color: 'white', fontSize: 13, outline: 'none',
            fontFamily: "'Nunito', sans-serif",
            width: 140,
          }}
        />
        <button
          onClick={handleClaim}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            border: 'none', borderRadius: 8,
            color: 'white', fontSize: 13, fontWeight: 700,
            padding: '7px 16px', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? '...' : 'Claim'}
        </button>
      </div>
      {error && (
        <span style={{ width: '100%', fontSize: 11, color: 'rgba(239,68,68,0.85)', marginTop: -4 }}>
          {error}
        </span>
      )}
    </div>
  );
}
