"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '../../pages/_app';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { reportGameResult } from '../../lib/reportGameResult';

const Connect4Game = dynamic(() => import('./Connect4Game'), { ssr: false });

/* ─── helpers ─── */
function copyText(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

/* ─── small sub-components ─── */
function Spinner({ size = 32, color = 'rgba(255,255,255,0.6)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${color}22`,
      borderTopColor: color,
      animation: 'spin 0.9s linear infinite',
    }} />
  );
}

function LoadingScreen({ message }) {
  return (
    <div style={fullPage}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner size={40} color="rgba(124,58,237,0.9)" />
      <p style={{ marginTop: 18, fontSize: 15, color: 'rgba(255,255,255,0.55)', fontFamily: "'Nunito Sans', sans-serif" }}>
        {message}
      </p>
    </div>
  );
}

const fullPage = {
  background: '#0d0b1e',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Nunito Sans', sans-serif",
};

/* ─── main component ─── */
export default function Connect4Online({ initialCode }) {
  const { username, playerId, playerStats } = useUser();

  // phase: null | 'creating' | 'waiting' | 'joining' | 'playing' | 'ended'
  // Note: initialCode starts null on static-page hydration; we watch it via effect
  const [phase, setPhase] = useState(null);
  const [gameMode, setGameMode] = useState('normal');
  const [isHost, setIsHost] = useState(false);
  const [room, setRoom] = useState(null);       // { code, roomId }
  const [hostInfo, setHostInfo] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);
  const [incomingMove, setIncomingMove] = useState(null);
  const [error, setError] = useState('');
  const [showExpand, setShowExpand] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [disconnectWin, setDisconnectWin] = useState(false);
  const [showEndButtons, setShowEndButtons] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);
  const disconnectTimerRef = useRef(null);
  const pollRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const autoJoinedRef = useRef(false);
  const gameEndedRef = useRef(false);

  // ── QR code generation ──
  useEffect(() => {
    if (phase !== 'waiting' || !room || !showExpand) return;
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toCanvas(canvas, `https://tez-games.com/game/connect4?code=${room.code}`, {
        width: 160,
        margin: 2,
        color: { dark: '#ffffff', light: '#1a1040' },
      });
    });
  }, [phase, room, showExpand]);

  // ── Auto-join from URL ──
  // initialCode arrives after hydration (router.query is empty on first render
  // for static pages), so watch it reactively instead of using it in useState.
  useEffect(() => {
    if (!initialCode || autoJoinedRef.current || phase !== null) return;
    setPhase('auto-joining');
  }, [initialCode, phase]);

  useEffect(() => {
    if (phase !== 'auto-joining' || autoJoinedRef.current) return;
    if (!username || !playerId) return; // wait for localStorage to load
    autoJoinedRef.current = true;
    joinRoom(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, username, playerId, initialCode]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
      clearInterval(heartbeatRef.current);
      clearTimeout(disconnectTimerRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  // ── Create a room (host) ──
  const handlePlayOnline = async (mode) => {
    if (!username || !playerId) { setError('You need a username to play online.'); return; }
    setGameMode(mode);
    setPhase('creating');
    setError('');
    setShowEndButtons(false);
    gameEndedRef.current = false;
    setDisconnected(false);
    setDisconnectWin(false);

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, gameMode: mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || 'unknown');
        throw new Error(msg);
      }

      const newRoom = { code: data.code, roomId: data.roomId };
      setIsHost(true);
      setRoom(newRoom);
      setHostInfo({ username, playerId, level: playerStats?.level || 'Rookie' });
      setGuestInfo(null);
      setPhase('waiting');

      setupChannel(data.roomId, true);
      startHostPolling(data.roomId);
    } catch (e) {
      setError(`Could not create room: ${e.message}`);
      setPhase(null);
    }
  };

  // ── Join a room (guest) ──
  const joinRoom = async (code) => {
    if (!username || !playerId) { setError('You need a username to play online.'); setPhase(null); return; }
    setPhase('joining');
    setError('');
    setShowEndButtons(false);
    gameEndedRef.current = false;
    setDisconnected(false);
    setDisconnectWin(false);

    const trimmed = (code || '').toUpperCase().trim();
    if (!trimmed) { setError('Enter a room code.'); setPhase(null); return; }

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = {
          not_found: 'Room not found. Double-check the code.',
          room_full: 'That room is already full.',
          expired: 'That room has expired.',
          own_room: "You can't join your own room.",
        };
        setError(msgs[data.error] || 'Could not join room.');
        setPhase(null);
        return;
      }

      setIsHost(false);
      setRoom({ code: trimmed, roomId: data.roomId });
      setGameMode(data.gameMode);
      setHostInfo({ username: data.hostUsername, level: data.hostLevel, country: data.hostCountry });
      setGuestInfo({ username, playerId, level: playerStats?.level || 'Rookie' });

      setupChannel(data.roomId, false);
    } catch {
      setError('Connection error. Please try again.');
      setPhase(null);
    }
  };

  // ── Supabase broadcast channel ──
  const setupChannel = (roomId, asHost) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const ch = supabase.channel(`connect4:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'move' }, ({ payload }) => {
      setIncomingMove({ ...payload, _t: Date.now() });
    });

    ch.on('broadcast', { event: 'heartbeat' }, () => {
      clearTimeout(disconnectTimerRef.current);
      if (disconnected) setDisconnected(false);
      armDisconnectTimer();
    });

    ch.on('broadcast', { event: 'rematch' }, ({ payload }) => {
      // opponent initiated rematch — auto-join their new room
      joinRoom(payload.code);
    });

    ch.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      if (!asHost) {
        // Guest: notify host we're here and start the game
        ch.send({ type: 'broadcast', event: 'guest_arrived', payload: {} });
        setPhase('playing');
        startHeartbeat(ch);
        armDisconnectTimer();
      }
    });

    channelRef.current = ch;
  };

  // ── Poll room status (host, while waiting) ──
  const startHostPolling = (roomId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/status?roomId=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'playing' && data.guestId) {
          clearInterval(pollRef.current);
          setGuestInfo({ username: data.guestUsername, level: data.guestLevel, country: data.guestCountry, playerId: data.guestId });
          setPhase('playing');
          startHeartbeat(channelRef.current);
          armDisconnectTimer();
        }
      } catch {}
    }, 2000);
  };

  // ── Heartbeat ──
  const startHeartbeat = (ch) => {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      ch?.send({ type: 'broadcast', event: 'heartbeat', payload: {} });
    }, 10000);
  };

  const armDisconnectTimer = () => {
    clearTimeout(disconnectTimerRef.current);
    disconnectTimerRef.current = setTimeout(() => {
      setDisconnected(true);
      // After 30 s total of no heartbeat, award the win
      disconnectTimerRef.current = setTimeout(() => {
        if (!gameEndedRef.current) {
          gameEndedRef.current = true;
          reportGameResult('connect4', 'win');
          setDisconnectWin(true);
          clearInterval(heartbeatRef.current);
        }
      }, 30000);
    }, 30000);
  };

  // ── Move relay ──
  const handleMove = useCallback((move) => {
    channelRef.current?.send({ type: 'broadcast', event: 'move', payload: move });
  }, []);

  // ── Game end ──
  const handleGameEnd = useCallback(({ winner, reason }) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    const localPlayer = isHost ? 1 : 2;
    const myResult = winner === 0 ? 'push' : winner === localPlayer ? 'win' : 'lose';
    reportGameResult('connect4', myResult);

    clearInterval(heartbeatRef.current);
    clearTimeout(disconnectTimerRef.current);

    fetch('/api/rooms/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room?.roomId }),
    });

    setShowEndButtons(true);
  }, [isHost, room]);

  // ── Rematch ──
  const handleRematch = async () => {
    setRematchLoading(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, gameMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      // Notify current opponent
      channelRef.current?.send({
        type: 'broadcast',
        event: 'rematch',
        payload: { code: data.code },
      });

      // Become host of new room
      const newRoom = { code: data.code, roomId: data.roomId };
      setIsHost(true);
      setRoom(newRoom);
      setGuestInfo(null);
      setShowEndButtons(false);
      gameEndedRef.current = false;
      setDisconnected(false);
      setDisconnectWin(false);
      setPhase('waiting');
      setupChannel(data.roomId, true);
      startHostPolling(data.roomId);
    } catch {
      setError('Could not create rematch. Please try again.');
    } finally {
      setRematchLoading(false);
    }
  };

  // ── Back to menu ──
  const handleCancel = () => {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    clearInterval(heartbeatRef.current);
    clearTimeout(disconnectTimerRef.current);
    clearInterval(pollRef.current);
    setPhase(null);
    setRoom(null);
    setGuestInfo(null);
    setShowEndButtons(false);
    gameEndedRef.current = false;
    setDisconnected(false);
    setDisconnectWin(false);
    setError('');
    autoJoinedRef.current = false;
  };

  const shareUrl = room ? `https://tez-games.com/game/connect4?code=${room.code}` : '';

  /* ════════════ RENDER ════════════ */

  // ── Not in online mode — show normal Connect4Game menu ──
  if (phase === null) {
    return (
      <div style={{ position: 'relative' }}>
        {error && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: 'rgba(239,68,68,0.92)', textAlign: 'center', padding: '10px 16px', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito Sans', sans-serif", backdropFilter: 'blur(4px)' }}>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕</button>
          </div>
        )}
        <Connect4Game
          onPlayOnline={handlePlayOnline}
          onJoinOnline={joinRoom}
        />
      </div>
    );
  }

  // ── Auto-joining from URL: wait for user context ──
  if (phase === 'auto-joining') {
    if (!username) {
      return (
        <div style={fullPage}>
          <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>Joining room {initialCode}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              You need a username to play online.
            </div>
            <button onClick={handleCancel} style={ghostBtn}>← Back</button>
          </div>
        </div>
      );
    }
    return <LoadingScreen message={`Joining room ${initialCode}…`} />;
  }

  // ── Creating room ──
  if (phase === 'creating') return <LoadingScreen message="Creating room…" />;

  // ── Joining room ──
  if (phase === 'joining') return <LoadingScreen message="Joining room…" />;

  // ── Waiting for opponent (host) ──
  if (phase === 'waiting') {
    return (
      <div style={fullPage}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dot { 0%,80%,100% { opacity: 0 } 40% { opacity: 1 } }
          @keyframes expandIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{ width: '100%', maxWidth: 360, padding: '0 24px', textAlign: 'center' }}>
          {/* Mode badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '4px 14px', marginBottom: 28, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {gameMode === 'rumble' ? '⚡ Rumble Mode' : '🎯 Normal Mode'}
          </div>

          {/* Code block */}
          <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            ROOM CODE
          </div>
          <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: 14, color: 'white', fontFamily: 'monospace', marginBottom: 16, textShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
            {room.code}
          </div>

          {/* Copy code button */}
          <button
            onClick={() => { copyText(room.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
            style={{ ...pillBtn, background: codeCopied ? 'rgba(74,222,128,0.15)' : 'rgba(124,58,237,0.2)', borderColor: codeCopied ? 'rgba(74,222,128,0.4)' : 'rgba(124,58,237,0.4)', color: codeCopied ? '#4ade80' : 'white', marginBottom: 12 }}
          >
            {codeCopied ? '✓ Copied!' : '📋 Copy Code'}
          </button>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
            Share this code with a friend
          </div>

          {/* Try another way */}
          <button
            onClick={() => setShowExpand(v => !v)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif", textDecoration: 'underline', textUnderlineOffset: 3, marginBottom: 4 }}
          >
            {showExpand ? '▲ Show less' : 'Try another way? ▼'}
          </button>

          {/* Expandable section */}
          <div style={{ overflow: 'hidden', maxHeight: showExpand ? 360 : 0, transition: 'max-height 0.45s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ paddingTop: 16, animation: showExpand ? 'expandIn 0.35s ease both' : 'none' }}>
              {/* Shareable link */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  tez-games.com/game/connect4?code={room.code}
                </span>
                <button
                  onClick={() => { copyText(shareUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                  style={{ ...pillBtn, fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', color: linkCopied ? '#4ade80' : 'rgba(255,255,255,0.7)', borderColor: linkCopied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.15)', background: 'transparent' }}
                >
                  {linkCopied ? '✓' : 'Copy'}
                </button>
              </div>

              {/* QR code */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas ref={qrCanvasRef} style={{ borderRadius: 12, background: '#1a1040' }} />
              </div>
            </div>
          </div>

          {/* Waiting indicator */}
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Spinner size={18} color="rgba(124,58,237,0.7)" />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Waiting for opponent…</span>
          </div>

          {/* Cancel */}
          <button onClick={handleCancel} style={{ ...ghostBtn, marginTop: 20, fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Disconnect win overlay ──
  if (disconnectWin) {
    return (
      <div style={fullPage}>
        <div style={{ textAlign: 'center', maxWidth: 340, padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', marginBottom: 8 }}>You Win!</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
            Opponent disconnected
          </div>
          <button onClick={handleCancel} style={primaryBtn}>Back to Menu</button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (phase === 'playing') {
    const p1Name = hostInfo?.username || 'Red';
    const p2Name = guestInfo?.username || 'Blue';

    return (
      <div style={{ position: 'relative' }}>
        <Connect4Game
          gameMode="online"
          gameType={gameMode}
          playerColor={isHost ? 'red' : 'blue'}
          onMove={handleMove}
          incomingMove={incomingMove}
          onGameEnd={handleGameEnd}
          p1Name={p1Name}
          p2Name={p2Name}
          notice={disconnected && !disconnectWin ? '⚠️ Opponent may have disconnected…' : null}
        />

        {/* Post-game buttons overlay */}
        {showEndButtons && (
          <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, zIndex: 200, padding: '0 16px' }}>
            <button
              onClick={handleRematch}
              disabled={rematchLoading}
              style={{ ...primaryBtn, opacity: rematchLoading ? 0.6 : 1 }}
            >
              {rematchLoading ? 'Creating…' : '🔄 Rematch'}
            </button>
            <button onClick={handleCancel} style={ghostBtn}>
              ← Menu
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/* ─── shared button styles ─── */
const pillBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '9px 22px', borderRadius: 24, border: '1px solid rgba(124,58,237,0.4)',
  background: 'rgba(124,58,237,0.2)', color: 'white', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif",
  transition: 'background 0.2s, border-color 0.2s, color 0.2s',
};

const primaryBtn = {
  padding: '11px 28px', borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  fontFamily: "'Nunito Sans', sans-serif",
  boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
  transition: 'transform 0.15s, box-shadow 0.2s',
};

const ghostBtn = {
  padding: '9px 20px', borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent', color: 'rgba(255,255,255,0.55)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'Nunito Sans', sans-serif",
  transition: 'background 0.2s, border-color 0.2s',
};
