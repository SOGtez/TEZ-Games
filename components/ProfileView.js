import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { countryFlag } from '../lib/countryFlag';
import { parsePaintStyle } from '../lib/namePaint';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: '3px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
        background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.12)'}`,
        color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)',
        fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function RollingNumber({ value, prefix = '', suffix = '', color }) {
  const [display, setDisplay] = useState(value);
  const [glow, setGlow] = useState(false);
  const prev = useRef(value);
  const raf = useRef(null);
  useEffect(() => {
    if (prev.current === value) return;
    const increased = value > prev.current;
    const start = prev.current, end = value, dur = 700, t0 = Date.now();
    setGlow(increased);
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (p < 1) { raf.current = requestAnimationFrame(tick); }
      else { setTimeout(() => setGlow(false), 500); }
    };
    raf.current = requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return (
    <span style={{
      color: color || 'white',
      textShadow: glow ? `0 0 18px ${color || '#4ade80'}aa` : 'none',
      transition: 'text-shadow 0.4s',
      fontVariantNumeric: 'tabular-nums',
    }}>{prefix}{display}{suffix}</span>
  );
}

const LEVEL_ORDER = ['Rookie', 'Player', 'Competitor', 'Champion', 'Master', 'Legend', 'GOAT'];
const LEVEL_THRESHOLDS = { Rookie: 0, Player: 100, Competitor: 500, Champion: 2000, Master: 5000, Legend: 10000, GOAT: 25000 };
const LEVEL_COLORS = {
  Rookie: '#92400e', Player: '#9ca3af', Competitor: '#eab308',
  Champion: '#3b82f6', Master: '#a855f7', Legend: '#f97316', GOAT: '#fde047',
};
const GAME_META = {
  blackjack: { emoji: '🃏', name: 'TEZ Blackjack', hasPush: true },
  connect4:  { emoji: '🔴', name: 'TEZ Connect 4', hasPush: false },
  war:       { emoji: '⚔️',  name: 'TEZ War',       hasPush: true },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function winRate(wins, played) {
  if (!played) return '—';
  return `${Math.round((wins / played) * 100)}%`;
}

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontFamily: "'Nunito', sans-serif", fontSize: 12,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'rgba(255,255,255,0.75)' }}>{value}</span>
    </div>
  );
}

