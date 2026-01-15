# War Card Game - Implementation Plan

## Git Coordination Strategy

We use **git worktrees** to allow 4 agents to work simultaneously on separate branches, with periodic merges to `main`.

### Setup (Run Once)

> **ALREADY COMPLETED** - Worktrees created on 2026-01-15. Skip to "OpenCode Windows" section.

```bash
# From the main repo directory
cd /Users/nateberkopec/src/tries/2026-01-15-vibe-game

# Create branches for each workstream
git checkout -b w1-engine
git checkout -b w2-persistence  
git checkout -b w3-rendering
git checkout -b w4-infrastructure
git checkout main

# Create worktrees (separate directories for each agent)
git worktree add ../war-game-w1 w1-engine
git worktree add ../war-game-w2 w2-persistence
git worktree add ../war-game-w3 w3-rendering
git worktree add ../war-game-w4 w4-infrastructure
```

This creates:
```
/Users/nateberkopec/src/tries/
├── 2026-01-15-vibe-game/     # Main repo (human coordination)
├── war-game-w1/               # Agent 1: Engine
├── war-game-w2/               # Agent 2: Persistence
├── war-game-w3/               # Agent 3: Rendering
└── war-game-w4/               # Agent 4: Infrastructure
```

### OpenCode Windows

Use the `bin/agents` script to launch all 4 agents in a tmux session:

```bash
# From the main repo
cd /Users/nateberkopec/src/tries/2026-01-15-vibe-game
bin/agents
```

This opens a tmux session with 4 panes, each running opencode in its worktree:
- **W1-Engine** - `war-game-w1/`
- **W2-Persistence** - `war-game-w2/`
- **W3-Rendering** - `war-game-w3/`
- **W4-Infrastructure** - `war-game-w4/`

**Tmux controls:**
- `Prefix + arrow keys` - Navigate between panes
- `Prefix + Q` - Kill all agents (custom binding)
- `Prefix + z` - Zoom current pane (toggle fullscreen)

**Other commands:**
```bash
bin/agents list   # Show worktree status
bin/agents nuke   # Kill the tmux session
```

**Manual alternative** (if you prefer separate terminals):
```bash
# Terminal 1 - Agent 1 (Engine)
cd /Users/nateberkopec/src/tries/war-game-w1
opencode

# Terminal 2 - Agent 2 (Persistence)
cd /Users/nateberkopec/src/tries/war-game-w2
opencode

# Terminal 3 - Agent 3 (Rendering)
cd /Users/nateberkopec/src/tries/war-game-w3
opencode

# Terminal 4 - Agent 4 (Infrastructure)
cd /Users/nateberkopec/src/tries/war-game-w4
opencode
```

### Branch Strategy

```
main (stable, human-managed)
 │
 ├── w1-engine         (Agent 1 commits here)
 ├── w2-persistence    (Agent 2 commits here)
 ├── w3-rendering      (Agent 3 commits here)
 └── w4-infrastructure (Agent 4 commits here)
```

### Agent Workflow

Each agent works in their worktree and commits to their branch:

```bash
# Agent commits their work
git add .
git commit -m "[W1] Implement card comparison logic"
git push origin w1-engine
```

### Sync Points (Human-Managed)

At phase boundaries, human merges all branches to main:

```bash
# From main repo
cd /Users/nateberkopec/src/tries/2026-01-15-vibe-game
git checkout main

# Merge infrastructure first (has build setup)
git merge w4-infrastructure --no-edit

# Then engine (has types others depend on)
git merge w1-engine --no-edit

# Then persistence and rendering
git merge w2-persistence --no-edit
git merge w3-rendering --no-edit

# Push main
git push origin main

# Update all worktrees to get merged code
cd ../war-game-w1 && git pull origin main --rebase
cd ../war-game-w2 && git pull origin main --rebase
cd ../war-game-w3 && git pull origin main --rebase
cd ../war-game-w4 && git pull origin main --rebase
```

### Getting Changes from Other Agents

When an agent needs another agent's code (e.g., Agent 2 needs types from Agent 1):

```bash
# Agent 2 pulls Agent 1's branch
cd /Users/nateberkopec/src/tries/war-game-w2
git fetch origin w1-engine
git merge origin/w1-engine --no-edit
```

