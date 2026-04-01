import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import TezToast from '../components/TezToast';

export const MusicContext = createContext({ musicOn: false, toggleMusic: () => {}, volume: 0.3, setVolume: () => {} });
export const useMusic = () => useContext(MusicContext);

export const UserContext = createContext({ username: null, playerId: null, playerStats: null, setUsername: () => {}, clearUsername: () => {}, refreshStats: () => {} });
export const useUser = () => useContext(UserContext);

// Module-level — created once, never destroyed by React lifecycle
let _audio = null;
let _playedOnce = false;

function getAudio() {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = new Audio('/sounds/swaggot 155 Cphy @prod.blinder.mp3');
    _audio.loop = true;
    _audio.volume = 0.3;
    _audio.preload = 'auto';
  }
  return _audio;
}

export default function App({ Component, pageProps }) {
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolumeState] = useState(0.3);
  const [username, setUsernameState] = useState(null);
  const [playerId, setPlayerIdState] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('tez_username');
    const savedId = localStorage.getItem('tez_player_id');
    if (saved) setUsernameState(saved);
    if (savedId) {
      setPlayerIdState(savedId);
    } else if (saved) {
      // Existing player without a stored ID — look it up and backfill
      fetch(`/api/get-player?username=${encodeURIComponent(saved)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.id) {
            localStorage.setItem('tez_player_id', data.id);
            setPlayerIdState(data.id);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch stats whenever playerId is resolved
  useEffect(() => {
    if (playerId) refreshStats(playerId);
  }, [playerId]);

  const setUsername = (name, id) => {
    localStorage.setItem('tez_username', name);
    if (id) localStorage.setItem('tez_player_id', id);
    setUsernameState(name);
    if (id) setPlayerIdState(id);
  };

  const clearUsername = () => {
    localStorage.removeItem('tez_username');
    localStorage.removeItem('tez_player_id');
    setUsernameState(null);
    setPlayerIdState(null);
  };

  const refreshStats = useCallback(async (id) => {
    const pid = id || playerId;
    if (!pid) return;
    try {
      const res = await fetch(`/api/get-player-by-id?id=${encodeURIComponent(pid)}`);
      if (res.ok) setPlayerStats(await res.json());
    } catch {}
  }, [playerId]);

  // Listen for tez-result events dispatched by reportGameResult
  useEffect(() => {
    const handler = (e) => {
      const data = e.detail;
      if (!data?.ok) return;
      const leveledUp = data.newLevel && data.previousLevel && data.newLevel !== data.previousLevel;
      const id = Date.now();
      const baseToast = {
        id,
        pointsEarned: data.pointsEarned,
        dailyBonus: data.dailyBonus,
        level: data.newLevel,
        exiting: false,
      };
      const newToasts = [];
      if (leveledUp) {
        newToasts.push({ ...baseToast, id: id + 1, type: 'levelup' });
      } else {
        newToasts.push({ ...baseToast, type: 'points' });
      }
      setToasts(prev => [...prev, ...newToasts]);
      // Refresh sidebar stats
      setPlayerStats(prev => prev ? {
        ...prev,
        tez_points: data.newPoints,
        level: data.newLevel,
        current_streak: data.newStreak,
      } : null);
      // Fade out after 2.5s
      setTimeout(() => {
        setToasts(prev => prev.map(t =>
          newToasts.some(n => n.id === t.id) ? { ...t, exiting: true } : t
        ));
        setTimeout(() => {
          setToasts(prev => prev.filter(t => !newToasts.some(n => n.id === t.id)));
        }, 350);
      }, 2500);
    };
    window.addEventListener('tez-result', handler);
    return () => window.removeEventListener('tez-result', handler);
  }, []);

  const setVolume = (v) => {
    const audio = getAudio();
    if (!audio) return;
    audio.volume = v;
    setVolumeState(v);
  };
  const router = useRouter();

  useEffect(() => {
    // Generate a session ID once per browser session
    let sessionId = sessionStorage.getItem('tez_sid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('tez_sid', sessionId);
    }

    const track = (url) => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: url, referrer: document.referrer, sessionId }),
      });
    };
    track(router.asPath);
    router.events.on('routeChangeComplete', track);
    return () => router.events.off('routeChangeComplete', track);
  }, []);

  const toggleMusic = () => {
    const audio = getAudio();
    if (!audio) return;
    if (!_playedOnce) {
      _playedOnce = true;
      audio.play().then(() => setMusicOn(true)).catch(() => { _playedOnce = false; });
    } else {
      audio.muted = musicOn;
      setMusicOn(!musicOn);
    }
  };

  return (
    <UserContext.Provider value={{ username, playerId, playerStats, setUsername, clearUsername, refreshStats }}>
      <MusicContext.Provider value={{ musicOn, toggleMusic, volume, setVolume }}>
        <Component {...pageProps} />
        <Analytics />
        <SpeedInsights />
        <TezToast toasts={toasts} />
      </MusicContext.Provider>
    </UserContext.Provider>
  );
}
