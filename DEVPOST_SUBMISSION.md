# Devpost Submission — Daily Chess Tactics

## Elevator Pitch
**Daily Chess Tactics** turns every Reddit thread into a daily Wordle-style chess arena where communities solve the same tactical position with 3 hearts, protect their daily streak, and post spoiler-free emoji scorecards straight to the comments in one click.

---

## Inspiration & Core Loop
Chess subreddits and casual strategy communities thrive on shared puzzle threads—yet traditional links bounce Redditors out to external tabs, break mobile viewports, and spoil solutions in the comments.

We designed **Daily Chess Tactics** specifically for Reddit's native feed:
1. **Shared Daily Challenge:** Every 24 hours (UTC), every player gets the exact same tactical puzzle (from both White and Black perspectives).
2. **High-Stakes 3-Heart Loop:** Players have **3 hearts (`❤️❤️❤️`)** to find the winning tactical line. A wrong move snaps back and shakes the board; a correct move triggers an automated opponent reply in `400ms` until checkmate or decisive material gain.
3. **Learn & Brag Together:** Upon completion, players see a concise tactical takeaway explaining *why* the combination works, compare against the subreddit's global solve rate, and click **"Share Result to Comments"** to post a spoiler-free emoji grid (`🟩` / `🟨` / `🟥`) with their streak and solve time.

---

## How We Built It
- **Platform:** **Reddit Devvit Web** (`@devvit/web`, `@devvit/start`) running an inline custom post entrypoint (`height: "tall"`) with a Zod-validated Hono backend (`src/server/index.ts`).
- **Frontend:** **React 19**, **TypeScript**, **Tailwind CSS v4**, `clsx`, `sonner`, `canvas-confetti`, and `lucide-react` icons, paired with 12 crisp inline tournament SVG chess pieces and **3 switchable board themes** (*Tournament Classic*, *Ocean Slate*, *Midnight Wood*) persisted in `localStorage`.
- **Chess Engine:** **`chess.js`** for deterministic legal move generation, tap-to-move + drag-and-drop moves, check/checkmate detection, SAN solution timeline playback (`ReplayBar`), and promotion handling (including underpromotions).
- **Audio Engine:** A **zero-asset Web Audio API synthesizer** (`src/client/utils/soundEngine.ts`) generating move, capture, check, mistake, and victory chimes directly in `AudioContext` without external `.mp3` files.
- **Persistence & Community Competition:** **Devvit Redis** stores per-user daily results, consecutive UTC day streaks, global play/solve rates, a **Redis Sorted Set Daily Leaderboard** (`GET /api/leaderboard` Top 5), and a one-comment-per-day share guard. A **Devvit Scheduler** task (`5 0 * * *`) plus a moderator menu action automatically spawns fresh daily posts.

---

## Challenges We Ran Into & Accomplishments
- **Fitting a Full Chessboard Inside Reddit's Post Iframe:** Built a `max-h-[100dvh]` responsive layout with tap-to-move and drag-and-drop controls, move progress pips, and zero vertical scrollbars across mobile and desktop Redditors.
- **Post-Game Learning & Auto-Play SAN Replay:** Added an interactive `ReplayBar` (`|<`, `< Prev`, `▶ Play`, `Next >`, `>|`) with algebraic notation (`1... d5`, `2. exd5`, `3. Qxf7#`), keyboard shortcuts, and move/capture/check sound cues so players understand *why* every sacrifice works.
- **3-Min Puzzle Rush Blitz & Personal Tactical Elo:** Built an arcade **3-Min Puzzle Rush** mode with 3-strike survival and combo multipliers (`x2`–`x5`), alongside a filterable 20-puzzle **Practice Archive** (`All`, `Unsolved`, `Mate`, `Sacrifice`) and persistent **Tactical Elo** tracking.
- **Zero-Latency Offline Puzzle Verification:** Bundled 20 curated White and Black tactical puzzles (including ECO opening traps `C57` and `C41`) and verified every FEN, setup move, and solution ply automatically via `scripts/verifyPuzzles.ts` and `node:test`.

---

## 2-Minute Demo Video Script

- **0:00 – 0:20 | Hook & Native Reddit Launch**
  - *Visual:* Open your test subreddit feed, click **"Create Daily Chess Tactics Post"** from the moderator menu (or scroll to the live pinned Daily Post), and expand the interactive board directly inside the post.
  - *Voiceover:* "Chess threads on Reddit are huge, but external puzzle links pull users out of the feed and spoil answers in the comments. Meet **Daily Chess Tactics**—a native Devvit Web game built for Reddit communities."

- **0:20 – 1:00 | Core Gameplay & Board Orientation**
  - *Visual:* Show the TopBar (Puzzle `#ID`, Rating badge, 3 hearts, live timer, mute toggle). Play a puzzle from the Black perspective (or flip the board), tap a piece to display legal destination dots, make the first tactical move, and show the opponent's 400ms automated reply.
  - *Voiceover:* "Every 24 hours UTC, everyone on Reddit gets the exact same tactical puzzle—sometimes from White's side, sometimes countering as Black. Tap-to-move controls and synthesized Web Audio cues make every check and capture feel snappy right inside Reddit mobile or desktop."

- **1:00 – 1:25 | Mistake Feedback, Hint & Victory**
  - *Visual:* Intentionally play a wrong move to trigger the horizontal board shake, red square flash, buzz SFX, and 1 heart deduction. Tap **Hint** to pulse the active piece square, then complete the winning checkmate move to trigger the emerald victory glow and arpeggio chime.
  - *Voiceover:* "You get three hearts. Blunders shake the board and snap back, hints highlight the key piece at a 50% bonus trade-off, and finding the winning sequence unlocks the tactical breakdown and global solve rate."

- **1:25 – 1:45 | Live Reddit Comment Share & Judge Archive**
  - *Visual:* Click **"Share Result to Comments"** inside the Victory modal, close the modal or scroll down to show the freshly posted spoiler-free comment (`♟️ Daily Chess Tactics #14 ... | 🟩🟨🟩 | 🔥 Streak: 1`), then open **Practice Archive** to jump into Puzzle #20 (*Knight Underpromotion*).
  - *Voiceover:* "One click posts your spoiler-free emoji grid directly to the Reddit thread—building community rivalry without spoiling the answer. And with our built-in Practice Archive, you can test 20 curated puzzles anytime without touching your official daily streak."

- **1:45 – 2:00 | Architecture Wrap-Up**
  - *Visual:* Quick cut to the ASCII architecture diagram in `README.md` (`React + chess.js` ↔ `Hono` ↔ `Devvit Redis & Reddit API`).
  - *Voiceover:* "Built 100% self-contained on Devvit Web with TypeScript, React, `chess.js`, Web Audio, and Devvit Redis. Thanks for watching—enjoy today's tactic!"
