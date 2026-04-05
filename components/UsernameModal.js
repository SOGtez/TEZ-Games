import { useState } from 'react';
import { useUser } from '../pages/_app';
import { saveSession } from '../lib/session';

export default function UsernameModal({ open, onClose }) {
  const { username, playerId, setUsername } = useUser();
  const [mode, setMode] = useState('claim'); // 'claim' | 'recover'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fcInput, setFcInput] = useState('');
  const [fcLoading, setFcLoading] = useState(false);
  const [fcError, setFcError] = useState('');

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
        body: JSON.stringify({ username: clean, ...(playerId ? { playerId } : {}) }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsername(clean, data.id);
        setInput('');
        onClose();
      } else if (data.error === 'taken') {
        setError(`"${clean}" is already taken — try another`);
      } else if (data.error === 'profanity') {
        setError('That username is not allowed. Please choose a different one.');
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

  const handleRecover = async () => {
    const code = fcInput.trim().toUpperCase();
    if (!code) { setFcError('Enter your recovery code'); return; }
    setFcLoading(true);
    setFcError('');
    try {
      const res = await fetch(`/api/recover-by-code?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok) {
        if (data.hasEmail) {
          setFcError('This account has an email linked — log in with your email instead.');
        } else {
          saveSession(data.username, data.id);
          setUsername(data.username, data.id);
          setFcInput('');
          onClose();
        }
      } else if (data.error === 'not_found') {
        setFcError('No account found with that recovery code.');
      } else {
        setFcError('Something went wrong, try again.');
      }
    } catch {
      setFcError('Something went wrong, try again.');
    }
    setFcLoading(false);
  };

  const close = () => {
    setInput('');
    setError('');
    setFcInput('');
    setFcError('');
    setMode('claim');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <style>{`
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

      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
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
          <button
            onClick={close}
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

          {mode === 'claim' ? (
            <>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'block', marginBottom: 6 }}>
                {username ? 'Change your username' : 'Create your username'}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                3–16 characters · letters, numbers and _ only
              </span>

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
                {loading ? (username ? 'Changing...' : 'Claiming...') : (username ? 'Change Username' : 'Claim Username')}
              </button>

              {!username && (
                <button
                  onClick={() => { setError(''); setMode('recover'); }}
                  style={{
                    display: 'block', width: '100%',
                    marginTop: 14, background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.35)', fontSize: 12,
                    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                    textDecoration: 'underline', textUnderlineOffset: 3,
                  }}
                >
                  Already have an account? Recover it →
                </button>
              )}
            </>
          ) : (
            <>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'block', marginBottom: 6 }}>
                Recover Account
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                Enter your recovery code (only visible on your own profile)
              </span>

              <input
                autoFocus
                value={fcInput}
                onChange={e => { setFcInput(e.target.value); setFcError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRecover()}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${fcError ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.35)'}`,
                  borderRadius: 10, padding: '11px 14px',
                  color: 'white', fontSize: 16, outline: 'none',
                  fontFamily: "'Nunito', sans-serif",
                  boxSizing: 'border-box',
                  marginTop: 18,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              />

              {fcError && (
                <span style={{ display: 'block', fontSize: 12, color: 'rgba(239,68,68,0.85)', marginTop: 6 }}>
                  {fcError}
                </span>
              )}

              <button
                onClick={handleRecover}
                disabled={fcLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
                  backgroundSize: '200% 200%',
                  animation: fcLoading ? 'none' : 'claim-btn-gradient 4s ease infinite, claim-btn-glow 2.5s ease-in-out infinite',
                  border: 'none', borderRadius: 10,
                  color: 'white', fontSize: 15, fontWeight: 800,
                  padding: '13px', cursor: fcLoading ? 'not-allowed' : 'pointer',
                  opacity: fcLoading ? 0.7 : 1,
                  fontFamily: "'Nunito', sans-serif",
                  marginTop: 16,
                  letterSpacing: '0.04em',
                  transition: 'opacity 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { if (!fcLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {fcLoading ? 'Recovering...' : 'Recover Account'}
              </button>

              <button
                onClick={() => { setFcError(''); setMode('claim'); }}
                style={{
                  display: 'block', width: '100%',
                  marginTop: 14, background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)', fontSize: 12,
                  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                ← Back to create username
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
