# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core commands

Project is an Electron + React + Vite + TypeScript desktop app with SQLite/Drizzle and Vitest.

### Install & dev

- Install dependencies (preferred):
  - `npm install`
- Start Electron dev app (main + renderer, with hot reload):
  - `npm run dev`

### Build & packaging

- Production build (TypeScript compile, Vite bundle, then electron-builder):
  - `npm run build`
- Built desktop artifacts are output under the `release` directory (electron-builder default), with intermediate Electron bundles in `dist-electron` and renderer assets in `dist`.

### Testing

Tests are run with Vitest; config is in `vitest.config.ts` and looks for tests in `test/**/*.{test,spec}.[jt]s?(x)`.

- Run the full test suite:
  - `npm test`
- Build the app for test mode (some tests expect a Vite test build first):
  - `npm run pretest`
- Typical end-to-end style flow (if tests rely on the built bundle):
  - `npm run pretest && npm test`
- Run a single test file (Vitest):
  - `npm test -- test/path/to/file.test.ts`
- Run a specific test by name:
  - `npm test -- -t "test name substring"`

### Database / Drizzle

SQLite lives in a `newsforge.db` file:
- In dev: in the project root (`process.cwd()`), created on first run.
- In packaged app: under Electron `app.getPath('userData')`.

Migrations are SQL files in `drizzle/`, applied via `drizzle-orm` and also invoked automatically at app startup from `electron/main/migrator.ts`.

- Push current Drizzle schema to the DB (migration-style):
  - `npm run db:push`
- Generate SQL migrations from schema changes (output into `drizzle/`):
  - `npm run db:generate`
- Open Drizzle Studio against the local SQLite DB:
  - `npm run db:studio`

### Vite-only renderer preview (optional)

- Run the renderer in browser-only mode (no Electron shell):
  - `npm run preview`

## Architecture overview

### High-level

NewsForge is a local-first desktop app with three main layers:

1. **Renderer (React)** under `src/` – UI, routing, and interaction logic.
2. **Main process (Electron)** under `electron/main/` – app lifecycle, DB, services, and external integrations.
3. **Persistence & migrations** – SQLite via Drizzle (`electron/main/db/*`, `drizzle/`).

Almost all renderer ↔ main communication goes over a typed IPC boundary defined in `electron/shared/ipc-channels.ts` and implemented in `electron/main/ipc/handlers.ts`. React hooks in `src/hooks` wrap IPC calls and expose domain-specific operations to components.

### Electron main process & services

Key files/directories:

- `electron/main/index.ts`
  - Entry point for the Electron main process.
  - Loads environment variables from `.env` (tries both the project root and a dist-relative path).
  - Sets up `process.env.DIST*` paths for the renderer bundle and public assets.
  - Creates the main `BrowserWindow` with `contextIsolation: true` and a preload script at `electron/preload/index.ts`.
  - Calls `registerIpcHandlers()` to wire all IPC channels.
  - On `app.whenReady()`:
    - Calls `initializeServices()` from `electron/main/services/index.ts`.
    - Runs database migrations via `runMigrations()`.
    - Then creates the main window.
  - Wires up `electron-updater` via `update(win)` from `electron/main/update.ts`.

- `electron/preload/index.ts`
  - Exposes a limited `ipcRenderer` API onto `window` via `contextBridge.exposeInMainWorld('ipcRenderer', ...)`.
  - Adds a simple loading overlay that is removed when the renderer signals readiness.

- `electron/main/db/schema.ts`
  - Drizzle schema for the core tables: `users`, `newsSources`, `runs`, `rawHeadlines`, `compiledItems`, `contentPackages`, `runArchives`, and `userSettings`.
  - These tables directly back the end-to-end workflow: source configuration → runs → raw headlines → compiled summaries → exportable content packages → archives.

- `electron/main/db/index.ts`
  - Creates the SQLite connection using `better-sqlite3`.
  - Chooses DB file location based on environment (root vs `userData`).
  - Exports a Drizzle `db` instance used across services.

