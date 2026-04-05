"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { reportGameResult } from "../../lib/reportGameResult";

const ROWS = 6, COLS = 7, PAD = 12, GAP = 5, CELL = 44, STRIDE = CELL + GAP;
const P1G = ["#FF6B6B", "#E24B4A"], P2G = ["#5EB8FF", "#378ADD"];

const POWERUPS = [
  { id: "fog", name: "Fog of War", emoji: "🌫️", grad: ["#7F77DD", "#534AB7"], rarity: "common", desc: "Opponent's board hidden except top row for 1 turn." },
  { id: "double", name: "Double Drop", emoji: "✌️", grad: ["#1D9E75", "#0F6E56"], rarity: "common", desc: "Drop 2 pieces this turn." },
  { id: "shield", name: "Shield", emoji: "🛡️", grad: ["#378ADD", "#185FA5"], rarity: "common", desc: "Block the next power-up used against you." },
  { id: "bomb", name: "Column Bomb", emoji: "💣", grad: ["#D85A30", "#993C1D"], rarity: "rare", desc: "Clear an entire column." },
  { id: "snatch", name: "Piece Snatch", emoji: "👋", grad: ["#D4537E", "#993556"], rarity: "rare", desc: "Flip one opponent piece to your color." },
  { id: "poison", name: "Poison Piece", emoji: "⚗️", grad: ["#6b2fa0", "#2d5a1b"], rarity: "rare", desc: "Your next piece is poisoned — opponent lands on it, both vanish." },
  { id: "gravity", name: "Gravity Flip", emoji: "🔃", grad: ["#E24B4A", "#A32D2D"], rarity: "legendary", desc: "Pieces stack from top for 2 turns." },
  { id: "ghost", name: "Ghost Piece", emoji: "👻", grad: ["#9F7DD6", "#533AB7"], rarity: "legendary", desc: "Place a piece anywhere ignoring gravity." },
];
const RARITY_W = { common: 40, rare: 15, legendary: 5 };
const PU_DESC = { fog: "Opponent's board hidden except top row for 1 turn.", double: "Drop 2 pieces this turn.", shield: "Block the next power-up used against you.", bomb: "Clear an entire column.", snatch: "Flip one opponent piece to your color.", poison: "Your next piece is poisoned — opponent lands, both vanish.", gravity: "Pieces stack from top for 2 turns.", ghost: "Place a piece anywhere ignoring gravity." };

