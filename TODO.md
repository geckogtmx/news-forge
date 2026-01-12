# NewsForge TODO List

**Project**: NewsForge - AI-Powered News Aggregation Desktop App  
**Repository**: https://github.com/geckogtmx/news-forge  
**Last Updated**: 2026-01-10

> **Note**: This TODO list tracks granular development tasks. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for strategic roadmap and architecture overview.

---

## 📊 Legend

- `[ ]` - Not started
- `[/]` - In progress
- `[x]` - Completed
- `[~]` - Partially complete / needs revision
- `[!]` - Blocked (see notes)

---

## 🏗️ Phase 1: Foundation ✅

### Project Setup
- [x] Initialize Electron + React + TypeScript project
- [x] Configure Vite for Electron renderer
- [x] Set up Tailwind CSS
- [x] Install and configure shadcn/ui
- [x] Configure electron-builder for packaging
- [x] Set up Git repository with .gitignore
- [x] Create initial README.md

### Database Setup
- [x] Install SQLite and Drizzle ORM
- [x] Configure Drizzle Kit for migrations
- [x] Define database schema in `electron/main/db/schema.ts`
  - [x] users table
  - [x] newsSources table
  - [x] runs table
  - [x] rawHeadlines table
  - [x] compiledItems table
  - [x] contentPackages table
  - [x] runArchives table
  - [x] userSettings table
- [x] Create initial migration
- [x] Set up database connection in main process

### Development Environment
- [x] Configure VSCode debugging
- [x] Set up Playwright for E2E testing
- [x] Set up Vitest for unit testing
- [x] Create basic UI layout structure
- [x] Configure auto-reload for development

---

## ✅ Phase 2: Core Data Layer (Completed)

### 2.1 Database Service Layer

#### User Management
- [x] Create `UserService` class in `electron/main/services/user.service.ts`
  - [x] `createUser(email, username)` - Create new user
  - [x] `getUserById(id)` - Get user by ID
  - [x] `getUserByEmail(email)` - Get user by email
  - [x] `updateUser(id, data)` - Update user details
  - [x] `deleteUser(id)` - Soft delete user
  - [x] Add error handling and validation
- [ ] Write unit tests for UserService (target: 90% coverage)

#### News Source Management
- [x] Create `NewsSourceService` class in `electron/main/services/source.service.ts`
  - [x] `createSource(userId, sourceData)` - Add new source
  - [x] `getSourceById(id)` - Get source details
  - [x] `getSourcesByUser(userId)` - List all user sources
  - [x] `getActiveSourcesByUser(userId)` - List active sources
  - [x] `updateSource(id, data)` - Update source config
  - [x] `toggleSourceActive(id, isActive)` - Enable/disable source
  - [x] `deleteSource(id)` - Remove source
  - [x] Add validation for source types and URLs
- [ ] Write unit tests for NewsSourceService

#### Run Management
- [x] Create `RunService` class in `electron/main/services/run.service.ts`
  - [x] `createRun(userId)` - Start new run
  - [x] `getRunById(id)` - Get run details
  - [x] `getRunsByUser(userId, limit)` - List runs with pagination
  - [x] `updateRunStatus(id, status)` - Update run status
  - [x] `completeRun(id, metadata)` - Mark run complete
  - [x] `failRun(id, error)` - Mark run failed
  - [x] `getRunStatistics(id)` - Get headline counts, etc.
- [ ] Write unit tests for RunService

#### Headline Management
- [x] Create `HeadlineService` class in `electron/main/services/headline.service.ts`
  - [x] `createHeadlines(runId, headlines[])` - Bulk insert headlines
  - [x] `getHeadlineById(id)` - Get single headline
  - [x] `getHeadlinesByRun(runId, filters)` - List with filtering
  - [x] `getSelectedHeadlines(runId)` - Get selected headlines only
  - [x] `toggleHeadlineSelection(id, selected)` - Mark for compilation
  - [x] `bulkSelectHeadlines(ids[], selected)` - Bulk selection
  - [x] `searchHeadlines(runId, query)` - Full-text search
  - [x] `deleteHeadlines(ids[])` - Bulk delete
- [ ] Write unit tests for HeadlineService

#### Compiled Item Management
- [x] Create `CompiledItemService` class in `electron/main/services/compiled.service.ts`
  - [x] `createCompiledItem(runId, itemData)` - Save compilation
  - [x] `getCompiledItemById(id)` - Get compilation details
  - [x] `getCompiledItemsByRun(runId)` - List all compilations
  - [x] `updateCompiledItem(id, data)` - Edit compilation
  - [x] `deleteCompiledItem(id)` - Remove compilation
  - [x] `getRelatedHeadlines(id)` - Fetch linked headlines
- [ ] Write unit tests for CompiledItemService

#### Content Package Management
- [x] Create `ContentPackageService` class in `electron/main/services/package.service.ts`
  - [x] `createPackage(compiledItemId, packageData)` - Generate package
  - [x] `getPackageById(id)` - Get package details
  - [x] `getPackagesByRun(runId)` - List packages
  - [x] `updatePackage(id, data)` - Edit package
  - [x] `markPackageExported(id)` - Mark as exported
  - [x] `deletePackage(id)` - Remove package