- `electron/main/migrator.ts`
  - Defines `runMigrations()`, which points Drizzle’s migration runner at the `drizzle/` directory using `process.cwd()`.

- `electron/main/services/`
  - Service layer encapsulating all business logic and DB access. Important services:
    - `user.service.ts`, `source.service.ts`, `run.service.ts`, `headline.service.ts`, `compiled.service.ts`, `package.service.ts`, `archive.service.ts`, `settings.service.ts` – CRUD and query operations for the corresponding tables.
    - `rss.service.ts` – Uses Electron’s `net` + `rss-parser` to fetch and parse RSS/Atom feeds, with retry and feed discovery logic.
    - `gmail.service.ts` – Handles Gmail OAuth2, token storage in `userSettings.format`, label listing, newsletter fetching, and headline extraction, relying on `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` environment variables.
    - `youtube.service.ts` – Validates YouTube URLs, fetches metadata, and prepares preview/headline structures for the UI.
    - `arxiv.service.ts` and `huggingface.service.ts` – Fetch papers and convert them into standardized headline objects.
    - `fetch-coordinator.service.ts` – Orchestrates a **run** of all active sources for a user:
      - Creates a `runs` record.
      - Loads active `newsSources`.
      - In parallel, fetches headlines via RSS, Gmail, ArXiv, Hugging Face, etc.
      - Persists `rawHeadlines` and updates run statistics.
      - Emits progress via `progressService`.
    - `compilation.service.ts` – Groups selected headlines and generates compiled items using the AI registry.
    - `ai/` – AI provider infrastructure (see below).

- `electron/main/services/index.ts`
  - Exports concrete service singletons and a `services` object used by the IPC handlers.
  - `initializeServices()` bootstraps external services:
    - Initializes the Gemini integration from `GEMINI_API_KEY` (if present).
    - Instantiates and registers AI providers (`OllamaProvider`, `OpenAIProvider`, `AnthropicProvider`, `DeepSeekProvider`, `GoogleProvider`) with the `aiRegistry`.

### AI integration

AI orchestration is centralized under `electron/main/services/ai/` and the `AIRegistry`:

- `ai/ai.registry.ts`
  - Maintains a registry of available AI providers and models.
  - Exposes APIs to list models across providers and to route generation requests to the appropriate provider.

- `ai/providers/*.provider.ts`
  - Concrete providers for Ollama (local), OpenAI, Anthropic, DeepSeek, and Google/Gemini.
  - Share a base interface from `base.provider.ts` that describes how models are listed and how text generation is requested.

- `electron/main/ipc/handlers.ts` (AI section)
  - `AI.GET_MODELS` handler:
    - Fetches secure `UserSettings` for a default user (currently ID 1 for the single-user desktop assumption).
    - Extracts provider API keys from `userSettings.aiProviders`.
    - Passes keys to `aiRegistry.getAllModels()` to surface the enabled models to the renderer.
  - `AI.GENERATE` handler:
    - Looks up secure provider config (keys) for the current `userId`.
    - Decides which provider to use based on `providerId` or `modelId`.
    - Calls `aiRegistry.generate()` with merged options including the correct API key.

On the renderer side:

- `src/components/settings/AISettings.tsx` (not fully read here) and the `Settings` page manage:
  - Default model (`userSettings.llmModel`).
  - Per-provider API configuration stored in `userSettings.aiProviders`.

### IPC contracts and renderer hooks

The IPC boundary is typed and centralized, then wrapped in React hooks for ergonomic use in the UI.

- `electron/shared/ipc-channels.ts`
  - Enumerates all IPC channel names grouped by domain (`USER`, `SOURCE`, `RUN`, `HEADLINE`, `COMPILED`, `PACKAGE`, `ARCHIVE`, `SETTINGS`, `PROGRESS`, `RSS`, `GMAIL`, `YOUTUBE`, `ARXIV`, `HF`, `FETCH`, `AI`, `COMPILATION`).
  - Exports a single `IPC_CHANNELS` object used both in main and renderer, avoiding stringly-typed channels.

