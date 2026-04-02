import { useEffect, useRef } from 'react';

const LEVEL_COLORS = {
  Rookie:     '#92400e',
  Player:     '#9ca3af',
  Competitor: '#eab308',
  Champion:   '#3b82f6',
  Master:     '#a855f7',
  Legend:     '#f97316',
  GOAT:       '#fde047',
};

export default function TezToast({ toasts }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} />
      ))}
      <style>{`
        @keyframes tez-toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tez-toast-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

function Toast({ toast }) {
  const isLevelUp = toast.type === 'levelup';
  const isDailyBucks = toast.type === 'daily_bucks';
  const color = LEVEL_COLORS[toast.level] || '#fde047';

  if (isDailyBucks) {
    return (
      <div style={{
        background: 'rgba(13,6,24,0.95)',
        border: '1px solid rgba(251,191,36,0.4)',
        borderRadius: 12,
        padding: '9px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        animation: `tez-toast-${toast.exiting ? 'out' : 'in'} 0.3s ease forwards`,
        minWidth: 160,
        maxWidth: 260,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fredoka', sans-serif" }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Nunito', sans-serif", fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Daily Bonus!
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>
              +{toast.bucksEarned} TEZ Bucks
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: isLevelUp
        ? 'linear-gradient(135deg, rgba(13,6,24,0.97), rgba(30,10,50,0.97))'
        : 'rgba(13,6,24,0.95)',
      border: `1px solid ${isLevelUp ? color : 'rgba(253,224,71,0.3)'}`,
      borderRadius: 12,
      padding: isLevelUp ? '12px 18px' : '9px 16px',
      boxShadow: isLevelUp
        ? `0 0 24px ${color}44, 0 4px 20px rgba(0,0,0,0.6)`
        : '0 4px 20px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      animation: `tez-toast-${toast.exiting ? 'out' : 'in'} 0.3s ease forwards`,
      minWidth: 160,
      maxWidth: 280,
    }}>
      {isLevelUp ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.45)', fontFamily: "'Nunito', sans-serif",
            textTransform: 'uppercase',
          }}>
            Level Up!
          </div>
          <div style={{
            fontSize: 16, fontWeight: 800,
            color,
            fontFamily: "'Fredoka', sans-serif",
            textShadow: `0 0 12px ${color}88`,
          }}>
            {toast.level === 'GOAT' ? '👑 ' : ''}{toast.level}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 600,
          }}>
            <span style={{ color: 'rgba(253,224,71,0.8)' }}>+{toast.pointsEarned} TP</span>
            {toast.bucksEarned > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span style={{ color: '#fbbf24' }}>+{toast.bucksEarned} 💰</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Fredoka', sans-serif",
        }}>
          <span style={{ fontSize: 16, color: '#fde047', fontWeight: 700,
            textShadow: '0 0 10px rgba(253,224,71,0.6)' }}>
            +{toast.pointsEarned} TP
          </span>
          {toast.bucksEarned > 0 && (
            <>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>|</span>
              <span style={{ fontSize: 15, color: '#fbbf24', fontWeight: 700,
                textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
                +{toast.bucksEarned} 💰
              </span>
            </>
          )}
          {toast.dailyBonus && (
            <span style={{ fontSize: 11, color: 'rgba(253,224,71,0.55)',
              fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
              (daily bonus!)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