- [ ] Write unit tests for ContentPackageService

#### Archive Management
- [x] Create `ArchiveService` class in `electron/main/services/archive.service.ts`
  - [x] `createArchive(runId, obsidianPath)` - Log archive export
  - [x] `getArchiveById(id)` - Get archive details
  - [x] `getArchivesByUser(userId)` - List all archives
  - [x] `getArchiveByRun(runId)` - Find archive for run
- [ ] Write unit tests for ArchiveService

#### Settings Management
- [x] Create `SettingsService` class in `electron/main/services/settings.service.ts`
  - [x] `getSettings(userId)` - Get user settings
  - [x] `updateSettings(userId, settings)` - Update settings
  - [x] `updateObsidianPath(userId, path)` - Set vault path
  - [x] `updateDefaultModel(userId, model)` - Set AI model
  - [x] `updateApiKeys(userId, keys)` - Store encrypted API keys
  - [x] `getDecryptedApiKeys(userId)` - Retrieve API keys
  - [x] Implement encryption for sensitive data
- [ ] Write unit tests for SettingsService

### 2.2 IPC Communication Layer

#### Define IPC Channels
- [x] Create `electron/shared/ipc-channels.ts` with channel constants
  - [x] User channels: `user:create`, `user:get`, `user:update`, etc.
  - [x] Source channels: `source:create`, `source:list`, `source:update`, etc.
  - [x] Run channels: `run:create`, `run:get`, `run:list`, etc.
  - [x] Headline channels: `headline:create`, `headline:list`, `headline:select`, etc.
  - [x] Compiled channels: `compiled:create`, `compiled:list`, etc.
  - [x] Package channels: `package:create`, `package:list`, etc.
  - [x] Archive channels: `archive:create`, `archive:list`, etc.
  - [x] Settings channels: `settings:get`, `settings:update`, etc.

#### Main Process IPC Handlers
- [x] Create `electron/main/ipc/handlers.ts`
  - [x] Register all IPC handlers using `ipcMain.handle()`
  - [x] Wire handlers to service methods
  - [x] Add comprehensive error handling
  - [x] Implement request/response typing
  - [x] Add logging for all IPC calls

#### Renderer Process IPC Hooks
- [x] Create React hooks for IPC communication in `src/hooks/`
  - [x] `useUser.ts` - User operations
  - [x] `useSources.ts` - News source operations
  - [x] `useRuns.ts` - Run management
  - [x] `useHeadlines.ts` - Headline operations
  - [x] `useCompiled.ts` - Compiled item operations
  - [x] `usePackages.ts` - Content package operations
  - [x] `useArchives.ts` - Archive operations
  - [x] `useSettings.ts` - Settings operations
- [x] Add TypeScript types for all IPC payloads
- [x] Implement loading states and error handling in hooks
- [ ] Add optimistic updates where appropriate

#### Progress Events
- [x] Create event emitters for long-running operations
  - [x] Run progress: `run:progress` event
  - [x] Compilation progress: `compile:progress` event
  - [x] Export progress: `export:progress` event
- [x] Implement progress listeners in renderer

---

## 📡 Phase 3: News Source Integration

### 3.1 RSS Feed Integration

#### RSS Parser Service
- [x] Create `electron/main/services/rss.service.ts`
  - [x] Install `rss-parser` library
  - [x] `fetchFeed(url)` - Parse RSS/Atom feeds
  - [x] `extractHeadlines(feed)` - Convert to headline format
  - [x] Add timeout handling (30s)
  - [x] Implement retry logic (3 attempts)
  - [x] Handle malformed feeds gracefully
  - [x] Support for RSS 2.0, Atom, and JSON Feed formats
- [x] Write unit tests with mocked feeds

#### RSS Feed Discovery
- [x] `discoverFeeds(websiteUrl)` - Auto-detect RSS feeds on a website
- [x] Parse HTML for `<link rel="alternate">` tags
- [x] Check common feed paths (e.g., `/feed`, `/rss`, `/atom.xml`)

#### RSS UI Components
- [x] Create `src/components/sources/RssSourceForm.tsx`
  - [x] URL input with validation
  - [x] Feed preview before saving
  - [x] Topic/tag assignment
  - [x] Active/inactive toggle
- [x] Add RSS source to source list UI

### 3.2 Gmail Integration

#### Gmail API Setup
- [x] Install `googleapis` package
- [x] Create OAuth2 configuration
  - [x] Set up Google Cloud project
  - [x] Enable Gmail API
  - [x] Configure OAuth consent screen
  - [x] Download credentials
- [x] Create `electron/main/services/gmail.service.ts`
  - [x] `authenticateUser()` - OAuth2 flow
  - [x] `getAuthUrl()` - Generate auth URL
  - [x] `handleAuthCallback(code)` - Exchange code for tokens
  - [x] Store tokens securely in settings

