# TEZ Games Changelog

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
