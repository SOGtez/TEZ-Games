import { useState, useRef, useCallback, useEffect } from "react";

var SUITS = ["♠", "♥", "♦", "♣"];
var SUIT_COLORS = { "♠": "#1a1a2e", "♣": "#1a1a2e", "♥": "#dc2626", "♦": "#dc2626" };
var RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
var RANK_VALUES = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14 };

function createDeck() {
  var deck = [];
  for (var s = 0; s < SUITS.length; s++) {
    for (var r = 0; r < RANKS.length; r++) {
      deck.push({ rank: RANKS[r], suit: SUITS[s], id: RANKS[r] + SUITS[s] + "_" + Math.random().toString(36).slice(2,6) });
    }
  }
  return deck;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function ParticleBurst({ color, count, trigger }) {
  var [particles, setParticles] = useState([]);
  useEffect(function() {
    if (!trigger) return;
    var p = [];
    for (var i = 0; i < (count || 12); i++) {
      var angle = (Math.PI * 2 * i) / (count || 12) + (Math.random() - 0.5) * 0.5;
      var dist = 60 + Math.random() * 80;
      p.push({ id: i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + Math.random() * 5, delay: Math.random() * 0.15, duration: 0.5 + Math.random() * 0.3 });
    }
    setParticles(p);
    var timer = setTimeout(function() { setParticles([]); }, 1200);
    return function() { clearTimeout(timer); };
  }, [trigger]);
  if (particles.length === 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
      {particles.map(function(p) {
        return (<div key={p.id} style={{
          position: "absolute", left: "50%", top: "50%",
          width: p.size, height: p.size, borderRadius: "50%", background: color,
          animation: "particleFly " + p.duration + "s ease-out " + p.delay + "s forwards",
          "--px": p.x + "px", "--py": p.y + "px", opacity: 0,
        }} />);
      })}
    </div>
  );
}

function GameCard({ card, showFace, size, slamDirection, glowColor, warEntrance, entranceDelay }) {
  var w = size === "sm" ? 44 : size === "md" ? 64 : 82;
  var h = w * 1.45;
  var fontSize = size === "sm" ? 9 : size === "md" ? 13 : 18;
  var suitSize = size === "sm" ? 11 : size === "md" ? 16 : 24;

  var containerStyle = { width: w, height: h, perspective: 800, position: "relative" };
  if (warEntrance) {
    containerStyle.animation = "warCardDrop 0.35s cubic-bezier(0.34,1.56,0.64,1) " + (entranceDelay || 0) + "s both";
  }
  if (slamDirection === "up") {
    containerStyle.animation = "slamUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards";
  } else if (slamDirection === "down") {
    containerStyle.animation = "slamDown 0.45s cubic-bezier(0.22,1,0.36,1) forwards";
  }

  var innerStyle = {
    width: "100%", height: "100%", position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
    transform: showFace ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  var baseFaceStyle = {
    position: "absolute", inset: 0, borderRadius: 8,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    MozBackfaceVisibility: "hidden",
  };

  var backEl = (
    <div style={{
      ...baseFaceStyle, transform: "rotateY(0deg)", zIndex: 2,
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      border: "2px solid #2a2a4a",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      overflow: "hidden",
    }}>
      <div style={{
        width: w * 0.55, height: h * 0.6, borderRadius: 4,
        border: "1.5px solid #f59e0b44",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: fontSize + 6, fontWeight: 800, letterSpacing: 2,
          background: "linear-gradient(135deg, #fde047, #f59e0b)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>T</span>
      </div>
      <div style={{
        position: "absolute", top: size === "sm" ? 3 : 5, left: size === "sm" ? 3 : 5,
        display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1,
      }}>
        <span style={{ fontSize: size === "sm" ? 6 : size === "md" ? 8 : 9, fontWeight: 700, color: "#f59e0b88", fontFamily: "'Nunito Sans', sans-serif" }}>T</span>
        <span style={{ fontSize: size === "sm" ? 5 : size === "md" ? 7 : 8, color: "#f59e0b55", marginTop: -1 }}>✦</span>
      </div>
      <div style={{
        position: "absolute", bottom: size === "sm" ? 3 : 5, right: size === "sm" ? 3 : 5,
        display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1,
        transform: "rotate(180deg)",
      }}>
        <span style={{ fontSize: size === "sm" ? 6 : size === "md" ? 8 : 9, fontWeight: 700, color: "#f59e0b88", fontFamily: "'Nunito Sans', sans-serif" }}>T</span>
        <span style={{ fontSize: size === "sm" ? 5 : size === "md" ? 7 : 8, color: "#f59e0b55", marginTop: -1 }}>✦</span>
      </div>
    </div>
  );

  var frontEl = null;
  if (card) {
    var color = SUIT_COLORS[card.suit];
    frontEl = (
      <div style={{
        ...baseFaceStyle, transform: "rotateY(180deg)", zIndex: 1,
        background: "#fff",
        border: glowColor ? "2px solid " + glowColor : "2px solid #e5e7eb",
        display: "flex", flexDirection: "column",
        padding: size === "sm" ? 3 : 6, overflow: "hidden",
        boxShadow: glowColor
          ? "0 0 20px " + glowColor + "66, 0 0 40px " + glowColor + "33, 0 4px 16px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1, zIndex: 1 }}>
          <span style={{ fontSize, fontWeight: 700, color, fontFamily: "'Nunito Sans', sans-serif" }}>{card.rank}</span>
          <span style={{ fontSize: suitSize, color, marginTop: -2 }}>{card.suit}</span>
        </div>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: suitSize * 2, color, opacity: 0.08,
        }}>{card.suit}</div>
        <div style={{
          position: "absolute", bottom: size === "sm" ? 3 : 6, right: size === "sm" ? 3 : 6,
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          transform: "rotate(180deg)", lineHeight: 1.1, zIndex: 1,
        }}>
          <span style={{ fontSize, fontWeight: 700, color, fontFamily: "'Nunito Sans', sans-serif" }}>{card.rank}</span>
          <span style={{ fontSize: suitSize, color, marginTop: -2 }}>{card.suit}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {backEl}
        {frontEl}
      </div>
    </div>
  );
}

function WarStakesDisplay({ stakesHistory, side }) {
  if (!stakesHistory || stakesHistory.length === 0) return null;
  var cards = [];
  for (var i = 0; i < stakesHistory.length; i++) {
    var round = stakesHistory[i];
    var sideCards = side === "player" ? round.playerCards : round.opponentCards;
    for (var j = 0; j < sideCards.length; j++) {
      cards.push({ card: sideCards[j], faceUp: false, roundIdx: i });
    }
  }
  if (cards.length === 0) return null;
  return (
    <div style={{
      display: "flex", gap: 2, alignItems: "center", justifyContent: "center",
      flexWrap: "wrap", maxWidth: 280,
    }}>
      {cards.map(function(c, idx) {
        return (
          <div key={idx} style={{
            animation: "warCardDrop 0.35s cubic-bezier(0.34,1.56,0.64,1) " + (idx * 0.08) + "s both",
          }}>
            <GameCard card={c.card} showFace={false} size="sm" />
          </div>
        );
      })}
    </div>
  );
}

function StatsPanel({ stats, onClose }) {
  var statItems = [
    { label: "Rounds Played", value: stats.rounds, icon: "🎴" },
    { label: "Wins", value: stats.wins, icon: "✅" },
    { label: "Losses", value: stats.losses, icon: "❌" },
    { label: "Wars Triggered", value: stats.wars, icon: "⚔️" },
    { label: "Double+ Wars", value: stats.doubleWars, icon: "💥" },
    { label: "Current Streak", value: stats.currentStreak, icon: stats.currentStreak > 0 ? "🔥" : stats.currentStreak < 0 ? "📉" : "➖" },
    { label: "Best Streak", value: stats.bestStreak, icon: "🏆" },
    { label: "Biggest Haul", value: stats.biggestHaul + " cards", icon: "💰" },
    { label: "Cards Captured", value: stats.totalCaptured, icon: "📦" },
  ];
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      backdropFilter: "blur(12px)", animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{
        background: "linear-gradient(145deg, #12122a, #1a1a2e)",
        borderRadius: 20, padding: 28, minWidth: 300, maxWidth: 360,
        border: "1px solid #2a2a4a", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        animation: "statsSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Nunito Sans', sans-serif" }}>📊 Game Stats</span>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a4a",
            color: "#94a3b8", fontSize: 16, cursor: "pointer", padding: "4px 10px", borderRadius: 8,
          }}>✕</button>
        </div>
        {statItems.map(function(s, i) {
          return (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < statItems.length - 1 ? "1px solid #1e1e3a" : "none",
              animation: "statRowFade 0.3s ease-out " + (i * 0.04) + "s both",
            }}>
              <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }}>{s.icon} {s.label}</span>
              <span style={{
                fontWeight: 700, fontSize: 15, fontFamily: "'Nunito Sans', sans-serif",
                background: "linear-gradient(135deg, #fde047, #f59e0b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TEZWar() {
  var [gamePhase, setGamePhase] = useState("menu");
  var [playerDeck, setPlayerDeck] = useState([]);
  var [opponentDeck, setOpponentDeck] = useState([]);
  var [playerCard, setPlayerCard] = useState(null);
  var [opponentCard, setOpponentCard] = useState(null);
  var [roundResult, setRoundResult] = useState(null);
  var [message, setMessage] = useState("");
  var [isAnimating, setIsAnimating] = useState(false);
  var [showStats, setShowStats] = useState(false);
  var [autoFlip, setAutoFlip] = useState(false);
  var [autoSpeed, setAutoSpeed] = useState(1200);
  var [winner, setWinner] = useState(null);
  var [screenShake, setScreenShake] = useState(false);
  var [flipStage, setFlipStage] = useState("idle");
  var [particleTrigger, setParticleTrigger] = useState(0);
  var [warFlashTrigger, setWarFlashTrigger] = useState(0);
  var [resultGlow, setResultGlow] = useState(null);
  var [roundKey, setRoundKey] = useState(0);

  var warStakesRef = useRef([]);
  var [warStakesVersion, setWarStakesVersion] = useState(0);
  var warTotalRef = useRef(0);

  var [stats, setStats] = useState({
    rounds: 0, wins: 0, losses: 0, wars: 0, doubleWars: 0,
    currentStreak: 0, bestStreak: 0, biggestHaul: 0, totalCaptured: 0,
  });

  var autoTimerRef = useRef(null);
  var playerDeckRef = useRef([]);
  var opponentDeckRef = useRef([]);

  playerDeckRef.current = playerDeck;
  opponentDeckRef.current = opponentDeck;

  function startGame() {
    var deck = shuffle(createDeck());
    var half = Math.floor(deck.length / 2);
    setPlayerDeck(deck.slice(0, half));
    setOpponentDeck(deck.slice(half));
    setPlayerCard(null);
    setOpponentCard(null);
    warStakesRef.current = [];
    warTotalRef.current = 0;
    setWarStakesVersion(0);
    setRoundResult(null);
    setMessage("Tap to flip!");
    setGamePhase("playing");
    setWinner(null);
    setFlipStage("idle");
    setResultGlow(null);
    setRoundKey(0);
    setStats({ rounds: 0, wins: 0, losses: 0, wars: 0, doubleWars: 0, currentStreak: 0, bestStreak: 0, biggestHaul: 0, totalCaptured: 0 });
  }

  function triggerShake() {
    setScreenShake(true);
    setTimeout(function() { setScreenShake(false); }, 500);
  }

  function collectAllWarCards() {
    var all = [];
    for (var i = 0; i < warStakesRef.current.length; i++) {
      var round = warStakesRef.current[i];
      if (round.flipCards) {
        all.push(round.flipCards.p);
        all.push(round.flipCards.o);
      }
      all = all.concat(round.playerCards).concat(round.opponentCards);
    }
    return all;
  }

  var flipCards = useCallback(function() {
    if (isAnimating || gamePhase !== "playing") return;
    var pDeck = playerDeckRef.current.slice();
    var oDeck = opponentDeckRef.current.slice();
    if (pDeck.length === 0 || oDeck.length === 0) return;

    setIsAnimating(true);
    setRoundResult(null);
    setResultGlow(null);
    setRoundKey(function(k) { return k + 1; });

    var pCard = pDeck.shift();
    var oCard = oDeck.shift();

    setPlayerDeck(pDeck);
    setOpponentDeck(oDeck);

    setFlipStage("dealing");
    setPlayerCard(pCard);
    setOpponentCard(oCard);
    setMessage("");

    setTimeout(function() { setFlipStage("opponentReveal"); }, 500);
    setTimeout(function() { setFlipStage("playerReveal"); }, 950);

    setTimeout(function() {
      var pVal = RANK_VALUES[pCard.rank];
      var oVal = RANK_VALUES[oCard.rank];
      var allWarCards = collectAllWarCards();
      var totalPot = allWarCards.length;

      if (pVal > oVal) {
        var winnings = [pCard, oCard].concat(allWarCards);
        var haul = winnings.length;
        var newPDeck = pDeck.concat(shuffle(winnings));
        warStakesRef.current = [];
        warTotalRef.current = 0;
        setWarStakesVersion(function(v) { return v + 1; });
        setPlayerDeck(newPDeck);
        setRoundResult("win");
        setResultGlow("win");
        setMessage(haul > 2 ? "You win " + haul + " cards!" : "You win!");
        setParticleTrigger(function(p) { return p + 1; });
        setFlipStage("result");
        setStats(function(prev) {
          var newStreak = prev.currentStreak > 0 ? prev.currentStreak + 1 : 1;
          return { ...prev, rounds: prev.rounds + 1, wins: prev.wins + 1, currentStreak: newStreak, bestStreak: Math.max(prev.bestStreak, newStreak), biggestHaul: Math.max(prev.biggestHaul, haul), totalCaptured: prev.totalCaptured + haul };
        });
        if (oDeck.length === 0) {
          setGamePhase("gameOver"); setWinner("player"); setMessage("Opponent ran out of cards!");
        }
        setTimeout(function() { setFlipStage("idle"); setIsAnimating(false); }, 700);

      } else if (oVal > pVal) {
        var oWinnings = [pCard, oCard].concat(allWarCards);
        var oHaul = oWinnings.length;
        var newODeck = oDeck.concat(shuffle(oWinnings));
        warStakesRef.current = [];
        warTotalRef.current = 0;
        setWarStakesVersion(function(v) { return v + 1; });
        setOpponentDeck(newODeck);
        setRoundResult("lose");
        setResultGlow("lose");
        setMessage(oHaul > 2 ? "Opponent wins " + oHaul + " cards!" : "Opponent wins!");
        setFlipStage("result");
        setStats(function(prev) {
          return { ...prev, rounds: prev.rounds + 1, losses: prev.losses + 1, currentStreak: prev.currentStreak < 0 ? prev.currentStreak - 1 : -1 };
        });
        if (pDeck.length === 0) {
          setGamePhase("gameOver"); setWinner("opponent"); setMessage("You ran out of cards!");
        }
        setTimeout(function() { setFlipStage("idle"); setIsAnimating(false); }, 700);

      } else {
        var warNumber = warStakesRef.current.length + 1;
        var warLabel = warNumber === 1 ? "⚔️  W A R  ⚔️" : warNumber === 2 ? "💥  DOUBLE WAR  💥" : "🔥  TRIPLE WAR  🔥";
        setRoundResult("war");
        setMessage(warLabel);
        triggerShake();
        setWarFlashTrigger(function(w) { return w + 1; });
        setFlipStage("result");

        if (warNumber >= 2) {
          setStats(function(prev) { return { ...prev, rounds: prev.rounds + 1, wars: prev.wars + 1, doubleWars: prev.doubleWars + 1 }; });
        } else {
          setStats(function(prev) { return { ...prev, rounds: prev.rounds + 1, wars: prev.wars + 1 }; });
        }

        var warDown = Math.min(3, pDeck.length, oDeck.length);

        if (warDown === 0) {
          if (pDeck.length <= oDeck.length) {
            setGamePhase("gameOver"); setWinner("opponent"); setMessage("Can't afford war! You lose!");
          } else {
            setGamePhase("gameOver"); setWinner("player"); setMessage("Opponent can't afford war!");
          }
          setIsAnimating(false);
          return;
        }

        setTimeout(function() {
          var pWarCards = pDeck.splice(0, warDown);
          var oWarCards = oDeck.splice(0, warDown);

          warStakesRef.current = warStakesRef.current.concat([{
            flipCards: { p: pCard, o: oCard },
            playerCards: pWarCards,
            opponentCards: oWarCards,
          }]);

          var total = 0;
          for (var i = 0; i < warStakesRef.current.length; i++) {
            total += 2;
            total += warStakesRef.current[i].playerCards.length;
            total += warStakesRef.current[i].opponentCards.length;
          }
          warTotalRef.current = total;

          setWarStakesVersion(function(v) { return v + 1; });
          setPlayerDeck(pDeck.slice());
          setOpponentDeck(oDeck.slice());

          setMessage(total + " cards at stake! Flip to decide!");
          setFlipStage("idle");

          if (pDeck.length === 0) {
            setGamePhase("gameOver"); setWinner("opponent"); setMessage("You ran out of cards during war!");
            setIsAnimating(false); return;
          }
          if (oDeck.length === 0) {
            setGamePhase("gameOver"); setWinner("player"); setMessage("Opponent ran out during war!");
            setIsAnimating(false); return;
          }

          setIsAnimating(false);
        }, 1200);
        return;
      }
    }, 1300);
  }, [isAnimating, gamePhase]);

  useEffect(function() {
    if (autoFlip && gamePhase === "playing" && !isAnimating) {
      autoTimerRef.current = setTimeout(flipCards, autoSpeed);
    }
    return function() { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); };
  }, [autoFlip, gamePhase, isAnimating, flipCards, autoSpeed]);

  function getResultColor() {
    if (roundResult === "win") return "#22c55e";
    if (roundResult === "lose") return "#ef4444";
    if (roundResult === "war") return "#f59e0b";
    return "transparent";
  }

  var playerPercent = Math.round((playerDeck.length / 52) * 100);
  var opponentPercent = Math.round((opponentDeck.length / 52) * 100);
  var hasWarStakes = warStakesRef.current.length > 0;

  if (gamePhase === "menu") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #06060f 0%, #0f0f23 40%, #1a1a2e 100%)",
        fontFamily: "'Nunito Sans', sans-serif", padding: 20,
        overflow: "hidden", position: "relative",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes menuFloat { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(-3deg); } }
          @keyframes titleIn { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
          @keyframes btnPulse { 0%,100% { box-shadow: 0 4px 24px rgba(245,158,11,0.25); } 50% { box-shadow: 0 4px 40px rgba(245,158,11,0.45); } }
          @keyframes ambientOrb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.2); } }
          @keyframes ambientOrb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,30px) scale(0.8); } }
        `}</style>
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #f59e0b11, transparent 70%)", top: "15%", left: "10%", animation: "ambientOrb1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #3b82f611, transparent 70%)", bottom: "10%", right: "5%", animation: "ambientOrb2 10s ease-in-out infinite" }} />

        <div style={{ textAlign: "center", marginBottom: 36, animation: "titleIn 0.8s ease-out" }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: 4, background: "linear-gradient(135deg, #fde047, #f59e0b, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(245,158,11,0.3))" }}>TEZ</span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 300, color: "#fff", letterSpacing: 8, animation: "titleIn 0.8s ease-out 0.15s both" }}>WAR</div>
          <div style={{ marginTop: 14, fontSize: 12, color: "#475569", letterSpacing: 2, textTransform: "uppercase", animation: "titleIn 0.8s ease-out 0.3s both" }}>Flip · Battle · Conquer</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 44, animation: "menuFloat 4s ease-in-out infinite" }}>
          <GameCard card={{ rank: "A", suit: "♠" }} showFace size="md" />
          <div style={{ transform: "translateY(-8px)" }}><GameCard card={{ rank: "K", suit: "♥" }} showFace size="md" /></div>
          <div style={{ transform: "translateY(4px)" }}><GameCard card={{ rank: "A", suit: "♦" }} showFace size="md" /></div>
        </div>

        <button onClick={startGame} style={{
          padding: "15px 52px", borderRadius: 14,
          background: "linear-gradient(135deg, #fde047, #f59e0b)",
          border: "none", fontSize: 15, fontWeight: 700, color: "#1a1a2e",
          cursor: "pointer", letterSpacing: 1.5, fontFamily: "'Nunito Sans', sans-serif",
          animation: "btnPulse 2.5s ease-in-out infinite, titleIn 0.8s ease-out 0.45s both",
          transition: "transform 0.2s",
        }}
          onMouseOver={function(e) { e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseOut={function(e) { e.currentTarget.style.transform = "scale(1)"; }}
        >PLAY NORMAL MODE</button>

        <button disabled style={{
          marginTop: 14, padding: "12px 42px", borderRadius: 14,
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e1e3a",
          fontSize: 13, fontWeight: 600, color: "#3a3a5a", cursor: "not-allowed",
          letterSpacing: 1.5, fontFamily: "'Nunito Sans', sans-serif", position: "relative",
          animation: "titleIn 0.8s ease-out 0.55s both",
        }}>
          BLITZ MODE
          <span style={{ position: "absolute", top: -8, right: -14, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontSize: 8, padding: "2px 7px", borderRadius: 6, fontWeight: 800 }}>SOON</span>
        </button>

        <div style={{ marginTop: 28, fontSize: 10, color: "#2a2a4a", letterSpacing: 1, animation: "titleIn 0.8s ease-out 0.65s both" }}>v0.4 · Normal Mode</div>
      </div>
    );
  }

  var opponentShowFace = flipStage === "opponentReveal" || flipStage === "playerReveal" || flipStage === "result";
  var playerShowFace = flipStage === "playerReveal" || flipStage === "result";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #06060f 0%, #0f0f23 40%, #06060f 100%)",
      fontFamily: "'Nunito Sans', sans-serif", position: "relative", overflow: "hidden",
      animation: screenShake ? "screenShake 0.5s ease-out" : "none",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes slamUp { 0% { transform: translateY(120px) scale(0.7) rotate(8deg); opacity:0; } 60% { transform: translateY(-8px) scale(1.05) rotate(-1deg); opacity:1; } 100% { transform: translateY(0) scale(1) rotate(0); } }
        @keyframes slamDown { 0% { transform: translateY(-120px) scale(0.7) rotate(-8deg); opacity:0; } 60% { transform: translateY(8px) scale(1.05) rotate(1deg); opacity:1; } 100% { transform: translateY(0) scale(1) rotate(0); } }
        @keyframes warCardDrop { 0% { transform: translateY(-30px) scale(0.5); opacity:0; } 60% { transform: translateY(4px) scale(1.08); opacity:1; } 100% { transform: translateY(0) scale(1); } }
        @keyframes screenShake { 0%,100% { transform: translate(0,0) rotate(0); } 10% { transform: translate(-5px,3px) rotate(-0.5deg); } 20% { transform: translate(4px,-4px) rotate(0.5deg); } 30% { transform: translate(-6px,1px) rotate(-0.3deg); } 40% { transform: translate(3px,5px) rotate(0.4deg); } 50% { transform: translate(-3px,-2px) rotate(-0.2deg); } 60% { transform: translate(5px,2px) rotate(0.3deg); } 70% { transform: translate(-2px,-3px) rotate(-0.1deg); } 80% { transform: translate(2px,1px) rotate(0.1deg); } 90% { transform: translate(-1px,1px); } }
        @keyframes particleFly { 0% { transform: translate(0,0) scale(1); opacity: 0.9; } 100% { transform: translate(var(--px), var(--py)) scale(0); opacity: 0; } }
        @keyframes warFlash { 0% { opacity:0; } 20% { opacity:0.15; } 100% { opacity:0; } }
        @keyframes resultPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes statsSlideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes statRowFade { from { transform: translateX(-10px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes winGlow { 0%,100% { box-shadow: 0 0 30px #22c55e33; } 50% { box-shadow: 0 0 60px #22c55e55; } }
        @keyframes loseGlow { 0%,100% { box-shadow: 0 0 30px #ef444433; } 50% { box-shadow: 0 0 60px #ef444455; } }
        @keyframes floatUp { 0% { transform: translateY(0); opacity:1; } 100% { transform: translateY(-60px); opacity:0; } }
        @keyframes streakPop { 0% { transform: scale(0.5); opacity:0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity:1; } }
        @keyframes gameOverIn { 0% { transform: scale(0.7); opacity:0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity:1; } }
        @keyframes crownBounce { 0% { transform: translateY(-30px) rotate(-10deg); opacity:0; } 50% { transform: translateY(5px) rotate(5deg); opacity:1; } 100% { transform: translateY(0) rotate(0); opacity:1; } }
        @keyframes warStakesPulse { 0%,100% { color: #f59e0b; } 50% { color: #fde047; } }
        @keyframes potGlow { 0%,100% { box-shadow: 0 0 8px #f59e0b22; } 50% { box-shadow: 0 0 16px #f59e0b44; } }
        .flip-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .flip-btn:hover { transform: scale(1.04) !important; box-shadow: 0 6px 36px rgba(245,158,11,0.4) !important; }
        .flip-btn:active { transform: scale(0.96) !important; }
      `}</style>

      {roundResult === "war" && (
        <div key={warFlashTrigger} style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle, #f59e0b22, transparent 70%)",
          animation: "warFlash 0.6s ease-out forwards",
          pointerEvents: "none", zIndex: 15,
        }} />
      )}
      {resultGlow && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          animation: resultGlow === "win" ? "winGlow 1s ease-in-out" : "loseGlow 1s ease-in-out",
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", zIndex: 10 }}>
        <button onClick={function() { setGamePhase("menu"); setAutoFlip(false); }} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e1e3a",
          color: "#4a5568", fontSize: 12, cursor: "pointer",
          fontFamily: "'Nunito Sans', sans-serif", padding: "5px 12px", borderRadius: 8,
        }}>← Menu</button>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 800, background: "linear-gradient(135deg, #fde047, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TEZ</span>
          <span style={{ fontSize: 13, fontWeight: 300, color: "#94a3b8", letterSpacing: 2 }}>WAR</span>
        </div>
        <button onClick={function() { setShowStats(true); }} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e1e3a",
          color: "#4a5568", fontSize: 12, cursor: "pointer",
          fontFamily: "'Nunito Sans', sans-serif", padding: "5px 12px", borderRadius: 8,
        }}>Stats</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 16px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <GameCard card={null} showFace={false} size="sm" />
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>OPPONENT</div>
            <div style={{ fontSize: 22, color: "#fff", fontWeight: 700 }}>{opponentDeck.length}</div>
          </div>
          <div style={{ width: 72, height: 5, background: "#111125", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: opponentPercent + "%", height: "100%", background: "linear-gradient(90deg, #ef4444, #f97316)", borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
        </div>

        {hasWarStakes && (
          <div key={"opp-stakes-" + warStakesVersion} style={{ marginBottom: 6 }}>
            <WarStakesDisplay stakesHistory={warStakesRef.current} side="opponent" />
          </div>
        )}

        <div style={{ minHeight: 120, display: "flex", alignItems: "center" }}>
          {opponentCard ? (
            <div key={"opp-" + roundKey}>
              <GameCard card={opponentCard} showFace={opponentShowFace} size="lg" slamDirection="down"
                glowColor={flipStage === "result" && roundResult !== "war" ? getResultColor() : null} />
            </div>
          ) : (
            <div style={{ width: 82, height: 119, borderRadius: 8, border: "2px dashed #1a1a30", opacity: 0.4 }} />
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 16px", position: "relative", zIndex: 10, minHeight: 80 }}>
        <ParticleBurst color="#22c55e" count={16} trigger={particleTrigger} />

        {hasWarStakes && (
          <div style={{
            padding: "4px 14px", borderRadius: 20,
            background: "rgba(245,158,11,0.08)", border: "1px solid #f59e0b33",
            marginBottom: 4, animation: "potGlow 2s ease-in-out infinite",
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
              animation: "warStakesPulse 1.5s ease-in-out infinite",
            }}>⚔️ {warTotalRef.current} cards at stake</span>
          </div>
        )}

        <div key={message + "-" + roundKey} style={{
          fontSize: roundResult === "war" ? 24 : 17,
          fontWeight: 800, color: getResultColor(),
          display: "flex", alignItems: "center", justifyContent: "center",
          textAlign: "center", width: "100%",
          textShadow: roundResult ? "0 0 24px " + getResultColor() + "55" : "none",
          letterSpacing: roundResult === "war" ? 4 : 1,
          animation: roundResult ? "resultPulse 0.5s ease-out" : "none",
          minHeight: 30,
        }}>
          {message}
        </div>

        {roundResult === "win" && (
          <div key={"haul-" + roundKey} style={{
            fontSize: 13, fontWeight: 700, color: "#22c55e",
            animation: "floatUp 1s ease-out forwards",
            position: "absolute", top: -5, pointerEvents: "none",
          }}>+cards</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "4px 0", width: "100%", maxWidth: 280 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #1e1e3a)" }} />
          <span style={{ fontSize: 10, color: "#2a2a4a", fontWeight: 700, letterSpacing: 3 }}>VS</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1e1e3a, transparent)" }} />
        </div>

        {stats.currentStreak >= 3 && (
          <div key={"streak-" + stats.currentStreak} style={{
            fontSize: 12, fontWeight: 700, color: "#f59e0b",
            display: "flex", alignItems: "center", gap: 4,
            animation: "streakPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>🔥 {stats.currentStreak} WIN STREAK</div>
        )}
        {stats.currentStreak <= -3 && (
          <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>📉 {Math.abs(stats.currentStreak)} LOSS STREAK</div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "8px 16px 0" }}>
        <div style={{ minHeight: 120, display: "flex", alignItems: "center" }}>
          {playerCard ? (
            <div key={"plr-" + roundKey}>
              <GameCard card={playerCard} showFace={playerShowFace} size="lg" slamDirection="up"
                glowColor={flipStage === "result" && roundResult !== "war" ? getResultColor() : null} />
            </div>
          ) : (
            <div style={{ width: 82, height: 119, borderRadius: 8, border: "2px dashed #1a1a30", opacity: 0.4 }} />
          )}
        </div>

        {hasWarStakes && (
          <div key={"plr-stakes-" + warStakesVersion} style={{ marginTop: 6 }}>
            <WarStakesDisplay stakesHistory={warStakesRef.current} side="player" />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <GameCard card={null} showFace={false} size="sm" />
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>YOU</div>
            <div style={{ fontSize: 22, color: "#fff", fontWeight: 700 }}>{playerDeck.length}</div>
          </div>
          <div style={{ width: 72, height: 5, background: "#111125", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: playerPercent + "%", height: "100%", background: "linear-gradient(90deg, #22c55e, #4ade80)", borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 20px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 10 }}>
        {gamePhase === "playing" && (
          <>
            <button className="flip-btn" onClick={flipCards} disabled={isAnimating || autoFlip} style={{
              width: "100%", maxWidth: 300, padding: "14px 0", borderRadius: 14,
              background: (isAnimating || autoFlip) ? "rgba(255,255,255,0.03)" : hasWarStakes ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #fde047, #f59e0b)",
              border: (isAnimating || autoFlip) ? "1px solid #1e1e3a" : "none",
              fontSize: 15, fontWeight: 700,
              color: (isAnimating || autoFlip) ? "#3a3a5a" : "#fff",
              cursor: (isAnimating || autoFlip) ? "not-allowed" : "pointer",
              letterSpacing: 2, fontFamily: "'Nunito Sans', sans-serif",
              boxShadow: (isAnimating || autoFlip) ? "none" : hasWarStakes ? "0 4px 24px rgba(239,68,68,0.3)" : "0 4px 24px rgba(245,158,11,0.25)",
            }}>
              {autoFlip ? "AUTO-FLIPPING..." : hasWarStakes ? "⚔️ FLIP FOR WAR" : "FLIP"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#3a3a5a" }}>Auto</span>
              <button onClick={function() { setAutoFlip(!autoFlip); }} style={{
                width: 40, height: 22, borderRadius: 11,
                background: autoFlip ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#111125",
                border: autoFlip ? "none" : "1px solid #1e1e3a",
                cursor: "pointer", position: "relative", transition: "all 0.3s",
              }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: autoFlip ? 21 : 3, transition: "left 0.3s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
              </button>
              {autoFlip && (
                <select value={autoSpeed} onChange={function(e) { setAutoSpeed(Number(e.target.value)); }} style={{
                  background: "#111125", color: "#64748b", border: "1px solid #1e1e3a",
                  borderRadius: 6, padding: "3px 8px", fontSize: 11,
                  fontFamily: "'Nunito Sans', sans-serif", animation: "fadeIn 0.3s ease-out",
                }}>
                  <option value={2000}>Slow</option>
                  <option value={1200}>Normal</option>
                  <option value={600}>Fast</option>
                  <option value={300}>Turbo</option>
                </select>
              )}
            </div>
          </>
        )}

        {gamePhase === "gameOver" && (
          <div style={{ textAlign: "center", animation: "gameOverIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
            {winner === "player" && (
              <div style={{ fontSize: 40, marginBottom: 4, animation: "crownBounce 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}>👑</div>
            )}
            <div style={{
              fontSize: 30, fontWeight: 800, marginBottom: 4,
              color: winner === "player" ? "#22c55e" : "#ef4444",
              textShadow: "0 0 30px " + (winner === "player" ? "#22c55e44" : "#ef444444"),
            }}>{winner === "player" ? "VICTORY!" : "DEFEAT"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, letterSpacing: 0.5 }}>{message}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={startGame} style={{
                padding: "11px 30px", borderRadius: 12,
                background: "linear-gradient(135deg, #fde047, #f59e0b)",
                border: "none", fontSize: 13, fontWeight: 700, color: "#1a1a2e",
                cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", transition: "transform 0.2s",
              }}
                onMouseOver={function(e) { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseOut={function(e) { e.currentTarget.style.transform = "scale(1)"; }}
              >PLAY AGAIN</button>
              <button onClick={function() { setShowStats(true); }} style={{
                padding: "11px 24px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid #1e1e3a",
                fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer",
                fontFamily: "'Nunito Sans', sans-serif", transition: "transform 0.2s",
              }}
                onMouseOver={function(e) { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseOut={function(e) { e.currentTarget.style.transform = "scale(1)"; }}
              >VIEW STATS</button>
            </div>
          </div>
        )}
      </div>

      {showStats && <StatsPanel stats={stats} onClose={function() { setShowStats(false); }} />}
    </div>
  );
}

export default TEZWar;