#### Gmail Fetching Service
- [x] `fetchEmails(userId, filters)` - Fetch matching emails
  - [x] Support for label filters
  - [x] Support for sender filters
  - [x] Support for subject filters
  - [x] Support for date range
- [x] `parseEmailContent(email)` - Extract relevant text
  - [x] HTML to plain text conversion
  - [x] Extract links from newsletters
  - [x] Parse structured newsletter formats
- [x] `extractHeadlines(emails)` - Convert to headline format
- [x] Implement rate limiting per Gmail quotas
- [x] Write unit tests with mocked Gmail API

#### Gmail UI Components
- [x] Create `src/components/sources/GmailSourceForm.tsx`
  - [x] OAuth2 authentication button
  - [x] Label/sender/subject filter inputs
  - [x] Test connection button
  - [x] Preview fetched emails
- [x] Add Gmail source to source list UI
- [x] Show authentication status indicator

### 3.3 YouTube Integration ✅ COMPLETE

> **Implementation**: Successfully integrated using Gemini API for AI-powered video analysis. Videos are added via Run page, not as persistent sources.

- [x] Evaluated multiple transcript extraction approaches
- [x] Implemented Gemini API integration for metadata analysis
- [x] Created `gemini.service.ts` for AI analysis
- [x] Created `youtube.service.ts` for video operations
- [x] Created `AddYoutubeVideoDialog` component
- [x] Added YouTube tab to Sources page (informational)
- [x] Video playback integration
- [x] Gemini summary extraction

### Phase 3.4: Technical Migration: pnpm
- [ ] Remove package-lock.json
- [ ] Clean node_modules
- [ ] Install dependencies with pnpm
- [ ] Verify application stability

### Phase 3.5: Research Integrations

#### ArXiv Integration
- [ ] Create `electron/main/services/arxiv.service.ts`
  - [ ] `fetchRecentPapers(category)` - Fetch from ArXiv API (e.g., cs.AI)
  - [ ] `searchPapers(query)` - Search functionality
  - [ ] `parseArxivResponse(xml)` - Convert Atom/XML to headlines
  - [ ] Extract PDF links and authors
- [ ] Create `src/components/sources/ArxivSourceForm.tsx`
  - [ ] Category selector (cs.AI, cs.LG, etc.)
  - [ ] Preview paper list

#### Hugging Face Papers Integration
- [ ] Create `electron/main/services/huggingface.service.ts`
  - [ ] `fetchDailyPapers()` - Get trending papers
  - [ ] `fetchPaperDetails(id)` - Get metadata
- [ ] Create `src/components/sources/HFSourceForm.tsx`
  - [ ] Simple enable/disable toggle for trending feed

#### Source Orchestration Update
- [ ] Update `source.service.ts` source definitions
- [ ] Ensure non-browser fetch strategy for these APIs

### 3.5 Source Orchestration

#### Fetch Coordinator
- [ ] Create `electron/main/services/fetch-coordinator.service.ts`
  - [ ] `runFetchForAllSources(userId)` - Start a run
  - [ ] Fetch from all active sources in parallel
  - [ ] Aggregate headlines from all sources
  - [ ] Save headlines to database
  - [ ] Emit progress events
  - [ ] Handle partial failures gracefully
- [ ] Write integration tests for fetch coordinator

---

## 🤖 Phase 4: AI Integration & Compilation

### 4.1 LangChain Setup

#### LangChain Installation
- [ ] Install `langchain` and required packages
- [ ] Install `@anthropic-ai/sdk` for Claude
- [ ] Install `openai` for GPT models

#### AI Service Configuration
- [ ] Create `electron/main/services/ai.service.ts`
  - [ ] Initialize Claude client
  - [ ] Initialize OpenAI client
  - [ ] `getChatModel(modelName)` - Factory for chat models
  - [ ] Configure model parameters (temperature, max tokens, etc.)
  - [ ] Implement retry logic for API failures
- [ ] Create prompt templates in `electron/main/prompts/`
  - [ ] `compilation.template.ts` - Headline grouping and summarization
  - [ ] `content-generation.template.ts` - Content package generation
  - [ ] `title-generation.template.ts` - YouTube title generation
  - [ ] `description-generation.template.ts` - Description generation

#### Token Tracking System
- [ ] Create `electron/main/services/token-tracker.service.ts`
  - [ ] `trackUsage(model, promptTokens, completionTokens, cost)` - Log usage
  - [ ] `getUsageByDateRange(userId, start, end)` - Analytics
  - [ ] `getUsageByModel(userId, model)` - Model-specific stats
  - [ ] `getTotalCost(userId, period)` - Cost calculations
- [ ] Create database table for token tracking
  - [ ] Migration for `tokenUsage` table
  - [ ] Fields: userId, model, operation, promptTokens, completionTokens, estimatedCost, timestamp
- [ ] Implement LangChain callbacks for automatic tracking

### 4.2 News Compilation

#### Headline Grouping Algorithm
- [ ] Create `electron/main/services/compilation.service.ts`
  - [ ] `groupHeadlines(headlines[])` - Cluster related headlines
  - [ ] Use semantic similarity (embeddings + cosine similarity)
  - [ ] Or use LLM-based grouping (more expensive)
  - [ ] Configurable similarity threshold
