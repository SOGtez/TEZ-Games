import { useState, useEffect } from 'react';
import { useUser } from '../pages/_app';

const MODAL_STYLES = `
  @keyframes modal-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modal-panel-in { from { opacity: 0; transform: scale(0.88) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes auth-btn-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes auth-btn-glow { 0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.45), 0 0 30px rgba(236,72,153,0.2); } 50% { box-shadow: 0 4px 28px rgba(124,58,237,0.7), 0 0 44px rgba(236,72,153,0.4); } }
`;

function inputStyle(error) {
  return {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.35)'}`,
    borderRadius: 10, padding: '11px 14px', color: 'white', fontSize: 15,
    outline: 'none', fontFamily: "'Nunito', sans-serif", boxSizing: 'border-box',
  };
}

export default function AuthModal({ open, onClose, initialMode = 'signup' }) {
  const { playerId, setUsername, refreshStats } = useUser();
  const [mode, setMode] = useState(initialMode);
  const [usernameInput, setUsernameInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset all state when modal opens
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setUsernameInput(''); setEmail(''); setPassword('');
      setError(''); setLoading(false); setForgotSent(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = (m) => { setMode(m); setError(''); setForgotSent(false); };

  const close = () => {
    setUsernameInput(''); setEmail(''); setPassword('');
    setError(''); setLoading(false); setForgotSent(false);
    onClose();
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first'); return; }
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setForgotSent(true); setError('');
    } catch { setError('Something went wrong, try again'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (mode === 'signup' && !/^[a-zA-Z0-9_]{3,16}$/.test(usernameInput.trim())) {
      setError('3–16 characters, letters, numbers and _ only'); return;
    }
    if (!email) { setError('Email is required'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const endpoints = { signup: '/api/auth/signup', login: '/api/auth/login', link: '/api/auth/link-email' };
      const bodies = {
        signup: { username: usernameInput.trim(), email, password },
        login: { email, password },
        link: { playerId, email, password },
      };
      const res = await fetch(endpoints[mode], {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodies[mode]),
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === 'signup' || mode === 'login') {
          setUsername(data.username, data.id);
        } else {
          await refreshStats(playerId);
        }
        close();
      } else {
        const errMap = {
          invalid_username: '3–16 characters, letters, numbers and _ only',
          taken: `"${usernameInput.trim()}" is already taken — try another`,
          email_taken: 'An account with this email already exists',
          invalid_credentials: 'Incorrect email or password',
          not_found: 'No account found — check your email or sign up',
          invalid: 'Please check your inputs and try again',
          server: 'Something went wrong, try again',
        };
        setError(errMap[data.error] || 'Something went wrong, try again');
      }
    } catch { setError('Something went wrong, try again'); }
    setLoading(false);
  };

  if (!open) return null;

  const titles = { signup: 'Create account', login: 'Welcome back', link: 'Secure your account' };
  const subtitles = {
    signup: 'Sign up to save progress across devices',
    login: 'Log in to restore your stats anywhere',
    link: 'Add email + password for cross-device access',
  };
  const btnLabels = { signup: 'Create Account', login: 'Log In', link: 'Link Email' };
  const loadingLabels = { signup: 'Creating...', login: 'Logging in...', link: 'Linking...' };

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'modal-backdrop-in 0.2s ease forwards',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(160deg, #1e0b35 0%, #0d0618 100%)',
            border: '1px solid rgba(124,58,237,0.25)', borderRadius: 22,
            padding: '38px 42px', width: 390, maxWidth: '90vw',
            boxShadow: '0 32px 100px rgba(0,0,0,0.75), 0 0 60px rgba(124,58,237,0.15)',
            fontFamily: "'Nunito', sans-serif", position: 'relative',
            animation: 'modal-panel-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          }}
        >
          {/* Close button */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 15,
            }}
          >✕</button>

          <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'block', marginBottom: 6 }}>
            {titles[mode]}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            {subtitles[mode]}
          </span>

          {/* Inputs */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'signup' && (
              <input
                autoFocus
                value={usernameInput}
                onChange={e => { setUsernameInput(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Username"
                maxLength={16}
                style={inputStyle(error && (error.includes('character') || error.includes('taken')))}
              />
            )}
            <input
              autoFocus={mode !== 'signup'}
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Email"
              type="email"
              style={inputStyle(error && error.includes('mail'))}
            />
            <input
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Password (min 6 characters)"
              type="password"
              style={inputStyle(error && error.includes('assword'))}
            />
          </div>

          {/* Error */}
          {error && (
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(239,68,68,0.85)', marginTop: 6 }}>
              {error}
            </span>
          )}

          {/* Forgot password */}
          {mode === 'login' && (
            <div style={{ marginTop: 8 }}>
              {forgotSent ? (
                <span style={{ fontSize: 12, color: '#4ade80' }}>Reset email sent ✓ Check your inbox</span>
              ) : (
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    cursor: 'pointer', fontSize: 12,
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: "'Nunito', sans-serif",
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
              backgroundSize: '200% 200%',
              animation: loading ? 'none' : 'auth-btn-gradient 4s ease infinite, auth-btn-glow 2.5s ease-in-out infinite',
              border: 'none', borderRadius: 10,
              color: 'white', fontSize: 15, fontWeight: 800,
              padding: '13px', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Nunito', sans-serif",
              marginTop: 16, letterSpacing: '0.04em',
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? loadingLabels[mode] : btnLabels[mode]}
          </button>

          {/* Mode switcher (signup ↔ login only) */}
          {(mode === 'signup' || mode === 'login') && (
            <div style={{
              textAlign: 'center', marginTop: 16,
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Nunito', sans-serif",
            }}>
              {mode === 'signup' ? (
                <>Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#a78bfa', fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: 13 }}
                  >Log In</button>
                </>
              ) : (
                <>Don&apos;t have one?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#a78bfa', fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: 13 }}
                  >Sign Up</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
