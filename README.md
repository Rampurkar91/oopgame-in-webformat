# Disaster Rescue Commander

A browser-based disaster response simulation with a **real C++17 engine compiled to WebAssembly** and a React command-centre interface. No backend, account, API key, desktop software or player-side compilation is required.

> Repository inspection: the starting repository contained only a README, not an existing C++ game. This implementation therefore introduces a new OOP engine rather than claiming to reuse unavailable source. The scenario uses the requested 9 × 13 grid. The Pune map is fictional, not real emergency navigation.

## Play locally

Requires Node.js 20.19+ (Node.js 22 recommended).

```bash
cd frontend
npm ci
npm run dev
```

Open the address printed by Vite. **Compiled `game.js` and `game.wasm` are included** in `frontend/public/wasm`, so installing Emscripten is unnecessary unless you change the engine.

### How to play

1. Start the simulation. Select one of four response units on the map or in the fleet panel.
2. Choose a waiting civilian and click **Dispatch rescue unit**.
3. The C++ engine validates fuel, medical supplies and hospital capacity, reserves a bed and computes pickup and delivery routes.
4. Watch the unit follow the actual C++ route, collect the civilian and deliver them to a hospital.
5. Deploy other units in parallel. Prioritize critical civilians and keep an eye on fuel.
6. Pause/resume, change simulation cadence (1×/2×/4×), save locally, or load your saved operation after refreshing.

The operation ends after all eight rescues, 600 engine ticks, or when no active/feasible mission remains. Each unit carries one patient. A grid step costs one fuel (two for helicopters); pickup uses one medical kit. Fire stations are staging facilities, not refueling depots. Two hospitals have four beds each. Critical rescues earn 300 points, urgent 200 and stable 100. Ambulances add 25 points on successful delivery. No points are awarded until hospital arrival.

## Interface

- **Overview** — introductory landing screen (click the RESCUE logo).
- **Dashboard** — metrics, interactive map, dispatch, fleet and event feed.
- **City map** — clickable units and civilians, blocked cells, facilities, live routes, zoom and layers.
- **Rescue fleet** — unit selection, fuel, supplies and mission progress.
- **Civilians** — searchable register, severity and rescue state.
- **Missions** — dispatch, pickup and completed-delivery tracking.
- **Facilities** — occupancy and beds reserved for incoming patients.
- **Pathfinder** — animated Dijkstra exploration using the engine's visited nodes and reconstructed route.
- **Analytics** — score breakdown and engine-generated rescue history.
- **Field guide** — instructions, engine architecture and save/load controls.

Pages use hash navigation, so refreshing any page works with static hosting. The dashboard is the initial screen; the logo opens the landing page.

## Architecture

```text
cpp-engine/
  include/
    core/           # Game, shared types and umbrella Engine.hpp
    entities/       # Abstract Person, Civilian
    vehicles/       # Abstract/polymorphic Vehicle and four unit subclasses
    facilities/     # Facility, Hospital, FireStation
    algorithms/     # Dijkstra path and exploration results
    map/            # 9 × 13 DisasterMap
    managers/       # GameManager, RescueManager, ScoreManager
  src/              # C++ engine implementations and embind entry point
  tests/            # Native engine regression tests
  vendor/json.hpp   # nlohmann/json 3.11.3 (MIT)
  CMakeLists.txt
frontend/
  public/wasm/      # Precompiled engine, loader and native-module bootstrap
  src/              # React, TypeScript, Tailwind, Framer Motion, Lucide, Recharts
  tests/            # Playwright browser tests
  vercel.json
scripts/
  build-wasm.sh
  test-wasm.mjs
.github/workflows/ci.yml
```

**React does not implement routing, rescue rules, fuel arithmetic, scoring or capacity logic.** It renders serialized engine state and sends commands through embind. SVG position transforms and animation timing are presentation only. The browser clock is informational and separate from engine ticks. All simulation timing advances through C++ commands, not elapsed wall-clock assumptions.

C++ owns grid validation, Dijkstra, vehicle state, pickup/delivery transitions, bed reservations, civilian priorities (STL priority queue), score calculation, notifications, history and game-over checks. C++ classes demonstrate abstraction, virtual dispatch, inheritance, RAII/`unique_ptr`, encapsulation and STL containers.

Saves contain versioned **command logs**, not arbitrary writable state snapshots. Loading replays every command against a fresh C++ engine and replaces the current state only after the complete log validates. Invalid saves cannot partially modify a running game. Save size and command count are bounded. Storage is local to the current browser/origin; it is not a cloud backup.

See [Engine API](docs/ENGINE.md), [deployment](docs/DEPLOYMENT.md) and [testing](docs/TESTING.md).

## Rebuild the C++ engine

Install CMake, Python 3, Node.js and the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html). With an activated SDK:

```bash
source /path/to/emsdk/emsdk_env.sh
./scripts/build-wasm.sh
```

Alternatively set `EMSDK=/path/to/emsdk` and the script will source its environment. CMake uses Emscripten's toolchain and creates:

```text
frontend/public/wasm/game.js
frontend/public/wasm/game.wasm
```

The checked-in artifacts were built and tested with Emscripten **6.0.9**. CI uses the same version. Rebuild and commit **both** generated files whenever you change C++. Do not edit the generated loader manually. `boot.js` is a handwritten native-module bootstrap, not generated game logic. It allows the same loader to work in Vite development and production.

## Tests and production build

```bash
# Native C++ tests (no Emscripten needed)
cmake -S cpp-engine -B build/native
cmake --build build/native --parallel 2
ctest --test-dir build/native --output-on-failure

# Actual WebAssembly + production frontend
cd frontend
npm ci
npm run test:wasm
npm run build

# Browser tests against the production build
npx playwright install --with-deps chromium
npm run test:e2e

# Serve the production build manually
npm run preview
```

GitHub Actions recompiles C++, runs native tests, rebuilds WebAssembly, tests the compiled engine, builds the frontend and runs Playwright. The resulting deployable `dist` is uploaded as an artifact. Build outputs and toolchains are ignored; the small deployment WASM assets are intentionally tracked.

## Deploy to Vercel

1. Import `Rampurkar91/oopgame-in-webformat` in your Vercel account and choose the branch containing this implementation.
2. Set **Root Directory** to `frontend` and framework to **Vite**.
3. Install command: `npm ci`; build command: `npm run build`; output: `dist`.
4. Deploy. `frontend/vercel.json` handles static WebAssembly MIME type, revalidation and SPA fallback.
5. Verify `/wasm/game.wasm` returns `application/wasm`, start a rescue, save/load, and refresh a page.

No Render server or MongoDB is necessary. Emscripten is **not** required on Vercel because deployable WASM is committed. Use the CI build to validate engine changes before deployment. This repository does not embed a deployment token, and no production Vercel URL is claimed without a successful account-authorized deployment.

## Third-party software

The vendored nlohmann/json header includes its MIT license and attribution. Other third-party dependencies retain their respective licenses in npm. No SFML, desktop runtime, remote map service, external image/font service or backend is used.