- [ ] Install embedding model (e.g., `sentence-transformers` via Python, or use OpenAI embeddings)

#### Compilation Generation
- [ ] `generateCompilation(headlineGroup)` - Create summary
  - [ ] Use Claude 3.5 Sonnet for high-quality summaries
  - [ ] Generate title for the compilation
  - [ ] Create 2-3 paragraph summary
  - [ ] Extract key points
  - [ ] Link to source headlines
  - [ ] Track tokens and cost
- [ ] `scoreSummaryQuality(summary)` - Optional quality check
- [ ] Write unit tests with mocked LLM responses

#### Batch Compilation UI
- [ ] Create `src/pages/CompilationPage.tsx`
  - [ ] Display selected headlines
  - [ ] Group preview before compilation
  - [ ] "Compile Now" button
  - [ ] Progress indicator
  - [ ] Display results with quality scores
- [ ] Create `src/components/compilation/CompilationCard.tsx`
  - [ ] Show compilation title and summary
  - [ ] List related headlines
  - [ ] Edit compilation button
  - [ ] Delete compilation button
  - [ ] "Create Content Package" button

### 4.3 Content Package Generation

#### Package Generation Service
- [ ] Extend `ai.service.ts` with content generation methods
  - [ ] `generateYoutubeTitle(compilation)` - Create catchy title
  - [ ] `generateYoutubeDescription(compilation)` - Write description
  - [ ] `generateScriptOutline(compilation)` - Create script structure
  - [ ] `suggestTags(compilation)` - Generate relevant tags
  - [ ] `optimizeForSEO(title, description, tags)` - SEO improvements
- [ ] Track tokens for all operations

#### Content Package UI
- [ ] Create `src/pages/ContentPackagePage.tsx`
  - [ ] Display compiled item
  - [ ] Show generated title (editable)
  - [ ] Show generated description (editable)
  - [ ] Show script outline (editable)
  - [ ] Show suggested tags (editable)
  - [ ] Export button (copy to clipboard, save as file, etc.)
- [ ] Create `src/components/package/PackageEditor.tsx`
  - [ ] Rich text editing for description and outline
  - [ ] Tag management
  - [ ] Preview mode

### 4.4 Advanced AI Features (Post-MVP)

#### Vault Assistant
- [ ] Create `electron/main/services/vault-assistant.service.ts`
  - [ ] `indexArchives(userId)` - Create vector index of archives
  - [ ] `queryArchives(userId, question)` - Q&A over archives
  - [ ] `performMetaAnalysis(userId, topic)` - Analyze trends
  - [ ] Use retrieval-augmented generation (RAG)
- [ ] Create UI for Vault Assistant chat interface

#### Heat Engine
- [ ] Create `electron/main/services/heat-engine.service.ts`
  - [ ] `detectHotTopics(headlines[], threshold)` - Find trending topics
  - [ ] `calculateHeatScore(topic)` - Score based on frequency and recency
  - [ ] `verifySignals(topic, sources[])` - Check across sources
  - [ ] `trackTopicOvertime(topic, dateRange)` - Trend analysis
- [ ] Create UI to display "heat map" of topics

#### AI Cost Optimization
- [ ] Implement tiered model strategy
  - [ ] Route simple tasks to GPT-4o-mini
  - [ ] Route complex tasks to Claude 3.5 Sonnet
  - [ ] Add configuration for model routing rules
- [ ] Implement response caching
  - [ ] Cache similar prompts
  - [ ] TTL-based cache invalidation
- [ ] Add budget controls
  - [ ] User-configurable daily/monthly limits
  - [ ] Warn user when approaching budget
  - [ ] Block AI operations if budget exceeded

---

## 📂 Phase 5: Obsidian Integration

### 5.1 File Export

#### Markdown Formatter
- [ ] Create `electron/main/services/export.service.ts`
  - [ ] `formatAsMarkdown(contentPackage)` - Convert to markdown
  - [ ] Support for frontmatter (YAML)
  - [ ] Include metadata (date, sources, tags)
  - [ ] Format headlines as links
  - [ ] Format compilation as structured headings
  - [ ] Include script outline as nested list
- [ ] Allow customizable templates

#### File Writing Service
- [ ] `exportToObsidian(userId, packages[])` - Write files to vault
  - [ ] Get vault path from settings
  - [ ] Validate path exists and is writable
  - [ ] Generate unique filenames
  - [ ] Handle file naming conflicts
  - [ ] Support for custom subfolder structure
  - [ ] Batch export multiple packages
- [ ] Create run archive record after export

#### Export UI
- [ ] Create `src/components/export/ExportDialog.tsx`
  - [ ] Select packages to export
  - [ ] Choose export location (within vault)
  - [ ] Preview markdown before export
  - [ ] Export progress indicator
  - [ ] Success/failure notification
- [ ] Add "Export to Obsidian" button to package page

### 5.2 Advanced Obsidian Features (Post-MVP)

