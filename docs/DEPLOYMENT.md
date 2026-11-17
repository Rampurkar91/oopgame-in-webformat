# Deployment runbook

## Vercel (basic single-player)

Import this GitHub repository. Choose the implementation branch `arena/e2969ac9-oopgame-in-webformat` for its preview deployment, or merge it into your production branch after review.

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Vite |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | 22.x |
| Environment variables | None |

`frontend/public/wasm/game.js`, `game.wasm` and `boot.js` are copied to `dist/wasm`. The checked-in Vercel configuration sets the WebAssembly content type, requires revalidation for the loader/binary pair and supplies static SPA fallback. Static files take precedence over the fallback. Hash navigation keeps deep links robust on other static hosts, too.

Do not add a Vercel function for the engine. Do not run a C++ server or install SFML. No COOP/COEP isolation headers are needed: the engine is single-threaded and does not use SharedArrayBuffer.

### Release checklist

1. Run native C++ tests.
2. If C++ changed, activate Emscripten 6.0.9 and run `./scripts/build-wasm.sh`.
3. Commit **both** generated engine assets with the matching source.
4. Run `npm ci`, `npm run test:wasm`, `npm run build` and `npm run test:e2e` in `frontend`.
5. Push to your implementation branch; inspect GitHub Actions.
6. Deploy that branch in Vercel; record the URL supplied by Vercel after success.
7. Verify in an actual browser:
   - `/wasm/game.js` is JavaScript, not the SPA HTML.
   - `/wasm/game.wasm` is a WASM binary with `application/wasm`.
   - Start, dispatch, watch a delivery, inspect score/fuel/beds.
   - Pause, save, refresh and load.
   - Open `/#Pathfinder`, calculate a route and refresh it.
   - Test a mobile viewport.

If the engine fails to initialize, check the Network console for missing WASM assets, MIME errors or accidentally cached mismatched loader/binary. Serving via HTTP(S), rather than opening `index.html` from disk, is required.

## Render

Not used or required. The complete single-player operation and local save/load run in the browser. A future authenticated cloud leaderboard would be a separate service, with score verification and account security; it is intentionally not represented by an insecure placeholder API here.

## Deployment status

A local preview and the production build can be tested without a hosting account. Creating a public Vercel production URL requires the repository owner's authorized Vercel account. The code does not claim that a live deployment exists before that step has succeeded.
