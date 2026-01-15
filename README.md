# War Card Game

A browser-based card game built with Three.js. Two players flip cards. The higher card wins. It's that simple.

**[Play Now](https://nateberkopec.github.io/war-game-tutorial/)** | **[View on itch.io](https://nateberkopec.itch.io/war-game)**

## About

This project is a tutorial on **multi-agent development**. I built the entire game using 4 AI coding agents working at the same time. Each agent owned a different part of the code:

| Agent | Area | What It Built |
|-------|------|---------------|
| W1 | Engine | Game logic, rules, state |
| W2 | Storage | Profiles, saves, replays |
| W3 | Graphics | Three.js, cards, animations |
| W4 | Build | Tests, CI/CD, deployment |

Want to learn how this works?

- **[Tutorial](./tutorial/tut.md)** - My thoughts as I built this, written by hand
- **[OpenCode Session](https://opncd.ai/share/GoTBTAgl)** - The first planning session where I talked to the AI
- **[Full Plan](./PLAN.md)** - The step-by-step plan the agents followed

## Features

- 3D card flip animations
- Local multiplayer (2 players, same screen)
- Four game modes: Classic, Quick, Marathon, Chaos
- Player profiles with stats that save between games
- Save and load games
- Watch replays of past games
- Undo and redo moves
- Works on desktop and mobile
- No server needed - runs in your browser

## How to Play

1. Each player gets 26 cards
2. Both players flip their top card
3. Higher card wins both cards (Ace is highest)
4. **War**: On a tie, each player puts 1 card face-down, then 1 face-up
5. Higher face-up card wins all the cards
6. First player to get all 52 cards wins

## Development

```bash
# Install
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Three.js](https://threejs.org/) | 3D graphics |
| [Vite](https://vitejs.dev/) | Build tool |
| TypeScript | Language |
| Vitest + Playwright | Testing |
| GitHub Pages | Hosting |

## Project Structure

```
src/
├── engine/        # Game logic (rules, deck, state)
├── persistence/   # Storage (profiles, saves, replays)
├── ui/            # Graphics (Three.js, animations)
└── main.ts        # Entry point

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── browser/       # End-to-end browser tests

tutorial/
├── tut.md         # Human-written tutorial
└── SPEC.md        # Original game spec
```

## License

MIT
