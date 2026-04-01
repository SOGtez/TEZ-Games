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
      <style>{`
        @keyframes banner-gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes btn-glow-orbit {
          0%   { box-shadow: 0 0 10px 2px rgba(124,58,237,0.55), 0 0 28px 6px rgba(236,72,153,0.25); }
          33%  { box-shadow: 0 0 16px 4px rgba(236,72,153,0.6),  0 0 36px 8px rgba(124,58,237,0.2); }
          66%  { box-shadow: 0 0 14px 3px rgba(124,58,237,0.45), 0 0 32px 7px rgba(236,72,153,0.35); }
          100% { box-shadow: 0 0 10px 2px rgba(124,58,237,0.55), 0 0 28px 6px rgba(236,72,153,0.25); }
        }
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-panel-in {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes claim-btn-gradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes claim-btn-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.45), 0 0 30px rgba(236,72,153,0.2); }
          50%       { box-shadow: 0 4px 28px rgba(124,58,237,0.7), 0 0 44px rgba(236,72,153,0.4); }
        }
      `}</style>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.1) 50%, rgba(124,58,237,0.15) 100%)',
        backgroundSize: '200% 100%',
        animation: 'banner-gradient-shift 6s ease infinite',
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
            background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
            backgroundSize: '200% 200%',
            animation: 'btn-glow-orbit 3s ease-in-out infinite, banner-gradient-shift 4s ease infinite',
            border: 'none', borderRadius: 10,
            color: 'white', fontSize: 14, fontWeight: 800,
            padding: '9px 22px', cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
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
            backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'modal-backdrop-in 0.2s ease forwards',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #1e0b35 0%, #0d0618 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 22,
              padding: '38px 42px',
              width: 390,
              maxWidth: '90vw',
              boxShadow: '0 32px 100px rgba(0,0,0,0.75), 0 0 60px rgba(124,58,237,0.15)',
              fontFamily: "'Nunito', sans-serif",
              position: 'relative',
              animation: 'modal-panel-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
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
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
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
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.35)'}`,
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
                background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
                backgroundSize: '200% 200%',
                animation: loading ? 'none' : 'claim-btn-gradient 4s ease infinite, claim-btn-glow 2.5s ease-in-out infinite',
                border: 'none', borderRadius: 10,
                color: 'white', fontSize: 15, fontWeight: 800,
                padding: '13px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: "'Nunito', sans-serif",
                marginTop: 16,
                letterSpacing: '0.04em',
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? 'Claiming...' : 'Claim Username'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