Or wait for human to merge to main, then:

```bash
git pull origin main --rebase
```

### Conflict Resolution

If conflicts occur during merge:
1. Human resolves in main repo
2. Human pushes resolved main
3. Agents rebase onto updated main

### File Ownership (Minimize Conflicts)

Each agent owns specific directories - **don't edit other agents' files**:

| Agent | Owns | Can Read |
|-------|------|----------|
| W1 | `src/engine/*` | - |
| W2 | `src/persistence/*` | `src/engine/types.ts` |
| W3 | `src/ui/*` | `src/engine/types.ts`, `src/engine/events.ts` |
| W4 | `tests/*`, `*.config.*`, `.github/*` | Everything |

Shared files (edited by human only):
- `package.json` (after initial setup by W4)
- `PLAN.md`, `SPEC.md`
- `src/main.ts` (integration point)

### Quick Commands Reference

```bash
# See all worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../war-game-w1

# See what branch you're on
git branch --show-current

# See remote branches
git branch -r

# Fetch all remote changes
git fetch --all
```

---

## Overview

This plan organizes work into **4 parallel workstreams** that can be executed by independent agents. Work is divided into **3 phases**, with synchronization points between phases.

## Workstreams

| Workstream | Focus Area | Dependencies |
|------------|------------|--------------|
| **W1: Core Engine** | Game logic, rules, state management | None |
| **W2: Persistence** | Profiles, saves, replays, LocalStorage | W1 (types only) |
| **W3: Rendering** | Three.js, cards, animations, scenes | W1 (events interface) |
| **W4: Infrastructure** | Project setup, build, testing, CI | None |

---

## Phase 1: Foundation (Can Start Immediately)

All workstreams can begin in parallel. Minimal coordination needed.

### W1: Core Engine - Phase 1
**Goal**: Playable engine with classic rules, no persistence

- [ ] **1.1** Define TypeScript types (`src/engine/types.ts`)
  - Card, Deck, GameState, GameConfig, GameEvent types
  - Export for other workstreams to import

- [ ] **1.2** Implement Card & Deck (`src/engine/deck.ts`)
  - `createDeck()` - generate 52 cards with unique IDs
  - `shuffle(deck, seed?)` - Fisher-Yates with optional seeded RNG
  - `splitDeck(deck, count)` - divide deck between players
  - `compareCards(a, b, config)` - determine winner

- [ ] **1.3** Implement seeded RNG (`src/engine/rng.ts`)
  - Seedable PRNG for reproducible games/replays
  - `createRng(seed)`, `rng.next()`, `rng.getState()`, `rng.setState()`

- [ ] **1.4** Implement Event Emitter (`src/engine/events.ts`)
  - Simple typed pub/sub system
  - `on(event, callback)`, `off(event, callback)`, `emit(event, data)`

- [ ] **1.5** Implement Core Game Engine (`src/engine/engine.ts`)
  - Constructor takes GameConfig
  - `setPlayers()`, `start()`, `draw()`
  - State machine: setup → playing ↔ war → finished
  - Emit events for all state changes

- [ ] **1.6** Implement War Resolution (`src/engine/war.ts`)
  - Handle tie → war → nested war chains
  - Configurable face-down card count
  - Insufficient cards edge case

- [ ] **1.7** Implement Win Conditions (`src/engine/win-conditions.ts`)
  - Elimination (default)
  - First to N cards
  - Most cards after N rounds
  - (Timed games deferred to v2)

**Deliverable**: Engine that can run a complete game via `draw()` calls, emitting events

---

### W2: Persistence - Phase 1
**Goal**: LocalStorage abstraction and profile management

- [ ] **2.1** Import types from W1 (coordinate on `src/engine/types.ts`)

- [ ] **2.2** Implement Storage Abstraction (`src/persistence/storage.ts`)
  - `StorageAdapter` interface (for future backends)
  - `LocalStorageAdapter` implementation
  - Key prefixing: `war-game/profiles/`, `war-game/saves/`, etc.
  - JSON serialization/deserialization