#### Daily Note Integration
- [ ] `exportToDailyNote(date, packages[])` - Append to daily note
- [ ] Find or create daily note based on user's template
- [ ] Insert content at specific heading

#### Tag Synchronization
- [ ] Sync tags between NewsForge and Obsidian
- [ ] Read existing tags from vault
- [ ] Suggest tags based on vault content

#### Bi-Directional Linking
- [ ] Support for `[[wikilinks]]` in exported notes
- [ ] Link compilations to related notes in vault
- [ ] Create backlinks to archives

#### Graph View Integration
- [ ] Export metadata for graph visualization
- [ ] Create MOC (Map of Content) notes for topics

---

## 🎨 Phase 6: User Interface & UX

### 6.1 Core UI Pages

#### Dashboard / Overview Page
- [ ] Create `src/pages/DashboardPage.tsx`
  - [ ] Recent runs summary
  - [ ] Today's headline count
  - [ ] Recent compilations
  - [ ] Recent content packages
  - [ ] Token usage summary
  - [ ] Quick action buttons
- [ ] Charts for analytics (using recharts or similar)

#### Sources Management Page
- [x] Create `src/pages/SourcesPage.tsx`
  - [x] List all configured sources
  - [x] Filter by type (RSS, Gmail, YouTube, Website)
  - [ ] Search sources
  - [x] Add new source button
  - [x] Edit source inline or in modal
  - [x] Delete source with confirmation
  - [x] Toggle active/inactive
  - [ ] Show last fetch timestamp
  - [ ] Show total headlines from each source

#### Run Execution Page
- [ ] Create `src/pages/RunPage.tsx`
  - [ ] "Start New Run" button
  - [ ] Real-time progress indicator
  - [ ] Source-by-source progress
  - [ ] Error display for failed sources
  - [ ] Cancel run button
  - [ ] Navigate to headlines after completion

#### Headlines Review Page
- [ ] Create `src/pages/HeadlinesPage.tsx`
  - [ ] Display all headlines for current run
  - [ ] Table or card view toggle
  - [ ] Checkbox for selection
  - [ ] Bulk select/deselect actions
  - [ ] Filter by source, date, selected status
  - [ ] Search headlines
  - [ ] Sort by date, source, title
  - [ ] Pagination for large datasets
  - [ ] "Compile Selected" button

#### Compilation Browser Page
- [ ] Create `src/pages/CompilationsPage.tsx`
  - [ ] List all compilations
  - [ ] Filter by run, date
  - [ ] Search compilations
  - [ ] View compilation details
  - [ ] Edit compilation
  - [ ] Delete compilation
  - [ ] "Generate Content Package" button

#### Content Package Editor Page
- [ ] Already addressed in Phase 4.3

#### Archives Viewer Page
- [ ] Create `src/pages/ArchivesPage.tsx`
  - [ ] List all archived runs
  - [ ] Show export date and file count
  - [ ] Link to Obsidian vault (open in file explorer)
  - [ ] Re-export option
  - [ ] Search archives

#### Settings Page
- [ ] Create `src/pages/SettingsPage.tsx`
  - [ ] **General Settings**
    - [ ] User profile (name, email)
  - [ ] **AI Settings**
    - [ ] Default AI model selection
    - [ ] API key management (Anthropic, OpenAI)
    - [ ] Token budget configuration
  - [ ] **Obsidian Settings**
    - [ ] Vault path picker
    - [ ] Export subfolder configuration
    - [ ] Markdown template customization
  - [ ] **Source Settings**
    - [ ] Default fetch frequency
    - [ ] Max headlines per source
  - [ ] **Appearance Settings**
    - [ ] Dark/light mode toggle
    - [ ] Font size
  - [ ] **About**
    - [ ] App version
    - [ ] Changelog link
    - [ ] License

### 6.2 Component Library

#### Shared Components
- [ ] Create reusable components in `src/components/`
  - [ ] `Button.tsx` (using shadcn/ui)
  - [ ] `Input.tsx`
  - [ ] `Select.tsx`
  - [ ] `Dialog.tsx`
  - [ ] `Table.tsx`
  - [ ] `Card.tsx`
  - [ ] `Badge.tsx`
  - [ ] `ProgressBar.tsx`
  - [ ] `Spinner.tsx`
  - [ ] `Toast.tsx` (notifications)
  - [ ] `ConfirmationDialog.tsx`

#### Domain-Specific Components
- [ ] `SourceCard.tsx` - Display source summary
- [ ] `HeadlineCard.tsx` - Display single headline
- [ ] `CompilationCard.tsx` - Display compilation summary
- [ ] `PackageCard.tsx` - Display content package
- [ ] `RunStatusBadge.tsx` - Status indicator for runs
- [ ] `TokenUsageChart.tsx` - Visualize token usage

### 6.3 UX Enhancements

#### Keyboard Shortcuts
- [ ] Implement global keyboard shortcuts
  - [ ] `Ctrl+N` - Start new run
  - [ ] `Ctrl+K` - Search
  - [ ] `Ctrl+S` - Save (where applicable)
  - [ ] `Ctrl+,` - Open settings
  - [ ] `Esc` - Close dialogs
  - [ ] Arrow keys for navigation
