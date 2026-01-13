# NewsForge Development Plan

**GitHub Repository**: https://github.com/geckogtmx/newsforge-app  
**Local Repository**: E:\git\newsforge-app  
**Preview URL**: https://newsforge-gbxpkwzy.manus.space/  
**Status**: 🚧 Active Development - Core features in progress  
**Last Updated**: 2026-01-10

> **Note**: The correct GitHub repository is `newsforge-app`, not `news-forge`. The local development environment is on Windows at `E:\git\newsforge-app`. A live preview is available at the URL above.

---

## 📋 Executive Summary

NewsForge is an AI-powered, local-first desktop application designed to streamline news research and content creation workflows. Built with Electron, React, and TypeScript, it aggregates news from multiple sources, uses AI to compile and analyze information, and exports curated content packages for YouTube creation and Obsidian knowledge management.

### Core Value Proposition
- **Local-First**: All data stored locally in SQLite for privacy and offline access
- **AI-Powered**: Intelligent news compilation, summarization, and content generation
- **Multi-Source**: RSS feeds, Gmail newsletters, YouTube channels, and websites
- **Content-Ready**: Generates YouTube-ready packages with titles, descriptions, and outlines
- **Knowledge Integration**: Seamless Obsidian vault integration for long-term archive management

---

## 🎯 Project Goals & Success Criteria

### Primary Goals
1. ✅ **Foundation**: Establish robust Electron/TypeScript/SQLite stack
2. 🚧 **Core Workflow**: Implement end-to-end news aggregation → compilation → export flow
3. ⏳ **AI Integration**: Deploy tiered LLM strategy with cost optimization
4. ⏳ **Obsidian Sync**: Deep integration for archival and knowledge management
5. ⏳ **Advanced Features**: Chat Assistant and Heat Engine capabilities

### Success Metrics
- Fast startup time (< 3 seconds)
- Efficient AI token usage (< $0.50 per 100 compilations)
- Seamless Obsidian integration (< 1 second export)
- User-friendly interface (< 5 min onboarding)
- Stable production builds (99.9% uptime)

---

## 🏗️ Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router (if needed for multi-page views)

#### Desktop Application
- **Runtime**: Electron 33
- **Process Communication**: IPC (Main ↔ Renderer)
- **Security**: Context isolation enabled
- **Auto-Update**: electron-updater

#### Database & ORM
- **Database**: SQLite (local file)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Location**: User data directory

#### AI/LLM Integration
- **Framework**: LangChain
- **Models**: 
  - Primary: Claude 3.5 Sonnet (compilation, content generation)
  - Secondary: GPT-4o (fallback, specialized tasks)
  - Local: Ollama integration (planned - privacy-sensitive operations)
- **Token Tracking**: Custom analytics + LangChain callbacks

#### Build & Development
- **Bundler**: Vite
- **Package Manager**: pnpm (switched from npm for disk efficiency)
- **Builder**: electron-builder
- **Testing**: Playwright (E2E) + Vitest (unit)

### Database Schema