- [ ] **2.3** Implement Profile Manager (`src/persistence/profiles.ts`)
  - `createProfile(name)` - generate UUID, initialize stats
  - `getProfile(id)`, `listProfiles()`, `deleteProfile(id)`
  - `updateProfile(id, updates)` - partial updates

- [ ] **2.4** Implement Profile Stats (`src/persistence/stats.ts`)
  - `recordGameResult(profile, gameSummary)` - update lifetime stats
  - Win streak tracking, records (fastest win, biggest comeback, etc.)
  - Recent games list (keep last 20)

- [ ] **2.5** Implement Settings Storage (`src/persistence/settings.ts`)
  - Global settings (last used profile, preferences)
  - `getSettings()`, `updateSettings()`

**Deliverable**: Can create/load/update profiles with stats in LocalStorage

---

### W3: Rendering - Phase 1
**Goal**: Three.js scene with static cards, responsive canvas

- [ ] **3.1** Three.js Scene Setup (`src/ui/scene.ts`)
  - Initialize renderer, scene, camera
  - Responsive canvas (resize handler)
  - Render loop with requestAnimationFrame

- [ ] **3.2** Card Geometry & Materials (`src/ui/card.ts`)
  - 3D card mesh (thin box geometry)
  - Card face textures (procedural or sprite sheet)
  - Card back texture
  - `createCard(rank, suit)` returns Three.js mesh

- [ ] **3.3** Card Texture Generation (`src/ui/card-textures.ts`)
  - Generate card faces procedurally (Canvas 2D → texture)
  - Rank + suit rendering
  - Simple, clean aesthetic

- [ ] **3.4** Table Layout (`src/ui/layout.ts`)
  - Position constants for: P1 deck, P2 deck, battlefield, war pile
  - Responsive positioning based on viewport

- [ ] **3.5** Basic Scene Composition (`src/ui/game-scene.ts`)
  - Render two deck stacks (card backs)
  - Render battlefield area
  - Static positioning (no animation yet)

**Deliverable**: Renders static game table with card decks

---

### W4: Infrastructure - Phase 1
**Goal**: Project builds, tests run, dev server works

- [ ] **4.1** Initialize Project
  ```bash
  npm init -y
  ```
  - Configure `package.json` with scripts
  - Add `.gitignore`

- [ ] **4.2** Configure TypeScript (`tsconfig.json`)
  - Strict mode
  - ES modules
  - Path aliases (`@engine/`, `@ui/`, `@persistence/`)

- [ ] **4.3** Configure Vite (`vite.config.ts`)
  - Dev server
  - Production build (single bundle for itch.io)
  - HTML entry point

- [ ] **4.4** Configure Vitest (`vitest.config.ts`)
  - jsdom environment
  - Setup file with canvas mocks
  - Coverage configuration

- [ ] **4.5** Configure Vitest Browser (`vitest.browser.config.ts`)
  - Playwright provider
  - Screenshot testing setup

- [ ] **4.6** Create Project Structure
  ```
  src/
  ├── engine/
  ├── persistence/
  ├── ui/
  └── main.ts
  tests/
  ├── unit/
  ├── integration/
  ├── browser/
  └── setup.ts
  index.html
  ```

- [ ] **4.7** Install Dependencies
  - Runtime: `three`
  - Dev: `typescript`, `vite`, `vitest`, `@vitest/browser`, `playwright`, `vitest-canvas-mock`, `jsdom`

- [ ] **4.8** Create `index.html` Shell
  - Minimal HTML for Three.js canvas
  - Import main.ts

**Deliverable**: `npm run dev` starts dev server, `npm test` runs (empty) tests

---

## Phase 1 Sync Point

Before Phase 2, ensure:
- [ ] W1 exports stable types that W2 and W3 can import
- [ ] W4 has working build that other workstreams can use
- [ ] Basic smoke test: engine can be instantiated, events fire

---

## Phase 2: Integration (Requires Phase 1)

### W1: Core Engine - Phase 2
**Goal**: Full feature set, undo/redo, replay support

- [ ] **1.8** Implement Config Presets (`src/engine/presets.ts`)
  - Classic, Quick, Marathon, Chaos presets
  - `getPreset(name)` returns GameConfig

