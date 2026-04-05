/**
 * Local split-screen test — simulates two online players with no network.
 * Moves pass through local state exactly as they would via Supabase.
 * Visit /connect4-test to use it.
 */
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const Connect4Game = dynamic(() => import('../components/games/Connect4Game'), { ssr: false });

export default function Connect4Test() {
  const [key, setKey] = useState(0); // bump to force remount / reset
  const [redMove, setRedMove] = useState(null);
  const [blueMove, setBlueMove] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (who, move) =>
    setLog(prev => [`${who}: ${JSON.stringify(move)}`, ...prev].slice(0, 30));

  const handleRedMove = useCallback((move) => {
    addLog('🔴→🔵', move);
    setBlueMove({ ...move, _t: Date.now() });
  }, []);

  const handleBlueMove = useCallback((move) => {
    addLog('🔵→🔴', move);
    setRedMove({ ...move, _t: Date.now() });
  }, []);

  const reset = () => {
    setRedMove(null);
    setBlueMove(null);
    setLog([]);
    setKey(k => k + 1);
  };

  return (
    <div style={{ background: '#0d0b1e', minHeight: '100vh', fontFamily: "'Nunito Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Connect 4 — Online Props Test &nbsp;·&nbsp;
          <span style={{ color: '#ef4444' }}>Left = Red (goes first)</span>
          &nbsp;&nbsp;
          <span style={{ color: '#60a5fa' }}>Right = Blue</span>
        </div>
        <button
          onClick={reset}
          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif" }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Split-screen boards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'auto' }}>
          <Connect4Game
            key={`red-${key}`}
            gameMode="online"
            playerColor="red"
            onMove={handleRedMove}
            incomingMove={redMove}
            onGameEnd={(r) => addLog('🔴 END', r)}
          />
        </div>
        <div style={{ overflow: 'auto' }}>
          <Connect4Game
            key={`blue-${key}`}
            gameMode="online"
            playerColor="blue"
            onMove={handleBlueMove}
            incomingMove={blueMove}
            onGameEnd={(r) => addLog('🔵 END', r)}
          />
        </div>
      </div>

      {/* Move log */}
      {log.length > 0 && (
        <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 16px', maxHeight: 100, overflowY: 'auto' }}>
          {log.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: i === 0 ? '#fde047' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace', lineHeight: 1.6 }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