```
users
├── id (primary key)
├── email
├── username
├── createdAt
└── updatedAt

newsSources
├── id (primary key)
├── userId (foreign key → users)
├── type (RSS/Gmail/YouTube/Website)
├── name
├── url
├── filters (JSON)
├── topics (JSON)
├── isActive
├── createdAt
└── updatedAt

runs
├── id (primary key)
├── userId (foreign key → users)
├── startTime
├── endTime
├── status (pending/running/completed/failed)
├── totalHeadlines
└── metadata (JSON)

rawHeadlines
├── id (primary key)
├── runId (foreign key → runs)
├── sourceId (foreign key → newsSources)
├── title
├── url
├── summary
├── publishedAt
├── selected (boolean)
└── metadata (JSON)

compiledItems
├── id (primary key)
├── runId (foreign key → runs)
├── title
├── summary
├── relatedHeadlines (JSON array of rawHeadline IDs)
├── aiModel
├── tokensUsed
├── createdAt
└── metadata (JSON)

contentPackages
├── id (primary key)
├── compiledItemId (foreign key → compiledItems)
├── title
├── description
├── scriptOutline (text)
├── tags (JSON)
├── aiModel
├── tokensUsed
├── createdAt
└── exported (boolean)

runArchives
├── id (primary key)
├── runId (foreign key → runs)
├── obsidianPath
├── exportedAt
├── fileCount
└── metadata (JSON)

userSettings
├── userId (primary key, foreign key → users)
├── obsidianVaultPath
├── defaultAiModel
├── apiKeys (encrypted JSON)
└── preferences (JSON)
```

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │ Contexts │  │  Hooks   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └─────────────┴─────────────┴─────────────┘           │
│                         │                                    │
│                         ▼                                    │
│                   ┌──────────┐                              │
│                   │   IPC    │                              │
│                   └──────────┘                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Main Process (Electron)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   DB     │  │   AI     │  │  Source  │  │ Obsidian │   │
│  │ Manager  │  │ Service  │  │ Manager  │  │  Sync    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │              │              │        │
│       ▼              ▼              ▼              ▼        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ SQLite   │  │LangChain │  │  Feeds   │  │   FS     │   │
│  │ Database │  │   API    │  │  API     │  │  Writer  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Development Phases

### Phase 1: Foundation ✅ (Completed)
**Timeline**: Completed  
**Status**: ✅ Done

- [x] Initialize Electron + React + TypeScript project
- [x] Configure Vite build system
- [x] Set up Tailwind CSS + shadcn/ui
- [x] Configure electron-builder
- [x] Set up SQLite + Drizzle ORM
- [x] Create database schema and migrations
- [x] Implement basic UI layout and routing
- [x] Configure VSCode debugging
- [x] Set up Playwright + Vitest testing framework

### Phase 2: Core Data Layer ✅ (Completed)
**Timeline**: Completed
**Status**: ✅ Done

#### 2.1 Database Operations
- [x] Implement user management (CRUD)
- [x] Create news source management service
- [x] Build run tracking system
- [x] Develop headline storage and retrieval
- [x] Implement compiled items management
- [x] Create content package storage
- [x] Build archive management system
- [x] Implement settings persistence

#### 2.2 IPC Communication
- [x] Define IPC channels for all database operations
- [x] Implement type-safe IPC handlers
- [x] Create renderer-side IPC hooks
- [x] Add error handling and logging
- [x] Implement progress events for long operations

### Phase 3: News Source Integration 🚧 (In Progress)
**Timeline**: Current Priority
**Status**: 🚧 Active Development

#### 3.1 RSS Feed Integration ✅
- [x] Implement RSS parser
- [x] Create feed fetching service
- [x] Build headline extraction logic
- [x] Add error handling for invalid feeds
- [x] Implement rate limiting

#### 3.2 Gmail Integration ✅
- [x] Set up Gmail API authentication
- [x] Implement newsletter fetching
- [x] Create email parsing logic
- [x] Build filter system for relevant emails
- [x] Add OAuth2 flow UI

#### 3.3 YouTube Integration ✅ COMPLETE
- [x] Implemented Gemini API for AI-powered video analysis
- [x] Created YouTube service and UI components
- [x] Integrate with Sources page
- [x] Tested with real videos

#### 3.4 Technical Migration: pnpm
- [ ] Remove npm artifacts (lockfile)
- [ ] Install pnpm
- [ ] Reinstall dependencies
- [ ] Verify build and test pipelies

#### 3.5 Research Integrations ✅ COMPLETE
- [x] Implement ArXiv API client (fetch by category/search)
- [x] Implement Hugging Face Papers API integration
- [x] Create specialized paper summary prompt
- [x] Add PDF link extraction and storage
- [x] Build research-specific UI (abstract view, authors)

#### 3.6 Source Orchestration
- [ ] Create fetch coordinator service
- [ ] Implement parallel source fetching
- [ ] Aggregate headlines from all sources
- [ ] Handle partial failures gracefully
- [ ] Add progress event tracking



### Phase 4: AI Integration & Compilation 🚧 (In Progress)
**Timeline**: Q1 2026  
**Status**: 🚧 Active Development