- [ ] **1.9** Implement History Tracking (`src/engine/history.ts`)
  - Record all events
  - Checkpoint at round boundaries

- [ ] **1.10** Implement Undo/Redo (`src/engine/undo.ts`)
  - `undo()` - restore to previous round start
  - `redo()` - replay undone events
  - `canUndo()`, `canRedo()`

- [ ] **1.11** Implement Replay Export (`src/engine/replay.ts`)
  - `exportReplay()` - package config, seed, events
  - `createFromReplay(replay)` - reconstruct game

- [ ] **1.12** Implement Game Stats Calculation (`src/engine/stats.ts`)
  - Calculate stats from event history
  - Wars count, longest chain, card rank wins, etc.

**Deliverable**: Full-featured engine with undo/redo and replay

---

### W2: Persistence - Phase 2
**Goal**: Save/load games, replay storage

- [ ] **2.6** Implement Save Manager (`src/persistence/saves.ts`)
  - `saveGame(engine)` - serialize full state + history
  - `loadGame(id)` - deserialize and return
  - `listSaves()`, `deleteSave(id)`
  - Auto-save support

- [ ] **2.7** Implement Replay Storage (`src/persistence/replays.ts`)
  - `saveReplay(replay)` - store in LocalStorage
  - `loadReplay(id)`, `listReplays()`, `deleteReplay(id)`

- [ ] **2.8** Implement Data Migration (`src/persistence/migration.ts`)
  - Version stored data
  - Migrate old formats on load

**Deliverable**: Full persistence layer for saves, replays, profiles

---

### W3: Rendering - Phase 2
**Goal**: Animations, UI text, game flow screens

- [ ] **3.6** Card Flip Animation (`src/ui/animations/card-flip.ts`)
  - 3D rotation animation (face-down → face-up)
  - Configurable duration, easing

- [ ] **3.7** Card Movement Animation (`src/ui/animations/card-move.ts`)
  - Animate cards to winner's deck
  - War pile collection animation

- [ ] **3.8** Animation System (`src/ui/animations/animator.ts`)
  - Queue animations
  - Sequential and parallel execution
  - Completion callbacks

- [ ] **3.9** UI Text Rendering (`src/ui/text.ts`)
  - Player names and card counts
  - Round result announcements
  - "WAR!" dramatic text
  - HTML overlay or Three.js text sprites

- [ ] **3.10** Title Screen (`src/ui/screens/title.ts`)
  - "WAR" title
  - Player name inputs
  - Start button
  - Profile selection (if profiles exist)

- [ ] **3.11** Victory Screen (`src/ui/screens/victory.ts`)
  - Winner announcement
  - Animated celebration (cards flying, confetti)
  - Stats display
  - Play again button

**Deliverable**: Full visual experience with animations and screens

---

### W4: Infrastructure - Phase 2
**Goal**: Tests for all modules, CI pipeline

- [ ] **4.9** Write Engine Unit Tests
  - `card-comparison.test.ts`
  - `deck.test.ts`
  - `war-resolution.test.ts`
  - `win-conditions.test.ts`
  - `config-presets.test.ts`

- [ ] **4.10** Write Persistence Unit Tests
  - `profile-manager.test.ts`
  - `save-load.test.ts`
  - `replay.test.ts`

- [ ] **4.11** Write Integration Tests
  - `full-game-flow.test.ts`
  - `event-sequences.test.ts`
  - `undo-redo.test.ts`

- [ ] **4.12** Setup GitHub Actions CI (`.github/workflows/ci.yml`)
  - Run unit tests on push
  - Run browser tests on push
  - Build check

**Deliverable**: Comprehensive test coverage, CI green

---

## Phase 2 Sync Point

Before Phase 3, ensure:
- [ ] Engine fully working with all features
- [ ] Persistence fully working
- [ ] Animations smooth and complete
- [ ] All unit and integration tests passing

---

## Phase 3: Polish & Ship (Requires Phase 2)

### W1: Core Engine - Phase 3
**Goal**: Edge cases, optimization

- [ ] **1.13** Handle All Edge Cases
  - Simultaneous empty decks
  - Multiple nested wars exhausting both decks
  - Round-limited games ending in ties

