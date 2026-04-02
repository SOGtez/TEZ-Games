import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { useUser } from './_app';
import { countryFlag } from '../lib/countryFlag';

const LEVEL_COLORS = {
  Rookie: '#92400e', Player: '#9ca3af', Competitor: '#eab308',
  Champion: '#3b82f6', Master: '#a855f7', Legend: '#f97316', GOAT: '#fde047',
};

function winRate(wins, played) {
  if (!played) return '—';
  return `${Math.round((wins / played) * 100)}%`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: '7px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
        background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.15)'}`,
        color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)',
        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(124,58,237,0.35)',
  borderRadius: 10, padding: '11px 14px', color: 'white', fontSize: 14,
  outline: 'none', fontFamily: "'Nunito', sans-serif", boxSizing: 'border-box',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20, padding: '24px 24px 20px',
};

export default function FriendsPage() {
  const { playerId, playerStats } = useUser();
  const [data, setData] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(null);
  const [acting, setActing] = useState(null);
  const [acceptedMsg, setAcceptedMsg] = useState(null);
  const debounce = useRef(null);

  const friendCode = playerStats?.friend_code;

  const load = useCallback(() => {
    if (!playerId) return;
    fetch(`/api/friends/get?playerId=${encodeURIComponent(playerId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

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
    if (!target || !playerId || adding) return;
    setAdding(target);
    setAddMsg(''); setAddError('');
    const r = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, target }),
    });
    const d = await r.json();
    setAdding(null);
    if (r.ok) {
      setAddMsg(`Friend request sent to ${d.username}!`);
      setSearchQ(''); setSearchResults([]); setCodeInput('');
      load();
    } else {
      const errMap = {
        not_found: 'Player not found',
        self: "You can't add yourself",
        already_friends: 'Already friends!',
        request_exists: 'Request already sent',
        server: 'Something went wrong',
      };
      setAddError(d.detail ? `${d.error}: ${d.detail}` : (errMap[d.error] || 'Something went wrong'));
    }
  };

  const respond = async (friendshipId, action, username) => {
    setActing(friendshipId);
    await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, friendshipId, action }),
    });
    if (action === 'accept') {
      setAcceptedMsg(username);
      setTimeout(() => setAcceptedMsg(null), 3000);
    }
    load();
    setActing(null);
  };

  const remove = async (friendId) => {
    if (!confirm('Remove this friend?')) return;
    await fetch('/api/friends/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, friendId }),
    });
    load();
  };

  return (
    <Layout title="Friends — TEZ Games">
      {!playerId ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>👥</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            Log in to see your friends
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            Create an account or claim a username to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 700, color: 'white' }}>
              👥 Friends
            </div>
            {friendCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(253,224,71,0.06)', border: '1px solid rgba(253,224,71,0.18)', borderRadius: 12, padding: '8px 16px' }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your code:</span>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: '#fde047', letterSpacing: '0.06em' }}>
                  {friendCode}
                </span>
                <CopyButton text={friendCode} />
              </div>
            )}
          </div>

          {/* Friend Requests — always shown */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white' }}>
                Friend Requests
              </div>
              {data?.incoming?.length > 0 && (
                <span style={{ background: '#7C3AED', color: 'white', borderRadius: 20, fontSize: 12, fontWeight: 800, padding: '2px 9px' }}>
                  {data.incoming.length}
                </span>
              )}
            </div>

            {acceptedMsg && (
              <div style={{ marginBottom: 14, fontSize: 13, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 9, padding: '10px 14px', fontFamily: "'Nunito', sans-serif" }}>
                ✅ You and {acceptedMsg} are now friends!
              </div>
            )}

            {(!data || data.incoming.length === 0) && !acceptedMsg && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif", fontSize: 13 }}>
                No pending requests
              </div>
            )}

            {data?.incoming?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.incoming.map(req => (
                  <div
                    key={req.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(req.requester.username)}`}
                      width={42} height={42}
                      style={{ borderRadius: 10, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: 'white' }}>
                        {req.requester.username}{req.requester.country ? ` ${countryFlag(req.requester.country)}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: LEVEL_COLORS[req.requester.level] || '#9ca3af', fontFamily: "'Nunito', sans-serif" }}>
                        {req.requester.level} · {(req.requester.tez_points || 0).toLocaleString()} TP
                      </div>
                    </div>
                    <button
                      onClick={() => respond(req.id, 'accept', req.requester.username)}
                      disabled={acting === req.id}
                      style={{
                        padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
                        color: '#4ade80', fontWeight: 700, fontSize: 13,
                        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.22)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.12)'; }}
                    >
                      {acting === req.id ? '...' : '✓ Accept'}
                    </button>
                    <button
                      onClick={() => respond(req.id, 'decline')}
                      disabled={acting === req.id}
                      style={{
                        padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', fontWeight: 700, fontSize: 13,
                        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                    >
                      Decline
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Friend */}
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 16 }}>
              Add Friend
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Search */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', fontFamily: "'Nunito', sans-serif", marginBottom: 8 }}>
                  SEARCH BY USERNAME
                </div>
                <input
                  value={searchQ}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Type a username..."
                  style={inputStyle}
                />
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    {searchResults.map((p, i) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                      >
                        <img
                          src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(p.username)}`}
                          width={32} height={32}
                          style={{ borderRadius: 8, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: 'white' }}>
                            {p.username}{p.country ? ` ${countryFlag(p.country)}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: LEVEL_COLORS[p.level] || '#9ca3af', fontFamily: "'Nunito', sans-serif" }}>
                            {p.level} · {(p.tez_points || 0).toLocaleString()} TP
                          </div>
                        </div>
                        <button
                          onClick={() => send(p.username)}
                          disabled={adding === p.username}
                          style={{
                            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                            color: '#c084fc', fontWeight: 700, fontSize: 13,
                            fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s', flexShrink: 0,
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
                {searchQ.length >= 2 && searchResults.length === 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
                    No players found
                  </div>
                )}
              </div>

              {/* Friend code */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', fontFamily: "'Nunito', sans-serif", marginBottom: 8 }}>
                  ENTER FRIEND CODE
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && send(codeInput)}
                    placeholder="TEZ-XXXX"
                    maxLength={8}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => send(codeInput)}
                    disabled={codeInput.length < 7 || !!adding}
                    style={{
                      padding: '11px 18px', borderRadius: 10, cursor: codeInput.length < 7 ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                      border: 'none', color: 'white', fontWeight: 800, fontSize: 14,
                      fontFamily: "'Nunito', sans-serif",
                      opacity: codeInput.length < 7 ? 0.4 : 1, transition: 'opacity 0.2s, transform 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (codeInput.length >= 7) e.currentTarget.style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {(addMsg || addError) && (
              <div style={{ marginTop: 14 }}>
                {addMsg && (
                  <div style={{ fontSize: 13, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'Nunito', sans-serif" }}>
                    ✓ {addMsg}
                  </div>
                )}
                {addError && (
                  <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.9)', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'Nunito', sans-serif" }}>
                    {addError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Friends list */}
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 16 }}>
              Your Friends
              {data && (
                <span style={{ marginLeft: 10, fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontFamily: "'Nunito', sans-serif" }}>
                  {data.friends.length}
                </span>
              )}
            </div>

            {!data && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", fontSize: 13 }}>
                Loading...
              </div>
            )}

            {data && data.friends.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  No friends yet
                </div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                  Share your code or search for players above!
                </div>
              </div>
            )}

            {data?.friends?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.friends.map(f => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                      borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <Link href={`/profile/${f.username}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, textDecoration: 'none', minWidth: 0 }}>
                      <img
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(f.username)}`}
                        width={44} height={44}
                        style={{ borderRadius: 10, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: 'white' }}>
                          {f.username}{f.country ? ` ${countryFlag(f.country)}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: LEVEL_COLORS[f.level] || '#9ca3af', fontFamily: "'Nunito', sans-serif" }}>
                            {f.level}
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
                            {winRate(f.total_wins, f.total_games)} win rate
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: '#fde047' }}>
                          {(f.tez_points || 0).toLocaleString()} TP
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
                          {f.total_games || 0} games
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(f.id)}
                      title="Remove friend"
                      style={{
                        padding: '7px 12px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                        background: 'transparent', border: '1px solid rgba(239,68,68,0.15)',
                        color: 'rgba(239,68,68,0.4)', fontWeight: 600, fontSize: 12,
                        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent requests */}
          {data?.outgoing?.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                Sent Requests ({data.outgoing.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.outgoing.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(req.addressee.username)}`}
                      width={36} height={36}
                      style={{ borderRadius: 8, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      {req.addressee.username}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif" }}>Pending...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </Layout>
  );
}