#### 4.1 LangChain Setup (Backend Complete)
- [ ] Configure LangChain with Claude/GPT (Replaced with Custom Provider Registry)
- [x] Implement AI Provider System (Ollama, OpenAI, Anthropic, DeepSeek)
- [x] Create token tracking system
- [ ] Build cost analytics dashboard
- [x] Implement tiered model strategy (Backend ready)

#### 4.1.5 Cost Estimation & Management
> **High Priority**: Implement alongside token tracking for full cost transparency

**Upfront Cost Estimation**:
- [ ] Create `cost-estimator.service.ts`
  - [ ] Estimate compilation costs based on headline count and model
  - [ ] Estimate content package costs based on input length
  - [ ] Token estimation algorithm (chars → tokens with 20% buffer)
  - [ ] Dynamic pricing lookup (periodically refresh model prices)
  - [ ] Cost breakdown by operation type

**Pre-Operation Cost Preview**:
- [ ] Show cost estimates in confirmation dialogs
  - [ ] "Compile 25 headlines → Est. $0.12 (Claude)" with model switcher
  - [ ] Real-time cost updates as user adjusts parameters
  - [ ] Display token estimates alongside cost
- [ ] Model comparison widget
  - [ ] Side-by-side cost comparison (Claude vs GPT-4o vs GPT-4o-mini)
  - [ ] Quality vs cost trade-off indicator
  - [ ] Recommendation based on operation type

**Smart Budget Controls**:
- [ ] User-configurable budget limits (daily/weekly/monthly)
- [ ] Soft limits (warnings) and hard limits (blocking)
- [ ] Budget approval workflow for high-cost operations
  - [ ] Auto-approve under threshold (e.g., $0.10)
  - [ ] Require confirmation for operations > $0.50
  - [ ] Suggest cheaper alternatives when near limit
- [ ] Budget reset notifications and summaries

**Cost Optimization Suggestions**:
- [ ] Batch operation recommendations
  - [ ] "Compile 10 more headlines to maximize efficiency"
  - [ ] Suggest optimal batch sizes for each model
- [ ] Cache hit predictions
  - [ ] Show "~30% cheaper due to cached content"
  - [ ] Highlight opportunities to reuse previous compilations
- [ ] Model routing intelligence
  - [ ] Auto-suggest GPT-4o-mini for simple tasks
  - [ ] Flag when Claude Sonnet is overkill

**Cost Analytics Dashboard**:
- [ ] Real-time spending charts (daily/weekly/monthly trends)
- [ ] Cost by operation type breakdown (pie chart)
- [ ] Cost by model comparison (bar chart)
- [ ] Savings metrics
  - [ ] Total saved via caching
  - [ ] Savings from model optimization
  - [ ] Comparison to "all Claude Sonnet" baseline
- [ ] Efficiency metrics
  - [ ] Cost per headline compiled
  - [ ] Cost per content package generated
  - [ ] ROI indicators

**Budget Alerts & Notifications**:
- [ ] Toast notifications at 50%, 75%, 90%, 100% of budget
- [ ] Daily spend summary (optional email/in-app)
- [ ] Weekly cost reports with trends and recommendations
- [ ] Anomaly detection (spending spike alerts)

#### 4.2 News Compilation
- [ ] Develop headline grouping algorithm
- [ ] Implement semantic similarity analysis
- [ ] Create compilation generation pipeline
- [ ] Build summary generation
- [ ] Add quality scoring for compilations

#### 4.3 Content Package Generation
- [ ] Create YouTube title generation
- [ ] Implement description generation
- [ ] Build script outline generator
- [ ] Add tag suggestion system
- [ ] Implement SEO optimization hints

#### 4.4 Chat Assistant (Archive Intelligence)
> **Purpose**: AI-powered conversational interface for querying, analyzing, and generating content from archived runs

**Core Capabilities**:
- **Archive Search & Query**: Natural language queries over historical data
  - "Show me all AI regulation stories from last month"
  - "What did I cover about climate tech this quarter?"
  - Time-based filtering (last week, month, quarter)
  
