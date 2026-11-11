# Neon Courier — Cyber Delivery

An offline-friendly, keyboard and touch arcade game about making three deliveries across a procedural night city. The game has no runtime dependencies, external assets, analytics, or network calls.

## Play

Requires Node.js 20 or newer.

```sh
npm run dev
```

Open the local address printed by the server (by default `http://localhost:4173`). Press **Start night shift** to begin.

- **WASD** or **arrow keys** — ride
- **Shift** — boost (charge refills while not boosting)
- **E**, **Space**, or the nearby action button — pick up or deliver
- **P** or **Escape** — pause or resume
- **Restart shift** — begin a fresh run

Follow the mint marker to the pickup, then to the delivery point. Deliver all three packages before time expires and keep at least one integrity point. Each successful delivery repairs one point and refills boost. Best score is stored locally in this browser when storage is available.

## Build and checks

```sh
npm test
npm run build
npm run preview
```

`npm run build` copies the complete static game into `dist/`; `npm run preview` serves that directory. The game can be hosted as static files and makes no requests beyond the host. There is no service worker, so a browser must be able to load the files from its local server or host before play.

The rules and seeded traffic are implemented in `src/model.js`. `tests/model.test.mjs` covers objective progression, time and pause behavior, collisions, terminal states, deterministic setup, and best-score storage failures.

## Project notes

- All city art is drawn in Canvas from deterministic geometry at runtime.
- Sound is optional and synthesized with the browser audio API after the player enables it.
- The game is a compact arcade demo: traffic follows fixed lanes, and there is no account, online leaderboard, or persistent save beyond the local best score.

## Screenshots

The `screenshots/` directory contains captures taken from the production preview: ready screen, pickup range, pause state, mobile controls, and the completed three-delivery run.
