"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { reportGameResult } from "../../lib/reportGameResult";

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RED_SUITS = ["♥","♦"];

function cardVal(r) {
  if (["J","Q","K"].includes(r)) return 10;
  if (r === "A") return 11;
  return parseInt(r);
}
function buildDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ rank:r, suit:s, id: Math.random() });
  return d.sort(() => Math.random() - 0.5);
}
function getTotal(hand) {
  let t = hand.reduce((s,c) => s + cardVal(c.rank), 0);
  let aces = hand.filter(c => c.rank === "A").length;
  while (t > 21 && aces-- > 0) t -= 10;
  return t;
}
const BONUS_TIERS = [
  { cards:7, label:"7-Card 21 🔥", mult:3.0 },
  { cards:6, label:"6-Card 21 ⚡", mult:2.0 },
  { cards:5, label:"5-Card 21 ✨", mult:1.5 },
];
function get21Bonus(hand) {
  if (getTotal(hand) !== 21 || hand.length < 5) return null;
  return BONUS_TIERS.find(t => hand.length >= t.cards) || null;
}
function getHintFor(player, dealerUp) {
  const t = getTotal(player), d = cardVal(dealerUp.rank), canDbl = player.length === 2;
  const pair = player.length === 2 && player[0].rank === player[1].rank;
  if (pair) {
    const r = player[0].rank;
    if (r==="A"||r==="8") return {action:"Split",why:"Always split Aces and 8s."};
    if (["10","J","Q","K"].includes(r)) return {action:"Stand",why:"Never split 10s — 20 is a great hand."};
    if (r==="9") return (d===7||d>=10)?{action:"Stand",why:"Stand on 18 vs dealer 7/10/A."}:{action:"Split",why:"Split 9s vs dealer weak cards."};
    if (r==="7") return d<=7?{action:"Split",why:"Split 7s vs dealer 2–7."}:{action:"Hit",why:"Hit 7s vs strong dealer."};
    if (r==="6") return d<=6?{action:"Split",why:"Split 6s vs dealer bust cards."}:{action:"Hit",why:"Hit 6s vs strong dealer."};
    if (r==="5") return (canDbl&&d<=9)?{action:"Double",why:"Treat 5s as 10 — double vs 2–9."}:{action:"Hit",why:"Never split 5s."};
    if (r==="4") return (d===5||d===6)?{action:"Split",why:"Split 4s only vs dealer 5 or 6."}:{action:"Hit",why:"Hit 4s vs anything else."};
    return d<=7?{action:"Split",why:"Split low pairs vs dealer 2–7."}:{action:"Hit",why:"Hit small pairs vs strong dealer."};
  }
  if (t>=17) return {action:"Stand",why:"Hard 17+ — always stand."};
  if (t>=13) return {action:d<=6?"Stand":"Hit",why:d<=6?"Dealer bust card — let them bust.":"Hit vs strong dealer."};
  if (t===12) return {action:(d>=4&&d<=6)?"Stand":"Hit",why:(d>=4&&d<=6)?"Dealer bust zone — stand.":"Hit 12 vs strong dealer."};
  if (t===11) return {action:canDbl?"Double":"Hit",why:"11 is the best doubling hand."};
  if (t===10) return {action:(canDbl&&d<=9)?"Double":"Hit",why:(canDbl&&d<=9)?"Double 10 vs dealer 2–9.":"Hit vs strong dealer."};
  if (t===9) return {action:(canDbl&&d>=3&&d<=6)?"Double":"Hit",why:(canDbl&&d>=3&&d<=6)?"Double 9 vs dealer 3–6.":"Hit 9 elsewhere."};
  return {action:"Hit",why:"Total too low — take a card."};
}

const CHIPS = [
  {val:5,bg:"#ef4444"},{val:10,bg:"#3b82f6"},{val:25,bg:"#22c55e"},
  {val:50,bg:"#a855f7"},{val:100,bg:"#eab308",color:"#000"},{val:500,bg:"#dc2626"},
];