- **Summarization**: Generate summaries across runs and compilations
  - "Summarize top 5 tech stories from this week"
  - "Give me key takeaways from my AI research archive"
  - Configurable depth (brief, detailed, comprehensive)
  
- **Cross-Run Analysis**: Identify patterns across multiple runs
  - "What topics have I covered most frequently?"
  - "Which sources provide the most valuable content?"
  - Topic frequency analysis and coverage gaps
  
- **Content Regeneration**: Create new content from archived insights
  - "Create a YouTube script combining these 3 quantum computing stories"
  - "Draft an article from my top 5 fintech compilations"
  - Mix and match content across runs
  
- **Trend Detection**: Identify emerging patterns in archive
  - "What trends are appearing in my tech coverage?"
  - "Show topics trending up/down over time"
  - Heat score analysis over time periods

**Implementation Approach**:
- **RAG (Retrieval-Augmented Generation)**: Semantic search + LLM generation
- **Vector Search**: Embed compilations and headlines for similarity search
- **Query Parser**: Detect intent (search, summarize, analyze, generate) and entities
- **Context Builder**: Fetch relevant data from database based on parsed query
- **Response Formatter**: Add citations, markdown, clickable links to source runs

**Technical Components**:
- [ ] Chat Assistant Service with query processing
- [ ] Vector database indexing for semantic search
- [ ] Intent detection and entity extraction
- [ ] Context-aware prompt construction
- [ ] **Model Selector**: JIT selection (Local/Cloud) per message or session
- [ ] Response formatting with citations
- [ ] Chat UI with message history and suggestions

#### 4.5 Heat Engine (Trend Detection)

### Phase 5: Obsidian Integration ⏳ (Planned)
**Timeline**: Q1 2026  
**Status**: ⏳ Not Started

#### 5.1 File Export
- [ ] Implement markdown export formatter
- [ ] Create vault path configuration UI
- [ ] Build file writing service
- [ ] Add conflict resolution
- [ ] Implement batch export

#### 5.2 Advanced Obsidian Features
- [ ] Create daily note integration
- [ ] Implement tag synchronization
- [ ] Build bi-directional linking
- [ ] Add metadata frontmatter
- [ ] Create graph view integration

### Phase 5.5: GitHub Awesome Lists Integration (Deferred)
**Timeline**: TBD (Post-Phase 5)
**Status**: ⏸️ Deferred

> **Note**: Deferred until after Obsidian Integration (Phase 5) is complete. "Nice to have" source.

Track updates to curated "awesome" lists on GitHub (e.g., awesome-ai-tools) as a news source.

**Approach**: Monitor commits to awesome list repositories and extract new tool/resource additions as headlines.

**Key Features**:
- Fetch recent commits via GitHub API
- Parse markdown diffs to identify new entries
- Extract tool name, description, URL, and category
- Alternative: Periodic full README parsing with diff comparison
- Support multiple awesome lists simultaneously

**Configuration**:
```json
{
  "type": "github-awesome",
  "config": {
    "repo": "mahseema/awesome-ai-tools",
    "categories": ["all"],
    "checkFrequency": "daily"
  }
}
```

**Implementation Tasks**:
- [ ] GitHub API integration (commits, file contents)
- [ ] Markdown parsing (remark/markdown-it)
- [ ] Diff extraction for new tools
- [ ] UI form for repository configuration
- [ ] Rate limiting and caching

### Phase 6: User Interface & UX ⏳ (Planned)
**Timeline**: Q2 2026  
**Status**: ⏳ Not Started

#### 6.1 Core UI Pages
- [ ] Dashboard/Overview page
- [ ] Sources management page
- [ ] Run execution and monitoring page
- [ ] Headlines review interface
- [ ] Compilation browser
- [ ] Content package editor
- [ ] Archives viewer
- [ ] Settings page

#### 6.2 UX Enhancements
- [ ] Implement keyboard shortcuts
- [ ] Add drag-and-drop support
- [ ] Create search and filter system
- [ ] Build notification system
- [ ] Implement undo/redo for critical actions
- [ ] Add onboarding flow
- [ ] Create contextual help system

### Phase 7: Security & Performance ⏳ (Planned)
**Timeline**: Q2 2026  
**Status**: ⏳ Not Started

