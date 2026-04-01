import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useUser } from './_app';

const TABS = [
  { key: 'global',    label: 'Global',      emoji: '🌍' },
  { key: 'blackjack', label: 'Blackjack',   emoji: '🃏' },
  { key: 'connect4',  label: 'Connect 4',   emoji: '🔴' },
  { key: 'war',       label: 'War',         emoji: '⚔️'  },
];

const LEVEL_COLORS = {
  Rookie: '#92400e', Player: '#9ca3af', Competitor: '#eab308',
  Champion: '#3b82f6', Master: '#a855f7', Legend: '#f97316', GOAT: '#fde047',
};

const RANK_STYLES = {
  1: { bg: 'rgba(253,224,71,0.1)',  border: 'rgba(253,224,71,0.35)',  medal: '🥇' },
  2: { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.35)', medal: '🥈' },
  3: { bg: 'rgba(180,83,9,0.12)',   border: 'rgba(180,83,9,0.35)',    medal: '🥉' },
};

function winRate(wins, played) {
  if (!played) return '—';
  return `${Math.round((wins / played) * 100)}%`;
}

function LevelBadge({ level }) {
  const color = LEVEL_COLORS[level] || '#9ca3af';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color, boxShadow: `0 0 5px ${color}88`,
        display: 'inline-block', flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color }}>
        {level === 'GOAT' ? '👑 ' : ''}{level}
      </span>
    </span>
  );
}

