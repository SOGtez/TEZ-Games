# TEZ Games Changelog

## v0.9.16 — Shop & Inventory infrastructure
- Added Shop (🛍️) and Inventory (🎒) links to the sidebar nav
- Shop page (/shop): premium "coming soon" teaser with shimmer title, floating icon, pulse animation, and blurred placeholder item grid
- Inventory page (/inventory): functional with 5 tabs (Name Paints, Banners, Game Skins, Badges, Profile Frames), TEZ Bucks balance, equip/unequip per slot, and empty states ready for when items are added
- New API: GET /api/inventory — owned cosmetics + equipped slots
- New API: POST /api/inventory/equip — equip/unequip with ownership verification
- New API: GET /api/shop/items — all cosmetics from DB, optional type filter
- New API: POST /api/shop/buy — validates balance, deducts TB, adds to player_cosmetics (with refund on failure)

## v0.9.15 — Private recovery code
- Each account now gets a unique private recovery code (format `XXXX-XXXX-XXXX-XXXX`, ~10²⁴ combinations)
- Only visible to the account owner on their own profile page — never shown publicly
- Existing accounts get a code auto-generated on next login
- Removed friend code account recovery — friend code is public, using it for recovery was a security risk
- Recovery code shown in profile with copy button and warning to save it somewhere safe

## v0.9.14 — Guest account persistence
- Dual-layer session storage: saves to both localStorage and a 1-year cookie so accounts survive storage clears on either side
- Friend code recovery: "Recover it →" link in UsernameModal lets users restore their account by entering their TEZ-XXXX friend code on a new device
- Session validation on load: if the stored player ID returns a 404 (account deleted), the stale session is automatically cleared
- Email link prompt: after 5 games, guests see an amber sidebar card prompting them to link an email to protect their progress (dismissible)
- Warning badge (⚠) next to username in sidebar for unlinked accounts, with tooltip explaining the risk

## v0.9.13 — Fix online Connect 4 freeze + dot size
- Fixed critical bug where online games froze at turn 4: a remote drop arriving while a local animation was running would be silently discarded and marked as processed, leaving both players stuck forever
- Root cause: `dropping = true` guard in `handleColClick` would reject the remote move, but `processedMoveRef` was already stamped — so the move was lost permanently when the animation finished
- Fix: queue the remote move in `pendingRemoteMoveRef` when animating; flush it as soon as `dropping` goes false
- Reduced last-placed white dot size from 28% to 18% of piece diameter

## v0.9.12 — Connect 4 last-placed piece dot indicator
- Small white dot appears in the center of the most recently dropped piece in all game modes (local, vs AI, online)
- Dot animates in with a spring pop (scale 0→1 with slight overshoot)
- Disappears automatically when the next piece is placed
- Does not appear on ghost piece or piece snatch placements — only normal column drops
- Hidden when win stars are shown at game end

## v0.9.11 — Connect 4 waiting screen redesign
- Removed "Try another way?" toggle from the online waiting screen
- Room code, shareable link (with copy button), QR code, and "Share this with a friend to play!" text are all shown immediately when a room is created
- No hidden sections or expandable panels — everything visible at once in a clean vertical stack

## v0.9.10 — Profanity / slur filter
- Added server-side word filter (`lib/wordFilter.js`) covering racial slurs, ethnic slurs, homophobic slurs, sexist slurs, hate-group terms, and common profanity
- Filter catches exact matches, leetspeak substitutions (4→a, 3→e, 1→i, 0→o, 5→s, etc.), embedded slurs inside longer strings, and separator tricks (n-i-g, n.i.g, n_i_g)
- Applied to username creation (`/api/claim-username`) and email sign-up (`/api/auth/signup`) — runs server-side so it cannot be bypassed
- Client modals show friendly error: "That username is not allowed. Please choose a different one." without revealing which word was matched
- Added `/api/admin/scan-usernames` endpoint (requires `ADMIN_SECRET` env var) to scan all existing usernames and return flagged ones for manual cleanup

## v0.9.9 — Full mobile optimization
- Added viewport meta tag for correct mobile scaling
- Layout: overflow-x hidden to prevent horizontal scroll; header hides redundant "All Games" nav link on mobile; main content padding tightened on mobile; friend request toasts fit within screen width
- Landing page: hero section reduced spacing on mobile; body text uses fluid font size
- Leaderboard: Win% and secondary stat columns hidden on small screens, leaving rank + player + main stat
- Connect 4: board wraps in scrollable container for small screens; power-up grid collapses to 2 columns; menu cards full-width
- Blackjack: action buttons stack vertically on mobile; top bar wraps
- War: menu/game buttons expand to full width on mobile
- Friends page: add-friend grid goes single-column; friend code header wraps
- Profile: stats grid already 2-column on mobile (no change needed)