- [ ] **1.14** Performance Optimization
  - Profile and optimize hot paths
  - Minimize allocations in game loop

---

### W2: Persistence - Phase 3
**Goal**: Polish, error handling

- [ ] **2.9** LocalStorage Quota Handling
  - Detect quota exceeded
  - Offer to delete old saves/replays
  - Graceful degradation

- [ ] **2.10** Data Validation
  - Validate loaded data
  - Handle corrupted saves gracefully

---

### W3: Rendering - Phase 3
**Goal**: Polish, mobile support, celebration effects

- [ ] **3.12** Confetti Effect (`src/ui/effects/confetti.ts`)
  - Particle system for victory celebration

- [ ] **3.13** Card Scatter Effect (`src/ui/effects/card-scatter.ts`)
  - Flying cards on victory

- [ ] **3.14** Touch Input Support (`src/ui/input.ts`)
  - Touch events for mobile
  - Click/tap anywhere to advance

- [ ] **3.15** Loading Screen (`src/ui/screens/loading.ts`)
  - Show while assets initialize
  - Progress indicator

- [ ] **3.16** Mobile Layout Adjustments
  - Responsive card sizes
  - Touch-friendly UI elements

---

### W4: Infrastructure - Phase 3
**Goal**: Browser tests, build optimization, ship

- [ ] **4.13** Write Browser E2E Tests
  - `title-screen.test.ts`
  - `card-flip-animation.test.ts`
  - `war-sequence.test.ts`
  - `victory-screen.test.ts`

- [ ] **4.14** Capture Golden Images
  - Run tests, capture screenshots
  - Review and commit golden images

- [ ] **4.15** Production Build Optimization
  - Minification
  - Tree shaking
  - Bundle size analysis

- [ ] **4.16** Create itch.io Package
  - Build production bundle
  - Create ZIP with index.html + assets
  - Test in itch.io sandbox

- [ ] **4.17** Deploy to GitHub Pages
  - Create `.github/workflows/deploy.yml` for GitHub Pages deployment
  - Configure Vite base path for GitHub Pages (`/war-game-tutorial/`)
  - Workflow triggers on push to main, builds with Vite, deploys to gh-pages
  - Game will be live at: https://nateberkopec.github.io/war-game-tutorial/

- [ ] **4.18** Documentation
  - Update README with build/run instructions
  - Document game rules for players
  - Add links to live demo (GitHub Pages) and itch.io

**Deliverable**: Shippable game ready for itch.io and live on GitHub Pages

---

## Task Assignment Summary

| Phase | W1: Engine | W2: Persistence | W3: Rendering | W4: Infrastructure |
|-------|------------|-----------------|---------------|-------------------|
| **1** | 1.1-1.7 (7 tasks) | 2.1-2.5 (5 tasks) | 3.1-3.5 (5 tasks) | 4.1-4.8 (8 tasks) |
| **2** | 1.8-1.12 (5 tasks) | 2.6-2.8 (3 tasks) | 3.6-3.11 (6 tasks) | 4.9-4.12 (4 tasks) |
| **3** | 1.13-1.14 (2 tasks) | 2.9-2.10 (2 tasks) | 3.12-3.16 (5 tasks) | 4.13-4.18 (6 tasks) |

**Total**: 58 tasks across 4 workstreams

---

## Critical Path

```
Phase 1: W4 (infra) ──┬── W1 (types) ───┐
                      │                  │
                      ├── W2 (storage) ──┼── Phase 2
                      │                  │
                      └── W3 (scene) ────┘
                      
Phase 2: All workstreams build on Phase 1 ─── Phase 3: Polish & Ship
```

**Blocking dependencies**:
1. W1 types must be defined before W2/W3 can fully integrate
2. W4 build setup needed before any workstream can run code
3. Phase 2 requires Phase 1 deliverables
4. Phase 3 requires Phase 2 deliverables

**Non-blocking**:
- W2 can stub types and develop storage abstraction in parallel
- W3 can develop Three.js rendering independent of game logic
- W4 can write test infrastructure before code exists

---

## Coordination Points

### Daily Sync Topics
1. Any type changes in `src/engine/types.ts`?
2. Any new events added to the event system?
3. Build/test infrastructure issues?
4. Blocking dependencies resolved?