function GlobalRow({ row, rank, isMe }) {
  const rs = RANK_STYLES[rank];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto auto auto',
      alignItems: 'center',
      gap: 10,
      padding: '11px 16px',
      borderRadius: 10,
      background: rs ? rs.bg : isMe ? 'rgba(124,58,237,0.08)' : 'transparent',
      border: `1px solid ${rs ? rs.border : isMe ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
      boxShadow: isMe ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
      marginBottom: 4,
      transition: 'background 0.15s',
    }}>
      {/* Rank */}
      <div style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: rs ? 18 : 15,
        fontWeight: 700,
        color: rs ? (rank === 1 ? '#fde047' : rank === 2 ? '#9ca3af' : '#cd7c3f') : 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        lineHeight: 1,
      }}>
        {rs ? rs.medal : `#${rank}`}
      </div>

      {/* Username + level */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, fontWeight: 700,
          color: isMe ? '#c084fc' : 'rgba(255,255,255,0.85)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {row.username}{isMe && <span style={{ fontSize: 11, color: '#a78bfa', marginLeft: 6 }}>(you)</span>}
        </div>
        <LevelBadge level={row.level || 'Rookie'} />
      </div>

      {/* Win rate */}
      <div style={{ textAlign: 'right', minWidth: 42 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Win %</div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#4ade80' }}>
          {winRate(row.total_wins, row.total_games)}
        </div>
      </div>

      {/* Total wins */}
      <div style={{ textAlign: 'right', minWidth: 36 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Wins</div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
          {row.total_wins || 0}
        </div>
      </div>

      {/* TP */}
      <div style={{ textAlign: 'right', minWidth: 52 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>TP</div>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
          color: '#fde047', textShadow: '0 0 6px rgba(253,224,71,0.4)',
        }}>
          {(row.tez_points || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function GameRow({ row, rank, isMe }) {
  const rs = RANK_STYLES[rank];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto auto auto',
      alignItems: 'center',
      gap: 10,
      padding: '11px 16px',
      borderRadius: 10,
      background: rs ? rs.bg : isMe ? 'rgba(124,58,237,0.08)' : 'transparent',
      border: `1px solid ${rs ? rs.border : isMe ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
      boxShadow: isMe ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
      marginBottom: 4,
    }}>
      <div style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: rs ? 18 : 15,
        fontWeight: 700,
        color: rs ? (rank === 1 ? '#fde047' : rank === 2 ? '#9ca3af' : '#cd7c3f') : 'rgba(255,255,255,0.35)',
        textAlign: 'center', lineHeight: 1,
      }}>
        {rs ? rs.medal : `#${rank}`}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, fontWeight: 700,
          color: isMe ? '#c084fc' : 'rgba(255,255,255,0.85)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {row.username}{isMe && <span style={{ fontSize: 11, color: '#a78bfa', marginLeft: 6 }}>(you)</span>}
        </div>
        <LevelBadge level={row.level || 'Rookie'} />
      </div>

      <div style={{ textAlign: 'right', minWidth: 42 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Win %</div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#4ade80' }}>
          {winRate(row.wins, row.played)}
        </div>
      </div>

      <div style={{ textAlign: 'right', minWidth: 52 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Played</div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: 'rgba(255,255,255,0.6)' }}>
          {row.played}
        </div>
      </div>

      <div style={{ textAlign: 'right', minWidth: 48 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Wins</div>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
          color: '#fde047', textShadow: '0 0 6px rgba(253,224,71,0.4)',
        }}>
          {row.wins}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { playerId } = useUser();
  const [activeTab, setActiveTab] = useState('global');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchTab = useCallback(async (tab) => {
    if (data[tab]) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (playerId) params.set('playerId', playerId);
      const res = await fetch(`/api/leaderboard?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, [tab]: json }));
      }
    } finally {
      setLoading(false);
    }
  }, [playerId, data]);

  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  const tabData = data[activeTab];
  const rows = tabData?.rows || [];
  const userRank = tabData?.userRank;
  const isGlobal = activeTab === 'global';
  const RowComponent = isGlobal ? GlobalRow : GameRow;

  return (
    <Layout title="Leaderboard — TEZ Games">
      {/* Back button */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
          fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 600,
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
        >
          ← Back to Games
        </Link>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 32, fontWeight: 700,
          background: 'linear-gradient(135deg, #fde047, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: 0, marginBottom: 4,
        }}>
          🏆 Leaderboard
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0,
        }}>
          Top players across all TEZ Games
        </p>
      </div>

      {/* Tab pills */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        {TABS.map(({ key, label, emoji }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                border: active ? '1px solid rgba(253,224,71,0.4)' : '1px solid rgba(255,255,255,0.1)',
                background: active
                  ? 'linear-gradient(135deg, rgba(253,224,71,0.18), rgba(245,158,11,0.12))'
                  : 'rgba(255,255,255,0.04)',
                color: active ? '#fde047' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 14px rgba(253,224,71,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '14px 12px 12px',
        minHeight: 200,
      }}>
        {/* Column headers */}
        {!loading && rows.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isGlobal ? '40px 1fr auto auto auto' : '40px 1fr auto auto auto',
            gap: 10, padding: '0 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 8,
          }}>
            <div style={headerStyle}>#</div>
            <div style={headerStyle}>Player</div>
            <div style={{ ...headerStyle, textAlign: 'right' }}>Win %</div>
            <div style={{ ...headerStyle, textAlign: 'right' }}>{isGlobal ? 'Wins' : 'Played'}</div>
            <div style={{ ...headerStyle, textAlign: 'right' }}>{isGlobal ? 'TP' : 'Wins'}</div>
          </div>
        )}

        {loading && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: "'Nunito', sans-serif", fontSize: 14,
          }}>
            Loading...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🏆</div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 8,
            }}>
              No players yet
            </div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, color: 'rgba(255,255,255,0.25)',
            }}>
              No games played yet — be the first to claim the top spot!
            </div>
          </div>
        )}

        {!loading && rows.map((row, i) => (
          <RowComponent
            key={row.id}
            row={row}
            rank={i + 1}
            isMe={row.id === playerId}
          />
        ))}

        {/* User rank pinned at bottom */}
        {!loading && userRank && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              margin: '16px 0 10px',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{
                fontSize: 11, fontFamily: "'Nunito', sans-serif",
                color: 'rgba(255,255,255,0.3)', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                Your Ranking
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <RowComponent row={userRank} rank={userRank.rank} isMe={true} />
          </>
        )}
      </div>
    </Layout>
  );
}

const headerStyle = {
  fontSize: 11,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  color: 'rgba(255,255,255,0.25)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