export default function ProfileView({ player, perGame, recent, isOwn, backHref = '/', backLabel = 'Back to Games', recoveryCode, paintCss }) {
  const level = player.level || 'Rookie';
  const points = player.tez_points || 0;
  const color = LEVEL_COLORS[level] || '#9ca3af';
  const idx = LEVEL_ORDER.indexOf(level);
  const isGoat = level === 'GOAT';
  const nextLevel = isGoat ? null : LEVEL_ORDER[idx + 1];
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : null;
  const curThreshold = LEVEL_THRESHOLDS[level] || 0;
  const progress = isGoat ? 1 : Math.min(1, (points - curThreshold) / (nextThreshold - curThreshold));
  const memberSince = player.created_at
    ? new Date(player.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const totalGames = player.total_games || 0;
  const totalWins = player.total_wins || 0;
  const totalLosses = player.total_losses || 0;
  const flag = countryFlag(player.country);

  return (
    <div>
      <style>{`
        .profile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 640px) { .profile-grid { grid-template-columns: repeat(2, 1fr); } }
        .game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 700px) { .game-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Back button */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <Link href={backHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
          fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 600,
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
        >
          ← {backLabel}
        </Link>
        {isOwn && (
          <span style={{
            fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            color: '#a78bfa',
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            Your profile
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Header card ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          display: 'flex', alignItems: 'center', gap: 22,
          flexWrap: 'wrap',
        }}>
          <img
            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(player.username)}`}
            alt="avatar"
            width={80} height={80}
            style={{ borderRadius: 16, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 30, fontWeight: 700, color: 'white',
              lineHeight: 1.1, marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <span style={paintCss ? parsePaintStyle(paintCss) || undefined : undefined}>{player.username}</span>
              {flag && <span style={{ fontSize: 24 }}>{flag}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${color}18`, border: `1px solid ${color}44`,
                borderRadius: 20, padding: '4px 12px',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, boxShadow: `0 0 6px ${color}`,
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color }}>
                  {isGoat ? '👑 ' : ''}{level}
                </span>
              </div>
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700 }}>
                <RollingNumber value={points} suffix=" TP" color="#fde047" />
              </span>
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                💰 <RollingNumber value={player.tez_bucks || 0} color="#fbbf24" />
              </span>
            </div>
            {memberSince && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
                Member since {memberSince}
              </div>
            )}
            {isOwn && player.friend_code && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif" }}>Friend Code:</span>
                <span style={{
                  fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700,
                  color: '#fde047', letterSpacing: '0.06em',
                }}>{player.friend_code}</span>
                <CopyButton text={player.friend_code} />
              </div>
            )}
            {isOwn && recoveryCode && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,158,11,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Recovery Code
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: 7 }}>
                    {recoveryCode}
                  </span>
                  <CopyButton text={recoveryCode} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.6)', lineHeight: 1.5 }}>
                  Save this somewhere safe — it's the only way to recover your account if you lose access. Never share it with anyone.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="profile-grid">
          {[
            { label: 'Games Played', value: <RollingNumber value={totalGames} />, icon: '🎮' },
            {
              label: 'Win Rate', icon: '📊',
              value: winRate(totalWins, totalGames),
              sub: <span><RollingNumber value={totalWins} color="rgba(255,255,255,0.4)" />W / <RollingNumber value={totalLosses} color="rgba(255,255,255,0.4)" />L</span>,
            },
            { label: 'Best Streak', value: <RollingNumber value={player.best_streak || 0} />, icon: '🔥' },
            { label: 'Current Streak', value: <RollingNumber value={player.current_streak || 0} />, icon: (player.current_streak || 0) >= 3 ? '🔥' : '🎯' },
          ].map(({ label, value, sub, icon }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '18px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
              <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 26, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 4,
              }}>
                {value}
              </div>
              {sub && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", marginBottom: 3 }}>
                  {sub}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Nunito', sans-serif" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── TEZ Points progress ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '24px 24px 20px',
        }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 18 }}>
            TEZ Points Progress
          </div>
          {!isGoat && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  {level} → {nextLevel}
                </span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  {points.toLocaleString()} / {nextThreshold?.toLocaleString()} TP ({Math.round(progress * 100)}%)
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.round(progress * 100)}%`, borderRadius: 4,
                  background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                  boxShadow: `0 0 10px ${color}66`, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
          {/* Level milestone timeline */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {LEVEL_ORDER.map((lvl, i) => {
              const reached = LEVEL_ORDER.indexOf(level) >= i;
              const isCurrent = lvl === level;
              const c = LEVEL_COLORS[lvl];
              const threshold = LEVEL_THRESHOLDS[lvl];
              return (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', flex: i < LEVEL_ORDER.length - 1 ? '1 1 0' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 52 }}>
                    <div style={{
                      width: isCurrent ? 18 : 13, height: isCurrent ? 18 : 13, borderRadius: '50%',
                      background: reached ? c : 'rgba(255,255,255,0.1)',
                      boxShadow: isCurrent ? `0 0 12px ${c}99` : 'none',
                      border: isCurrent ? `2px solid ${c}` : 'none',
                      transition: 'all 0.3s', flexShrink: 0,
                    }} />
                    <div style={{
                      fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                      fontFamily: "'Nunito', sans-serif",
                      color: reached ? (isCurrent ? c : 'rgba(255,255,255,0.55)') : 'rgba(255,255,255,0.2)',
                      textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap',
                    }}>
                      {lvl === 'GOAT' ? '👑' : ''}{lvl}
                      {threshold > 0 && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                          {threshold >= 1000 ? `${threshold / 1000}k` : threshold}
                        </div>
                      )}
                    </div>
                  </div>
                  {i < LEVEL_ORDER.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, marginBottom: 22,
                      background: LEVEL_ORDER.indexOf(level) > i
                        ? `linear-gradient(90deg, ${LEVEL_COLORS[lvl]}, ${LEVEL_COLORS[LEVEL_ORDER[i + 1]]})`
                        : 'rgba(255,255,255,0.08)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Per-game breakdown ── */}
        <div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 14 }}>
            Game Breakdown
          </div>
          <div className="game-grid">
            {Object.entries(GAME_META).map(([key, meta]) => {
              const gs = perGame?.[key] || { played: 0, wins: 0, losses: 0, pushes: 0 };
              return (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '18px 18px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 600, color: 'white' }}>
                      {meta.name}
                    </span>
                  </div>
                  {gs.played === 0 ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif", fontStyle: 'italic' }}>
                      No games played yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <StatRow label="Played" value={<RollingNumber value={gs.played} />} />
                      <StatRow label="Wins" value={<RollingNumber value={gs.wins} color="#4ade80" />} color="#4ade80" />
                      <StatRow label="Losses" value={<RollingNumber value={gs.losses} color="#f87171" />} color="#f87171" />
                      {meta.hasPush && <StatRow label="Pushes" value={<RollingNumber value={gs.pushes} color="#fde047" />} color="#fde047" />}
                      {key === 'blackjack' && gs.biggestWin > 0 && (
                        <StatRow label="Biggest Win" value={<RollingNumber value={gs.biggestWin} prefix="$" color="#fbbf24" />} color="#fbbf24" />
                      )}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 8 }}>
                        <StatRow label="Win Rate" value={winRate(gs.wins, gs.played)} color="#a78bfa" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 14 }}>
            Recent Activity
          </div>
          {(recent || []).length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '28px', textAlign: 'center',
              fontSize: 13, color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif",
            }}>
              No games played yet — get out there!
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              {recent.map((r, i) => {
                const meta = GAME_META[r.game_type] || { emoji: '🎮', name: r.game_type };
                const resultColor = r.result === 'win' ? '#4ade80' : r.result === 'lose' ? '#f87171' : '#fde047';
                const resultLabel = r.result === 'win' ? 'Win' : r.result === 'lose' ? 'Loss' : 'Push';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px',
                    borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                        {meta.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Nunito', sans-serif" }}>
                        {timeAgo(r.created_at)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                      color: resultColor, background: `${resultColor}18`, border: `1px solid ${resultColor}33`,
                      borderRadius: 20, padding: '3px 10px', flexShrink: 0,
                    }}>
                      {resultLabel}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                      color: '#fde047', flexShrink: 0, minWidth: 48, textAlign: 'right',
                    }}>
                      +{r.points_earned} TP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