### Integration Milestones
- **M1**: Engine emits events, UI subscribes (W1 + W3)
- **M2**: Game results saved to profiles (W1 + W2)
- **M3**: Full game playable in browser (W1 + W2 + W3)
- **M4**: All tests passing (W4 validates all)

---

## Agent Orchestration Guide

### Agent Assignment
| Agent | Workstream | Primary Focus |
|-------|------------|---------------|
| **Agent 1** | W1: Core Engine | Game logic, rules, state |
| **Agent 2** | W2: Persistence | Profiles, saves, LocalStorage |
| **Agent 3** | W3: Rendering | Three.js, cards, animations |
| **Agent 4** | W4: Infrastructure | Build, tests, CI, deployment |

---

### Phase 1 Instructions

#### Agent 1 (Engine)
**Start immediately. No waiting.**

1. Begin with task 1.1 (`src/engine/types.ts`) - this unblocks Agents 2 and 3
2. Commit and push `types.ts` as soon as it's complete
3. Proceed with tasks 1.2-1.7 in order
4. When done, signal: "Phase 1 complete. Types stable. Engine instantiates and emits events."

**Output needed by others:**
- `src/engine/types.ts` (Agent 2 and 3 import this)
- Working `WarGameEngine` class that can be instantiated

#### Agent 2 (Persistence)
**Wait for:** Agent 1 to complete task 1.1 (`types.ts`)

1. Start with task 2.2 (storage abstraction) - this has no dependencies
2. Once Agent 1 pushes `types.ts`, pull and complete task 2.1
3. Proceed with tasks 2.3-2.5
4. When done, signal: "Phase 1 complete. Profiles can be created/loaded/saved."

**How to wait:** Poll the repo every 10-15 minutes for `src/engine/types.ts`, or start with 2.2 which needs no types.

#### Agent 3 (Rendering)
**Start immediately. No waiting in Phase 1.**

1. Begin with task 3.1 (Three.js scene setup) - completely independent
2. Proceed with tasks 3.2-3.5
3. You'll need types in Phase 2, but Phase 1 rendering is standalone
4. When done, signal: "Phase 1 complete. Static game table renders with card decks."

**Note:** You can define local placeholder types if needed, replace with imports in Phase 2.

#### Agent 4 (Infrastructure)
**Start immediately. Critical path - others need your output.**

1. Complete tasks 4.1-4.8 as fast as possible
2. Push working config files so other agents can run `npm run dev` and `npm test`
3. Create empty placeholder files in the directory structure so imports don't fail
4. When done, signal: "Phase 1 complete. Run `npm install && npm run dev` to start. `npm test` runs."

**Output needed by others:**
- `package.json` with all dependencies
- `tsconfig.json` with path aliases
- `vite.config.ts` working
- Directory structure created

---

### Phase 1 → Phase 2 Sync

**All agents STOP and wait for human confirmation before starting Phase 2.**

Checklist for human to verify:
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts dev server
- [ ] `npm test` runs (even if no tests yet)
- [ ] `src/engine/types.ts` exists and exports core types
- [ ] Engine can be instantiated: `new WarGameEngine(config)`
- [ ] Three.js scene renders (static cards visible)
- [ ] Profile can be created and retrieved from LocalStorage

Once verified, human tells all agents: **"Proceed to Phase 2"**

---

### Phase 2 Instructions

#### Agent 1 (Engine)
**Start immediately when Phase 2 begins.**

1. Complete tasks 1.8-1.12 in order
2. Coordinate with Agent 2 on save format (task 1.9 history affects 2.6)
3. When done, signal: "Phase 2 complete. Undo/redo works. Replays can be exported."

**Coordinate with Agent 2:** Agree on `SavedGame` and `Replay` serialization format.

#### Agent 2 (Persistence)  
**Start immediately when Phase 2 begins.**

1. Complete tasks 2.6-2.8
2. Task 2.6 requires Agent 1's history format - coordinate or wait for task 1.9
3. When done, signal: "Phase 2 complete. Games can be saved/loaded. Replays stored."

**Wait for:** Agent 1 to complete task 1.9 (history tracking) before finalizing save format.

