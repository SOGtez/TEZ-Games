export default function UsernameBanner({ onOpenModal }) {
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
      `}</style>
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
          onClick={onOpenModal}
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
    </>
  );
}
