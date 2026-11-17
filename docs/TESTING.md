# Testing

## Executed locally

- Native C++17 CMake build and CTest engine suite: passed.
- Actual compiled WebAssembly imported and exercised in Node.js: passed.
- TypeScript check and Vite production build: passed.
- Chromium browser checks against Vite development: passed with no page errors.
- Playwright suite against Vite **production preview**: 4 tests passed.
- Mobile viewport (390 × 844): no horizontal document overflow.

## Native regression coverage

Grid endpoints, blocked cells, four-direction path adjacency, route distance, pause behavior, duplicate rescue rejection, medical kits, fuel, hospital occupancy/reservations, scoring, full eight-civilian operation, terminal state, valid save replay, malformed/invalid save rejection and atomic load behavior. Tests use explicit runtime checks, not `assert`, so Release builds retain assertions.

## WASM integration coverage

Actual JS loader and binary instantiation; every getter; map dimensions; route endpoints and blocked-cell avoidance; selecting and dispatching; pause/resume; rescue completion; score and fuel; save, reset, load; corrupted save rejection; complete operation through compiled C++ exports.

## Browser coverage

1. WASM MIME type/magic bytes, successful initialization, dispatch, pause, save, refresh, load, real delivery and navigation between management pages.
2. Dijkstra route visualization and blocked-endpoint rejection.
3. Restart confirmation resets the operation.
4. Mobile navigation and overflow checks.

### Commands

```bash
cmake -S cpp-engine -B build/native
cmake --build build/native --parallel 2
ctest --test-dir build/native --output-on-failure
cd frontend
npm ci
npm run test:wasm
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright starts a production preview server automatically on port 4173. Set `CHROMIUM_EXECUTABLE_PATH` only if using an existing system Chromium installation. The regular workflow installs Playwright's browser and OS dependencies.

## Limits of local verification

A production Vercel deployment cannot be declared tested until deployed with an authorized hosting account. The Vercel configuration is supplied; run the release checklist in `DEPLOYMENT.md` on the actual public URL. Safari/Firefox and assistive-technology testing have not been performed. The suite currently targets Chromium.