#### Agent 3 (Rendering)
**Start immediately when Phase 2 begins.**

1. Complete tasks 3.6-3.11
2. Task 3.10 (title screen) and 3.11 (victory) need to integrate with engine events
3. Subscribe to engine events from Agent 1 - coordinate on event names/payloads
4. When done, signal: "Phase 2 complete. Animations work. Title and victory screens render."

**Coordinate with Agent 1:** Confirm event types match what you're subscribing to.

#### Agent 4 (Infrastructure)
**Wait for:** Agents 1, 2, 3 to have testable code before writing tests.

1. Begin task 4.12 (CI setup) immediately - no dependencies
2. Start writing tests as other agents complete their modules:
   - Wait ~30min, then start engine tests (4.9)
   - Wait ~30min more, then persistence tests (4.10)
   - Integration tests (4.11) last
3. When done, signal: "Phase 2 complete. All unit tests passing. CI pipeline runs."

**How to wait:** Check for exported functions in other agents' modules before writing tests for them.

---

### Phase 2 → Phase 3 Sync

**All agents STOP and wait for human confirmation before starting Phase 3.**

Checklist for human to verify:
- [ ] Full game is playable in browser (click to draw, war works, game ends)
- [ ] Profiles persist across page reloads
- [ ] Save/load game works
- [ ] Undo/redo works
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] CI pipeline is green

Once verified, human tells all agents: **"Proceed to Phase 3"**

---

### Phase 3 Instructions

#### Agent 1 (Engine)
**Start immediately when Phase 3 begins.**

1. Tasks 1.13-1.14 are polish and edge cases
2. Work with Agent 4 to identify any failing edge case tests
3. When done, signal: "Phase 3 complete. All edge cases handled. Performance optimized."

#### Agent 2 (Persistence)
**Start immediately when Phase 3 begins.**

1. Tasks 2.9-2.10 are error handling and validation
2. Test with full LocalStorage to verify quota handling
3. When done, signal: "Phase 3 complete. Error handling robust. Data validation complete."

#### Agent 3 (Rendering)
**Start immediately when Phase 3 begins.**

1. Tasks 3.12-3.16 are polish and mobile support
2. Test on mobile viewport sizes
3. When done, signal: "Phase 3 complete. Effects look good. Mobile works."

#### Agent 4 (Infrastructure)
**Start immediately when Phase 3 begins.**

1. Tasks 4.13-4.17 are browser tests and shipping
2. Coordinate with Agent 3 on screenshot timing for golden images
3. Final task: create itch.io ZIP package
4. When done, signal: "Phase 3 complete. All tests pass. itch.io package ready."

**Wait for:** Agent 3 to complete effects before capturing golden images.

---

### Communication Protocol

When agents need to coordinate:

1. **Signaling completion:** Push code and add a commit message like:
   ```
   [W1] Phase 1 complete - types stable, engine works
   ```

2. **Requesting information:** Create a file `COORDINATION.md` with questions:
   ```markdown
   ## Questions for Agent 1
   - What is the exact shape of GameEvent for 'roundWon'?
   
   ## Questions for Agent 3  
   - What screen dimensions should golden images use?
   ```

3. **Blocking issues:** If truly blocked, add to `COORDINATION.md`:
   ```markdown
   ## BLOCKED: Agent 2
   Waiting for: Agent 1 task 1.9 (history format)
   Can proceed with: Nothing until this is resolved
   ```

Human reviews `COORDINATION.md` periodically and relays answers or unblocks agents.

---

### Quick Reference: What Each Agent Waits For

| Agent | Phase 1 Wait | Phase 2 Wait | Phase 3 Wait |
|-------|--------------|--------------|--------------|
| **1 (Engine)** | Nothing | Nothing | Nothing |
| **2 (Persistence)** | Agent 1 task 1.1 (~30min) | Agent 1 task 1.9 (~1hr) | Nothing |
| **3 (Rendering)** | Nothing | Agent 1 event interface | Agent 4 for golden images |
| **4 (Infrastructure)** | Nothing | Other agents' code exists | Agent 3 effects complete |

All agents wait for **human confirmation** between phases.
