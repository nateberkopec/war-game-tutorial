# War Card Game - Specification

## Overview

A browser-based implementation of the classic card game War for two players in hot-seat local multiplayer mode. Distributed via Itch.io.

## Technology Stack

- **Renderer**: Three.js
- **Visual Style**: Minimalist/clean 2D background with 3D card models and animations
- **Audio**: None (may add later)
- **Distribution**: Itch.io (browser embed)

## Game Rules

### Setup
- Standard 52-card deck
- Deck shuffled and split evenly (26 cards each)
- Players enter custom names at game start

### Gameplay
1. Both players simultaneously flip the top card of their deck
2. Higher card wins both cards (Ace high)
3. Won cards go to the bottom of the winner's deck
4. Repeat until one player has all cards

### War (Tie Resolution)
- When both cards have equal rank, War is triggered
- Each player places 1 card face-down, then 1 card face-up
- Higher face-up card wins all 6 cards
- If another tie, repeat War
- **Edge case**: If a player cannot complete a War (insufficient cards), they lose immediately

### Card Rankings (Low to High)
2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A

### Card Identification
Each card has a unique ID for tracking through the game and enabling deterministic replays.

**Format:** `{deckIndex}-{suit}-{rank}`

**Examples:**
- `0-hearts-A` - Ace of Hearts from deck 0
- `0-spades-10` - Ten of Spades from deck 0
- `1-diamonds-K` - King of Diamonds from deck 1 (in multi-deck games)

This format is:
- **Deterministic:** Same seed produces same card IDs
- **Unique:** No collisions within a game
- **Readable:** Easy to debug and inspect

## User Experience

### Game Flow

```
┌─────────────────────────────────────────┐
│            TITLE SCREEN                 │
│                                         │
│              "WAR"                       │
│                                         │
│    Player 1 Name: [____________]        │
│    Player 2 Name: [____________]        │
│                                         │
│           [ START GAME ]                │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            GAME SCREEN                  │
│                                         │
│   [P1 Name]              [P2 Name]      │
│   Cards: 26              Cards: 26      │
│                                         │
│    ┌─────┐              ┌─────┐         │
│    │░░░░░│              │░░░░░│         │
│    │░░░░░│   vs         │░░░░░│         │
│    │░░░░░│              │░░░░░│         │
│    └─────┘              └─────┘         │
│           (deck backs)                  │
│                                         │
│       "Click anywhere to draw"          │
└─────────────────────────────────────────┘
                   │
                   ▼ (on click)
┌─────────────────────────────────────────┐
│           CARD REVEAL                   │
│                                         │
│   [P1 Name]              [P2 Name]      │
│   Cards: 25              Cards: 25      │
│                                         │
│    ┌─────┐              ┌─────┐         │
│    │  K  │              │  7  │         │
│    │  ♠  │   vs         │  ♥  │         │
│    │     │              │     │         │
│    └─────┘              └─────┘         │
│                                         │
│      "[P1 Name] wins this round!"       │
│       "Click anywhere to continue"      │
└─────────────────────────────────────────┘
                   │
                   ▼ (on game end)
┌─────────────────────────────────────────┐
│          VICTORY SCREEN                 │
│                                         │
│     🎉  [Winner Name] WINS!  🎉         │
│                                         │
│    (animated celebration: cards         │
│     flying, confetti effects)           │
│                                         │
│         ── GAME STATS ──                │
│     Total Rounds: 47                    │
│     Wars Fought: 3                      │
│     Longest War: 2 ties                 │
│                                         │
│          [ PLAY AGAIN ]                 │
└─────────────────────────────────────────┘
```

### Turn Flow (Detailed)

1. Game screen shows both decks face-down
2. Prompt: "Click anywhere to draw"
3. On click/tap:
   - Both cards animate flipping simultaneously (3D flip animation)
   - Brief pause for dramatic effect
   - Winner announcement displayed
4. On next click/tap:
   - Winning cards animate moving to winner's deck
   - Card counts update
   - Return to step 2

### War Sequence

1. Tie detected - "WAR!" displayed dramatically
2. Countdown: "3... 2... 1..."
3. Each player's face-down card slides out
4. On click: face-up cards flip and reveal
5. Winner takes all cards (or another War if tied)

