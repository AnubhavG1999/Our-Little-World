# Our Little World

A little pixel-art room for two, made by **Pratiksha**. Walk around, kiss, cuddle, feed the cat, water the plant, leave Letters, keep Memories, play games, pin places on Our Map, plan the future, and listen to music together, live across Kolkata and Chicago.

Play it at **https://anubhavg1999.github.io/Our-Little-World/** (sign-in is limited to the two of us).

## How it's put together

- `index.html` + `css/style.css`: the page. No build step, no framework.
- `js/`: plain scripts, loaded in order:
  - `room.js`: Pratiksha's original game (Characters, Pair moments, the cat, furniture, chat).
  - `sync.js`: Firebase sign-in and live sync.
  - `ui.js`: panels, menus and Speech bubbles.
  - `gamer.js`: the phone close-up view.
  - One file per feature: `memories.js`, `games.js`, `map.js`, `plans.js`, `jar.js`, `music.js`, `wardrobe.js`, `settings.js`, `extras.js`.
- `assets/`: Pratiksha's art and the app icons.
- `CONTEXT.md`: the game's vocabulary. `docs/adr/`: why things are the way they are. `docs/sprite-wishlist.md`: art that would make it better.

## Running it locally

Serve the folder with any static server and open it on `localhost` (Google sign-in allows `localhost`), for example:

```
npx http-server -p 5577 -c-1
```

Without Firebase it falls back to playing on one device, saving to the browser.

## Free by design

GitHub Pages hosts the page. Firebase's free plan holds the shared data (Firestore) and sign-in. Spotify runs through a developer app (see `docs/adr/0004`). Nothing here needs a credit card.