- [ ] Display keyboard shortcuts in tooltips
- [ ] Create keyboard shortcuts help modal

#### Drag and Drop
- [ ] Drag to reorder sources
- [ ] Drag to select multiple headlines
- [ ] Drag files to import (if applicable)

#### Search and Filter
- [ ] Global search across headlines, compilations, packages
- [ ] Advanced filters (date range, source, tags, status)
- [ ] Save filter presets

#### Notification System
- [ ] Toast notifications for success/error
- [ ] System notifications for completed runs
- [ ] In-app notification center for important events

#### Undo/Redo
- [ ] Implement undo/redo for critical actions
  - [ ] Delete source
  - [ ] Delete headlines
  - [ ] Delete compilations

#### Onboarding Flow
- [ ] Create first-time setup wizard
  - [ ] Welcome screen
  - [ ] API key setup
  - [ ] Add first source
  - [ ] Run first fetch
  - [ ] View results
- [ ] Tooltips and guided tours for features

#### Contextual Help
- [ ] Help icons with tooltips throughout UI
- [ ] Link to documentation
- [ ] FAQ section in settings

---

## 🔒 Phase 7: Security & Performance

### 7.1 Security Hardening

#### Electron Security
- [ ] Enable context isolation in production
  - [ ] Update `electron/main/index.ts` BrowserWindow config
  - [ ] Set `contextIsolation: true`
  - [ ] Set `nodeIntegration: false`
- [ ] Disable `allowRunningInsecureContent`
- [ ] Enable `webSecurity`
- [ ] Implement Content Security Policy (CSP)
  - [ ] Add CSP meta tag or header
  - [ ] Whitelist allowed sources

#### API Key Security
- [ ] Use system keychain for API key storage (keytar package)
  - [ ] Store keys in OS-level secure storage
  - [ ] Fallback to encrypted storage if keychain unavailable
- [ ] Never log API keys in plain text
- [ ] Mask API keys in UI (show only last 4 chars)

#### Input Validation
- [ ] Validate all user inputs
  - [ ] URL validation for sources
  - [ ] Email validation
  - [ ] Sanitize HTML content from scraped pages
- [ ] Prevent SQL injection (Drizzle ORM handles this, but verify)
- [ ] Prevent XSS attacks
  - [ ] Sanitize rendered markdown
  - [ ] Use DOMPurify for HTML sanitization

#### Request Security
- [ ] Implement rate limiting for AI requests
- [ ] Sign requests to external APIs (where applicable)
- [ ] Use HTTPS for all external requests
- [ ] Validate SSL certificates

#### Security Audit
- [ ] Run security audit with `npm audit`
- [ ] Fix high/critical vulnerabilities
- [ ] Consider penetration testing before public release

### 7.2 Performance Optimization

#### Database Optimization
- [ ] Add indexes to frequently queried columns
  - [ ] `newsSources.userId`
  - [ ] `runs.userId`
  - [ ] `rawHeadlines.runId`
  - [ ] `compiledItems.runId`
  - [ ] `rawHeadlines.publishedAt` (for sorting)
- [ ] Optimize queries
  - [ ] Use `LIMIT` and `OFFSET` for pagination
  - [ ] Avoid `SELECT *`, select only needed columns
  - [ ] Use database views for complex queries (if needed)
- [ ] Implement query result caching (in-memory cache)

#### UI Performance
- [ ] Implement virtual scrolling for large lists
  - [ ] Use `react-window` or `react-virtualized`
  - [ ] Apply to headlines table, compilations list
- [ ] Lazy load components
  - [ ] Use `React.lazy()` and `Suspense`
  - [ ] Split code by route
- [ ] Optimize re-renders
  - [ ] Use `React.memo()` for expensive components
  - [ ] Use `useMemo()` and `useCallback()` hooks
  - [ ] Avoid unnecessary state updates

#### Bundle Optimization
- [ ] Analyze bundle size with `vite-plugin-bundle-analyzer`
- [ ] Tree-shake unused code
- [ ] Code splitting by route
- [ ] Lazy load heavy dependencies (e.g., Playwright, LangChain)
- [ ] Minimize CSS (Tailwind purge)

#### Startup Optimization
- [ ] Defer non-critical initialization
- [ ] Lazy load database connection
- [ ] Show splash screen during startup
- [ ] Profile startup time and optimize bottlenecks

#### Memory Management
- [ ] Monitor memory usage in long-running operations
- [ ] Clean up event listeners on component unmount
- [ ] Cancel pending API requests when navigating away
- [ ] Implement garbage collection for large datasets

#### Performance Profiling
- [ ] Use React DevTools Profiler
- [ ] Use Electron's built-in profiling tools
- [ ] Measure and log critical operation times
- [ ] Set performance budgets (e.g., page load < 1s)

---

## 🧪 Phase 8: Testing & Quality Assurance

### 8.1 Unit Tests