## Visual Design

### Style
- Clean, minimalist aesthetic
- Simple 2D background (solid color or subtle gradient)
- 3D card models with realistic flip animations
- Clear typography for names and card counts
- High contrast for readability

### Cards
- 3D geometry (thin box with front/back textures)
- Smooth flip animation on reveal
- Standard playing card faces (simple/clean design)
- Distinct card back design

### Colors (Suggested)
- Background: Dark gray or deep blue
- Card backs: Solid color with simple pattern
- UI text: White or light gray
- Accent: Highlight color for winner announcements

## Technical Requirements

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebGL required (Three.js dependency)
- Responsive design for various screen sizes

### Performance
- Target 60fps for animations
- Minimal asset loading (procedural card generation if possible)
- No external API calls (fully client-side)

### Itch.io Integration

#### Upload Requirements
- Upload as a **ZIP file** containing `index.html` as entry point
- ZIP must contain < 1,000 files, < 500MB total extracted
- Individual files < 200MB, filenames < 240 characters
- Use **relative paths only** (no absolute paths starting with `/`)
- Filenames are **case-sensitive** (exact match required)
- All external resources must use **HTTPS**

#### Embed Configuration
- Set "Kind of Game" to **HTML Game**
- Choose **"Embed in page"** with manual dimensions (recommended: 960x540 or 16:9 ratio)
- Enable **"Click to play"** to prevent auto-loading (itch.io default for new games)
- Enable **"Fullscreen button"** - itch.io provides overlay button
- Mark as **"Mobile Friendly"** if touch controls work

#### Responsive Canvas (Critical)
The game canvas **must resize dynamically** to fill the iframe viewport. This is essential for:
- Itch.io's fullscreen button to work properly
- Mobile device support (variable screen sizes)
- Different embed dimensions

Implementation approach:
```javascript
// Listen for resize and update Three.js renderer
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial size should use full viewport
renderer.setSize(window.innerWidth, window.innerHeight);
```

#### File Optimization
- Itch.io auto-compresses: `.html`, `.js`, `.css`, `.wasm`, `.svg`
- Keep total bundle size small for fast loading
- Consider code splitting if bundle grows large

#### Mobile Considerations
- On mobile, itch.io forces "Click to launch in fullscreen" mode
- Touch events work in iframe
- Test on actual mobile devices before publishing

#### No Server-Side APIs Needed
For a fully client-side game like War, we don't need:
- OAuth/authentication
- Server-side API calls
- User data persistence (localStorage is available)

The JavaScript API (`Itch.attachBuyButton`, `Itch.getGameData`) is only for embedding purchase buttons on external sites - not needed for our use case.

## Game Engine Architecture

The game engine is a **pure logic layer** completely separate from UI/rendering. It handles rules, state, events, and persistence. The UI subscribes to engine events and calls engine methods.

### Configuration System

#### Rule Presets
```typescript
type RulePreset = 'classic' | 'quick' | 'marathon' | 'chaos' | 'custom'

const PRESETS = {
  classic: { warFaceDownCards: 1, deckCount: 1, aceHigh: true, ... },
  quick: { warFaceDownCards: 1, deckCount: 1, winCondition: { type: 'firstTo', count: 30 }, ... },
  marathon: { warFaceDownCards: 3, deckCount: 2, ... },
  chaos: { warFaceDownCards: 5, deckCount: 2, shuffleWonCards: true, ... },
  custom: { /* user-defined */ }
}
```