- `electron/main/ipc/handlers.ts`
  - Registers `ipcMain.handle` handlers for each domain channel.
  - Every handler wraps a service call in a `{ success, data?, error? }` envelope and centralizes error logging via `handleIpcError`.

- `src/hooks/useIpc.ts`
  - Generic hook used by all domain hooks to invoke IPC channels:
    - Expects the `{ success, data, error }` envelope.
    - Manages `loading` and `error` state per call.
    - Logs IPC errors to the console.

- Domain-specific hooks under `src/hooks/` map UI concepts to IPC services:
  - `useUser` / `UserContext`: wraps user CRUD and keeps the “current user” in context (today largely single-user but schema supports more).
  - `useSources`: CRUD for `newsSources` + config validation over IPC.
  - `useRuns`: exposes run lifecycle (create, update status/stats, complete/fail, list runs, statistics).
  - `useHeadlines`: bulk creation, selection toggling, search, and deletion for `rawHeadlines` in the context of a `run`.
  - `useCompiled`: access and update `compiledItems`, including selection and related headline lookup.
  - `usePackages`: CRUD operations for `contentPackages` and state transitions (ready/exported).
  - `useArchives`: access to `runArchives` and per-user/per-run archive queries.
  - `useSettings`: wraps `UserSettings` CRUD and specific operations (update Obsidian path, model, AI provider configs).
  - `useAI`: exposes `getModels` and `generate` over the AI IPC channels.
  - `useGmail`, `useRss`, `useYoutube`: thin wrappers over the respective IPC domains for integration-specific workflows.

This pattern means that when you add a new feature, you typically:
1. Add/extend a service in `electron/main/services/*`.
2. Add a channel constant in `electron/shared/ipc-channels.ts`.
3. Register a handler in `electron/main/ipc/handlers.ts`.
4. Optionally add a typed hook in `src/hooks` and use it from UI components.

### Renderer (React) app structure

Core renderer entry and layout:

- `src/main.tsx`
  - Standard React entry: creates root on `#root` and renders `<App />`.

- `src/App.tsx`
  - Top-level composition:
    - Wraps the app in `ErrorBoundary`, `ThemeProvider`, `UserProvider`, and `TooltipProvider`.
    - Configures routes using `wouter` with routes for:
      - `/` → `Dashboard`
      - `/sources` → `Sources`
      - `/run` → `NewsInbox`
      - `/archive` → `Archive`
      - `/settings` → `Settings`
      - `/compile` → `Compilation`
      - `/content` → `ContentPackage`
      - Additional test pages under `/test/*` and a 404 route.
    - Each route is rendered inside `AppLayout`, which provides the shared shell (navigation, layout, theming).

Important page responsibilities (high level):

- `Dashboard.tsx`
  - Landing screen; displays high-level stats for the last run (currently mocked) and quick links to start a run, manage sources, or view archive.

- `Sources.tsx`
  - End-user UI for configuring `newsSources`:
    - Bootstraps/ensures a default user (ID 1) exists via `useUser`.
    - Loads sources for the user via `useSources`.
    - Exposes tabs/forms for RSS, Gmail, YouTube, ArXiv, and Hugging Face sources (see `src/components/sources/*`).
    - Toggles source active state and deletes sources.

- `NewsInbox.tsx`
  - Represents the “collect and triage headlines” stage of the workflow.
  - Uses `useRuns` to create a new `run` record and `useHeadlines` to bulk insert `rawHeadlines` (currently using mocked data).
  - Supports headline selection, bulk selection, search and basic categorization.
  - Emits a `runId` that is passed into the `/compile` route.

- `Compilation.tsx`
  - Represents the “AI compilation” stage.
  - Given a `runId`, loads selected headlines and existing compiled items.
  - Uses `useCompilation` (not shown here) plus `useCompiled`/`useHeadlines` to:
    - Group selected headlines.
    - Call AI to generate `compiledItems` (topic, hook, summary) for each group.
    - Allow per-item editing, re-generation with alternate models, and selection of compiled items for content packages.
  - Tracks estimated token/cost usage per model and exposes a “Compile Headlines” dialog.