#### Database Layer Tests
- [ ] Write tests for all service classes
  - [ ] UserService
  - [ ] NewsSourceService
  - [ ] RunService
  - [ ] HeadlineService
  - [ ] CompiledItemService
  - [ ] ContentPackageService
  - [ ] ArchiveService
  - [ ] SettingsService
- [ ] Use in-memory SQLite for tests
- [ ] Use test fixtures and factories
- [ ] Target: 80%+ code coverage

#### AI Service Tests
- [ ] Mock LangChain API calls
- [ ] Test prompt generation
- [ ] Test token tracking
- [ ] Test error handling for API failures

#### IPC Tests
- [ ] Test IPC handlers with mock services
- [ ] Verify request/response payloads
- [ ] Test error propagation

### 8.2 Integration Tests

#### IPC Communication Integration
- [ ] Test main ↔ renderer communication
- [ ] Test data flow from UI action → IPC → service → database
- [ ] Test event emission for long operations

#### Source Integration Tests
- [ ] Test RSS fetching with mock feeds
- [ ] Test Gmail fetching with mock API
- [ ] Test YouTube fetching with mock API
- [ ] Test scraper with mock HTML pages

#### AI Pipeline Integration
- [ ] Test headline grouping → compilation generation
- [ ] Test compilation → content package generation
- [ ] Test end-to-end AI workflow

### 8.3 End-to-End (E2E) Tests

#### Critical User Workflows
- [ ] Test: Add RSS source → Run fetch → Review headlines
- [ ] Test: Select headlines → Compile → Generate package
- [ ] Test: Export package to Obsidian
- [ ] Test: Configure settings → Save → Reload app
- [ ] Test: Run complete workflow from start to finish

#### E2E Test Setup
- [ ] Use Playwright for E2E tests
- [ ] Create test fixtures (sample sources, headlines)
- [ ] Mock external API calls (LLM, Gmail, YouTube)
- [ ] Run tests against built application

### 8.4 Test Infrastructure

#### CI/CD Pipeline
- [ ] Set up GitHub Actions workflow
  - [ ] Run tests on push
  - [ ] Run tests on PR
  - [ ] Lint and type-check
  - [ ] Build for all platforms
- [ ] Add code coverage reporting (Codecov or similar)
- [ ] Fail builds if coverage drops below threshold

#### Test Factories
- [ ] Create factory functions for test data
  - [ ] `createTestUser()`
  - [ ] `createTestSource()`
  - [ ] `createTestRun()`
  - [ ] `createTestHeadlines()`

#### Mocking Strategies
- [ ] Mock file system operations
- [ ] Mock external HTTP requests (nock or msw)
- [ ] Mock LLM API responses
- [ ] Mock database in unit tests

---

## 📚 Phase 9: Documentation

### 9.1 User Documentation

#### README.md
- [x] Project overview
- [x] Installation instructions
- [x] Quick start guide
- [ ] Update with latest features as they're added

#### User Guide
- [ ] Create `docs/USER_GUIDE.md`
  - [ ] How to add sources
  - [ ] How to run a fetch
  - [ ] How to review and select headlines
  - [ ] How to compile headlines
  - [ ] How to generate content packages
  - [ ] How to export to Obsidian
  - [ ] How to configure settings
  - [ ] Troubleshooting common issues

#### Video Tutorials (Optional)
- [ ] Screen recording: Adding first source
- [ ] Screen recording: Running first compilation
- [ ] Screen recording: Exporting to Obsidian

### 9.2 Developer Documentation

#### Architecture Documentation
- [x] High-level architecture (in DEVELOPMENT_PLAN.md)
- [ ] Create `docs/ARCHITECTURE.md` with diagrams
  - [ ] Data flow diagrams
  - [ ] IPC communication diagram
  - [ ] AI pipeline diagram

#### API Documentation
- [ ] Document all IPC channels in `docs/IPC_API.md`
  - [ ] Channel names
  - [ ] Request/response payloads
  - [ ] Example usage
- [ ] Document service layer APIs
  - [ ] Method signatures
  - [ ] Parameters and return types
  - [ ] Example usage

#### Code Documentation
- [ ] Add JSDoc comments to all public functions
- [ ] Document complex algorithms
- [ ] Add inline comments for non-obvious code

### 9.3 Contribution Guidelines

#### CONTRIBUTING.md
- [ ] How to set up development environment
- [ ] How to run tests
- [ ] How to submit a PR
- [ ] Code style guidelines
- [ ] Commit message conventions

#### Code of Conduct
- [ ] Create `CODE_OF_CONDUCT.md` (optional, for open source)

---

## 🚀 Phase 10: Distribution & Deployment

### 10.1 Code Signing

#### Windows Code Signing
- [ ] Obtain code signing certificate
- [ ] Configure electron-builder with certificate
- [ ] Sign Windows installer

#### macOS Code Signing
- [ ] Obtain Apple Developer certificate
- [ ] Configure electron-builder with certificate
- [ ] Notarize macOS app

### 10.2 Auto-Update Setup

#### Update Server
- [ ] Set up update server (GitHub Releases or custom)
- [ ] Configure electron-builder to upload releases
- [ ] Implement update checking in `electron/main/update.ts`