#### Full Configuration Object
```typescript
interface GameConfig {
  // Deck setup
  deckCount: number              // 1-4 standard decks combined
  cardsPerPlayer: number | 'all' // Fixed count or split entire deck
  
  // Card rankings
  aceHigh: boolean               // true = Ace beats King
  customRankOrder?: string[]     // e.g., ['2','3',...,'A'] or custom
  suitsRank: boolean             // false = suits don't matter (default)
  suitOrder?: string[]           // If suits matter: ['clubs','diamonds','hearts','spades']
  
  // War rules
  warFaceDownCards: number       // 1 (classic), 3 (common variant), or custom
  insufficientCardsRule: 'lose' | 'useRemaining' | 'splitPot'
  
  // Win conditions
  winCondition: 
    | { type: 'elimination' }                    // Default: opponent has 0 cards
    | { type: 'firstTo', count: number }         // First to N cards wins
    | { type: 'rounds', count: number }          // Most cards after N rounds
    // Note: Timed games deferred to v2 (requires timer UI, pause/resume, additional events)
  
  // Card collection
  shuffleWonCards: boolean       // Shuffle won cards before adding to deck
  wonCardsPosition: 'bottom' | 'random'  // Where won cards go
  
  // Randomization
  seed?: string                  // For reproducible games / replays
}
```

### Core Types

```typescript
// Player identification
type PlayerId = 'player1' | 'player2'

// Lightweight player info for game sessions (not the full profile)
interface Player {
  id: PlayerId
  name: string
  profileId?: string  // Optional link to persistent profile
}

// Minimal player info for replays/summaries
interface PlayerInfo {
  name: string
  profileId?: string
}
```

### Event System

The engine emits events for every significant action. The UI (or any other subscriber) listens and reacts.

```typescript
type GameEvent =
  | { type: 'gameStarted', config: GameConfig, players: [Player, Player] }
  | { type: 'roundStarted', roundNumber: number }
  | { type: 'cardsDrawn', cards: { player1: Card, player2: Card } }
  | { type: 'comparison', result: PlayerId | 'tie', cards: [Card, Card] }
  | { type: 'roundWon', winner: PlayerId, cardsWon: Card[] }
  | { type: 'warStarted', depth: number }
  | { type: 'warFaceDownPlaced', player: PlayerId, count: number }
  | { type: 'warResolved', winner: PlayerId, totalCards: number }
  | { type: 'insufficientCards', player: PlayerId, needed: number, had: number }
  | { type: 'gameEnded', winner: PlayerId, stats: GameStats }
  | { type: 'deckShuffled', player: PlayerId }
  | { type: 'stateRestored', fromSave: boolean }

interface GameEngine {
  on(event: string, callback: (event: GameEvent) => void): void
  off(event: string, callback: Function): void
}
```

### Game State

```typescript
interface GameState {
  id: string                     // Unique game ID (for saves/replays)
  config: GameConfig
  phase: 'setup' | 'playing' | 'war' | 'paused' | 'finished'
  
  players: {
    player1: PlayerState
    player2: PlayerState
  }
  
  // Battlefield tracks cards currently in play
  // During a normal round: each player has 1 face-up card, warPile is empty
  // During war: face-up cards from comparison, plus warPile accumulates all cards at stake
  battlefield: {
    player1FaceUp: Card | null   // Current face-up card (the one being compared)
    player2FaceUp: Card | null
    player1FaceDown: Card[]      // Face-down cards placed during war
    player2FaceDown: Card[]
    warPile: Card[]              // All cards accumulated during war sequence
  }
  
  currentRound: number
  warDepth: number               // 0 = normal round, 1+ = nested war
  
  // Random state for replay
  rngState: string
}

interface PlayerState {
  id: PlayerId
  name: string
  profileId?: string             // Optional link to persistent profile
  deck: Card[]
  cardsWon: number               // Running total for this game
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: string                   // '2'-'10', 'J', 'Q', 'K', 'A'
  id: string                     // Unique ID: "{deckIndex}-{suit}-{rank}" e.g. "0-hearts-A"
}
```

**Battlefield Flow:**
1. **Normal round start:** Both `faceUp` are null, `faceDown` arrays empty, `warPile` empty
2. **Cards drawn:** Each player's top card goes to their `faceUp` slot
3. **Comparison:** Winner determined, all cards move to `warPile`
4. **Round won:** Winner collects `warPile` to bottom of their deck, battlefield resets

**War sequence:**
1. **Tie detected:** Both `faceUp` cards move to `warPile`
2. **Face-down placed:** Each player places N cards in their `faceDown` array
3. **War cards drawn:** New cards go to `faceUp` slots
4. **Comparison:** If tie, repeat from step 1 (nested war). If winner, they collect entire `warPile` + all `faceDown` cards + both `faceUp` cards