#### 7.1 Security Hardening
- [ ] Enable context isolation in production
- [ ] Implement secure API key storage
- [ ] Add input validation and sanitization
- [ ] Enable CSP (Content Security Policy)
- [ ] Implement request signing for external APIs
- [ ] Add rate limiting for AI requests
- [ ] Security audit and penetration testing

#### 7.2 Performance Optimization
- [ ] Implement database indexing
- [ ] Add query optimization
- [ ] Create virtual scrolling for large lists
- [ ] Implement lazy loading
- [ ] Add caching layers
- [ ] Optimize bundle size
- [ ] Performance profiling and optimization

### Phase 8: Testing & Quality Assurance ⏳ (Ongoing)
**Timeline**: Continuous  
**Status**: ⏳ Not Started

- [ ] Write unit tests for database operations (target: 80% coverage)
- [ ] Create integration tests for IPC communication
- [ ] Build E2E tests for critical workflows
- [ ] Implement AI response mocking for tests
- [ ] Add performance benchmarks
- [ ] Create test fixtures and factories
- [ ] Set up CI/CD pipeline
- [ ] Implement automated regression testing

### Phase 9: Documentation & Polish ⏳ (Planned)
**Timeline**: Q2 2026  
**Status**: ⏳ Not Started

- [ ] Write comprehensive README
- [ ] Create user guide
- [ ] Build developer documentation
- [ ] Document API and IPC channels
- [ ] Create video tutorials
- [ ] Write contribution guidelines
- [ ] Add inline code documentation

### Phase 10: Distribution & Deployment ⏳ (Planned)
**Timeline**: Q3 2026  
**Status**: ⏳ Not Started

- [ ] Configure code signing certificates
- [ ] Set up auto-update infrastructure
- [ ] Create installers for Windows/Mac/Linux
- [ ] Implement crash reporting
- [ ] Set up analytics (privacy-respecting)
- [ ] Create release pipeline
- [ ] Beta testing program
- [ ] Public release

### Phase 11: UI/UX Optimization & Polish ⏳ (Planned)
**Timeline**: Q3 2026  
**Status**: ⏳ Not Started

#### 11.1 Visual Polish & Design Consistency
- [ ] Conduct comprehensive UI audit for consistency
  - [ ] Standardize spacing scale (4px/8px grid system)
  - [ ] Verify consistent color usage across all components
  - [ ] Standardize typography hierarchy
  - [ ] Ensure consistent button sizes and styles
  - [ ] Audit icon usage and sizing
- [ ] Refine component styling
  - [ ] Reduce excessive padding in cards and containers
  - [ ] Optimize white space for better density
  - [ ] Improve visual hierarchy with better contrast
  - [ ] Add subtle shadows and depth where appropriate
- [ ] Polish micro-interactions
  - [ ] Smooth hover transitions (200-300ms)
  - [ ] Loading state animations
  - [ ] Success/error state feedback
  - [ ] Skeleton loaders for async content

#### 11.2 Accessibility (a11y)
- [ ] Keyboard navigation
  - [ ] Ensure all interactive elements are keyboard accessible
  - [ ] Implement logical tab order
  - [ ] Add visible focus indicators
  - [ ] Support keyboard shortcuts (Ctrl+N, Ctrl+K, etc.)
- [ ] Screen reader support
  - [ ] Add ARIA labels to all interactive elements
  - [ ] Ensure semantic HTML structure
  - [ ] Test with screen readers (NVDA, JAWS)
  - [ ] Add descriptive alt text for images/icons
- [ ] Color and contrast
  - [ ] Verify WCAG AA compliance (4.5:1 contrast ratio)
  - [ ] Test in grayscale mode
  - [ ] Ensure color is not the only indicator of state
- [ ] Motion and animation
  - [ ] Respect `prefers-reduced-motion` setting
  - [ ] Provide alternatives to animations

#### 11.3 Responsive Design & Layout
- [ ] Window resizing support
  - [ ] Test minimum and maximum window sizes
  - [ ] Ensure layouts adapt gracefully
  - [ ] Implement responsive breakpoints
  - [ ] Handle edge cases (small screens, ultra-wide)
