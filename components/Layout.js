import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useMusic, useUser } from '../pages/_app';
import { version } from '../lib/version';
import UsernameBanner from './UsernameBanner';
import UsernameModal from './UsernameModal';
import AuthModal from './AuthModal';
import AddFriendModal from './AddFriendModal';
import { countryFlag } from '../lib/countryFlag';

const LEVEL_ORDER = ['Rookie', 'Player', 'Competitor', 'Champion', 'Master', 'Legend', 'GOAT'];
const LEVEL_THRESHOLDS = { Rookie: 0, Player: 100, Competitor: 500, Champion: 2000, Master: 5000, Legend: 10000, GOAT: 25000 };
const LEVEL_COLORS = {
  Rookie: '#92400e', Player: '#9ca3af', Competitor: '#eab308',
  Champion: '#3b82f6', Master: '#a855f7', Legend: '#f97316', GOAT: '#fde047',
};

function SidebarStatsCard({ stats, expanded, onClose, onChangeUsername }) {
  const level = stats.level || 'Rookie';
  const points = stats.tez_points || 0;
  const color = LEVEL_COLORS[level] || '#9ca3af';
  const idx = LEVEL_ORDER.indexOf(level);
  const isGoat = level === 'GOAT';
  const nextLevel = isGoat ? null : LEVEL_ORDER[idx + 1];
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : null;
  const curThreshold = LEVEL_THRESHOLDS[level] || 0;
  const progress = isGoat ? 1 : Math.min(1, (points - curThreshold) / (nextThreshold - curThreshold));
  const tpToNext = isGoat ? 0 : nextThreshold - points;
  const streak = stats.current_streak || 0;

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: expanded ? 400 : 0,
      opacity: expanded ? 1 : 0,
      transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
    }}>
      <div style={{
        margin: '0 12px 10px',
        padding: '13px 13px 11px',
        borderRadius: 11,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Level badge + TP */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}99`,
              flexShrink: 0,
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600, fontSize: 14,
              color,
            }}>
              {isGoat ? '👑 ' : ''}{level}
            </span>
          </div>
          <span style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 15, fontWeight: 700,
            color: '#fde047',
            textShadow: '0 0 8px rgba(253,224,71,0.5)',
          }}>
            {points.toLocaleString()} TP
          </span>
        </div>

        {/* Progress bar */}
        {!isGoat && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              height: 5, borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{
              marginTop: 4, fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Nunito', sans-serif",
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>Next: {nextLevel} ({nextThreshold?.toLocaleString()} TP)</span>
              <span>{tpToNext} away</span>
            </div>
          </div>
        )}

        {/* W / L / Streak */}
        <div style={{
          display: 'flex', gap: 8,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12, fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 10,
        }}>
          <span>W: <span style={{ color: '#4ade80' }}>{stats.total_wins || 0}</span></span>
          <span>·</span>
          <span>L: <span style={{ color: '#f87171' }}>{stats.total_losses || 0}</span></span>
          {streak >= 3 && (
            <>
              <span>·</span>
              <span style={{ color: '#fde047' }}>🔥 {streak} streak</span>
            </>
          )}
          {streak > 0 && streak < 3 && (
            <>
              <span>·</span>
              <span>🎯 {streak} streak</span>
            </>
          )}
        </div>

        {/* View Full Profile */}
        <Link
          href="/profile"
          onClick={onClose}
          style={{
            display: 'block', textAlign: 'center',
            padding: '6px 0',
            borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(253,224,71,0.6)',
            border: '1px solid rgba(253,224,71,0.15)',
            textDecoration: 'none',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: 7,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,224,71,0.08)'; e.currentTarget.style.color = '#fde047'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(253,224,71,0.6)'; }}
        >
          View Full Profile →
        </Link>

        {/* Change Username */}
        <button
          onClick={onChangeUsername}
          style={{
            display: 'block', width: '100%',
            padding: '5px 0',
            borderRadius: 8,
            fontSize: 11, fontWeight: 600,
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(255,255,255,0.3)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          Change Username
        </button>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: '/', label: 'All Games', emoji: '🎮' },
  { href: '/leaderboard', label: 'Leaderboard', emoji: '🏆' },
];

function SidebarFriendsPanel({ expanded, data, acting, onRespond, onAddFriend, onCloseSidebar }) {
  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: expanded ? 500 : 0,
      opacity: expanded ? 1 : 0,
      transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
    }}>
      <div style={{ margin: '0 12px 10px', padding: '2px 0 6px' }}>
        {!data && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", textAlign: 'center', padding: '12px 0' }}>
            Loading...
          </div>
        )}

        {data?.incoming?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.06em', marginBottom: 7, paddingLeft: 2 }}>
              REQUESTS
            </div>
            {data.incoming.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <img
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(req.requester.username)}`}
                  width={28} height={28}
                  style={{ borderRadius: 7, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: "'Nunito', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.requester.username}
                  </div>
                  <div style={{ fontSize: 10, color: LEVEL_COLORS[req.requester.level] || '#9ca3af', fontFamily: "'Nunito', sans-serif" }}>
                    {req.requester.level}
                  </div>
                </div>
                <button
                  onClick={() => onRespond(req.id, 'accept')}
                  disabled={acting === req.id}
                  title="Accept"
                  style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >✓</button>
                <button
                  onClick={() => onRespond(req.id, 'decline')}
                  disabled={acting === req.id}
                  title="Decline"
                  style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {data?.friends?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.06em', marginBottom: 7, paddingLeft: 2 }}>
              FRIENDS
            </div>
            {data.friends.slice(0, 5).map(f => (
              <Link
                key={f.id}
                href={`/profile/${f.username}`}
                onClick={onCloseSidebar}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, textDecoration: 'none', borderRadius: 8, padding: '4px', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <img
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(f.username)}`}
                  width={28} height={28}
                  style={{ borderRadius: 7, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: "'Nunito', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.username}{f.country ? ` ${countryFlag(f.country)}` : ''}
                  </div>
                  <div style={{ fontSize: 10, color: LEVEL_COLORS[f.level] || '#9ca3af', fontFamily: "'Nunito', sans-serif" }}>
                    {f.level}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: "'Fredoka', sans-serif", color: '#fde047', flexShrink: 0 }}>
                  {(f.tez_points || 0).toLocaleString()} TP
                </div>
              </Link>
            ))}
          </div>
        )}

        {data && data.friends.length === 0 && data.incoming.length === 0 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", textAlign: 'center', padding: '10px 0' }}>
            No friends yet — share your code!
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={onAddFriend}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#c084fc', fontWeight: 700, fontSize: 12,
              fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.28)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = '#c084fc'; }}
          >
            + Add Friend
          </button>
          <Link
            href="/friends"
            onClick={onCloseSidebar}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12,
              fontFamily: "'Nunito', sans-serif", textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, title = 'TEZ Games', hideChrome = false }) {
  const { musicOn, toggleMusic, volume, setVolume } = useMusic();
  const { username, playerId, playerStats, isEmailLinked, clearUsername } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [friendsExpanded, setFriendsExpanded] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendsData, setFriendsData] = useState(null);
  const [friendsActing, setFriendsActing] = useState(null);

  const refreshFriends = useCallback(() => {
    if (!playerId) return;
    fetch(`/api/friends/get?playerId=${encodeURIComponent(playerId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFriendsData(d); })
      .catch(() => {});
  }, [playerId]);

  useEffect(() => { if (friendsExpanded && !friendsData) refreshFriends(); }, [friendsExpanded]);
  useEffect(() => { if (playerId) refreshFriends(); }, [playerId]);

  const handleFriendRespond = async (friendshipId, action) => {
    setFriendsActing(friendshipId);
    await fetch('/api/friends/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, friendshipId, action }),
    });
    refreshFriends();
    setFriendsActing(null);
  };

  const pendingCount = friendsData?.incoming?.length || 0;

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

        {/* Sidebar */}
        {!hideChrome && (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 60,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(2px)',
                }}
              />
            )}

            {/* Sidebar panel */}
            <aside style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 70,
              width: 290,
              background: 'rgba(13,6,24,0.97)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              boxShadow: sidebarOpen ? '4px 0 40px rgba(0,0,0,0.6)' : 'none',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', flexDirection: 'column',
              padding: '0',
              overflowY: 'auto',
            }}>
              {/* Sidebar header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 16px 12px',
              }}>
                <span style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 18, fontWeight: 600,
                  background: 'linear-gradient(135deg, #fde047, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Menu
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                    fontSize: 16, transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  ✕
                </button>
              </div>

              {/* User profile block — clickable to expand stats */}
              {username && (
                <>
                  <div
                    onClick={() => setStatsExpanded(v => !v)}
                    style={{
                      padding: '12px 16px 14px',
                      borderBottom: statsExpanded ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(username)}`}
                      alt="avatar"
                      width={44} height={44}
                      style={{ borderRadius: 10, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif", marginBottom: 2 }}>
                        Signed in as
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: "'Nunito', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                        {username}
                        {playerStats?.country && <span style={{ fontSize: 16 }}>{countryFlag(playerStats.country)}</span>}
                        {isEmailLinked && (
                          <span title="Email linked" style={{ fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, padding: '1px 5px', lineHeight: 1.4 }}>✉</span>
                        )}
                      </div>
                    </div>
                    {/* Chevron */}
                    <span style={{
                      color: 'rgba(255,255,255,0.25)',
                      fontSize: 11,
                      transform: statsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                    }}>
                      ▼
                    </span>
                  </div>

                  {/* Expandable stats card */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {playerStats && (
                      <SidebarStatsCard
                        stats={playerStats}
                        expanded={statsExpanded}
                        onClose={() => setSidebarOpen(false)}
                        onChangeUsername={() => {
                          setStatsExpanded(false);
                          setUsernameModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Divider below profile / above nav */}
              {!username && <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />}

              {/* Sign Up / Log In (no user) */}
              {!username && (
                <div style={{ padding: '14px 12px 6px', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setAuthModalMode('signup'); setSidebarOpen(false); }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))',
                      border: '1px solid rgba(124,58,237,0.4)',
                      color: '#c084fc', fontWeight: 700, fontSize: 13,
                      fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.25))'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))'; e.currentTarget.style.color = '#c084fc'; }}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setAuthModalMode('login'); setSidebarOpen(false); }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13,
                      fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* Nav links */}
              <nav style={{ padding: '12px 8px' }}>
                {/* Friends section */}
                {username && playerId && (
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6, paddingBottom: 6 }}>
                    <div
                      onClick={() => setFriendsExpanded(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10,
                        color: 'rgba(255,255,255,0.75)',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 600, fontSize: 15,
                        cursor: 'pointer', userSelect: 'none',
                        transition: 'background 0.2s, color 0.2s',
                        marginBottom: 4,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,224,71,0.1)'; e.currentTarget.style.color = '#fde047'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                    >
                      <span style={{ fontSize: 18 }}>👥</span>
                      <span style={{ flex: 1 }}>Friends</span>
                      {pendingCount > 0 && (
                        <span style={{
                          background: '#7C3AED', color: 'white', borderRadius: 20,
                          fontSize: 11, fontWeight: 800, padding: '1px 7px', minWidth: 20, textAlign: 'center',
                        }}>
                          {pendingCount}
                        </span>
                      )}
                      <span style={{
                        color: 'rgba(255,255,255,0.25)', fontSize: 11,
                        transform: friendsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}>▼</span>
                    </div>
                    <SidebarFriendsPanel
                      expanded={friendsExpanded}
                      data={friendsData}
                      acting={friendsActing}
                      onRespond={handleFriendRespond}
                      onAddFriend={() => { setAddFriendOpen(true); setSidebarOpen(false); }}
                      onCloseSidebar={() => setSidebarOpen(false)}
                    />
                  </div>
                )}

                {NAV_ITEMS.map(({ href, label, emoji }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 600, fontSize: 15,
                      textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                      marginBottom: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,224,71,0.1)'; e.currentTarget.style.color = '#fde047'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Link Email + Log Out (logged-in users) */}
              {username && (
                <div style={{ padding: '6px 12px 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {!isEmailLinked && (
                    <button
                      onClick={() => { setAuthModalMode('link'); setSidebarOpen(false); }}
                      style={{
                        padding: '8px 0', borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(74,222,128,0.06)',
                        border: '1px solid rgba(74,222,128,0.2)',
                        color: 'rgba(74,222,128,0.7)', fontWeight: 600, fontSize: 12,
                        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.12)'; e.currentTarget.style.color = '#4ade80'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.06)'; e.currentTarget.style.color = 'rgba(74,222,128,0.7)'; }}
                    >
                      ✉ Link Email
                    </button>
                  )}
                  <button
                    onClick={() => { clearUsername(); setSidebarOpen(false); }}
                    style={{
                      padding: '8px 0', borderRadius: 9, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: 'rgba(239,68,68,0.5)', fontWeight: 600, fontSize: 12,
                      fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </aside>
          </>
        )}

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
            {/* Hamburger toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open menu"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                fontSize: 16, flexShrink: 0,
                transition: 'background 0.2s, color 0.2s',
                marginRight: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              ☰
            </button>
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
            <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link
                href="/"
                className="font-semibold font-nunito transition-all duration-200"
                style={{ color: 'rgba(253,224,71,0.75)', fontSize: 15 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fde047'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(253,224,71,0.75)'}
              >
                All Games
              </Link>
              <div
                style={{ position: 'relative', flexShrink: 0 }}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMusic}
                  title={musicOn ? 'Mute music' : 'Play music'}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20,
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: musicOn ? '#fde047' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                >
                  {musicOn ? '🎵' : '🔇'}
                </button>

                {/* Volume slider popup */}
                {showVolumeSlider && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0,
                    paddingTop: 8,
                    minWidth: 36,
                  }}>
                    <div style={{
                      background: 'rgba(13,6,24,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)',
                    }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Nunito', sans-serif", userSelect: 'none' }}>
                        {Math.round(volume * 100)}%
                      </span>
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={volume}
                        onChange={e => setVolume(parseFloat(e.target.value))}
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl',
                          height: 80,
                          width: 4,
                          cursor: 'pointer',
                          accentColor: '#fde047',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
          {!username && <UsernameBanner onOpenModal={() => setUsernameModalOpen(true)} />}
        </header>}

        <UsernameModal open={usernameModalOpen} onClose={() => setUsernameModalOpen(false)} />
        <AuthModal open={!!authModalMode} onClose={() => setAuthModalMode(null)} initialMode={authModalMode || 'signup'} />
        <AddFriendModal
          open={addFriendOpen}
          onClose={() => setAddFriendOpen(false)}
          playerId={playerId}
          onAdded={() => refreshFriends()}
        />

        <main className="max-w-6xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>

        {!hideChrome && (
          <footer
            className="text-center py-8 font-nunito text-sm"
            style={{ color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}
          >
            <p>Made by SOGtez · Play, have fun, repeat!</p>
            <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, color: '#666', opacity: 0.7 }}>{version}</span>
          </footer>
        )}
      </div>
    </>
  );
}