- `ContentPackage.tsx`
  - Represents the “YouTube-ready content” stage.
  - Currently uses mocked `ContentAsset` data, but conceptually aligns with the `contentPackages` table.
  - Provides editing for YouTube title, description, and script outline; copy/export actions; and a simple “finalize” status.

- `Archive.tsx`
  - Visualizes historical `runs` and associated Obsidian export paths (currently mocked data matching the schema).
  - Designed to be backed by `runArchives` and `run` statistics.

- `Settings.tsx`
  - General app and export configuration:
    - Output template for generated content (string template with placeholders like `{title}`, `{hook}`, etc.).
    - Obsidian vault path.
  - Includes `AISettings` tab which surfaces model/provider configuration backed by `UserSettings`.

Shared utilities and context:

- `src/contexts/ThemeContext.tsx`
  - Light/dark theme state synchronized to `document.documentElement` and (optionally) `localStorage`.

- `src/contexts/UserContext.tsx`
  - Simple current-user context for the single-user desktop assumption (fetches the first user and exposes it to the tree).

- `src/lib/utils.ts`
  - Tailwind/CVA helper for merging classNames via `clsx` and `tailwind-merge`.

### Data model & workflow

The end-to-end workflow is encoded both in the schema and in how services/pages interact:

1. **Configure sources** (RSS, Gmail, YouTube, ArXiv, Hugging Face):
   - `newsSources` rows, configured via the `Sources` page and corresponding forms.
2. **Start a run**:
   - Either manually (`NewsInbox` uses `createRun`) or via `fetch-coordinator` (`FETCH.RUN_ALL_SOURCES`).
   - A `runs` row is created and progress is tracked via `progressService`.
3. **Collect raw headlines**:
   - `FetchCoordinatorService` calls RSS/Gmail/ArXiv/HF services to build standardized `InsertRawHeadline` objects.
   - These are persisted into `rawHeadlines` via `headlineService`.
4. **Select headlines in the UI**:
   - `NewsInbox` uses `useHeadlines` and its IPC channels to present, filter, and toggle `rawHeadlines.isSelected`.
5. **AI compilation**:
   - `Compilation` uses `useCompilation`/`useCompiled` to ask `compilationService` to group and summarize selected headlines.
   - Results are stored as `compiledItems` in SQLite.
6. **Content packages**:
   - Compiled items are the basis for `contentPackages` rows (YouTube title, description, outline, status).
   - The `ContentPackage` page currently operates on mocked data but mirrors the eventual DB-backed design.
7. **Archival & export**:
   - When a run is “archived”, `runArchives` rows capture a snapshot plus an `obsidianExportPath`.
   - Obsidian vault path and output template live in `userSettings` (`Settings` page), and export code uses those fields when writing Markdown to disk.

## Environment & configuration

- **Node & tooling**
  - Node.js >= 16 is expected; `type` is `module` in `package.json`.
  - Frontend uses React 18, Tailwind, and shadcn/ui over Vite.

- **Environment variables / `.env`**
  - `.env` is loaded in the main process by `electron/main/index.ts` from either the project root or a dist-relative path.
  - Critical environment variables include (non-exhaustive):
    - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` – Required for Gmail OAuth2 in `gmail.service.ts`.
    - `GEMINI_API_KEY` – Used by `gemini.service` initialization.
  - Other AI provider keys are managed via the `AISettings` UI and stored in the `userSettings.aiProviders` JSON column (retrieved securely by `settingsService.getSecureSettings`).

- **Obsidian integration**
  - Obsidian vault path is stored in `userSettings.obsidianVaultPath` and configured in the `Settings` page.
  - Export code (not detailed here) uses this path and the output template to write run archives into a dated folder structure inside the vault.

- **Single-user assumption**
  - While the schema supports multiple users, the current implementation generally assumes a single “local” user with ID 1 (e.g., `Sources` bootstraps a `local-user` if no user exists; AI handlers default to user 1 for model discovery).
  - When extending functionality, keep this assumption in mind or deliberately evolve the multi-user story.