- [ ] Content density options
  - [ ] Compact/comfortable/spacious view modes
  - [ ] User preference persistence
  - [ ] Optimized for different screen sizes

#### 11.4 Performance & Perceived Performance
- [ ] Loading states
  - [ ] Skeleton screens for content loading
  - [ ] Progress indicators for long operations
  - [ ] Optimistic UI updates where safe
- [ ] Instant feedback
  - [ ] Sub-100ms response to user actions
  - [ ] Debounce expensive operations
  - [ ] Prevent double-clicks with loading states
- [ ] Reduce visual jank
  - [ ] Eliminate layout shifts (CLS)
  - [ ] Use content placeholders
  - [ ] Optimize re-renders with React.memo

#### 11.5 Information Architecture
- [ ] Simplify navigation
  - [ ] Reduce clicks to common actions
  - [ ] Clear breadcrumbs and page titles
  - [ ] Contextual actions in relevant locations
- [ ] Improve data presentation
  - [ ] Optimize table layouts for scannability
  - [ ] Add helpful empty states with CTAs
  - [ ] Use progressive disclosure for complex forms
  - [ ] Implement smart defaults

#### 11.6 User Feedback & Error Handling
- [ ] Error messages
  - [ ] User-friendly error text (no technical jargon)
  - [ ] Actionable solutions suggested
  - [ ] Proper error state UI
- [ ] Success confirmation
  - [ ] Toast notifications for actions
  - [ ] Visual feedback for state changes
  - [ ] Undo options for destructive actions
- [ ] Validation
  - [ ] Real-time form validation
  - [ ] Clear validation messages
  - [ ] Focus management on errors

#### 11.7 Dark Mode Refinement
- [ ] Audit dark mode colors
  - [ ] Ensure proper contrast in dark mode
  - [ ] Reduce eye strain with appropriate grays
  - [ ] Test all components in dark mode
- [ ] Image and icon adjustments for dark mode
- [ ] Smooth theme transition animation

#### 11.8 User Testing & Feedback
- [ ] Conduct usability testing
  - [ ] Test with 5-10 representative users
  - [ ] Identify pain points and confusion
  - [ ] Document improvement opportunities
- [ ] Implement feedback
  - [ ] Prioritize high-impact UX improvements
  - [ ] Iterate on problematic workflows
  - [ ] A/B test major changes if needed

---

## 🎨 UI/UX Design Principles

### Design Philosophy
- **Clean & Minimal**: Reduce cognitive load, focus on content
- **Information-Dense**: Show relevant data without overwhelming
- **Fast & Responsive**: Instant feedback, smooth animations
- **Keyboard-First**: Power users should never need the mouse
- **Dark Mode**: First-class support (default)

### UI Components Strategy
- Use shadcn/ui for consistency
- Custom components for domain-specific needs
- Storybook for component documentation (optional)

---

## 🔧 Development Best Practices

### Git Workflow
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch for features
- **Feature Branches**: `feature/feature-name`
- **Bugfix Branches**: `bugfix/issue-description`
- **Commit Convention**: Conventional Commits (feat, fix, docs, chore, etc.)

### Code Quality
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with strict rules
- **Formatting**: Prettier (automatic on save)
- **Pre-commit Hooks**: Lint + format + type check
- **Code Review**: All PRs require review (if team expands)

### Testing Strategy
- **Unit Tests**: All business logic functions
- **Integration Tests**: Database + IPC operations
- **E2E Tests**: Critical user workflows
- **AI Mocking**: Mock LLM responses for deterministic tests

### Logging & Debugging
- **Structured Logging**: Use Winston or Pino
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Log Rotation**: Keep logs manageable
- **Error Tracking**: Sentry or similar (optional)

---

## 💰 AI Cost Optimization Strategy

### Tiered Model Strategy
### Hybrid Model Architecture (Just-in-Time Selection)

We implement a **"Right Tool for the Job"** philosophy, allowing dynamic selection between Local (Free/Private) and Cloud (Premium/Paid) models at critical workflow steps.