### Save/Load System

```typescript
interface SavedGame {
  id: string
  savedAt: number                // Timestamp
  state: GameState
  history: GameEvent[]           // For undo/replay
  playerProfiles: [string, string]  // Profile IDs
}

interface GameEngine {
  // Save current state
  save(): SavedGame
  
  // Load and restore state
  load(save: SavedGame): void
  
  // List available saves
  static listSaves(): SavedGame[]
  
  // Auto-save after each round (optional)
  enableAutoSave(slot: string): void
}
```

### Undo/Redo System

```typescript
interface GameEngine {
  canUndo(): boolean
  canRedo(): boolean
  undo(): GameState              // Returns to previous round start
  redo(): GameState              // Re-applies undone action
  
  // History access
  getHistory(): GameEvent[]
  getHistoryIndex(): number
}
```

The engine maintains a full event history. Undo walks back to the previous `roundStarted` event and replays from there.

### Replay System

```typescript
interface Replay {
  id: string
  createdAt: number
  config: GameConfig
  seed: string                   // For deterministic replay
  players: [PlayerInfo, PlayerInfo]
  events: GameEvent[]
  stats: GameStats
  duration: number               // Total game time in ms
}

interface GameEngine {
  // Record current game
  exportReplay(): Replay
  
  // Playback
  static createFromReplay(replay: Replay): GameEngine
  
  // Step through replay
  stepForward(): GameEvent | null
  stepBackward(): GameEvent | null
  jumpToRound(round: number): void
  
  // Playback control
  setPlaybackSpeed(multiplier: number): void  // 0.5x, 1x, 2x, etc.
}
```

### Statistics Tracking

```typescript
interface GameStats {
  // Per-game stats
  totalRounds: number
  warsCount: number
  longestWarChain: number        // Max consecutive ties
  largestWarPot: number          // Most cards won in single war
  
  // Card distribution
  cardRankWins: Record<string, number>    // Which ranks won most
  suitDistribution: Record<string, number>
  
  // Timing
  duration: number
  averageRoundTime: number
  
  // Player-specific
  player1RoundsWon: number
  player2RoundsWon: number
  biggestLead: { player: PlayerId, amount: number }
}
```

## Player Profiles

Persistent player profiles stored in LocalStorage.

```typescript
interface PlayerProfile {
  id: string                     // UUID
  name: string
  createdAt: number
  
  // Lifetime stats
  stats: {
    gamesPlayed: number
    gamesWon: number
    gamesLost: number
    winStreak: number            // Current
    bestWinStreak: number        // All-time
    totalRoundsPlayed: number
    totalWarsWon: number
    totalWarsFought: number
    fastestWin: number | null    // Duration in ms
    longestGame: number | null
    
    // Interesting records
    biggestComeback: number      // Won after being down by N cards
    mostWarsInGame: number
    longestWarChain: number
  }
  
  // Recent activity
  recentGames: GameSummary[]     // Last 20 games
  
  // Preferences
  preferences: {
    favoritePreset: RulePreset
    customConfig?: GameConfig
  }
}

interface GameSummary {
  id: string
  playedAt: number
  opponent: string               // Profile name or ID
  won: boolean
  stats: GameStats
  config: RulePreset | 'custom'
}

interface ProfileManager {
  createProfile(name: string): PlayerProfile
  getProfile(id: string): PlayerProfile | null
  updateProfile(id: string, updates: Partial<PlayerProfile>): void
  deleteProfile(id: string): void
  listProfiles(): PlayerProfile[]
  
  // After a game ends
  recordGameResult(profileId: string, game: GameSummary): void
}
```

### LocalStorage Schema

```
war-game/
├── profiles/
│   ├── {uuid1}: PlayerProfile
│   └── {uuid2}: PlayerProfile
├── saves/
│   ├── {gameId1}: SavedGame
│   └── {gameId2}: SavedGame
├── replays/
│   ├── {replayId1}: Replay
│   └── {replayId2}: Replay
└── settings/
    └── global: { lastProfileId, soundEnabled, ... }
```

## Engine API Summary