## v0.9.8 — Connect 4 online multiplayer room system
- Room-based matchmaking: host creates a room with a random 4-char code (e.g. `TEZ7`), shares it with a friend
- Waiting screen shows the room code large + copy button, plus expandable "Try another way?" section with a shareable URL and QR code (client-side, dark theme)
- Guest joins by entering the code in the new "Join a Room" section on the Connect 4 menu, or by visiting `tez-games.com/game/connect4?code=TEZ7` directly (auto-joins)
- Host is always Red (goes first), guest is always Blue; usernames shown in each player card
- Moves relayed in real-time via Supabase Realtime broadcast channels — piece drop animations fire automatically on the opponent's board
- Chess clock, power-ups, and Rumble mode all work in online play
- Disconnect detection: 30 s of missed heartbeats → warning banner; 60 s → win awarded and stats reported
- Post-game: "Rematch" (creates new room, opponent auto-joins) and "← Menu" buttons
- Stats reported independently for both players via `reportGameResult`
- `game_rooms` table stores room state; rooms expire after 10 minutes if no one joins
- Added `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars required in Vercel

## v0.9.7 — Connect 4 chess clock timer
- 4-minute chess clock for online and AI modes (`timerDuration` prop, default 240s)
- Per-player countdown displayed in player cards; timer only ticks on the active player's side
- Timer pauses during power-up spin animations and bomb phases
- Color changes at <30s (orange, pulse) and <10s (red, urgent flash + glow)
- Timeout triggers game over: result banner shows "You ran out of time! ⏰" / "Opponent ran out of time! ⏰" (online), or "P1/P2 ran out of time! ⏰" (local), or "AI ran out of time! ⏰"
- Online mode: `timerSync` move type sent periodically so both clients stay in sync
- AI player 2 has no timer (AI responds instantly)

## v0.9.6 — Connect 4 multiplayer-ready refactor
- Renamed component to `Connect4Game`, added `"use client"` directive
- Accepts `gameMode` ('local'|'ai'|'online'), `playerColor` ('red'|'blue'), `onMove`, `incomingMove`, `onGameEnd` props
- When `gameMode` is passed, skips menu and starts the game directly
- Online mode: turn indicator shows "Your Turn" / "Waiting for opponent...", all board interaction disabled when it's not the local player's turn
- `onMove` fires for every local action: `{ type: 'drop', col }`, `{ type: 'bomb', col }`, `{ type: 'snatch', row, col }`, `{ type: 'ghost', row, col }`, `{ type: 'useItem' }`
- `incomingMove` prop processes the opponent's move (all types) as if they clicked
- `onGameEnd({ winner, mode })` fires when the game ends; stats tracked for online mode the same as AI mode
- Menu, local 2P, and AI modes all work exactly as before

## v0.9.5 — Fix daily login bonus repeating on refresh
- Normalize stored `last_login_bonus` to `YYYY-MM-DD` before comparing (full timestamp strings caused the check to always be `true`)
- Replace `.or()` Supabase filter with two separate `.is(null)` / `.lt()` conditional UPDATEs — avoids filter quirks in Supabase JS
- Add client-side localStorage guard: toast only shows once per calendar day per device, even if concurrent requests fire

## v0.9.4 — Fix daily login bonus race condition
- Daily login bonus now uses a conditional server-side UPDATE filtered to rows where `last_login_bonus` is null or before today — only one concurrent request can win the write, preventing duplicate awards on rapid page loads/refreshes

## v0.9.3 — Connect 4 AI upgrade + stat gating
- Replaced simple AI with Minimax + alpha-beta pruning (depth 6): never misses a win or obvious block, evaluates center control and multi-in-a-row patterns
- Small random factor among near-best moves so AI varies its play
- AI response capped at 300ms (feels like thinking, not instant)
- Local 2-player games no longer report stats — only vs AI games count toward leaderboard/TEZ Points/TEZ Bucks

## v0.9.2 — Fix navbar layout centering
- TEZ Games logo is now absolutely centered in the navbar and stays centered regardless of left/right content
- Hamburger and TEZ Bucks pill grouped on the left; nav items on the right

## v0.9.1 — TEZ Bucks in navbar
- Show TEZ Bucks balance as a bordered pill in the top navbar next to the sidebar button

## v0.9.0 — TEZ Bucks system
- New currency: TEZ Bucks earned from gameplay (win +5, lose +1, push +2, natural blackjack +10, win streak +3)
- Daily login bonus: +10 TEZ Bucks once per calendar day (on site load or first game)
- Bucks balance shown in sidebar profile card (💰) and on profile page
- Game result toast now shows both TP and Bucks earned: "+10 TP | +5 💰"
- Separate "Daily Bonus! +10 💰" toast when daily login bonus triggers
- New "Richest Players" leaderboard tab ranked by total TEZ Bucks

## v0.8.4 — Hide "Add Friend" when already friends
- Sidebar hides "+ Add Friend" button when viewing a profile of someone already in your friends list

## v0.8.3 — Clean up debug error output
- Remove debug error details from friend add API and frontend; errors now show friendly messages only

## v0.8.2 — Friend request notifications
- Slide-down notification when a new friend request arrives (polls every 30s)
- Notification shows sender's username, flag, level badge with Accept and X buttons
- Accept on notification → changes to "You and X are now friends!" → auto-dismisses after 2s
- X dismisses immediately; request stays pending and is visible on /friends
- Auto-dismisses after 4s if no interaction; multiple requests stack
- Sidebar pending badge updates on the same 30s poll
- Friend Requests card moved to top of /friends page, always shown (shows "No pending requests" when empty)
- Inline acceptance confirmation on /friends page

## v0.8.1 — Friend system
- Auto-generated friend codes (TEZ-XXXX) for all players; backfilled on next login for existing players
- Add friends by username search or friend code
- Friend request flow: send → pending → accept/decline
- Sidebar 👥 Friends section with pending badge count, expandable panel showing requests + friend list
- AddFriendModal accessible from sidebar with username search and friend code input
- Full /friends page: add friend, pending requests, friends list with stats and Remove option, sent requests
- Friend code shown on own profile page with copy button
- New API routes: /api/friends/get, search, add, respond, remove

## v0.8.0 — Email account system
- Sign Up with email + password to create a cross-device account
- Log In from any device using email + password to restore username and stats
- Existing guests can Link Email from the sidebar to secure their account
- Forgot password sends a reset email via Supabase Auth
- Email-linked accounts show a ✉ badge next to the username in the sidebar
- Log Out button in sidebar clears local session
- All Supabase Auth calls are server-side (API routes); client session remains localStorage-based
- Guest (username-only) mode continues working exactly as before

## v0.7.8 — Real-time profile stats & rolling animations
- Profile page polls every 30s and refreshes instantly on game result (tez-result event)
- Rolling counter animation on all numeric stats (700ms cubic ease-out, glow on increase)
- Animated values: TP, Games Played, Best/Current Streak, W/L record, per-game breakdown counts

## v0.7.7 — Blackjack balance persistence & biggest win tracking
- Blackjack balance saved to Supabase (blackjack_balance column); persists across sessions
- Guests (no username) default to $500 with no saving; balance 0 resets to $500 on next load
- Tracks biggest single-hand profit (blackjack_biggest_win column); included in reportGameResult details
- Profile page Blackjack card shows 'Biggest Win' dollar amount

## v0.7.6 — Fix game breakdown and recent activity
- Added missing created_at column to game_stats table in Supabase
- Per-game breakdown and recent activity now correctly populate on profile page

## v0.7.5 — Wire Connect 4 & War result reporting
- TEZ Connect 4 now calls reportGameResult on win/loss (skip draws); includes mode and opponent type
- TEZ War now calls reportGameResult on win/loss; includes rounds, wars, biggestHaul stats
- TEZ Blackjack verified still reporting correctly
- Per-game breakdown and recent activity on profile page will now populate as games are played

## v0.7.4 — Clickable Profiles & Country Flags
- Leaderboard rows are clickable links to /profile/[username]
- New public profile route at /profile/[username] (read-only, fetches by username)
- Own /profile page shows "Your profile" badge; both routes share ProfileView component
- Country auto-detected via Vercel header on username claim; backfilled on next visit
- Country flag emoji shown in sidebar, leaderboard rows, and profile headers
- lib/countryFlag.js utility for flag emoji conversion

## v0.7.3 — Leaderboard
- New /leaderboard page with Global, Blackjack, Connect 4, and War tabs
- Global tab: ranked by TEZ Points, shows level badge, wins, win rate
- Per-game tabs: ranked by wins, shows games played and win rate
- Top 3 rows highlighted with gold/silver/bronze medals
- Current user's row highlighted with purple glow
- If user is outside top 50, rank pinned at bottom with divider
- Leaderboard link added to sidebar nav with 🏆 icon
- New /api/leaderboard endpoint

## v0.7.2 — Full Profile Page
- New /profile page with avatar, username, level badge, TP, and member since date
- Stats grid: total games, win rate, best streak, current streak
- TEZ Points progress bar + full level milestone timeline (Rookie → GOAT)
- Per-game breakdown cards for Blackjack, Connect 4, and War
- Recent activity feed (last 10 results) with game emoji, result badge, TP earned, and time ago
- New /api/get-profile endpoint aggregating player + game_stats data
- Responsive layout (2-col mobile, 4-col desktop grid)

## v0.7.1 — Sidebar Stats Card & TP Toast Notifications
- Sidebar shows compact stats card when logged in: level badge, TEZ Points, progress bar to next level, W/L record, streak indicator
- +X TP toast notification (bottom-left) after every game result
- Level Up toast variant with level color and crown for GOAT
- playerStats added to UserContext, refreshed on login and after each game
- Added /api/get-player-by-id endpoint
- report-result now returns previousLevel for level-up detection

## v0.7.0 — TEZ Points & Stats Tracking
- game_stats table tracking every game result
- TEZ Points system: earn TP from wins (+10), losses (+2), pushes (+3), blackjacks (+15), streaks (+5), daily bonus (+5)
- Level system: Rookie → Player → Competitor → Champion → Master → Legend → GOAT
- reportGameResult() utility for all games to use
- Wired up TEZ Blackjack as first tracked game
- claim-username now returns and stores player UUID for stat attribution

## v0.6.8 — Remove Change Username from sidebar

## v0.6.7 — Username system fully working
- Supabase players table created and connected
- Removed debug error detail from API and modal

## v0.6.6 — Fix username modal full-screen (proper fix)
- Split banner and modal into separate components (UsernameBanner + UsernameModal)
- Modal now renders in Layout outside the header — fully escapes backdropFilter stacking context

## v0.6.5 — Fix username modal rendering full-screen
- Modal now uses a React portal (renders at document.body) to escape header stacking context

## v0.6.4 — Username banner & modal animations
- Banner sticks to top with the header on scroll
- Animated shifting gradient on the banner background
- "Create Username" button has animated gradient + orbiting glow
- Modal popup enters with a spring scale + fade animation
- "Claim Username" button has animated gradient and pulsing glow

## v0.6.3 — Username banner redesign
- Banner text larger and white
- Replaced inline input with a "Create Username" button
- Clicking opens a centered modal with input, validation, and claim button

## v0.6.2 — Username system
- Username claim banner below header for new visitors
- POST /api/claim-username validates and stores username in Supabase players table
- Username persisted in localStorage via UserContext
- Header displays 👤 username once claimed
- Sidebar "Change Username" button to reset and re-claim

## v0.6.1 — BETA tags & game ordering
- New games now appear at the top of the home screen grid
- BETA badge on TEZ Connect 4 and TEZ War cards

## v0.6.0 — TEZ Connect 4 V1 BETA
- Full Connect 4 game with Normal and Rumble modes
- Normal: classic 2-player or vs AI
- Rumble: power-ups, mystery boxes, fog of war, gravity flip, poison piece, and more
- Particle effects, animated piece drops, spin wheel for power-ups
- Unlocked Connect 4 card on home screen

## v0.5.4 — Music only plays on explicit button press
- Removed auto-play on first page interaction
- Music now starts only when the user clicks the music button

## v0.5.3 — Fix volume slider staying open while hovering
- Removed gap between button and slider popup so hover stays continuous

## v0.5.2 — Move volume slider below music button
- Volume slider popup now appears below the button instead of above

## v0.5.1 — Volume slider on music button hover
- Hovering the music button shows a vertical volume slider popup
- Slider shows current volume percentage and controls audio level in real time

## v0.5.0 — New background music
- Replaced bg-music.mp3 with new track (swaggot 155 Cphy @prod.blinder.mp3)

## v0.4.9 — Remove analytics from sidebar
- Removed Analytics link from sidebar nav

## v0.4.8 — Toggleable sidebar navigation
- Added slide-in sidebar on the left side of every page
- Hamburger ☰ button in the header opens the sidebar
- Sidebar closes on backdrop click or ✕ button
- NAV_ITEMS array in Layout.js for easy future page additions

## v0.4.7 — TEZ War Tutorial Mode
- Added "LEARN TO PLAY" button on TEZ War menu
- Full interactive tutorial with 20 scripted steps
- Scripted card flips demonstrating win, lose, war, double war scenarios
- TutorialPopup overlay with gold progress bar
- "LEARN" badge in top bar during tutorial
- Stats and auto-flip hidden during tutorial

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
