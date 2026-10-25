# Final Score

An offline-first PWA for scoring board and card games on your phone. It currently supports **Skull King**, **Flip 7**, **Bank** and **Herd Mentality**.

- Choose a game to see past results, start a rematch with the same players, or start a new game. Names you've used before are suggested as you type.
- Everything stays on the device in IndexedDB. There's no account, no server and no sync.
- It installs to the home screen and works with no connection.
- It updates itself. When a new version is deployed, phones pick it up the next time they open the app or switch back to it. A held-back update waits until no game is on screen.

## Games

| Game | Scoring |
|---|---|
| Skull King | **Classic:** 20 per trick bid, −10 per trick off. A zero bid scores ±10 × the round number. Bonuses count only when the bid is made: 14s, the black 14, captures, Loot. **Rascal:** points per card dealt, with Grapeshot (half points when off by one) or Cannonball (15 per card, all or nothing). |
| Bank | The app is the bank. Enter rolls from your own dice, or tap the on-screen dice to roll. In the first three rolls a 7 adds 70; after that doubles double the bank and a 7 ends the round. Tap a player to bank their points. 10 rounds by default. |
| Herd Mentality | The app asks the questions: a built-in bank of original questions, which can be turned off if you use the cards. Tap who was in the herd (one cow each) and the odd one out (they take the pink cow). First to 8 cows wins, but not while holding the pink cow. |
| Flip 7 | Type the score, tap **Bust**, or count it with the card picker. The x2 card doubles the number cards. Seven different numbers add +15. The game ends after the round in which someone reaches the target (200 by default). |

## Adding a game

Each game lives in `src/games/<id>/` and is registered in `src/games/registry.ts`:

- `rules.ts`: pure scoring functions, with tests in `tests/`.
- `RoundEntry.svelte`: the input for one round.
- `Options.svelte`: the settings on the new-game screen.
- `Art.svelte`: the artwork for the home tile.
- `index.ts`: a `GameDefinition` (see `src/games/types.ts`) that ties these together, plus a theme class in `src/app.css`.

Home, history, rematch, player suggestions, the scoreboard and storage are shared by every game.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (scoring rules, storage)
npm run check        # type check
npm run build && npx vite preview --port 4173 &
npm run e2e          # headless Chromium walkthrough; screenshots in e2e/shots
```

## Deploy

Pushing to `main` builds `ghcr.io/yesterdayforgotten/final-score:latest`, as set up in `.github/workflows/docker.yml`. Run it with `docker-compose.yml`, which serves nginx on port 8092.

Phones only install and run PWAs offline over **HTTPS**, so put the container behind a TLS reverse proxy. For example, Apache:

```apache
<VirtualHost *:443>
    ServerName scores.example.com
    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:8092/
    ProxyPassReverse / http://127.0.0.1:8092/
</VirtualHost>
```

To update, re-pull the image and recreate the container. Installed apps update on their own.