#### Update UI
- [ ] Show update notification to user
- [ ] "Download and Install" button
- [ ] Progress bar for update download
- [ ] Release notes display

### 10.3 Installers

#### Windows Installer
- [ ] Configure NSIS installer options in `electron-builder.json`
- [ ] Add custom installer images
- [ ] Test installer on clean Windows machine

#### macOS Installer
- [ ] Configure DMG options
- [ ] Add custom DMG background
- [ ] Test installer on clean macOS machine

#### Linux Installer
- [ ] Create AppImage
- [ ] Create .deb package
- [ ] Create .rpm package
- [ ] Test on Ubuntu and Fedora

### 10.4 Crash Reporting

#### Sentry Integration (Optional)
- [ ] Set up Sentry account
- [ ] Install `@sentry/electron`
- [ ] Configure Sentry in main and renderer processes
- [ ] Test crash reporting

### 10.5 Analytics (Privacy-Respecting)

#### Usage Analytics (Optional)
- [ ] Use privacy-respecting analytics (e.g., plausible, umami)
- [ ] Track feature usage (anonymized)
- [ ] Track error rates
- [ ] Make analytics opt-in

### 10.6 Release Process

#### Pre-Release Checklist
- [ ] Run full test suite
- [ ] Manual testing on all platforms
- [ ] Update version number in `package.json`
- [ ] Update CHANGELOG.md
- [ ] Create Git tag
- [ ] Build release binaries

#### Release Pipeline
- [ ] Set up automated builds in GitHub Actions
  - [ ] Build for Windows (x64, arm64)
  - [ ] Build for macOS (x64, arm64)
  - [ ] Build for Linux (x64)
- [ ] Upload to GitHub Releases
- [ ] Announce release

#### Beta Testing
- [ ] Recruit beta testers
- [ ] Create beta release channel
- [ ] Collect feedback
- [ ] Fix critical bugs before public release

---

## 🔮 Future Enhancements (Post-MVP)

### Advanced Features Backlog
- [ ] Multi-language support (i18n)
  - [ ] Extract all strings to translation files
  - [ ] Implement language switcher
  - [ ] Support for at least English, Spanish, Chinese
- [ ] Collaboration features
  - [ ] Share runs/compilations with team
  - [ ] Comments on compilations
  - [ ] Role-based access control
- [ ] Cloud sync (optional)
  - [ ] Encrypted backup to cloud storage
  - [ ] Sync across multiple devices
  - [ ] Conflict resolution
- [ ] Mobile companion app
  - [ ] React Native app for iOS/Android
  - [ ] View archives on mobile
  - [ ] Quick capture of articles
- [ ] Browser extension
  - [ ] Capture articles directly from browser
  - [ ] Right-click "Save to NewsForge"
  - [ ] Sync with desktop app
- [ ] Podcast integration
  - [ ] Aggregate podcast episodes
  - [ ] Transcribe episodes (using Whisper or similar)
  - [ ] Include in compilations
- [ ] Advanced analytics
  - [ ] Topic trends over time
  - [ ] Source credibility scoring
  - [ ] Bias detection
  - [ ] Sentiment analysis
- [ ] Custom AI prompts
  - [ ] User-defined compilation templates
  - [ ] Prompt library
  - [ ] Share prompts with community
- [ ] Integration API
  - [ ] REST API for third-party integrations
  - [ ] Webhooks for events (new run, new compilation, etc.)
  - [ ] API documentation
- [ ] Plugin system
  - [ ] Allow community-developed plugins
  - [ ] Plugin marketplace
  - [ ] SDK for plugin development

### Advanced AI Capabilities
- [ ] Custom fine-tuning
  - [ ] Train models on user's archive
  - [ ] Personalized summarization style
- [ ] Multi-agent workflows
  - [ ] Specialized agents for different tasks
  - [ ] Research agent, writing agent, fact-checking agent
- [ ] Fact-checking
  - [ ] Verify claims across sources
  - [ ] Cross-reference with fact-checking databases
- [ ] Bias detection
  - [ ] Identify editorial slant
  - [ ] Compare coverage across sources
- [ ] Source credibility scoring
  - [ ] Rate reliability of sources
  - [ ] Warn about low-credibility sources

---

## 📌 Current Priorities (Next Steps)

1. ✅ ~~Create development plan and TODO list~~ (this document)
2. ✅ ~~Complete database service layer~~ (Phase 2.1) 
3. ✅ ~~Implement IPC communication~~ (Phase 2.2)
4. 🎯 **Build RSS feed integration** (Phase 3.1) - NEXT
5. ⏳ **Create sources management UI** (Phase 6.1)
6. ⏳ **Integrate Claude API for first compilation** (Phase 4.2)

---

## 📝 Notes

- This TODO list is a living document and should be updated as development progresses
- Mark items as `[x]` when completed
- Use `[!]` to mark blocked items and add notes
- Revisit priorities every 2 weeks
- See `DEVELOPMENT_PLAN.md` for strategic overview

---

**Last Updated**: 2026-01-10  
**Next Review**: 2026-01-24