```typescript
class WarGameEngine {
  // Construction
  constructor(config: GameConfig)
  static fromPreset(preset: RulePreset): WarGameEngine
  static fromSave(save: SavedGame): WarGameEngine
  static fromReplay(replay: Replay): WarGameEngine
  
  // Game setup - uses lightweight Player, not full PlayerProfile
  // The engine only needs names and optional profile IDs for tracking
  setPlayers(p1: Player, p2: Player): void
  start(): void
  
  // Core gameplay (UI calls these)
  draw(): void                   // Execute next draw
  
  // State access
  getState(): GameState
  getConfig(): GameConfig
  
  // Events
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  
  // Persistence
  save(): SavedGame
  load(save: SavedGame): void
  exportReplay(): Replay
  
  // History
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
}
```

## Testing Strategy

### Three Layers of Testing

#### 1. Unit Tests (Engine Logic) - Vitest + jsdom
- Test the pure game engine in isolation
- No Three.js involvement - engine is pure logic
- Fast, runs in Node with jsdom
- Covers: card comparison, deck shuffling, war resolution, win conditions, stats tracking, profile management, save/load serialization

#### 2. Integration Tests (Engine + Storage) - Vitest + jsdom
- Test engine with real LocalStorage (jsdom provides this)
- Test profile persistence, save/load round-trips, replay export/import
- Test event sequences (subscribe, trigger actions, verify events fired)

#### 3. Browser/E2E Tests (Full Stack) - Vitest Browser Mode + Playwright
- Real browser with WebGL
- Screenshot comparison against golden images
- Test: title screen renders, cards flip correctly, victory celebration shows
- Uses `@vitest/browser` with Playwright provider

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@vitest/browser": "^2.x",
    "@vitest/coverage-v8": "^2.x",
    "playwright": "^1.x",
    "vitest-canvas-mock": "^0.x",
    "jsdom": "^24.x"
  }
}
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit & integration tests
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    
    // Coverage
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/persistence/**'],
    },
  },
})
```

```typescript
// vitest.browser.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/browser/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
})
```

### Test File Structure

```
tests/
├── setup.ts                    # Canvas mocks, global setup
├── unit/
│   ├── engine/
│   │   ├── card-comparison.test.ts
│   │   ├── deck.test.ts
│   │   ├── war-resolution.test.ts
│   │   ├── win-conditions.test.ts
│   │   └── config-presets.test.ts
│   ├── persistence/
│   │   ├── profile-manager.test.ts
│   │   ├── save-load.test.ts
│   │   └── replay.test.ts
│   └── stats/
│       └── statistics.test.ts
├── integration/
│   ├── full-game-flow.test.ts
│   ├── event-sequences.test.ts
│   └── undo-redo.test.ts
├── browser/
│   ├── title-screen.test.ts
│   ├── card-flip-animation.test.ts
│   ├── war-sequence.test.ts
│   └── victory-screen.test.ts
└── golden/
    ├── title-screen.png
    ├── card-flip-mid.png
    └── victory-celebration.png
```

### Screenshot Testing

Browser tests use Playwright's screenshot comparison:

```typescript
// tests/browser/title-screen.test.ts
import { test, expect } from '@vitest/browser/context'

test('title screen renders correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('title-screen.png', {
    maxDiffPixelRatio: 0.01,  // Allow 1% variance for anti-aliasing
  })
})
```

Golden images stored in `tests/golden/`, updated with:
```bash
npm test -- --update-snapshots
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "test:coverage": "vitest run --coverage",
    "test:all": "npm run test && npm run test:browser"
  }
}
```

### Mocking Strategy

Unit tests mock canvas/WebGL to prevent import errors:

```typescript
// tests/setup.ts
import 'vitest-canvas-mock'

// Mock Three.js WebGLRenderer for any tests that import UI code
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
    })),
  }
})
```

The engine layer has **zero Three.js dependencies**, so most unit tests need no mocking at all.

## Future Considerations (Out of Scope for v1)

- Online multiplayer
- AI opponent
- Sound effects and music
- Card deck themes/skins
- Tournament mode
- Achievements
- Mobile app versions
- Cloud sync for profiles