#### 1. The "Switchboard" (AI Provider Registry)
- **Local Provider**: Ollama integration (`qwen`, `mistral`, `emma`)
- **Cloud Provider**: OpenAI, Anthropic, DeepSeek integration
- **Supported Models**: Curated list of best-in-class options (not every model in existence)

#### 2. Critical Selection Points (JIT)
At key moments (e.g., "Generate Script"), a `ModelSelectorDialog` appears:
- **Option A: Local Speed** (e.g., `qwen2.5:7b`) - Free, Fast
- **Option B: Local Power** (e.g., `qwen2.5:14b`) - Free, Smart
- **Option C: Cloud Premium** (e.g., `Claude 3.5 Sonnet`) - Paid ($0.05), Best Quality

#### 3. Default Tiered Roles (Auto-Pilot)
If user disables JIT prompts, we default to:
1. **Reasoning**: `qwen2.5:14b` (Local)
2. **Standard**: `qwen2.5:7b` (Local)
3. **Fast/Edge**: `emma3:4b` (Local)
4. **Creative**: `devstral-small-2` (Local)

### Cost Control Measures
- **Token Tracking**: Real-time monitoring per operation
- **Context Hygiene**: Minimize prompt size, trim unnecessary context
- **Caching**: Cache similar requests
- **Batch Processing**: Group similar operations
- **User Budgets**: Optional daily/monthly limits

### Analytics Dashboard
- Total tokens used (by model)
- Estimated costs (daily/weekly/monthly)
- Cost per compilation/content package
- Top expensive operations
- Savings from caching

---

## 🔮 Future Enhancements (Post-MVP)

### Advanced Features
- [ ] **Multi-language Support**: i18n for UI
- [ ] **Collaboration**: Share runs/compilations with others
- [ ] **Cloud Sync** (optional): Encrypted backup to cloud
- [ ] **Mobile Companion App**: View archives on mobile
- [ ] **Browser Extension**: Capture articles directly
- [ ] **Podcast Integration**: Aggregate podcast episodes
- [ ] **Advanced Analytics**: Topic trends over time
- [ ] **Custom AI Prompts**: User-defined compilation templates
- [ ] **Integration API**: Allow third-party integrations
- [ ] **Plugin System**: Extensibility for community additions
- [ ] **Subscription Integration**: Web-based access to ChatGPT/Gemini (deferred)

### Advanced AI Capabilities
- [ ] **Custom Fine-Tuning**: Train models on user's archive
- [ ] **Multi-Agent Workflows**: Specialized agents for different tasks
- [ ] **Fact-Checking**: Verify claims across sources
- [ ] **Bias Detection**: Identify editorial slant
- [ ] **Source Credibility Scoring**: Rate reliability

---

## 📊 Current Project Status

### Completed ✅
- Project structure and foundation
- Build system configuration
- Database schema and migrations
- Basic UI components and layout
- Development environment setup
- Core data layer implementation (Phase 2)
- News source integration (RSS, Gmail, YouTube, ArXiv, HF)
- IPC communication layer

### In Progress 🚧
- Phase 4: Hybrid AI Integration & Compilation
- Cost Estimation & Management

### Blocked ⛔
- None currently

### Next Priorities 🎯
1. **Phase 4.2**: News Compilation (Headline grouping & summarization)
2. **Phase 4.3**: Content Package Generation (YouTube scripts)
3. **Phase 4.1.5**: Cost Estimation UI (Token tracking & visualizers)
4. **Phase 4.4**: Chat Assistant (Archive Intelligence)

---

## 📞 Support & Resources

### Documentation
- [README.md](README.md) - Project overview and quick start
- [TODO.md](TODO.md) - Detailed task breakdown
- This document (DEVELOPMENT_PLAN.md) - Strategic roadmap

### Issue Tracking
- GitHub Issues: https://github.com/geckogtmx/news-forge/issues
- Label System: `bug`, `feature`, `enhancement`, `documentation`, `question`

### Community
- Personal project, suggestions welcome via GitHub Issues

---

**Document Version**: 1.0  
**Last Reviewed**: 2026-01-10  
**Next Review**: 2026-02-01
