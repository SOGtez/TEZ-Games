import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';

export const MusicContext = createContext({ musicOn: false, toggleMusic: () => {} });
export const useMusic = () => useContext(MusicContext);

// Module-level — created once, never destroyed by React lifecycle
let _audio = null;
let _playedOnce = false;

function getAudio() {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = new Audio('/sounds/bg-music.mp3');
    _audio.loop = true;
    _audio.volume = 0.3;
    _audio.preload = 'auto';
  }
  return _audio;
}

export default function App({ Component, pageProps }) {
  const [musicOn, setMusicOn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const track = (url) => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: url, referrer: document.referrer }),
      });
    };
    track(router.asPath);
    router.events.on('routeChangeComplete', track);
    return () => router.events.off('routeChangeComplete', track);
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (!audio || _playedOnce) return;

    const tryPlay = () => {
      if (_playedOnce) return;
      _playedOnce = true;
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
      audio.play().then(() => setMusicOn(true)).catch(() => {
        _playedOnce = false;
        window.addEventListener('click', tryPlay);
        window.addEventListener('keydown', tryPlay);
      });
    };

    window.addEventListener('click', tryPlay);
    window.addEventListener('keydown', tryPlay);

    // Only remove listeners on cleanup — never touch the audio element
    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const toggleMusic = () => {
    const audio = getAudio();
    if (!audio) return;
    audio.muted = musicOn;
    setMusicOn(!musicOn);
  };

  return (
    <MusicContext.Provider value={{ musicOn, toggleMusic }}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </MusicContext.Provider>
  );
}