// ── SOUND ENGINE ─────────────────────────────────────────────
const SOUND_FILES = {
  chip:      "/sounds/chip.mp3",
  deal:      "/sounds/deal.mp3",
  flip:      "/sounds/flip.mp3",
  win:       "/sounds/win.mp3",
  blackjack: "/sounds/blackjack.mp3",
  lose:      "/sounds/lose.mp3",
  bust:      "/sounds/bust.mp3",
  push:      "/sounds/push.mp3",
  clear:     "/sounds/clear.mp3",
};

function createSoundEngine() {
  let muted = false;
  const cache = {};

  function load(key) {
    if (typeof window === "undefined") return null;
    if (!cache[key]) {
      const audio = new Audio(SOUND_FILES[key]);
      audio.preload = "auto";
      cache[key] = audio;
    }
    return cache[key];
  }

  function play(key) {
    if (muted || typeof window === "undefined") return;
    try {
      const audio = load(key);
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch(e) {}
  }

  return {
    setMuted(val) { muted = val; },
    getMuted()    { return muted; },
    chip()      { play("chip"); },
    deal()      { play("deal"); },
    flip()      { play("flip"); },
    win()       { play("win"); },
    blackjack() { play("blackjack"); },
    lose()      { play("lose"); },
    bust()      { play("bust"); },
    push()      { play("push"); },
    clear()     { play("clear"); },
  };
}

const SFX = createSoundEngine();

// ── CARD COMPONENT ───────────────────────────────────────────
function Card({ card, hidden, small, delay=0, animKey }) {
  const [entered, setEntered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const prevHidden = useRef(hidden);
  const w = small ? 42 : 58, h = small ? 62 : 88;

  useEffect(() => {
    setEntered(false);
    setFlipped(false);
    const t = setTimeout(() => setEntered(true), delay);
    return () => clearTimeout(t);
  }, [animKey]);

  useEffect(() => {
    if (prevHidden.current === true && hidden === false) {
      setTimeout(() => { setFlipped(true); SFX.flip(); }, 80);
    }
    prevHidden.current = hidden;
  }, [hidden]);

  const red = !hidden && card && RED_SUITS.includes(card.suit);
  const showBack = (hidden && !flipped) || (!hidden && !entered);

  return (
    <div style={{
      width:w, height:h, perspective:800, flexShrink:0,
      transform: entered ? "translateY(0) scale(1) rotate(0deg)" : "translateY(-70px) scale(0.7) rotate(-8deg)",
      opacity: entered ? 1 : 0,
      transition: "transform 0.42s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease",
    }}>
      <div style={{
        width:"100%", height:"100%", position:"relative",
        transformStyle:"preserve-3d",
        transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: flipped ? "transform 0.5s cubic-bezier(0.455,0.03,0.515,0.955)" : "none",
      }}>
        <div style={{
          position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
          borderRadius:8, background:"#fff", border:"1.5px solid #ddd",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          boxShadow:"0 6px 20px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3)",
        }}>
          <div style={{fontSize:small?13:18,fontWeight:800,lineHeight:1,color:red?"#dc2626":"#111",fontFamily:"Georgia,serif"}}>{card?.rank}</div>
          <div style={{fontSize:small?17:24,lineHeight:1.1,color:red?"#dc2626":"#111"}}>{card?.suit}</div>
        </div>
        <div style={{
          position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
          transform:"rotateY(180deg)", borderRadius:8, background:"#1a237e",
          border:"1.5px solid #3949ab", boxShadow:"0 6px 20px rgba(0,0,0,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
        }}>
          <div style={{
            width:"80%", height:"80%", border:"2px solid rgba(255,255,255,0.2)", borderRadius:4,
            background:"repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px)"
          }}/>
        </div>
      </div>
    </div>
  );
}

function Particles({ active, win }) {
  const [pts, setPts] = useState([]);
  useEffect(() => {
    if (!active) return;
    setPts(Array.from({length:28},(_,i) => ({
      id:i, x:48+Math.random()*4, y:50+Math.random()*4,
      vx:(Math.random()-0.5)*180, vy:-(60+Math.random()*140),
      color: win ? ["#4ade80","#86efac","#fde047","#fff","#fbbf24"][i%5] : ["#f87171","#fca5a5","#fff","#fcd34d"][i%4],
      size:4+Math.random()*7, rot:Math.random()*360,
    })));
    const t = setTimeout(() => setPts([]), 900);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:Math.random()>0.5?"50%":"2px",
          background:p.color,
          animation:"ptcl 0.85s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
          "--vx":`${p.vx}px`, "--vy":`${p.vy}px`, "--rot":`${p.rot}deg`,
        }}/>
      ))}
      <style>{`@keyframes ptcl{0%{opacity:1;transform:translate(0,0) rotate(0deg)}100%{opacity:0;transform:translate(var(--vx),calc(var(--vy)*-1 + 120px)) rotate(var(--rot))}}`}</style>
    </div>
  );
}

function BalanceCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const delta = value - prev.current;
    setFlash(delta > 0 ? "win" : "lose");
    const start = prev.current, end = value, dur = 600, startTime = Date.now();
    const tick = () => {
      const p = Math.min(1,(Date.now()-startTime)/dur);
      const ease = 1-Math.pow(1-p,3);
      setDisplay(Math.round(start + (end-start)*ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
    setTimeout(() => setFlash(null), 700);
  }, [value]);
  return (
    <span style={{
      fontWeight:700, fontSize:18,
      color: flash==="win"?"#4ade80":flash==="lose"?"#f87171":"white",
      transition:"color 0.3s",
      textShadow: flash==="win"?"0 0 12px rgba(74,222,128,0.8)":flash==="lose"?"0 0 12px rgba(248,113,113,0.8)":"none",
    }}>${display}</span>
  );
}

function BetCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const [glow, setGlow] = useState(false);
  const prev = useRef(value);
  const raf = useRef(null);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current, end = value, dur = 500, t0 = Date.now();
    setGlow(true);
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const p = Math.min(1,(Date.now()-t0)/dur);
      const ease = 1-Math.pow(1-p,3);
      setDisplay(Math.round(start + (end-start)*ease));
      if (p < 1) { raf.current = requestAnimationFrame(tick); }
      else { setTimeout(() => setGlow(false), 400); }
    };
    raf.current = requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return (
    <span style={{
      fontWeight:700, fontSize:18, color:"#fde047",
      textShadow: glow ? "0 0 14px rgba(253,224,71,0.95)" : "none",
      transition:"text-shadow 0.3s",
      fontVariantNumeric:"tabular-nums",
    }}>${display}</span>
  );
}

