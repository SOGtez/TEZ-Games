/**
 * Local multiplayer prop test — simulates two online players in split-screen.
 * Red (left) goes first. Moves are passed through local state, no network.
 * Visit /connect4-test to use it. Delete this file when done testing.
 */
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Connect4Game = dynamic(() => import('../components/games/Connect4Game'), { ssr: false });

export default function Connect4Test() {
  const [redMove, setRedMove] = useState(null);
  const [blueMove, setBlueMove] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (who, move) =>
    setLog(prev => [`${who}: ${JSON.stringify(move)}`, ...prev].slice(0, 20));

  const handleRedMove = (move) => {
    addLog('🔴 red → blue', move);
    setBlueMove({ ...move, _t: Date.now() });
  };

  const handleBlueMove = (move) => {
    addLog('🔵 blue → red', move);
    setRedMove({ ...move, _t: Date.now() });
  };

  const handleRedEnd = (result) => addLog('🔴 END', result);
  const handleBlueEnd = (result) => addLog('🔵 END', result);

  return (
    <div style={{ background: '#0d0b1e', minHeight: '100vh', fontFamily: "'Nunito Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        Connect 4 — Online Props Test &nbsp;|&nbsp; Red goes first &nbsp;|&nbsp;
        <span style={{ color: '#ef4444' }}>Left = Red (you)</span> &nbsp;
        <span style={{ color: '#3b82f6' }}>Right = Blue (opponent)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <Connect4Game
            gameMode="online"
            playerColor="red"
            onMove={handleRedMove}
            incomingMove={redMove}
            onGameEnd={handleRedEnd}
          />
        </div>
        <div>
          <Connect4Game
            gameMode="online"
            playerColor="blue"
            onMove={handleBlueMove}
            incomingMove={blueMove}
            onGameEnd={handleBlueEnd}
          />
        </div>
      </div>

      {log.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', maxHeight: 140, overflowY: 'auto' }}>
          {log.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: i === 0 ? '#fde047' : 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
