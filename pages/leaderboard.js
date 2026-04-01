import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useUser } from './_app';
import { countryFlag } from '../lib/countryFlag';

const TABS = [
  { key: 'global',    label: 'Global',    emoji: '🌍' },
  { key: 'blackjack', label: 'Blackjack', emoji: '🃏' },
  { key: 'connect4',  label: 'Connect 4', emoji: '🔴' },
  { key: 'war',       label: 'War',       emoji: '⚔️'  },
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

function PlayerName({ row, isMe }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 14, fontWeight: 700,
        color: isMe ? '#c084fc' : 'rgba(255,255,255,0.85)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>{row.username}</span>
        {row.country && <span style={{ fontSize: 14 }}>{countryFlag(row.country)}</span>}
        {isMe && <span style={{ fontSize: 11, color: '#a78bfa', flexShrink: 0 }}>(you)</span>}
      </div>
      <LevelBadge level={row.level || 'Rookie'} />
    </div>
  );
}

function RowWrapper({ row, rank, isMe, isGlobal }) {
  const rs = RANK_STYLES[rank];
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto auto auto',
    alignItems: 'center',
    gap: 10,
    padding: '11px 16px',
    borderRadius: 10,
    background: rs ? rs.bg : isMe ? 'rgba(124,58,237,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
    border: `1px solid ${rs ? rs.border : isMe ? 'rgba(124,58,237,0.3)' : hovered ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
    boxShadow: isMe ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
    marginBottom: 4,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.15s, border 0.15s',
  };

  return (
    <Link
      href={`/profile/${encodeURIComponent(row.username)}`}
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank */}
      <div style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: rs ? 18 : 15, fontWeight: 700,
        color: rs ? (rank === 1 ? '#fde047' : rank === 2 ? '#9ca3af' : '#cd7c3f') : 'rgba(255,255,255,0.35)',
        textAlign: 'center', lineHeight: 1,
      }}>
        {rs ? rs.medal : `#${rank}`}
      </div>

      <PlayerName row={row} isMe={isMe} />

      {/* Win rate */}
      <div style={{ textAlign: 'right', minWidth: 42 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>Win %</div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#4ade80' }}>
          {isGlobal ? winRate(row.total_wins, row.total_games) : winRate(row.wins, row.played)}
        </div>
      </div>

      {/* Col 4 */}
      <div style={{ textAlign: 'right', minWidth: 40 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
          {isGlobal ? 'Wins' : 'Played'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
          {isGlobal ? (row.total_wins || 0) : row.played}
        </div>
      </div>

      {/* Col 5 */}
      <div style={{ textAlign: 'right', minWidth: 52 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
          {isGlobal ? 'TP' : 'Wins'}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
          color: '#fde047', textShadow: '0 0 6px rgba(253,224,71,0.4)',
        }}>
          {isGlobal ? (row.tez_points || 0).toLocaleString() : row.wins}
        </div>
      </div>
    </Link>
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
          fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 700,
          background: 'linear-gradient(135deg, #fde047, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: 0, marginBottom: 4,
        }}>
          🏆 Leaderboard
        </h1>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Top players across all TEZ Games
        </p>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(({ key, label, emoji }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
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
        borderRadius: 18, padding: '14px 12px 12px', minHeight: 200,
      }}>
        {/* Column headers */}
        {!loading && rows.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto',
            gap: 10, padding: '0 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
          }}>
            {['#', 'Player', 'Win %', isGlobal ? 'Wins' : 'Played', isGlobal ? 'TP' : 'Wins'].map((h, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em',
                textAlign: i > 1 ? 'right' : 'left',
              }}>{h}</div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
            Loading...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🏆</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              No players yet
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              No games played yet — be the first to claim the top spot!
            </div>
          </div>
        )}

        {!loading && rows.map((row, i) => (
          <RowWrapper key={row.id} row={row} rank={i + 1} isMe={row.id === playerId} isGlobal={isGlobal} />
        ))}

        {/* User rank pinned at bottom */}
        {!loading && userRank && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 10px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Your Ranking
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <RowWrapper row={userRank} rank={userRank.rank} isMe={true} isGlobal={isGlobal} />
          </>
        )}
      </div>
    </Layout>
  );
}
