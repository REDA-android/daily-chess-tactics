# ♟️ Daily Chess Tactics

**A Wordle-style daily tactical chess puzzle running natively inside a Reddit post via Devvit Web.**

Every 24 hours (UTC), every Redditor on the thread faces the exact same tactical chess position with **3 hearts** (`❤️❤️❤️`). Find the winning combination, protect your daily streak, and post your spoiler-free emoji scorecard directly to the Reddit comments in one click.

---

## Key Features

- **Synchronized Daily UTC Puzzles + Live Countdown:** Deterministic UTC date mapping (`YYYY-MM-DD`) ensures every Redditor on the thread faces the exact same tactical puzzle each day, complete with a live 1-second `HH:MM:SS` UTC countdown timer.
- **Live Subreddit Daily Leaderboard (Redis Sorted Sets):** Solving today's puzzle ranks you against the community (`GET /api/leaderboard`) using a speed-and-accuracy composite score (`daily:{dateKey}:leaderboard`), displayed in a **Top 5 Today** podium tab (`🥇`, `🥈`, `🥉`).
- **Interactive 8×8 Chessboard (`React` + `chess.js`):**
  - Supports both **tap-to-move** (Reddit Mobile) and **drag-and-drop** (Desktop), plus move progress pips (`● ○`).
  - **3 Switchable Board Palettes** persisted in `localStorage`: *Tournament Classic*, *Ocean Slate*, and *Midnight Wood*.
  - Full pawn promotion picker (including knight underpromotions), ECO opening pills (`C57`, `C41`), pulsing king-in-check warning, blunder shake, and emerald victory glow.
- **Post-Game Interactive SAN Solution Replay (`▶ Play` / `< Prev` / `Next >`):** Step manually, use keyboard arrows, or hit **Play** to watch the full algebraic-notation tactic (`1... d5`, `2. exd5`, `3. Qxf7#`) animate with move/capture/check audio cues.
- **3-Min Puzzle Rush Blitz & Practice Archive (`20` Puzzles + Tactical Elo):**
  - Launch **3-Min Puzzle Rush** for 3-strike blitz survival with combo multipliers (`x2`–`x5`) and Personal Best tracking.
  - Browse all 20 curated puzzles (`All`, `Unsolved`, `Mate`, `Sacrifice`), track your **Tactical Elo**, and chain **Next Puzzle →** seamlessly without affecting your Daily Streak.
- **Zero-Asset Web Audio SFX & One-Click Reddit Comment Sharing:** Synthesized `AudioContext` sound cues with mute toggle, reduced-motion-safe confetti, UTC day streaks in Devvit Redis, and spoiler-free emoji scorecard comments via `reddit.submitComment`.

---

## Architecture

```text
+-------------------------------------------------------------------------+
|                        REDDIT POST (DEVVIT WEB)                         |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |  Client (React 19 + Tailwind CSS v4 + chess.js + Web Audio API)   |  |
|  |  - usePuzzleGame & useRushGame  : Daily, Practice & 3-Min Blitz   |  |
|  |  - ChessBoard + PromotionPicker : Tap/Drag 8x8 SVG & 3 palettes   |  |
|  |  - ReplayBar + CountdownTimer   : Auto-play SAN & live UTC clock  |  |
|  |  - ResultModal / LeaderboardTab : Explanation, Elo & Top 5 Today  |  |
|  +---------------------------------+---------------------------------+  |
|                                    | HTTPS (/api/*)                     |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  |  Devvit Server (Hono @ src/server/index.ts)                       |  |
|  |  - GET  /api/init           -> User stats, daily puzzle, global % |  |
|  |  - GET  /api/leaderboard    -> Top 5 Redditors + caller rank      |  |
|  |  - POST /api/submit         -> Persist result, streak & ZSET rank |  |
|  |  - POST /api/share-comment  -> One-time spoiler-free post comment |  |
|  |  - POST /internal/*         -> Daily UTC cron & mod menu trigger  |  |
|  +----------------+---------------------------------+----------------+  |
|                   |                                 |                   |
|                   v                                 v                   |
|  +-------------------------------+   +-------------------------------+  |
|  |  Devvit Redis Persistence     |   |  Reddit Platform APIs         |  |
|  |  - user:{id}:streak           |   |  - context.reddit             |  |
|  |  - user:{id}:daily:{date}     |   |    .submitComment(...)        |  |
|  |  - daily:{date}:leaderboard   |   |    .submitCustomPost(...)     |  |
|  |  - daily:{date}:plays/solves  |   |  - Devvit Scheduler (00:05)   |  |
|  +-------------------------------+   +-------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## Local Development & Playtest Instructions

### Prerequisites
- **Node.js** `>= 22.0.0`
- **Devvit CLI** (`npm i -g devvit` or use local `npx devvit`) logged in via `devvit login`
- A private Reddit test subreddit where you are a moderator

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Verify all 20 bundled FENs & UCI tactical lines against chess.js
npm run verify:puzzles

# 3. Run strict TypeScript checks & unit tests
npm run test:types
npm run test:unit

# 4. Build client & server bundles (dist/client & dist/server/index.cjs)
npm run build

# 5. Upload private build & launch interactive playtest in your subreddit
npx devvit upload
npx devvit playtest <YOUR_TEST_SUBREDDIT>
```

Once `devvit playtest` is running, open your test subreddit and select **"Create Daily Chess Tactics Post"** from the subreddit moderator menu (or trigger the daily post) to launch the interactive post.
