# TEZ Games Changelog

## v0.4.6 — TEZ War (Normal Mode)
- Added TEZ War as a playable game (unlocked)
- Card flip battle with war mechanics, double/triple war, particle effects
- Auto-flip toggle with speed control (Slow / Normal / Fast / Turbo)
- Stats panel: rounds, wins, losses, wars, streaks, biggest haul
- Blitz Mode placeholder (coming soon)

## v0.4.5 — Live visitors card
- Track session IDs to identify unique visitors
- /api/live counts distinct sessions active in last 5 minutes
- Live Now card on analytics dashboard with pulsing green dot, auto-refreshes every 30s

## v0.4.4 — Full analytics dashboard restored
- Added browser tracking (Chrome, Safari, Firefox, Edge, etc.)
- Browsers breakdown card restored to /analytics dashboard

## v0.4.3 — Custom analytics with Supabase
- Track page views in Supabase (page, country, device, referrer)
- /api/track logs each page visit server-side
- /api/analytics-data aggregates real data from Supabase
- /analytics dashboard now shows live traffic data

## v0.4.2 — Fix music truly persisting across pages
- Move audio to module-level singleton so React lifecycle can never destroy it
- Cleanup no longer pauses/clears audio on navigation

## v0.4.1 — Persistent background music across pages
- Moved audio to _app.js so it never resets on navigation
- Shared music state via React context

## v0.4.0 — Switch background music to MP3
- Converted bg-music from WAV (20MB) to MP3 for faster loading

## v0.3.9 — Fix music autoplay reliability
- Add preload=auto so audio buffers before first interaction
- Fix retry logic so play can re-attempt if initial attempt fails

## v0.3.8 — Fix music mute toggle
- Mute/unmute now uses audio.muted instead of pause/play to avoid browser blocking

## v0.3.7 — Background music WAV support
- Switched background music from .m4a to .wav format

## v0.3.6 — Full analytics dashboard
- Daily bar chart (30-day traffic history)
- Countries, Referrers, Devices, Browsers breakdowns
- 2-column grid layout with color-coded accent bars

## v0.3.5 — Custom analytics dashboard
- /analytics now shows a real dashboard (page views, unique visitors, top pages)
- Server-side API route proxies Vercel Analytics REST API
- PIN-gated, not linked anywhere on the site

## v0.3.4 — Hidden analytics page
- PIN-gated /analytics page (not linked anywhere)
- Installs @vercel/analytics for passive page view tracking
- Correct PIN redirects to Vercel Analytics dashboard

## v0.3.3 — Background music
- Added looping background music player (public/sounds/bg-music.mp3)
- Auto-plays on first user interaction (browser autoplay policy)
- Music toggle button (🎵/🔇) in top-right header
- SSR-safe, persists across page navigation

## v0.3.2 — Coming soon game cards
- Added locked cards for TEZ Uno, TEZ War, TEZ Tic Tac Toe, TEZ Minesweeper

## v0.3.1 — Connect 4 locked card
- Connect 4 game card shows greyed out with 🔒 Coming Soon badge
- Locked cards are non-clickable

## v0.3.0 — TEZ Blackjack Sound Engine
- Added sound engine with MP3 support (chip, deal, flip, win, blackjack, lose, bust, push, clear)
- Mute/unmute toggle button (bottom right corner)
- Animated bet counter with glow effect
- Sound hooks on all game actions

## v0.2.1 — Font & Animation Polish
- Switched font from Fredoka to Segoe UI across logos and game titles
- Game card hover: smooth ease-in/out, glow pulse, polished mouse-leave transition
- Version number displayed in footer bottom-right

## v0.2.0 — TEZ Blackjack
- Imported TEZ Blackjack as first playable game
- Single player with learn mode, split, double, insurance
- Site-wide TEZ branding (gold gradient TEZ + light weight game names)

## v0.1.0 — Initial Launch
- Landing page with game grid
- Game page routing at /game/[slug]
- Site structure and layout with Fredoka font
- TEZ Blackjack and Connect 4 placeholder cards
