import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';

export const MusicContext = createContext({ musicOn: false, toggleMusic: () => {}, volume: 0.3, setVolume: () => {} });
export const useMusic = () => useContext(MusicContext);

export const UserContext = createContext({ username: null, playerId: null, setUsername: () => {}, clearUsername: () => {} });
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
    <UserContext.Provider value={{ username, playerId, setUsername, clearUsername }}>
      <MusicContext.Provider value={{ musicOn, toggleMusic, volume, setVolume }}>
        <Component {...pageProps} />
        <Analytics />
        <SpeedInsights />
      </MusicContext.Provider>
    </UserContext.Provider>
  );
}