function ResultBadge({ result, delay=0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, []);
  const map = {
    blackjack:{label:"Blackjack! 🎉",color:"#fbbf24"},
    win:{label:"Win ✅",color:"#4ade80"},
    bust:{label:"Bust 💥",color:"#f87171"},
    lose:{label:"Dealer Wins",color:"#f87171"},
    push:{label:"Push 🤝",color:"#fde047"},
    bonus:{label:result?.label,color:"#a78bfa"},
  };
  const m = result?.type === "bonus" ? map.bonus : (map[result?.type] || map.win);
  return (
    <div style={{
      textAlign:"center", background:"rgba(0,0,0,0.45)", borderRadius:12,
      padding:"10px 20px", border:`1.5px solid ${m.color}`,
      transform: vis ? "scale(1) translateY(0)" : "scale(0.4) translateY(20px)",
      opacity: vis ? 1 : 0,
      transition:"transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease",
      boxShadow: vis ? `0 0 20px ${m.color}44` : "none",
    }}>
      <div style={{fontSize:20,fontWeight:800,color:m.color}}>{m.label}</div>
      {result?.note && <div style={{fontSize:11,color:"#a78bfa"}}>{result.note}</div>}
      <div style={{color:"#d1d5db",fontSize:13,marginTop:2}}>
        {result?.delta>0?`+$${result.delta}`:result?.delta===0?"Push":`-$${Math.abs(result?.delta)}`}
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function BlackjackGame() {
  const [deck,setDeck]             = useState(()=>buildDeck());
  const [phase,setPhase]           = useState("bet");
  const [hands,setHands]           = useState([[]]);
  const [activeIdx,setActiveIdx]   = useState(0);
  const [dealer,setDealer]         = useState([]);
  const [bet,setBet]               = useState(0);
  const [splitBets,setSplitBets]   = useState([0]);
  const [balance,setBalance]       = useState(500);
  const [results,setResults]       = useState([]);
  const [learnMode,setLearnMode]   = useState(true);
  const [hint,setHint]             = useState(null);
  const [insPhase,setInsPhase]     = useState(false);
  const [insBet,setInsBet]         = useState(0);
  const [insResult,setInsResult]   = useState(null);
  const [dealerRevealed,setDealerRevealed] = useState(false);
  const [dealKey,setDealKey]       = useState(0);
  const [burst,setBurst]           = useState(null);
  const [chipAnim,setChipAnim]     = useState(false);
  const reportedRef = useRef(false);

  // Report result to TEZ Points system whenever a hand resolves
  useEffect(() => {
    if (phase !== "result" || results.length === 0) { reportedRef.current = false; return; }
    if (reportedRef.current) return;
    reportedRef.current = true;
    const hasBJ  = results.some(r => r.type === "blackjack");
    const hasWin = results.some(r => r.delta > 0);
    const allPush = results.every(r => r.delta === 0);
    const apiResult = hasWin ? 'win' : allPush ? 'push' : 'lose';
    const totalDelta = results.reduce((s, r) => s + r.delta, 0);
    reportGameResult('blackjack', apiResult, {
      isBlackjack: hasBJ,
      payout: totalDelta,
      handsPlayed: results.length,
    });
  }, [phase, results]);
  const [muted,setMuted]           = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    SFX.setMuted(next);
  };

  const addChip = (v) => {
    if (phase!=="bet") return;
    if (balance-bet >= v) {
      setBet(b=>b+v);
      setChipAnim(true);
      setTimeout(()=>setChipAnim(false),200);
      SFX.chip();
    }
  };
  const maxBet = () => {
    if (phase!=="bet") return;
    setBet(balance);
    SFX.chip();
  };
  const clearBetFn = () => {
    if (phase!=="bet") return;
    setBet(0);
    SFX.clear();
  };

  const deal = () => {
    if (bet===0) return;
    const d = deck.length<20?buildDeck():[...deck];
    const p=[d.pop(),d.pop()], dl=[d.pop(),d.pop()];
    setDeck(d); setHands([p]); setSplitBets([bet]); setDealer(dl);
    setResults([]); setHint(null); setActiveIdx(0);
    setInsBet(0); setInsResult(null); setDealerRevealed(false);
    setDealKey(k=>k+1);
    [0,1,2,3].forEach(i => setTimeout(() => SFX.deal(), i*160+80));
    if (dl[0].rank==="A") { setInsPhase(true); setPhase("insurance"); }
    else setPhase("play");
  };

  const takeIns = () => { const ib=Math.floor(bet/2); setInsBet(ib); setBalance(b=>b-ib); setInsPhase(false); setPhase("play"); SFX.chip(); };
  const declineIns = () => { setInsPhase(false); setPhase("play"); };

  const resolveHands = (allHands,allBets,dl,dk) => {
    const dh=[...dl], ddk=[...dk];
    while (getTotal(dh)<17) dh.push(ddk.pop());
    const dt=getTotal(dh), dealerBJ=dh.length===2&&dt===21;
    let insDelta=0, insRes=null;
    if (insBet>0) { insRes=dealerBJ?"win":"lose"; insDelta=dealerBJ?insBet*2:0; }
    setInsResult(insRes); setDealerRevealed(true);
    const res = allHands.map((h,i) => {
      const pt=getTotal(h), playerBJ=h.length===2&&pt===21;
      const bonus=get21Bonus(h);
      if (playerBJ&&dealerBJ) return {type:"push",label:"Push 🤝",delta:0,note:"Both Blackjack"};
      if (playerBJ) return {type:"blackjack",delta:Math.floor(allBets[i]*1.5),note:"Pays 3:2"};
      if (pt>21) return {type:"bust",delta:-allBets[i],note:""};
      if (dealerBJ) return {type:"lose",label:"Dealer BJ",delta:-allBets[i],note:""};
      if (dt>21||pt>dt) {
        if (bonus) { const bp=Math.floor(allBets[i]*bonus.mult); return {type:"bonus",label:bonus.label,delta:allBets[i]+bp,note:`+${Math.round((bonus.mult-1)*100)}% bonus!`}; }
        return {type:"win",delta:allBets[i],note:""};
      }
      if (pt===dt) return {type:"push",delta:0,note:""};
      return {type:"lose",delta:-allBets[i],note:""};
    });
    const totalDelta=res.reduce((s,r)=>s+r.delta,0)+insDelta;
    setDealer(dh); setDeck(ddk); setHands(allHands); setResults(res);
    setBalance(b=>b+totalDelta); setSplitBets(allBets); setPhase("result");
    const anyWin=res.some(r=>r.delta>0);
    setBurst(anyWin?"win":"lose");
    setTimeout(()=>setBurst(null),950);
    setTimeout(() => {
      const hasBJ = res.some(r=>r.type==="blackjack");
      const hasBust = res.some(r=>r.type==="bust");
      const hasPush = res.every(r=>r.type==="push");
      const hasLose = res.some(r=>r.type==="lose"||r.type==="bust");
      if (hasBJ) SFX.blackjack();
      else if (anyWin) SFX.win();
      else if (hasBust) SFX.bust();
      else if (hasPush) SFX.push();
      else if (hasLose) SFX.lose();
    }, 600);
  };

  const advanceOrResolve = (nh,nb,nd,idx) => {
    const next=idx+1;
    if (next<nh.length) { setHands(nh); setSplitBets(nb); setDeck(nd); setActiveIdx(next); setHint(null); }
    else resolveHands(nh,nb,dealer,nd);
  };

  const hit = () => {
    const d=[...deck];
    const h=hands.map((hand,i)=>i===activeIdx?[...hand,d.pop()]:hand);
    setHint(null);
    SFX.deal();
    if (getTotal(h[activeIdx])>=21) advanceOrResolve(h,splitBets,d,activeIdx);
    else { setHands(h); setDeck(d); }
  };
  const stand = () => advanceOrResolve(hands,splitBets,deck,activeIdx);
  const dbl = () => {
    const d=[...deck];
    const h=hands.map((hand,i)=>i===activeIdx?[...hand,d.pop()]:hand);
    const nb=splitBets.map((b,i)=>i===activeIdx?b*2:b);
    setBalance(b=>b-splitBets[activeIdx]);
    SFX.deal();
    advanceOrResolve(h,nb,d,activeIdx);
  };
  const split = () => {
    if (balance<bet) return;
    const d=[...deck], cur=hands[activeIdx];
    const h1=[cur[0],d.pop()], h2=[cur[1],d.pop()];
    const nh=[...hands.slice(0,activeIdx),h1,h2,...hands.slice(activeIdx+1)];
    const nb=[...splitBets.slice(0,activeIdx),bet,bet,...splitBets.slice(activeIdx+1)];
    setBalance(b=>b-bet); setHands(nh); setSplitBets(nb); setDeck(d); setHint(null);
    SFX.deal();
  };
  const next = () => {
    if (balance<=0) setBalance(500);
    setBet(0); setHands([[]]); setSplitBets([0]); setDealer([]); setResults([]); setHint(null);
    setActiveIdx(0); setInsBet(0); setInsResult(null); setDealerRevealed(false); setPhase("bet");
    SFX.clear();
  };

  const canSplit = () => { const h=hands[activeIdx]; return h.length===2&&h[0].rank===h[1].rank&&balance>=bet&&hands.length<4; };
  const canDouble = () => hands[activeIdx].length===2&&balance>=splitBets[activeIdx];
  const totalBet = splitBets.reduce((s,b)=>s+b,0);

  const btn = (bg,fg="#fff",dis=false) => ({
    padding:"11px 22px", borderRadius:10, border:"none",
    background:dis?"#374151":bg, color:dis?"#6b7280":fg,
    fontWeight:700, fontSize:15, cursor:dis?"not-allowed":"pointer",
    transition:"transform 0.12s ease, filter 0.15s ease, box-shadow 0.15s ease",
    boxShadow: dis?"none":`0 4px 14px ${bg}55`,
  });

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#1a4731 0%,#0d2b1e 60%,#071a12 100%)",color:"white",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{`
        .abtn:hover{filter:brightness(1.18)!important;transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(0,0,0,0.4)!important}
        .abtn:active{transform:scale(0.95)!important}
        .chip:hover{transform:scale(1.18) translateY(-4px)!important;filter:brightness(1.15)}
        .chip:active{transform:scale(0.9)!important}
        @keyframes ins-in{from{opacity:0;transform:scale(0.9) translateY(-10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes hint-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 8px rgba(253,224,71,0.4)}50%{box-shadow:0 0 22px rgba(253,224,71,0.9),0 0 40px rgba(253,224,71,0.3)}}
      `}</style>

      <Particles active={burst!==null} win={burst==="win"} />

      {/* Mute button */}
      <button
        onClick={toggleMute}
        style={{
          position:"fixed", bottom:16, right:16, zIndex:8000,
          width:40, height:40, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)",
          background:"rgba(0,0,0,0.55)", color:"white", fontSize:18,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(4px)", transition:"all 0.2s",
        }}
        title={muted?"Unmute":"Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px",background:"rgba(0,0,0,0.4)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22,fontWeight:800,letterSpacing:3,background:"linear-gradient(135deg,#fde047,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TEZ</span>
          <span style={{fontSize:22,fontWeight:300,letterSpacing:3,color:"rgba(255,255,255,0.9)"}}>BLACKJACK</span>
        </div>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:"#86efac",letterSpacing:1,textTransform:"uppercase"}}>Balance</div>
            <BalanceCounter value={balance} />
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:"#86efac",letterSpacing:1,textTransform:"uppercase"}}>Bet</div>
            <BetCounter value={phase==="bet"?bet:totalBet} />
          </div>
          <button className="abtn" onClick={()=>setLearnMode(l=>!l)} style={{...btn(learnMode?"#d97706":"#374151",learnMode?"#000":"#9ca3af"),border:"none",fontSize:12,padding:"7px 13px"}}>
            📚 {learnMode?"ON":"OFF"}
          </button>
        </div>
      </div>

      <div style={{maxWidth:580,margin:"0 auto",padding:"22px 16px",display:"flex",flexDirection:"column",gap:16,width:"100%"}}>

        {/* Dealer */}
        <div>
          <div style={{textAlign:"center",fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"rgba(134,239,172,0.7)",marginBottom:8}}>
            Dealer {phase==="result"?`— ${getTotal(dealer)}`:""}
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:10,minHeight:90,alignItems:"center"}}>
            {dealer.map((c,i)=>(
              <Card key={`d-${dealKey}-${i}`} card={c}
                hidden={!dealerRevealed&&(phase==="play"||phase==="insurance")&&i===1}
                delay={i*160} animKey={`d-${dealKey}-${i}`} />
            ))}
          </div>
        </div>

        {/* Insurance */}
        {phase==="insurance"&&(
          <div style={{background:"rgba(0,0,0,0.6)",border:"1.5px solid #fbbf24",borderRadius:14,padding:18,textAlign:"center",animation:"ins-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275)",boxShadow:"0 0 30px rgba(251,191,36,0.2)"}}>
            <div style={{fontSize:19,fontWeight:700,color:"#fbbf24",marginBottom:6}}>🛡️ Insurance?</div>
            <div style={{fontSize:13,color:"#d1d5db",marginBottom:14}}>
              Dealer shows Ace. Buy insurance for <strong style={{color:"#fde047"}}>${Math.floor(bet/2)}</strong> — pays 2:1 if dealer has Blackjack.
              {learnMode&&<div style={{color:"#86efac",marginTop:6,fontSize:12}}>💡 Basic strategy: Always decline — house edge is high.</div>}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10}}>
              <button className="abtn" onClick={takeIns} style={btn("#7c3aed")}>Take Insurance</button>
              <button className="abtn" onClick={declineIns} style={btn("#374151")}>Decline</button>
            </div>
          </div>
        )}

        {/* Insurance result */}
        {phase==="result"&&insResult&&(
          <div style={{textAlign:"center"}}>
            <div style={{display:"inline-block",padding:"6px 16px",borderRadius:8,
              background:insResult==="win"?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)",
              border:`1px solid ${insResult==="win"?"#4ade80":"#f87171"}`,
              animation:"ins-in 0.3s ease"}}>
              <span style={{color:insResult==="win"?"#4ade80":"#f87171",fontWeight:700,fontSize:14}}>
                {insResult==="win"?`🛡️ Insurance Win +$${insBet*2}`:`🛡️ Insurance Lost -$${insBet}`}
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {phase==="result"&&results.length>0&&(
          <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
            {results.map((r,i)=>(<ResultBadge key={i} result={r} delay={i*120} />))}
          </div>
        )}

        {/* Hint */}
        {learnMode&&phase==="play"&&hands[activeIdx]?.length>0&&(
          <div style={{animation:"hint-in 0.25s ease"}}>
            {!hint
              ?<button className="abtn" onClick={()=>setHint(getHintFor(hands[activeIdx],dealer[0]))} style={{width:"100%",padding:10,borderRadius:10,background:"rgba(234,179,8,0.1)",border:"1px solid rgba(253,224,71,0.5)",color:"#fde047",fontWeight:700,cursor:"pointer",fontSize:14}}>
                💡 Basic Strategy Hint
              </button>
              :<div style={{background:"rgba(0,0,0,0.45)",border:"1px solid rgba(253,224,71,0.6)",borderRadius:10,padding:14,animation:"hint-in 0.25s ease",boxShadow:"0 0 16px rgba(253,224,71,0.1)"}}>
                <div style={{color:"#fde047",fontWeight:700,fontSize:17}}>→ {hint.action}</div>
                <div style={{color:"#d1d5db",fontSize:13,marginTop:4}}>{hint.why}</div>
              </div>
            }
          </div>
        )}

        {/* Player hands */}
        <div>
          <div style={{textAlign:"center",fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"rgba(134,239,172,0.7)",marginBottom:8}}>
            {hands.length>1?`Hand ${activeIdx+1} of ${hands.length}`:"You"}
            {phase!=="bet"&&hands[activeIdx]?.length>0?` — ${getTotal(hands[activeIdx])}`:""}
          </div>
          {hands.length>1?(
            <div style={{display:"flex",justifyContent:"center",gap:18,flexWrap:"wrap"}}>
              {hands.map((h,i)=>{
                const active=i===activeIdx&&phase==="play";
                return (
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",transform:active?"scale(1.06)":"scale(1)"}}>
                    <div style={{fontSize:10,color:active?"#fde047":"#86efac",textTransform:"uppercase",letterSpacing:1,transition:"color 0.3s"}}>
                      {active?"▶ ":""}Hand {i+1} ({getTotal(h)})
                    </div>
                    <div style={{display:"flex",gap:5,padding:8,borderRadius:10,border:active?"1.5px solid #fde047":"1.5px solid transparent",background:"rgba(0,0,0,0.25)",transition:"border-color 0.3s, box-shadow 0.3s",animation:active?"pulse-glow 2s ease-in-out infinite":"none"}}>
                      {h.map((c,j)=><Card key={`s${i}-${j}-${dealKey}`} card={c} small delay={j*120} animKey={`s${i}-${j}-${dealKey}`} />)}
                    </div>
                    <div style={{fontSize:11,color:"#fde047"}}>${splitBets[i]}</div>
                  </div>
                );
              })}
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"center",gap:10,minHeight:90,alignItems:"center"}}>
              {hands[0]?.map((c,i)=>(
                <Card key={`p-${dealKey}-${i}`} card={c} delay={i*160+80} animKey={`p-${dealKey}-${i}`} />
              ))}
            </div>
          )}
        </div>

        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)"}}/>

        {/* Bet phase */}
        {phase==="bet"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{textAlign:"center",fontSize:11,color:"rgba(134,239,172,0.7)",letterSpacing:2,textTransform:"uppercase"}}>Place your bet</div>
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
              {CHIPS.map(({val,bg,color})=>(
                <button key={val} className="chip" onClick={()=>addChip(val)} style={{
                  width:56,height:56,borderRadius:"50%",background:bg,color:color||"white",
                  fontWeight:800,fontSize:13,cursor:"pointer",
                  border:"3px solid rgba(255,255,255,0.25)",
                  boxShadow:`0 5px 15px ${bg}77, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  transition:"transform 0.15s ease, filter 0.15s ease",
                }}>
                  ${val}
                </button>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10}}>
              <button className="abtn" onClick={clearBetFn} style={btn("#374151")}>Clear</button>
              <button className="abtn" onClick={maxBet} style={btn("#059669")}>Max Bet</button>
              <button className="abtn" onClick={deal} disabled={bet===0} style={btn("#d97706","#000",bet===0)}>Deal</button>
            </div>
          </div>
        )}

        {/* Play phase */}
        {phase==="play"&&(
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            <button className="abtn" onClick={hit}   style={btn("#15803d")}>Hit</button>
            <button className="abtn" onClick={stand} style={btn("#b91c1c")}>Stand</button>
            {canDouble()&&<button className="abtn" onClick={dbl}   style={btn("#1d4ed8")}>Double</button>}
            {canSplit() &&<button className="abtn" onClick={split} style={btn("#7c3aed")}>Split</button>}
          </div>
        )}

        {/* Result phase */}
        {phase==="result"&&(
          <div style={{display:"flex",justifyContent:"center",marginTop:4}}>
            <button className="abtn" onClick={next} style={btn("#d97706","#000")}>Next Hand →</button>
          </div>
        )}

        {/* Rules */}
        {learnMode&&phase==="bet"&&(
          <div style={{background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:14,fontSize:13,color:"#9ca3af"}}>
            <div style={{color:"#86efac",fontWeight:700,marginBottom:8,fontSize:14}}>📖 Quick Rules</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 16px",marginBottom:12}}>
              <div>🎯 Beat dealer without busting</div>
              <div>🃏 Blackjack pays 3:2</div>
              <div>👑 J, Q, K = 10 points</div>
              <div>🅰️ Ace = 1 or 11</div>
              <div>🔀 Split matching pairs (up to 4)</div>
              <div>🛡️ Insurance on dealer Ace</div>
            </div>
            <div style={{color:"#a78bfa",fontWeight:700,marginBottom:8,fontSize:13}}>✨ 21 Bonus Payouts</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {BONUS_TIERS.map(t=>(
                <div key={t.cards} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(124,58,237,0.5)",borderRadius:8,padding:"5px 10px",fontSize:12,textAlign:"center"}}>
                  <div style={{color:"#a78bfa",fontWeight:700}}>{t.label}</div>
                  <div style={{color:"#9ca3af"}}>+{Math.round((t.mult-1)*100)}% bonus</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
