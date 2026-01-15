# War Card Game

A browser-based implementation of the classic card game **War** built with Three.js, featuring 3D card animations and hot-seat multiplayer.

**[Play Now](https://nateberkopec.github.io/war-game-tutorial/)** | **[View on itch.io](https://nateberkopec.itch.io/war-game)**

---

## About

This project is a tutorial/experiment in **multi-agent development** - building a complete game using 4 parallel AI coding agents, each owning a different part of the codebase:

| Agent | Workstream | Responsibility |
|-------|------------|----------------|
| W1 | Core Engine | Game logic, rules, state management |
| W2 | Persistence | LocalStorage, profiles, saves, replays |
| W3 | Rendering | Three.js, cards, animations, UI |
| W4 | Infrastructure | Build, tests, CI/CD, deployment |

See [PLAN.md](./PLAN.md) for the full implementation plan and coordination strategy.

---

## Features

- 3D card flip animations with Three.js
- Hot-seat local multiplayer (2 players, same device)
- Multiple game modes: Classic, Quick, Marathon, Chaos
- Player profiles with persistent stats
- Save/load games and replay system
- Undo/redo support
- Responsive design (desktop + mobile)
- No server required - runs entirely in browser

---

## Tech Stack

- **Renderer**: [Three.js](https://threejs.org/)
- **Build**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Testing**: Vitest + Playwright
- **Deployment**: GitHub Pages + itch.io

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── engine/        # Game logic (W1)
│   ├── types.ts
│   ├── deck.ts
│   ├── engine.ts
│   └── ...
├── persistence/   # Storage layer (W2)
│   ├── storage.ts
│   ├── profiles.ts
│   └── ...
├── ui/            # Three.js rendering (W3)
│   ├── scene.ts
│   ├── card.ts
│   └── ...
└── main.ts        # Entry point

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── browser/       # E2E browser tests
```

---

## Game Rules

1. Deck is shuffled and split evenly between two players (26 cards each)
2. Both players flip their top card simultaneously
3. Higher card wins both cards (Ace high)
4. **War**: On a tie, each player places 1 card face-down, then 1 face-up
5. Higher face-up card wins all cards
6. Game ends when one player has all 52 cards

---

## License

MIT