function spinPU() { const pool = POWERUPS.flatMap(p => Array(RARITY_W[p.rarity]).fill(p)); return pool[Math.floor(Math.random() * pool.length)]; }
function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function applyGravity(board, fromTop = false) {
  const nb = emptyBoard();
  for (let c = 0; c < COLS; c++) { const pieces = []; for (let r = 0; r < ROWS; r++) if (board[r][c] !== null) pieces.push(board[r][c]); if (fromTop) pieces.forEach((p, i) => nb[i][c] = p); else pieces.forEach((p, i) => nb[ROWS - pieces.length + i][c] = p); }
  return nb;
}
function checkWinner(board) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const p = board[r][c]; if (!p) continue;
    if (c + 3 < COLS && [1, 2, 3].every(i => board[r][c + i] === p)) return { winner: p, cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
    if (r + 3 < ROWS && [1, 2, 3].every(i => board[r + i][c] === p)) return { winner: p, cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
    if (r + 3 < ROWS && c + 3 < COLS && [1, 2, 3].every(i => board[r + i][c + i] === p)) return { winner: p, cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
    if (r + 3 < ROWS && c - 3 >= 0 && [1, 2, 3].every(i => board[r + i][c - i] === p)) return { winner: p, cells: [[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]] };
  } return null;
}
function getLandRow(board, col, fromTop = false) {
  if (fromTop) { for (let r = 0; r < ROWS; r++) if (!board[r][col]) return r; }
  else { for (let r = ROWS - 1; r >= 0; r--) if (!board[r][col]) return r; }
  return -1;
}
function formatTime(s) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeOutBounce(t) { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function pGrad(p) { if (p === 1) return `linear-gradient(135deg,${P1G[0]},${P1G[1]})`; if (p === 2) return `linear-gradient(135deg,${P2G[0]},${P2G[1]})`; return "#12102a"; }
function pShadow(p) { if (p === 1) return `0 2px 8px rgba(226,75,74,0.4),inset 0 -3px 6px rgba(0,0,0,0.3)`; if (p === 2) return `0 2px 8px rgba(55,138,221,0.4),inset 0 -3px 6px rgba(0,0,0,0.3)`; return "inset 0 2px 6px rgba(0,0,0,0.6)"; }
// ─── Minimax AI (depth-6 with alpha-beta pruning) ───────────────
function scoreWindow(win, piece) {
  const opp = piece === 2 ? 1 : 2;
  const pc = win.filter(c => c === piece).length;
  const ec = win.filter(c => c === null).length;
  const oc = win.filter(c => c === opp).length;
  if (pc === 4) return 1000;
  if (pc === 3 && ec === 1) return 5;
  if (pc === 2 && ec === 2) return 2;
  if (oc === 3 && ec === 1) return -4;
  return 0;
}
function scorePosition(board, piece) {
  let score = 0;
  const mid = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (board[r][mid] === piece) score += 3;
    if (mid - 1 >= 0 && board[r][mid - 1] === piece) score++;
    if (mid + 1 < COLS && board[r][mid + 1] === piece) score++;
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], piece);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - 4; r++)
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], piece);
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], piece);
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], piece);
  return score;
}
function mmBoard(board, depth, alpha, beta, maxing, fromTop) {
  const win = checkWinner(board);
  if (win) return win.winner === 2 ? 100000 + depth : -100000 - depth;
  const isFull = board[fromTop ? ROWS - 1 : 0].every(c => c !== null);
  if (depth === 0 || isFull) return scorePosition(board, 2) - scorePosition(board, 1);
  const order = [3, 2, 4, 1, 5, 0, 6];
  const cols = order.filter(c => getLandRow(board, c, fromTop) >= 0);
  if (maxing) {
    let best = -Infinity;
    for (const c of cols) {
      const r = getLandRow(board, c, fromTop);
      const nb = board.map(row => [...row]); nb[r][c] = 2;
      best = Math.max(best, mmBoard(nb, depth - 1, alpha, beta, false, fromTop));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of cols) {
      const r = getLandRow(board, c, fromTop);
      const nb = board.map(row => [...row]); nb[r][c] = 1;
      best = Math.min(best, mmBoard(nb, depth - 1, alpha, beta, true, fromTop));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}
function getAIMove(board, fromTop) {
  const order = [3, 2, 4, 1, 5, 0, 6];
  const cols = order.filter(c => getLandRow(board, c, fromTop) >= 0);
  if (!cols.length) return null;
  const scored = cols.map(c => {
    const r = getLandRow(board, c, fromTop);
    const nb = board.map(row => [...row]); nb[r][c] = 2;
    return { c, s: mmBoard(nb, 5, -Infinity, Infinity, false, fromTop) };
  });
  const best = Math.max(...scored.map(x => x.s));
  if (best >= 99999) return scored.find(x => x.s === best).c;
  // Small random factor among near-best moves for variety
  const near = scored.filter(x => x.s >= best - 1.5);
  return near[Math.floor(Math.random() * near.length)].c;
}

function MenuOrbs() {
  const canvasRef = useRef(null);
  const orbsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; ctx.scale(2, 2); };
    resize();

    const colors = [
      { r: 239, g: 159, b: 39 },
      { r: 255, g: 107, b: 107 },
      { r: 94, g: 184, b: 255 },
      { r: 127, g: 119, b: 221 },
    ];

    orbsRef.current = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 80 + 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (time) => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      orbsRef.current.forEach(orb => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;
        const pulse = Math.sin(time / 1000 + orb.phase) * 0.3 + 0.7;
        const { r, g, b } = orb.color;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.08 * pulse})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

export default function Connect4Game({ gameMode, playerColor, onMove, incomingMove, onGameEnd, timerDuration = 240, gameType = 'normal', p1Name, p2Name, onPlayOnline, onJoinOnline, initialError, notice } = {}) {
  const [screen, setScreen] = useState(gameMode ? "game" : "menu");
  const [mode, setMode] = useState(gameMode ? (gameType || 'normal') : 'normal');
  const [joinCode, setJoinCode] = useState('');
  const [joinErr, setJoinErr] = useState(initialError || '');
  const [vsAI, setVsAI] = useState(gameMode === 'ai');
  const [board, setBoard] = useState(emptyBoard());
  const [turn, setTurn] = useState(1);
  const [result, setResult] = useState(null);
  const reportedRef = useRef(false);
  const processedMoveRef = useRef(null);
  const [winCells, setWinCells] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [animPieces, setAnimPieces] = useState([]);
  const [dropping, setDropping] = useState(false);
  const pieceIdRef = useRef(0);
  const rafRef = useRef(null);
  const [boxes, setBoxes] = useState({});
  const [inventory, setInventory] = useState({ 1: null, 2: null });
  const [shields, setShields] = useState({ 1: false, 2: false });
  const [fog, setFog] = useState({ 1: false, 2: false });
  const [fogT, setFogT] = useState({ 1: 0, 2: 0 });
  const fogRafRef = useRef({});
  const [gravityTurns, setGravityTurns] = useState(0);
  const [poisonCell, setPoisonCell] = useState(null);
  const [poisonArmed, setPoisonArmed] = useState(false);
  const [pulseT, setPulseT] = useState(0);
  const poisonRafRef = useRef(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [msg, setMsg] = useState("");
  const [hoverCol, setHoverCol] = useState(null);
  const [doubleFirst, setDoubleFirst] = useState(false);
  const [lastPlaced, setLastPlaced] = useState(null);
  const [dissolveCell, setDissolveCell] = useState(null);
  const [dissolveT, setDissolveT] = useState(1);
  const [confirmPU, setConfirmPU] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinFor, setSpinFor] = useState(null);
  const [spinIdx, setSpinIdx] = useState(0);
  const [spinAnimate, setSpinAnimate] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const spinRef = useRef(null);
  const [hiddenCells, setHiddenCells] = useState(new Set());
  const [bombPhase, setBombPhase] = useState(false);
  const bombTimers = useRef([]);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const drawingRef = useRef(false);
  const [flipping, setFlipping] = useState(null);
  const [flipAngle, setFlipAngle] = useState(0);
  const [menuReady, setMenuReady] = useState(false);
  const [timers, setTimers] = useState({ 1: timerDuration, 2: timerDuration });
  const timerIntervalRef = useRef(null);
  const fromTop = gravityTurns > 0;
  const localPlayer = gameMode === 'online' ? (playerColor === 'red' ? 1 : 2) : null;
  const isMyTurn = gameMode !== 'online' || turn === localPlayer;
  const hasTimer = (vsAI || gameMode === 'online') && screen === 'game';
  const timerPaused = !!result || spinning || bombPhase;

  useEffect(() => {
    if (screen === "menu") {
      setMenuReady(false);
      const t = setTimeout(() => setMenuReady(true), 50);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (!poisonCell) { cancelAnimationFrame(poisonRafRef.current); return; }
    let s = null;
    const run = ts => { if (!s) s = ts; setPulseT((ts - s) / 1000); poisonRafRef.current = requestAnimationFrame(run); };
    poisonRafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(poisonRafRef.current);
  }, [poisonCell]);

  // Chess-clock timer countdown — ticks for the active player when not paused
  useEffect(() => {
    const timerFor = (hasTimer && !timerPaused) ? turn : null;
    if (timerFor === null || (vsAI && timerFor === 2)) {
      clearInterval(timerIntervalRef.current);
      return;
    }
    const p = timerFor;
    timerIntervalRef.current = setInterval(() => {
      setTimers(prev => ({ ...prev, [p]: Math.max(0, prev[p] - 1) }));
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [hasTimer, timerPaused, turn, vsAI]);

  // Detect timeout — triggers game end when a player's time hits 0
  useEffect(() => {
    if (!hasTimer || result || screen !== 'game') return;
    if (timers[1] <= 0 && (gameMode === 'online' || vsAI)) {
      setResult({ winner: 2, timeout: true });
    } else if (timers[2] <= 0 && gameMode === 'online') {
      setResult({ winner: 1, timeout: true });
    }
  }, [timers, hasTimer, result, screen, gameMode, vsAI]);

  // Emit timerSync for online mode so both sides stay in sync
  const myTimerVal = localPlayer ? timers[localPlayer] : null;
  useEffect(() => {
    if (gameMode !== 'online' || myTimerVal === null || screen !== 'game' || myTimerVal >= timerDuration) return;
    onMove?.({ type: 'timerSync', timeRemaining: myTimerVal });
  }, [myTimerVal, gameMode, screen, timerDuration, onMove]);

  const boardToPieces = useCallback((b) => {
    const list = [];
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++)
      if (b[r][c] !== null) list.push({ id: pieceIdRef.current++, col: c, player: b[r][c], currentY: r });
    return list;
  }, []);

  const animateDrop = useCallback((col, player, landRow, onLand, onPassRow) => {
    setDropping(true);
    const id = pieceIdRef.current++;
    setAnimPieces(prev => [...prev, { id, col, player, currentY: -1 }]);
    let currentRow = -1;
    const stepMs = 62;
    const step = () => {
      currentRow++;
      setAnimPieces(prev => prev.map(p => p.id === id ? { ...p, currentY: currentRow } : p));
      if (onPassRow) onPassRow(currentRow, id);
      if (currentRow < landRow) { rafRef.current = setTimeout(step, stepMs); }
      else {
        let s = null; const dur = 200;
        const bounce = ts => {
          if (!s) s = ts; const t = Math.min((ts - s) / dur, 1);
          setAnimPieces(prev => prev.map(p => p.id === id ? { ...p, currentY: landRow + 0.15 * Math.sin(t * Math.PI) * (1 - t) } : p));
          if (t < 1) rafRef.current = requestAnimationFrame(bounce);
          else { setAnimPieces(prev => prev.map(p => p.id === id ? { ...p, currentY: landRow } : p)); onLand(id); }
        };
        rafRef.current = requestAnimationFrame(bounce);
      }
    };
    rafRef.current = setTimeout(step, stepMs);
  }, []);

  const animateFog = useCallback((player, target) => {
    cancelAnimationFrame(fogRafRef.current[player]);
    let s = null; const dur = 700;
    const run = ts => {
      if (!s) s = ts; const t = Math.min((ts - s) / dur, 1);
      setFogT(prev => ({ ...prev, [player]: target === 1 ? prev[player] + (1 - prev[player]) * (1 - Math.pow(1 - t, 2)) : prev[player] * Math.pow(1 - t, 2) }));
      if (t < 1) fogRafRef.current[player] = requestAnimationFrame(run);
      else setFogT(prev => ({ ...prev, [player]: target }));
    };
    fogRafRef.current[player] = requestAnimationFrame(run);
  }, []);

  const spawnBox = useCallback((b, tc, existingBoxes = {}) => {
    if (tc % 3 !== 0 || tc === 0) return {};
    const occupiedCols = new Set(Object.keys(existingBoxes).map(k => parseInt(k.split(",")[1])));
    const candidates = [];
    for (let c = 0; c < COLS; c++) {
      if (occupiedCols.has(c)) continue;
      for (let r = 0; r < ROWS; r++) if (!b[r][c]) candidates.push(`${r},${c}`);
    }
    if (!candidates.length) return {};
    return { [candidates[Math.floor(Math.random() * candidates.length)]]: true };
  }, []);

  const beginSpin = useCallback((pu, boardSnap, afterBoard) => {
    setSpinFor({ pu, boardSnap, afterBoard });
    setSpinning(true); setSpinAnimate(true); setSpinResult(null); setSpinIdx(0);
    let i = 0;
    const run = () => {
      i++; const delay = Math.round(35 + (i / 30) ** 2 * 260);
      setSpinIdx(Math.floor(Math.random() * POWERUPS.length));
      if (i < 30) spinRef.current = setTimeout(run, delay);
      else { setSpinAnimate(false); setSpinResult(pu); }
    };
    spinRef.current = setTimeout(run, 35);
  }, []);

  const finishTurn = useCallback((nb, nextTurn, tc, nfog, ngrav, nsh, ninv, npoison) => {
    const w = checkWinner(nb);
    if (w) {
      setResult(w); setWinCells(w.cells); setBoard(nb);
      setAnimPieces([]);
      setDropping(false); return;
    }
    if (nb.every(r => r.every(c => c !== null))) { setResult({ winner: 0 }); setBoard(nb); setAnimPieces([]); setDropping(false); return; }
    const newBoxes = mode === "rumble" ? spawnBox(nb, tc, boxes) : {};
    setBoard(nb); setTurn(nextTurn); setTurnCount(tc);
    setFog(nfog); setGravityTurns(ngrav); setShields(nsh); setInventory(ninv);
    if (npoison !== undefined) setPoisonCell(npoison);
    setBoxes(prev => ({ ...prev, ...newBoxes }));
    setDoubleFirst(false); setDropping(false); setMsg(""); setPendingAction(null);
    setAnimPieces(boardToPieces(nb));
  }, [mode, spawnBox, boxes, boardToPieces]);

  const activatePU = useCallback((pu, player, nb, tc, nfog, ngrav, nsh, ninv, npoison, triggerPiece = null) => {
    const opp = player === 1 ? 2 : 1;
    if (nsh[opp] && ["fog", "bomb", "snatch", "gravity", "ghost", "poison"].includes(pu.id)) {
      setMsg(`${pu.name} blocked by Shield!`);
      finishTurn(nb, opp, tc, nfog, ngrav, { ...nsh, [opp]: false }, ninv, npoison); return;
    }
    const setState = () => { setBoard(nb); setTurn(player); setTurnCount(tc); setFog(nfog); setGravityTurns(ngrav); setShields(nsh); setInventory(ninv); if (npoison !== undefined) setPoisonCell(npoison); setAnimPieces(boardToPieces(nb)); };
    if (pu.id === "fog") { const nf = { ...nfog, [opp]: true }; setFog(nf); animateFog(opp, 1); finishTurn(nb, opp, tc, nf, ngrav, nsh, ninv, npoison); }
    else if (pu.id === "shield") { setMsg("Shield active!"); finishTurn(nb, opp, tc, nfog, ngrav, { ...nsh, [player]: true }, ninv, npoison); }
    else if (pu.id === "double") { setState(); setPendingAction({ type: "double", player, board: nb, tc, fog: nfog, grav: ngrav, sh: nsh, inv: ninv, poison: npoison, triggerPiece }); setMsg("Double Drop! Place 2 pieces."); setDropping(false); }
    else if (pu.id === "bomb") { setState(); setPendingAction({ type: "bomb", player, board: nb, tc, fog: nfog, grav: ngrav, sh: nsh, inv: ninv, poison: npoison }); setMsg("Column Bomb: click a column!"); setDropping(false); }
    else if (pu.id === "snatch") { setState(); setPendingAction({ type: "snatch", player, board: nb, tc, fog: nfog, grav: ngrav, sh: nsh, inv: ninv, poison: npoison }); setMsg("Piece Snatch: click an opponent piece!"); setDropping(false); }
    else if (pu.id === "ghost") { setState(); setPendingAction({ type: "ghost", player, board: nb, tc, fog: nfog, grav: ngrav, sh: nsh, inv: ninv, poison: npoison }); setMsg("Ghost Piece: click any empty cell!"); setDropping(false); }
    else if (pu.id === "gravity") {
      setMsg("Gravity flipped!");
      const newGravTurns = ngrav + 2;
      const newFromTop = newGravTurns > 0;
      const settled = applyGravity(nb, newFromTop);
      const curPieces = boardToPieces(nb);
      const targets = [];
      for (let c = 0; c < COLS; c++) {
        const colP = curPieces.filter(p => p.col === c).sort((a, b) => a.currentY - b.currentY);
        const targetRows = [];
        for (let r = 0; r < ROWS; r++) if (settled[r][c] !== null) targetRows.push(r);
        colP.forEach((p, i) => { if (targetRows[i] !== undefined) targets.push({ id: p.id, toY: targetRows[i] }); });
      }
      setAnimPieces(curPieces);
      const startMap = {}; curPieces.forEach(p => startMap[p.id] = p.currentY);
      let s = null; const dur = 700;
      const run = ts => {
        if (!s) s = ts; const t = Math.min((ts - s) / dur, 1); const e = newFromTop ? easeOutExpo(t) : easeOutBounce(t);
        setAnimPieces(prev => prev.map(p => { const tgt = targets.find(t => t.id === p.id); return tgt ? { ...p, currentY: startMap[p.id] + (tgt.toY - startMap[p.id]) * e } : p; }));
        if (t < 1) rafRef.current = requestAnimationFrame(run);
        else setAnimPieces(prev => prev.map(p => { const tgt = targets.find(t => t.id === p.id); return tgt ? { ...p, currentY: tgt.toY } : p; }));
      };
      rafRef.current = requestAnimationFrame(run);
      finishTurn(settled, opp, tc, nfog, newGravTurns, nsh, ninv, npoison);
    }
    else if (pu.id === "poison") { setPoisonArmed(true); setMsg("Poison armed — your next piece is poisoned!"); finishTurn(nb, opp, tc, nfog, ngrav, nsh, ninv, npoison); }
  }, [finishTurn, animateFog, boardToPieces]);

  const handleSpinChoice = useCallback((useNow) => {
    const { pu, boardSnap, afterBoard } = spinFor;
    const { tc, fog: nfog, grav: ngrav, sh: nsh, inv: ninv, poison: npoison, nextTurn, player, triggerPiece } = afterBoard;
    setSpinning(false); setSpinResult(null); setSpinFor(null);
    const newInv = { ...ninv };
    if (useNow) activatePU(pu, player, boardSnap, tc, nfog, ngrav, nsh, newInv, npoison, triggerPiece);
    else { newInv[player] = pu; finishTurn(boardSnap, nextTurn, tc, nfog, ngrav, nsh, newInv, npoison); }
  }, [spinFor, finishTurn, activatePU]);

  const startDrawLoop = useCallback(() => {
    if (drawingRef.current) return; drawingRef.current = true;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.life -= p.decay; p.rot += p.rotV; p.vx *= 0.98;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.type === "spark") { ctx.strokeStyle = p.color; ctx.lineWidth = p.r * 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.vx * 3, -p.vy * 3); ctx.stroke(); }
        else if (p.type === "ember") { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r); g.addColorStop(0, p.colorInner); g.addColorStop(1, p.color + "00"); ctx.fillStyle = g; ctx.shadowColor = p.color; ctx.shadowBlur = p.r * 3; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        else if (p.type === "shard") { ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 4; ctx.fillRect(-p.r / 2, -p.r * 1.5, p.r, p.r * 3); }
        else if (p.type === "ring") { ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(0.5, p.r * (1 - p.age)); ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, p.radius * p.age, 0, Math.PI * 2); ctx.stroke(); p.age += 0.07; }
        ctx.restore();
      });
      if (particlesRef.current.length > 0) rafRef.current = requestAnimationFrame(draw);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); drawingRef.current = false; }
    };
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const spawnBurst = useCallback((col, row, boardSnap) => {
    const cx = PAD + col * STRIDE + CELL / 2, cy = PAD + CELL + GAP + row * STRIDE + CELL / 2;
    const cell = boardSnap[row][col]; const hasPiece = cell !== null;
    const pc = cell === 1 ? P1G[0] : cell === 2 ? P2G[0] : "#EF9F27";
    particlesRef.current.push({ type: "ring", x: cx, y: cy, radius: CELL * 0.8, age: 0.05, r: 3, color: hasPiece ? pc + "cc" : "#EF9F2766", life: 1, decay: 0.04, vx: 0, vy: 0, gravity: 0, rotV: 0, rot: 0 });
    if (hasPiece) {
      for (let i = 0; i < 14; i++) { const a = (Math.PI * 2 / 14) * i, s = Math.random() * 5 + 2.5; particlesRef.current.push({ type: "ember", x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, gravity: 0.22, r: Math.random() * 4 + 3, color: pc, colorInner: "#fff", life: 1, decay: Math.random() * 0.018 + 0.014, rot: 0, rotV: 0 }); }
      for (let i = 0; i < 18; i++) { const a = Math.random() * Math.PI * 2, s = Math.random() * 9 + 4; particlesRef.current.push({ type: "spark", x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, gravity: 0.3, r: Math.random() * 1.5 + 1, color: ["#FFD700", "#FF8C00", "#FF4500", pc, "#fff"][Math.floor(Math.random() * 5)], life: 1, decay: Math.random() * 0.03 + 0.025, rot: 0, rotV: 0 }); }
      for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, s = Math.random() * 4 + 1.5; particlesRef.current.push({ type: "shard", x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, gravity: 0.28, r: Math.random() * 3 + 2, color: Math.random() > 0.5 ? pc : "#EF9F27", life: 1, decay: Math.random() * 0.02 + 0.016, rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.25 }); }
    } else { for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2; particlesRef.current.push({ type: "spark", x: cx, y: cy, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 1, gravity: 0.25, r: 1, color: "#EF9F2799", life: 0.7, decay: 0.04, rot: 0, rotV: 0 }); } }
    startDrawLoop();
  }, [startDrawLoop]);

  const fireBomb = useCallback((col, pa) => {
    setBombPhase(true); const boardSnap = pa.board;
    for (let row = ROWS - 1; row >= 0; row--) {
      const delay = (ROWS - 1 - row) * 130;
      const t = setTimeout(() => { spawnBurst(col, row, boardSnap); if (boardSnap[row][col] !== null) setHiddenCells(prev => new Set([...prev, `${row},${col}`])); }, delay);
      bombTimers.current.push(t);
    }
    const finish = setTimeout(() => {
      const nb = boardSnap.map(r => [...r]); for (let r = 0; r < ROWS; r++) nb[r][col] = null;
      const settled = applyGravity(nb, fromTop);
      setHiddenCells(new Set()); setBombPhase(false);
      finishTurn(settled, pa.player === 1 ? 2 : 1, pa.tc, pa.fog, pa.grav, pa.sh, pa.inv, pa.poison);
    }, ROWS * 130 + 500);
    bombTimers.current.push(finish);
  }, [spawnBurst, finishTurn, fromTop]);

  const handleColClick = useCallback((col, isRemote = false) => {
    if (result || spinning || dropping || bombPhase || flipping) return;
    const pa = pendingAction;
    if (pa?.type === "bomb") {
      if (!isRemote && gameMode === 'online') onMove?.({ type: 'bomb', col });
      fireBomb(col, pa); setPendingAction(null); return;
    }
    if (pa?.type === "snatch" || pa?.type === "ghost") return;
    if (vsAI && turn === 2) return;
    if (gameMode === 'online' && !isRemote && turn !== (playerColor === 'red' ? 1 : 2)) return;
    const srcBoard = pa?.type === "double" ? pa.board : board;
    const landRow = getLandRow(srcBoard, col, fromTop);
    if (landRow < 0) return;
    const player = pa?.type === "double" ? pa.player : turn;
    const newTc = turnCount + 1;
    const newGrav = gravityTurns > 0 ? gravityTurns - 1 : 0;
    const newFog = { 1: fog[1] ? false : fog[1], 2: fog[2] ? false : fog[2] };
    let newPoison = poisonCell;
    const boxTriggeredRef = { current: false };

    if (!isRemote && gameMode === 'online') onMove?.({ type: 'drop', col });
    animateDrop(col, player, landRow, (droppedId) => {
      const nb = srcBoard.map(r => [...r]);
      const isPoison = poisonArmed && player === turn && !pa;
      let poisonTriggered = false;
      if (poisonCell && poisonCell.c === col) {
        const targetRow = fromTop ? poisonCell.r - 1 : poisonCell.r + 1;
        if (landRow === targetRow) poisonTriggered = true;
      }
      if (poisonTriggered && poisonCell) {
        nb[landRow][col] = null; nb[poisonCell.r][poisonCell.c] = null;
        newPoison = null; setPoisonArmed(false); setMsg("💀 Poison triggered! Both pieces vanish.");
      } else {
        nb[landRow][col] = player;
        if (isPoison) { newPoison = { r: landRow, c: col, placedBy: player }; setPoisonArmed(false); }
        else if (poisonCell && poisonCell.r === landRow && poisonCell.c === col) newPoison = null;
      }
      setLastPlaced({ r: landRow, c: col });
      if (boxTriggeredRef.current && mode === "rumble") {
        setBoard(nb); setTurnCount(newTc); setFog(newFog); setGravityTurns(newGrav);
        setAnimPieces(boardToPieces(nb)); setDropping(false);
        const pu = spinPU();
        beginSpin(pu, nb, { tc: newTc, fog: newFog, grav: newGrav, sh: shields, inv: inventory, poison: newPoison, nextTurn: player === 1 ? 2 : 1, player, triggerPiece: { r: landRow, c: col } });
        return;
      }
      if (pa?.type === "double") {
        if (!doubleFirst) {
          setDoubleFirst(true); setBoard(nb); setPendingAction({ ...pa, board: nb });
          setAnimPieces(boardToPieces(nb)); setDropping(false);
        } else {
          setPendingAction(null); setBoard(nb); setAnimPieces(boardToPieces(nb)); setDropping(false);
          const tp = pa.triggerPiece;
          if (tp && nb[tp.r]?.[tp.c] !== null) {
            setDissolveCell({ r: tp.r, c: tp.c, player: nb[tp.r][tp.c] }); setDissolveT(1);
            let s = null; const dur = 700;
            const run = ts => {
              if (!s) s = ts; const t = Math.min((ts - s) / dur, 1); setDissolveT(1 - t);
              if (t < 1) rafRef.current = requestAnimationFrame(run);
              else {
                const nb2 = nb.map(r => [...r]); nb2[tp.r][tp.c] = null; setDissolveCell(null); setDissolveT(1);
                setAnimPieces(boardToPieces(nb2));
                if (newFog[1] === false && fog[1]) animateFog(1, 0); if (newFog[2] === false && fog[2]) animateFog(2, 0);
                finishTurn(nb2, player === 1 ? 2 : 1, newTc, newFog, newGrav, shields, inventory, newPoison);
              }
            };
            rafRef.current = requestAnimationFrame(run);
          } else {
            if (newFog[1] === false && fog[1]) animateFog(1, 0); if (newFog[2] === false && fog[2]) animateFog(2, 0);
            finishTurn(nb, player === 1 ? 2 : 1, newTc, newFog, newGrav, shields, inventory, newPoison);
          }
        }
      } else {
        if (newFog[1] === false && fog[1]) animateFog(1, 0); if (newFog[2] === false && fog[2]) animateFog(2, 0);
        finishTurn(nb, player === 1 ? 2 : 1, newTc, newFog, newGrav, shields, inventory, newPoison);
      }
    }, (passedRow) => {
      if (boxTriggeredRef.current || mode !== "rumble") return;
      const key = `${passedRow},${col}`; if (!boxes[key]) return;
      boxTriggeredRef.current = true;
      setBoxes(prev => { const n = { ...prev }; delete n[key]; return n; });
    });
  }, [result, spinning, dropping, bombPhase, flipping, pendingAction, vsAI, turn, board, fromTop, turnCount, gravityTurns, fog, poisonCell, poisonArmed, mode, animateDrop, fireBomb, doubleFirst, finishTurn, animateFog, boardToPieces, shields, inventory, beginSpin, boxes, gameMode, playerColor, onMove]);

  const handleCellClick = useCallback((r, c, isRemote = false) => {
    const pa = pendingAction; if (!pa) return;
    if (pa.type === "snatch") {
      const opp = pa.player === 1 ? 2 : 1; if (pa.board[r][c] !== opp) return;
      if (!isRemote && gameMode === 'online') onMove?.({ type: 'snatch', row: r, col: c });
      setFlipping({ r, c, player: pa.player, pa });
      let s = null; const dur = 580;
      const run = ts => {
        if (!s) s = ts; const t = Math.min((ts - s) / dur, 1); setFlipAngle(easeInOutCubic(t) * 180);
        if (t < 1) rafRef.current = requestAnimationFrame(run);
        else { setFlipAngle(0); setFlipping(null); const nb = pa.board.map(row => [...row]); nb[r][c] = pa.player; setAnimPieces(boardToPieces(nb)); finishTurn(nb, opp, pa.tc, pa.fog, pa.grav, pa.sh, pa.inv, pa.poison); }
      };
      rafRef.current = requestAnimationFrame(run);
    } else if (pa.type === "ghost") {
      if (pa.board[r][c] !== null) return;
      if (!isRemote && gameMode === 'online') onMove?.({ type: 'ghost', row: r, col: c });
      const nb = pa.board.map(row => [...row]); nb[r][c] = pa.player;
      setAnimPieces(boardToPieces(nb)); finishTurn(nb, pa.player === 1 ? 2 : 1, pa.tc, pa.fog, pa.grav, pa.sh, pa.inv, pa.poison);
    }
  }, [pendingAction, finishTurn, boardToPieces, gameMode, onMove]);

  const useInventory = useCallback((player) => {
    if (spinning || result || turn !== player || dropping || pendingAction) return;
    if (gameMode === 'online' && turn !== (playerColor === 'red' ? 1 : 2)) return;
    const pu = inventory[player]; if (!pu) return;
    setConfirmPU({ player, pu });
  }, [spinning, result, turn, dropping, pendingAction, inventory, gameMode, playerColor]);

  const confirmUse = useCallback((isRemote = false) => {
    if (!confirmPU) return;
    const { player, pu } = confirmPU; setConfirmPU(null);
    if (!isRemote && gameMode === 'online') onMove?.({ type: 'useItem' });
    activatePU(pu, player, board, turnCount, fog, gravityTurns, shields, { ...inventory, [player]: null }, poisonCell, lastPlaced);
  }, [confirmPU, board, turnCount, fog, gravityTurns, shields, inventory, poisonCell, activatePU, lastPlaced, gameMode, onMove]);

  useEffect(() => {
    if (!vsAI || turn !== 2 || result || spinning || dropping || pendingAction || screen !== "game" || bombPhase || flipping) return;
    const t = setTimeout(() => {
      const col = getAIMove(board, fromTop); if (col === null) return;
      const landRow = getLandRow(board, col, fromTop); if (landRow < 0) return;
      const newTc = turnCount + 1, newGrav = gravityTurns > 0 ? gravityTurns - 1 : 0;
      const newFog = { 1: fog[1] ? false : fog[1], 2: fog[2] ? false : fog[2] };
      const boxTriggeredRef = { current: false };
      animateDrop(col, 2, landRow, (id) => {
        const nb = board.map(r => [...r]); nb[landRow][col] = 2;
        if (boxTriggeredRef.current && mode === "rumble") {
          setBoard(nb); setTurnCount(newTc); setFog(newFog); setGravityTurns(newGrav);
          setAnimPieces(boardToPieces(nb)); setDropping(false);
          const pu = spinPU();
          beginSpin(pu, nb, { tc: newTc, fog: newFog, grav: newGrav, sh: shields, inv: inventory, poison: poisonCell, nextTurn: 1, player: 2, triggerPiece: { r: landRow, c: col } });
          return;
        }
        if (newFog[1] === false && fog[1]) animateFog(1, 0); if (newFog[2] === false && fog[2]) animateFog(2, 0);
        finishTurn(nb, 1, newTc, newFog, newGrav, shields, inventory, poisonCell);
      }, (passedRow) => {
        if (boxTriggeredRef.current || mode !== "rumble") return;
        const key = `${passedRow},${col}`; if (!boxes[key]) return;
        boxTriggeredRef.current = true;
        setBoxes(prev => { const n = { ...prev }; delete n[key]; return n; });
      });
    }, 300);
    return () => clearTimeout(t);
  }, [turn, vsAI, board, result, spinning, dropping, pendingAction, screen, bombPhase, flipping, gravityTurns, turnCount, fog, shields, inventory, poisonCell, mode, fromTop, animateDrop, finishTurn, animateFog, boardToPieces, boxes, beginSpin]);

  const startGame = useCallback((m, ai) => {
    setMode(m); setVsAI(ai); setBoard(emptyBoard()); setTurn(1); setResult(null); setWinCells([]); setTurnCount(0);
    setAnimPieces([]); setDropping(false); setHoverCol(null);
    setBoxes({}); setInventory({ 1: null, 2: null }); setShields({ 1: false, 2: false });
    setFog({ 1: false, 2: false }); setFogT({ 1: 0, 2: 0 }); setGravityTurns(0);
    setPoisonCell(null); setPoisonArmed(false); setPendingAction(null); setMsg(""); setDoubleFirst(false);
    setSpinning(false); setHiddenCells(new Set()); setBombPhase(false); setFlipping(null); setConfirmPU(null);
    setDissolveCell(null); setDissolveT(1); setLastPlaced(null);
    bombTimers.current.forEach(clearTimeout); bombTimers.current = [];
    setTimers({ 1: timerDuration, 2: timerDuration });
    setScreen("game");
  }, [timerDuration]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); bombTimers.current.forEach(clearTimeout); clearInterval(timerIntervalRef.current); }, []);

  // Report game result to TEZ Points — AI and online modes only (not local 2P)
  useEffect(() => {
    if (!result) { reportedRef.current = false; return; }
    if (reportedRef.current) return;
    reportedRef.current = true;
    const isOnline = gameMode === 'online';
    if (isOnline && onGameEnd) {
      const winner = result.winner === 0 ? 'draw' : result.winner === 1 ? 'red' : 'blue';
      onGameEnd({ winner, mode, reason: result.timeout ? 'timeout' : 'normal' });
    }
    if (!vsAI && !isOnline) return; // no stats for local 2-player
    if (result.winner === 0) return; // draw — skip
    const localWinner = isOnline ? localPlayer : 1; // online: local player's number; AI: player 1 is human
    const apiResult = result.winner === localWinner ? 'win' : 'lose';
    reportGameResult('connect4', apiResult, { mode, opponent: isOnline ? 'online' : 'ai' });
  }, [result, mode, vsAI, gameMode, localPlayer, onGameEnd]);

  // Process incoming opponent moves in online mode
  useEffect(() => {
    if (!incomingMove || gameMode !== 'online') return;
    if (incomingMove === processedMoveRef.current) return;
    processedMoveRef.current = incomingMove;
    const { type } = incomingMove;
    if (type === 'drop' || type === 'bomb') {
      handleColClick(incomingMove.col, true);
    } else if (type === 'snatch' || type === 'ghost') {
      handleCellClick(incomingMove.row, incomingMove.col, true);
    } else if (type === 'useItem') {
      const opponentPlayer = localPlayer === 1 ? 2 : 1;
      const pu = inventory[opponentPlayer];
      if (pu) {
        activatePU(pu, opponentPlayer, board, turnCount, fog, gravityTurns, shields,
          { ...inventory, [opponentPlayer]: null }, poisonCell, lastPlaced);
      }
    } else if (type === 'timerSync') {
      const opponentPlayer = localPlayer === 1 ? 2 : 1;
      setTimers(prev => ({ ...prev, [opponentPlayer]: incomingMove.timeRemaining }));
    }
  }, [incomingMove, gameMode, localPlayer, handleColClick, handleCellClick, activatePU, inventory, board, turnCount, fog, gravityTurns, shields, poisonCell, lastPlaced]);

  const poisonGlow = poisonCell ? Math.sin(pulseT * Math.PI * 1.4) * 0.5 + 0.5 : 0;
  const poisonShadow = `0 0 ${10 + poisonGlow * 28}px rgba(140,50,255,${0.6 + poisonGlow * 0.4}),0 0 ${6 + poisonGlow * 16}px rgba(40,200,80,${0.35 + poisonGlow * 0.45}),0 0 ${3 + poisonGlow * 8}px rgba(180,80,255,0.9),inset 0 -3px 8px rgba(0,0,0,0.6)`;
  const boardW = COLS * STRIDE + PAD * 2, boardH = ROWS * STRIDE + PAD * 2;
  const p1Label = p1Name || (gameMode === 'online' ? (localPlayer === 1 ? 'You' : 'Opponent') : vsAI ? 'You' : 'P1');
  const p2Label = p2Name || (gameMode === 'online' ? (localPlayer === 2 ? 'You' : 'Opponent') : vsAI ? 'AI' : 'P2');
  const gameOver = !!result;

  /* ═══════════════ MENU SCREEN ═══════════════ */
  if (screen === "menu") return (
    <div style={{ background: "#0d0b1e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "'Nunito Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <MenuOrbs />
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%,100% { filter: drop-shadow(0 0 12px rgba(239,159,39,0.5)); } 50% { filter: drop-shadow(0 0 24px rgba(239,159,39,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.3)); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes borderGlow { 0%,100% { border-color: rgba(55,138,221,0.2); } 50% { border-color: rgba(55,138,221,0.5); } }
        @keyframes rumbleBorderGlow { 0%,100% { border-color: rgba(127,119,221,0.2); } 50% { border-color: rgba(239,159,39,0.45); } }
        @keyframes floatBadge { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .mc-normal { background: linear-gradient(135deg,rgba(55,138,221,0.1),rgba(24,95,165,0.05)); border: 1px solid rgba(55,138,221,0.2); border-radius: 18px; padding: 22px 22px 18px; position: relative; overflow: hidden; transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s, border-color 0.3s; cursor: pointer; animation: borderGlow 3s ease-in-out infinite; }
        .mc-normal:hover { transform: scale(1.025); box-shadow: 0 0 40px rgba(55,138,221,0.25), 0 8px 32px rgba(0,0,0,0.3); border-color: rgba(55,138,221,0.55); }
        .mc-normal::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(55,138,221,0.06), transparent); transition: left 0.6s; }
        .mc-normal:hover::before { left: 150%; }
        .mc-rumble { background: linear-gradient(135deg,rgba(127,119,221,0.1),rgba(239,159,39,0.05)); border: 1px solid rgba(127,119,221,0.2); border-radius: 18px; padding: 22px 22px 18px; position: relative; overflow: hidden; transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s, border-color 0.3s; cursor: pointer; animation: rumbleBorderGlow 3s ease-in-out infinite; }
        .mc-rumble:hover { transform: scale(1.025); box-shadow: 0 0 40px rgba(239,159,39,0.2), 0 8px 32px rgba(0,0,0,0.3); border-color: rgba(239,159,39,0.5); }
        .mc-rumble::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(239,159,39,0.06), transparent); transition: left 0.6s; }
        .mc-rumble:hover::before { left: 150%; }
        .menu-btn-primary { flex: 1; padding: 11px 0; border-radius: 11px; border: none; color: white; font-weight: 700; font-size: 13px; cursor: pointer; transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s; font-family: 'Nunito Sans', sans-serif; }
        .menu-btn-primary:hover { transform: scale(1.06); }
        .menu-btn-primary:active { transform: scale(0.96); }
        .menu-btn-ghost { flex: 1; padding: 11px 0; border-radius: 11px; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.75); font-weight: 600; font-size: 13px; cursor: pointer; transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, background 0.2s; font-family: 'Nunito Sans', sans-serif; }
        .menu-btn-ghost:hover { transform: scale(1.06); background: rgba(255,255,255,0.1); }
        .menu-btn-ghost:active { transform: scale(0.96); }
        .menu-btn-online { width: 100%; margin-top: 8px; padding: 9px 0; border-radius: 11px; border: 1px solid rgba(74,222,128,0.25); background: rgba(74,222,128,0.07); color: #4ade80; font-weight: 700; font-size: 13px; cursor: pointer; transition: transform 0.15s, background 0.2s, border-color 0.2s; font-family: 'Nunito Sans', sans-serif; }
        .menu-btn-online:hover { transform: scale(1.03); background: rgba(74,222,128,0.14); border-color: rgba(74,222,128,0.45); }
        .menu-btn-online:active { transform: scale(0.97); }
        @media (max-width: 480px) {
          .mc-normal, .mc-rumble { padding: 16px 14px 14px; }
        }
      `}</style>

      <div style={{
        textAlign: "center", marginBottom: 36, position: "relative", zIndex: 1,
        opacity: menuReady ? 1 : 0, transform: menuReady ? "translateY(0)" : "translateY(-20px)",
        transition: "opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: 3, animation: "glowPulse 3s ease-in-out infinite" }}>
          <span style={{ background: "linear-gradient(135deg,#fde047,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TEZ</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Connect 4</div>
        <div style={{
          fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8,
          background: "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.5), rgba(255,255,255,0.2))",
          backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 3s linear infinite",
        }}>Drop • Connect • Dominate</div>
      </div>

      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
        <div className="mc-normal" style={{
          opacity: menuReady ? 1 : 0, transform: menuReady ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.5s cubic-bezier(.22,1,.36,1) 0.15s, transform 0.5s cubic-bezier(.22,1,.36,1) 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#378ADD,#185FA5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(55,138,221,0.3)" }}>🎯</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "white", letterSpacing: 0.3 }}>Normal Mode</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Classic Connect 4 — pure strategy</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => startGame("normal", false)} className="menu-btn-primary" style={{ background: "linear-gradient(135deg,#378ADD,#185FA5)", boxShadow: "0 4px 16px rgba(55,138,221,0.25)" }}>2 Players</button>
            <button onClick={() => startGame("normal", true)} className="menu-btn-ghost" style={{ background: "rgba(55,138,221,0.08)" }}>vs AI</button>
          </div>
          {onPlayOnline && (
            <button onClick={() => onPlayOnline("normal")} className="menu-btn-online">🌐 Play Online</button>
          )}
        </div>

        <div className="mc-rumble" style={{
          opacity: menuReady ? 1 : 0, transform: menuReady ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.5s cubic-bezier(.22,1,.36,1) 0.3s, transform 0.5s cubic-bezier(.22,1,.36,1) 0.3s",
        }}>
          <div style={{ position: "absolute", top: 12, right: 14, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: "linear-gradient(135deg,#EF9F27,#FF8C00)", color: "#0d0b1e", animation: "floatBadge 2s ease-in-out infinite", boxShadow: "0 2px 12px rgba(239,159,39,0.4)" }}>NEW</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7F77DD,#534AB7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(127,119,221,0.3)" }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "white", letterSpacing: 0.3 }}>Rumble Mode</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Power-ups, mystery boxes & chaos</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => startGame("rumble", false)} className="menu-btn-primary" style={{ background: "linear-gradient(135deg,#7F77DD,#534AB7)", boxShadow: "0 4px 16px rgba(127,119,221,0.25)" }}>2 Players</button>
            <button onClick={() => startGame("rumble", true)} className="menu-btn-ghost" style={{ background: "rgba(127,119,221,0.08)" }}>vs AI</button>
          </div>
          {onPlayOnline && (
            <button onClick={() => onPlayOnline("rumble")} className="menu-btn-online">🌐 Play Online</button>
          )}
        </div>

        {/* ── Join a Room ── */}
        {onJoinOnline && (
          <div style={{
            opacity: menuReady ? 1 : 0, transform: menuReady ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.5s cubic-bezier(.22,1,.36,1) 0.45s, transform 0.5s cubic-bezier(.22,1,.36,1) 0.45s",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>Join a Room</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)); setJoinErr(''); }}
                onKeyDown={e => e.key === 'Enter' && joinCode.length === 4 && onJoinOnline(joinCode)}
                placeholder="Room code (e.g. TEZ7)"
                maxLength={4}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, letterSpacing: 4, outline: "none" }}
              />
              <button
                onClick={() => { if (joinCode.length === 4) onJoinOnline(joinCode); else setJoinErr('Enter a 4-character code.'); }}
                style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: joinCode.length === 4 ? "linear-gradient(135deg,#7C3AED,#5B21B6)" : "rgba(255,255,255,0.07)", color: joinCode.length === 4 ? "white" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 13, cursor: joinCode.length === 4 ? "pointer" : "default", fontFamily: "'Nunito Sans', sans-serif", transition: "background 0.2s, color 0.2s" }}
              >
                Join →
              </button>
            </div>
            {joinErr && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{joinErr}</div>}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 32, fontSize: 11, color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1,
        opacity: menuReady ? 1 : 0, transition: "opacity 0.5s 0.5s",
      }}>
        tez-games.com
      </div>
    </div>
  );

  /* ═══════════════ GAME SCREEN ═══════════════ */
  return (
    <div style={{ background: "#0d0b1e", minHeight: "100vh", padding: "1rem", fontFamily: "'Nunito Sans', sans-serif", boxSizing: "border-box" }}>
      <style>{`
        @keyframes pulseBar { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes winPulse { from { box-shadow: 0 0 0 0 rgba(239,159,39,0.5) } to { box-shadow: 0 0 0 10px rgba(239,159,39,0) } }
        @keyframes starPop { from { transform: scale(0) rotate(-20deg); opacity: 0 } to { transform: scale(1) rotate(0deg); opacity: 1 } }
        @keyframes celebrateIn { from { opacity: 0; transform: scale(0.8) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes timerPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes timerUrgent { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.65; transform: scale(1.08) } }
        .game-btn { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.6); font-size: 12px; padding: 7px 14px; cursor: pointer; font-family: 'Nunito Sans', sans-serif; transition: background 0.2s, border-color 0.2s; }
        .game-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
        @media (max-width: 480px) {
          .c4-board-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .c4-powerup-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          {gameMode !== 'online' ? <button onClick={() => setScreen("menu")} className="game-btn">← Menu</button> : <div style={{ width: 60 }} />}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{mode === "rumble" ? "⚡ Rumble" : "🎯 Normal"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{gameMode === 'online' ? 'Online' : vsAI ? "vs AI" : "Local 2P"}</div>
          </div>
          {gameMode !== 'online' ? <button onClick={() => startGame(mode, vsAI)} className="game-btn">Restart</button> : <div style={{ width: 60 }} />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[1, 2].map(p => {
            const active = turn === p && !result;
            const grad = p === 1 ? P1G : P2G;
            return (
              <div key={p} style={{ background: active ? `linear-gradient(135deg,${grad[0]}22,${grad[1]}11)` : "rgba(255,255,255,0.03)", border: `1px solid ${active ? grad[0] + "44" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "10px 14px", position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
                {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${grad[0]},transparent)`, animation: "pulseBar 2s ease-in-out infinite" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg,${grad[0]},${grad[1]})`, boxShadow: active ? `0 0 10px ${grad[0]}` : "none", transition: "box-shadow 0.3s" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? "white" : "rgba(255,255,255,0.35)", transition: "color 0.3s" }}>{p === 1 ? p1Label : p2Label}</span>
                  {shields[p] && <span style={{ fontSize: 12 }}>🛡️</span>}
                  {fogT[p] > 0.05 && <span style={{ fontSize: 11, color: "#7F77DD" }}>🌫️</span>}
                  {poisonArmed && turn === p && <span style={{ fontSize: 11 }}>⚗️</span>}
                  {hasTimer && !(vsAI && p === 2) && (() => {
                    const t = timers[p];
                    const urgent = t < 10;
                    const warn = t < 30;
                    return (
                      <span style={{
                        marginLeft: 'auto', fontFamily: "'Nunito Sans', sans-serif",
                        fontSize: active ? 14 : 12, fontWeight: 700,
                        color: urgent ? '#ef4444' : warn ? '#f97316' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                        animation: urgent ? 'timerUrgent 0.4s ease-in-out infinite' : warn ? 'timerPulse 1s ease-in-out infinite' : 'none',
                        transition: 'font-size 0.2s, color 0.3s',
                        textShadow: urgent ? '0 0 8px rgba(239,68,68,0.6)' : warn ? '0 0 6px rgba(249,115,22,0.5)' : 'none',
                        minWidth: 34, textAlign: 'right',
                      }}>
                        {formatTime(t)}
                      </span>
                    );
                  })()}
                </div>
                {mode === "rumble" && inventory[p] && (
                  <button disabled={!active || !!pendingAction || dropping} onClick={() => useInventory(p)}
                    style={{ marginTop: 6, width: "100%", padding: "4px 8px", borderRadius: 8, background: `linear-gradient(135deg,${inventory[p].grad[0]},${inventory[p].grad[1]})`, border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: active && !pendingAction && !dropping ? "pointer" : "not-allowed", opacity: active && !pendingAction && !dropping ? 1 : 0.45, fontFamily: "'Nunito Sans', sans-serif" }}>
                    {inventory[p].emoji} {inventory[p].name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {notice && (
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '7px 14px', borderRadius: 8, color: '#f97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.22)', fontFamily: "'Nunito Sans', sans-serif", animation: 'pulseBar 2s ease-in-out infinite' }}>
            {notice}
          </div>
        )}

        {gameMode === 'online' && !result && (
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '7px 14px', borderRadius: 8, color: isMyTurn ? '#4ade80' : 'rgba(255,255,255,0.4)', background: isMyTurn ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isMyTurn ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'Nunito Sans', sans-serif" }}>
            {isMyTurn ? 'Your Turn' : 'Waiting for opponent...'}
          </div>
        )}

        {result && (
          <div style={{ textAlign: "center", padding: "18px 24px", marginBottom: 14, background: result.winner === 1 ? "linear-gradient(135deg,#FF6B6B22,#E24B4A11)" : result.winner === 2 ? "linear-gradient(135deg,#5EB8FF22,#378ADD11)" : "rgba(255,255,255,0.05)", border: `1px solid ${result.winner === 1 ? P1G[0] + "44" : result.winner === 2 ? P2G[0] + "44" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, animation: "celebrateIn 0.4s cubic-bezier(.34,1.56,.64,1) both" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: result.winner === 1 ? P1G[0] : result.winner === 2 ? P2G[0] : "rgba(255,255,255,0.7)", letterSpacing: 0.5 }}>
              {result.winner === 0 ? "Draw!" :
                result.timeout
                  ? (gameMode === 'online'
                      ? (result.winner === localPlayer ? "Opponent ran out of time! ⏰" : "You ran out of time! ⏰")
                      : vsAI
                        ? (result.winner === 2 ? "You ran out of time! ⏰" : "AI ran out of time! ⏰")
                        : `P${result.winner === 1 ? 2 : 1} ran out of time! ⏰`)
                  : result.winner === 1
                    ? (gameMode === 'online' ? (localPlayer === 1 ? "You Win! 🎉" : "Opponent Wins! 🔴") : vsAI ? "You Win! 🎉" : "P1 Wins! 🔴")
                    : (gameMode === 'online' ? (localPlayer === 2 ? "You Win! 🎉" : "Opponent Wins! 🔵") : vsAI ? "AI Wins! 😤" : "P2 Wins! 🔵")}
            </div>
            {gameMode !== 'online' && (
              <button onClick={() => startGame(mode, vsAI)} style={{ marginTop: 12, padding: "9px 28px", borderRadius: 11, background: "linear-gradient(135deg,#7F77DD,#534AB7)", border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", boxShadow: "0 4px 16px rgba(127,119,221,0.3)", transition: "transform 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                Play Again
              </button>
            )}
          </div>
        )}

        {msg && !spinning && !result && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#EF9F27", marginBottom: 10, padding: "7px 14px", background: "rgba(239,159,39,0.08)", border: "1px solid rgba(239,159,39,0.2)", borderRadius: 8 }}>{msg}</div>
        )}

        <div className="c4-board-wrap" style={{ position: "relative" }}>
          <div style={{ background: "#1a1535", borderRadius: 20, padding: PAD, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", position: "relative", overflow: "visible" }}>
            <div style={{ display: "flex", gap: GAP, marginBottom: GAP }}>
              {Array.from({ length: COLS }, (_, c) => {
                const srcBoard = pendingAction?.type === "double" ? pendingAction.board : board;
                const colFull = getLandRow(srcBoard, c, fromTop) < 0;
                const canDrop = !result && !spinning && !dropping && !bombPhase && !flipping && !(vsAI && turn === 2) && isMyTurn && pendingAction?.type !== "snatch" && pendingAction?.type !== "ghost" && !colFull;
                const isBombMode = pendingAction?.type === "bomb";
                const isHov = hoverCol === c && (canDrop || isBombMode);
                const grad = turn === 1 ? P1G : P2G;
                return (
                  <div key={c} style={{ flex: 1, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", cursor: (canDrop || isBombMode) ? "pointer" : "default" }}
                    onMouseEnter={() => setHoverCol(c)} onMouseLeave={() => setHoverCol(null)} onClick={() => handleColClick(c)}>
                    <div style={{ width: CELL - 8, height: CELL - 8, borderRadius: "50%", background: isHov ? (isBombMode ? "linear-gradient(135deg,#D85A30,#993C1D)" : `linear-gradient(135deg,${grad[0]},${grad[1]})`) : "transparent", opacity: isHov ? 0.45 : 0, transition: "opacity 0.15s", boxShadow: isHov ? `0 0 14px ${isBombMode ? "#D85A3088" : grad[0] + "88"}` : "none" }} />
                  </div>
                );
              })}
            </div>

            <div style={{ position: "relative" }}>
              {Array.from({ length: ROWS }, (_, r) => (
                <div key={r} style={{ display: "flex", gap: GAP, marginBottom: r < ROWS - 1 ? GAP : 0 }}>
                  {Array.from({ length: COLS }, (_, c) => {
                    const cell = board[r][c];
                    const key = `${r},${c}`;
                    const isBox = boxes[key] && mode === "rumble";
                    const isPoison = poisonCell?.r === r && poisonCell?.c === c;
                    const isSnatch = pendingAction?.type === "snatch" && cell === (pendingAction.player === 1 ? 2 : 1);
                    const isGhost = pendingAction?.type === "ghost" && cell === null && !isBox;
                    const isFlippingCell = flipping?.r === r && flipping?.c === c;
                    const isDissolving = dissolveCell !== null && dissolveCell.r === r && dissolveCell.c === c;
                    const isWinPiece = winCells.length > 0 && winCells.some(([wr, wc]) => wr === r && wc === c);
                    const shimmer = isPoison ? Math.sin(pulseT * Math.PI * 2.1) * 0.5 + 0.5 : 0;
                    const ft = fogT[turn];
                    let bg = "#12102a", shadow = "inset 0 2px 6px rgba(0,0,0,0.6)";
                    if (isBox) { bg = "linear-gradient(135deg,#EF9F27,#BA7517)"; shadow = "0 0 12px rgba(239,159,39,0.5)"; }
                    else if (isDissolving) { bg = "#12102a"; shadow = "inset 0 2px 6px rgba(0,0,0,0.6)"; }
                    else if (cell !== null && !isPoison) {
                      if (ft > 0 && r > 0) {
                        const p1rgb = [226, 75, 74], p2rgb = [55, 138, 221], grey1 = [75, 72, 95], grey2 = [52, 50, 68];
                        const lerp = (a, b, t) => Math.round(a + (b - a) * t);
                        const src = cell === 1 ? p1rgb : p2rgb;
                        bg = `linear-gradient(135deg,rgb(${lerp(src[0], grey1[0], ft)},${lerp(src[1], grey1[1], ft)},${lerp(src[2], grey1[2], ft)}),rgb(${lerp(src[0], grey2[0], ft)},${lerp(src[1], grey2[1], ft)},${lerp(src[2], grey2[2], ft)}))`;
                        shadow = `inset 0 -3px 6px rgba(0,0,0,${0.3 + ft * 0.15})`;
                      } else { bg = pGrad(cell); shadow = pShadow(cell); }
                    }
                    if (isFlippingCell) { bg = flipAngle > 90 ? pGrad(flipping.player) : pGrad(cell); shadow = pShadow(flipAngle > 90 ? flipping.player : cell); }
                    const hidden = hiddenCells.has(key) && cell !== null;
                    if (isWinPiece) {
                      shadow = `0 0 12px rgba(239,159,39,0.6), 0 0 24px rgba(239,159,39,0.3), ${pShadow(cell)}`;
                    }
                    return (
                      <div key={c}
                        onMouseEnter={() => setHoverCol(c)} onMouseLeave={() => setHoverCol(null)}
                        onClick={() => (isSnatch || isGhost) ? handleCellClick(r, c) : handleColClick(c)}
                        style={{
                          flex: 1, aspectRatio: "1", borderRadius: "50%", position: "relative", overflow: "visible",
                          background: isPoison ? `radial-gradient(circle at 38% 35%,rgba(190,120,255,${0.25 + shimmer * 0.15}) 0%,rgba(80,20,160,0.95) 40%,rgba(15,60,20,0.98) 75%,rgba(30,10,50,1) 100%)` : bg,
                          boxShadow: isPoison ? poisonShadow : shadow,
                          cursor: (isSnatch || isGhost) ? "pointer" : "default",
                          animation: isWinPiece ? "winPulse 0.7s ease-in-out infinite alternate" : undefined,
                          transition: "box-shadow 0.15s",
                          ...(isFlippingCell ? { transform: `scaleX(${Math.max(Math.abs(Math.cos(flipAngle * Math.PI / 180)), 0.02)}) scaleY(${1 + 0.1 * Math.sin(flipAngle * Math.PI / 180)})`, transition: "none" } : {}),
                          ...(hidden ? { opacity: 0 } : {}),
                        }}>
                        {isPoison && <>
                          <div style={{ position: "absolute", inset: 3, borderRadius: "50%", border: `1px solid rgba(160,80,255,${0.3 + shimmer * 0.4})`, pointerEvents: "none" }} />
                          <div style={{ position: "absolute", top: 4, left: 6, width: "35%", height: "28%", borderRadius: "50%", background: `rgba(210,170,255,${0.12 + shimmer * 0.13})`, filter: "blur(2px)", pointerEvents: "none" }} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, filter: `drop-shadow(0 0 ${3 + shimmer * 6}px rgba(140,255,100,0.8)) drop-shadow(0 0 ${2 + shimmer * 4}px rgba(180,80,255,0.9))`, zIndex: 2, pointerEvents: "none" }}>☠️</div>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", borderRadius: "0 0 50% 50%", background: `rgba(20,120,30,${0.18 + shimmer * 0.12})`, pointerEvents: "none" }} />
                        </>}
                        {isBox && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "white", pointerEvents: "none" }}>?</div>}
                        {isDissolving && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: pGrad(dissolveCell.player), boxShadow: pShadow(dissolveCell.player), opacity: dissolveT, transform: `scale(${dissolveT})`, transformOrigin: "center", transition: "none", pointerEvents: "none" }} />}
                        {isWinPiece && (
                          <div style={{ position: "absolute", inset: -4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, zIndex: 15, pointerEvents: "none", animation: "starPop 0.4s cubic-bezier(.34,1.56,.64,1) both", filter: "drop-shadow(0 0 6px rgba(239,159,39,0.8))" }}>⭐</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {!gameOver && animPieces.map(p => (
                <div key={p.id} style={{
                  position: "absolute",
                  left: `calc(${p.col} * ((100% - ${GAP * (COLS - 1)}px) / ${COLS} + ${GAP}px))`,
                  top: `calc(${p.currentY} * ((100% - ${GAP * (ROWS - 1)}px) / ${ROWS} + ${GAP}px))`,
                  width: `calc((100% - ${GAP * (COLS - 1)}px) / ${COLS})`,
                  height: `calc((100% - ${GAP * (ROWS - 1)}px) / ${ROWS})`,
                  borderRadius: "50%", background: pGrad(p.player), boxShadow: pShadow(p.player),
                  pointerEvents: "none", zIndex: 5,
                }} />
              ))}
            </div>
          </div>

          {fogT[turn] > 0.01 && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none", zIndex: 8, background: `linear-gradient(180deg,transparent 14%,rgba(13,11,30,${fogT[turn] * 0.93}) 36%)`, opacity: fogT[turn], transition: "none" }} />
          )}

          <canvas ref={canvasRef} width={boardW} height={boardH + CELL + GAP}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", pointerEvents: "none", zIndex: 20, borderRadius: 20 }} />

          {spinning && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "92%", maxWidth: 380, background: "#16132e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "22px 18px", textAlign: "center", zIndex: 50, boxShadow: "0 30px 80px rgba(0,0,0,0.85)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>Mystery Box</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 16 }}>{spinAnimate ? "Spinning..." : "You got..."}</div>
              <div className="c4-powerup-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: spinResult ? 16 : 0 }}>
                {POWERUPS.map((p, i) => {
                  const active = spinAnimate && spinIdx === i;
                  const landed = !spinAnimate && spinResult?.id === p.id;
                  return (
                    <div key={p.id} style={{
                      padding: "9px 4px", borderRadius: 11,
                      background: landed ? `linear-gradient(135deg,${p.grad[0]},${p.grad[1]})` : active ? `linear-gradient(135deg,${p.grad[0]}88,${p.grad[1]}66)` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active || landed ? p.grad[0] + "99" : "rgba(255,255,255,0.06)"}`,
                      transform: active || landed ? "scale(1.07)" : "scale(1)", transition: "transform 0.07s,background 0.07s",
                      boxShadow: landed ? `0 0 22px ${p.grad[0]}66` : "none", textAlign: "center"
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{p.emoji}</div>
                      <div style={{ fontSize: 9, color: active || landed ? "white" : "rgba(255,255,255,0.25)", lineHeight: 1.3 }}>{p.name}</div>
                    </div>
                  );
                })}
              </div>
              {spinResult && !spinAnimate && (
                <>
                  <div style={{ background: `linear-gradient(135deg,${spinResult.grad[0]},${spinResult.grad[1]})`, borderRadius: 13, padding: "14px", marginBottom: 12, boxShadow: `0 6px 28px ${spinResult.grad[0]}44` }}>
                    <div style={{ fontSize: 30, marginBottom: 5 }}>{spinResult.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "white" }}>{spinResult.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4, lineHeight: 1.5 }}>{spinResult.desc}</div>
                    <div style={{ display: "inline-block", marginTop: 7, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 9px", borderRadius: 20, background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.65)" }}>{spinResult.rarity}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleSpinChoice(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: `linear-gradient(135deg,${spinResult.grad[0]},${spinResult.grad[1]})`, color: "white", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>Use Now</button>
                    <button onClick={() => handleSpinChoice(false)} disabled={!!inventory[spinFor?.afterBoard?.player]} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: inventory[spinFor?.afterBoard?.player] ? 0.4 : 1, fontFamily: "'Nunito Sans', sans-serif" }}>Save</button>
                  </div>
                  {inventory[spinFor?.afterBoard?.player] && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Inventory full — use saved item first</div>}
                </>
              )}
            </div>
          )}

          {confirmPU && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "85%", maxWidth: 320, background: "#16132e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "28px 22px", textAlign: "center", zIndex: 50, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg,${confirmPU.pu.grad[0]},${confirmPU.pu.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px", boxShadow: `0 6px 24px ${confirmPU.pu.grad[0]}55` }}>{confirmPU.pu.emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 6 }}>{confirmPU.pu.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 20 }}>{PU_DESC[confirmPU.pu.id]}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 18 }}>Use this power-up now?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmPU(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>Cancel</button>
                <button onClick={confirmUse} style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: `linear-gradient(135deg,${confirmPU.pu.grad[0]},${confirmPU.pu.grad[1]})`, color: "white", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>Use It!</button>
              </div>
            </div>
          )}
        </div>

        {mode === "rumble" && !result && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Saved Power-up</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[1, 2].map(p => {
                const pu = inventory[p];
                const canUse = turn === p && !result && !spinning && !dropping && !pendingAction && pu && isMyTurn;
                return (
                  <div key={p}>
                    <div style={{ fontSize: 10, color: `rgba(${p === 1 ? "226,75,74" : "55,138,221"},0.6)`, marginBottom: 5, fontWeight: 600 }}>{p === 1 ? p1Label : p2Label}</div>
                    {pu ? (
                      <button onClick={() => canUse && useInventory(p)}
                        style={{ width: "100%", background: `linear-gradient(135deg,${pu.grad[0]}22,${pu.grad[1]}11)`, border: `1px solid ${pu.grad[0]}${canUse ? "88" : "33"}`, borderRadius: 14, padding: "10px 12px", cursor: canUse ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 10, opacity: canUse ? 1 : 0.5, transition: "all 0.2s", fontFamily: "'Nunito Sans', sans-serif" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${pu.grad[0]},${pu.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: `0 4px 12px ${pu.grad[0]}44` }}>{pu.emoji}</div>
                        <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 1 }}>{pu.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{PU_DESC[pu.id]}</div>
                        </div>
                        {canUse && <div style={{ fontSize: 10, color: pu.grad[0], fontWeight: 600, flexShrink: 0 }}>Tap →</div>}
                      </button>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No power-up saved</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode === "rumble" && !result && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {POWERUPS.map(p => (
              <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "7px 5px", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{p.emoji}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.3, marginTop: 2 }}>{p.name}</div>
                <div style={{ fontSize: 9, marginTop: 2, color: p.rarity === "legendary" ? "#E24B4A" : p.rarity === "rare" ? "#EF9F27" : "#1D9E75", fontWeight: 700, textTransform: "uppercase" }}>{p.rarity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
