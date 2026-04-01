import { useState } from 'react';
import { useUser } from '../pages/_app';

export default function UsernameBanner() {
  const { setUsername } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
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
        setModalOpen(false);
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

  const closeModal = () => {
    setModalOpen(false);
    setInput('');
    setError('');
  };

  return (
    <>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(236,72,153,0.08) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        fontFamily: "'Nunito', sans-serif",
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
          👤 Pick a username to track your stats and compete on leaderboards!
        </span>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            border: 'none', borderRadius: 10,
            color: 'white', fontSize: 14, fontWeight: 800,
            padding: '9px 22px', cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            transition: 'opacity 0.2s, transform 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Create Username
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #1a0a2e 0%, #0d0618 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '36px 40px',
              width: 380,
              maxWidth: '90vw',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              fontFamily: "'Nunito', sans-serif",
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                fontSize: 15,
              }}
            >
              ✕
            </button>

            {/* Title */}
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'block', marginBottom: 6 }}>
              Create your username
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              3–16 characters · letters, numbers and _ only
            </span>

            {/* Input */}
            <input
              autoFocus
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleClaim()}
              placeholder="YourUsername"
              maxLength={16}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 10, padding: '11px 14px',
                color: 'white', fontSize: 16, outline: 'none',
                fontFamily: "'Nunito', sans-serif",
                boxSizing: 'border-box',
                marginTop: 18,
              }}
            />

            {error && (
              <span style={{ display: 'block', fontSize: 12, color: 'rgba(239,68,68,0.85)', marginTop: 6 }}>
                {error}
              </span>
            )}

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                border: 'none', borderRadius: 10,
                color: 'white', fontSize: 15, fontWeight: 800,
                padding: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: "'Nunito', sans-serif",
                marginTop: 14,
                letterSpacing: '0.03em',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Claiming...' : 'Claim Username'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
