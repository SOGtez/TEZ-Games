import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useState, useEffect, useRef, createContext, useContext } from 'react';

export const MusicContext = createContext({ musicOn: false, toggleMusic: () => {} });
export const useMusic = () => useContext(MusicContext);

export default function App({ Component, pageProps }) {
  const audioRef = useRef(null);
  const playedRef = useRef(false);
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/sounds/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    audioRef.current = audio;

    const tryPlay = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
      audio.play().then(() => setMusicOn(true)).catch(() => {
        playedRef.current = false;
        window.addEventListener('click', tryPlay);
        window.addEventListener('keydown', tryPlay);
      });
    };
    window.addEventListener('click', tryPlay);
    window.addEventListener('keydown', tryPlay);

    return () => {
      audio.pause();
      audio.src = '';
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
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
