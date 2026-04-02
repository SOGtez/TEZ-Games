import { useState, useEffect, useRef } from 'react';
import { countryFlag } from '../lib/countryFlag';

const LEVEL_COLORS = {
  Rookie: '#92400e', Player: '#9ca3af', Competitor: '#eab308',
  Champion: '#3b82f6', Master: '#a855f7', Legend: '#f97316', GOAT: '#fde047',
};

function inputStyle() {
  return {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(124,58,237,0.35)',
    borderRadius: 10, padding: '10px 13px', color: 'white', fontSize: 14,
    outline: 'none', fontFamily: "'Nunito', sans-serif", boxSizing: 'border-box',
  };
}

export default function AddFriendModal({ open, onClose, playerId, onAdded }) {
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(null);
  const debounce = useRef(null);

  useEffect(() => {
    if (open) { setSearchQ(''); setSearchResults([]); setCodeInput(''); setMsg(''); setError(''); }
  }, [open]);

  const handleSearch = (q) => {
    setSearchQ(q);
    clearTimeout(debounce.current);
    if (q.length < 2) { setSearchResults([]); return; }
    debounce.current = setTimeout(async () => {
      const r = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}&playerId=${encodeURIComponent(playerId || '')}`);
      const d = await r.json();
      setSearchResults(d.results || []);
    }, 300);
  };

  const send = async (target) => {
    if (!target || !playerId) return;
    setAdding(target);
    setMsg(''); setError('');
    const r = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, target }),
    });
    const d = await r.json();
    setAdding(null);
    if (r.ok) {
      setMsg(`Friend request sent to ${d.username}!`);
      setSearchQ(''); setSearchResults([]); setCodeInput('');
      onAdded?.();
    } else {
      const errMap = {
        not_found: 'Player not found',
        self: "You can't add yourself",
        already_friends: 'Already friends',
        request_exists: 'Request already sent',
        server: 'Something went wrong',
      };
      setError(errMap[d.error] || 'Something went wrong');
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes afm-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes afm-panel { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'afm-in 0.2s ease forwards',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(160deg, #1e0b35 0%, #0d0618 100%)',
            border: '1px solid rgba(124,58,237,0.25)', borderRadius: 22,
            padding: '32px 36px', width: 420, maxWidth: '92vw',
            boxShadow: '0 32px 100px rgba(0,0,0,0.75), 0 0 60px rgba(124,58,237,0.12)',
            fontFamily: "'Nunito', sans-serif", position: 'relative',
            animation: 'afm-panel 0.28s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 15,
            }}
          >✕</button>

          <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>Add Friend</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>
            Search by username or enter a friend code
          </div>

          {/* Username search */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 7 }}>
              SEARCH BY USERNAME
            </div>
            <input
              autoFocus
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Type a username..."
              style={inputStyle()}
            />
            {searchResults.length > 0 && (
              <div style={{
                marginTop: 6, borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                {searchResults.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px',
                      borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(p.username)}`}
                      width={30} height={30}
                      style={{ borderRadius: 7, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {p.username}{p.country ? ` ${countryFlag(p.country)}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: LEVEL_COLORS[p.level] || '#9ca3af' }}>{p.level}</div>
                    </div>
                    <button
                      onClick={() => send(p.username)}
                      disabled={adding === p.username}
                      style={{
                        padding: '5px 13px', borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                        color: '#c084fc', fontWeight: 700, fontSize: 12,
                        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#c084fc'; }}
                    >
                      {adding === p.username ? '...' : '+ Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friend code */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 7 }}>
              ENTER FRIEND CODE
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && send(codeInput)}
                placeholder="TEZ-XXXX"
                maxLength={8}
                style={{ ...inputStyle(), flex: 1 }}
              />
              <button
                onClick={() => send(codeInput)}
                disabled={codeInput.length < 7 || !!adding}
                style={{
                  padding: '10px 18px', borderRadius: 10, cursor: codeInput.length < 7 ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                  border: 'none', color: 'white', fontWeight: 800, fontSize: 14,
                  fontFamily: "'Nunito', sans-serif", opacity: codeInput.length < 7 ? 0.45 : 1,
                  transition: 'opacity 0.2s, transform 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (codeInput.length >= 7) e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Add
              </button>
            </div>
          </div>

          {msg && (
            <div style={{ fontSize: 13, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '9px 13px' }}>
              ✓ {msg}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.9)', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '9px 13px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
