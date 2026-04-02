# TEZ Games Changelog

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
