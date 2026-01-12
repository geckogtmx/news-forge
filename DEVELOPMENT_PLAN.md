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
5. ⏳ **Advanced Features**: Vault Assistant and Heat Engine capabilities

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
- **Package Manager**: npm
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

### Phase 2: Core Data Layer 🚧 (In Progress)
**Timeline**: Current Priority  
**Status**: 🚧 Active Development

#### 2.1 Database Operations
- [ ] Implement user management (CRUD)
- [ ] Create news source management service
- [ ] Build run tracking system
- [ ] Develop headline storage and retrieval
- [ ] Implement compiled items management
- [ ] Create content package storage
- [ ] Build archive management system
- [ ] Implement settings persistence

#### 2.2 IPC Communication
- [ ] Define IPC channels for all database operations
- [ ] Implement type-safe IPC handlers
- [ ] Create renderer-side IPC hooks
- [ ] Add error handling and logging
- [ ] Implement progress events for long operations

### Phase 3: News Source Integration 🚧 (In Progress)
**Timeline**: Current Priority  
**Status**: 🚧 Active Development

#### 3.1 RSS Feed Integration
- [ ] Implement RSS parser
- [ ] Create feed fetching service
- [ ] Build headline extraction logic
- [ ] Add error handling for invalid feeds
- [ ] Implement rate limiting

#### 3.2 Gmail Integration
- [ ] Set up Gmail API authentication
- [ ] Implement newsletter fetching
- [ ] Create email parsing logic
- [ ] Build filter system for relevant emails
- [ ] Add OAuth2 flow UI

#### 3.3 YouTube Integration ✅ COMPLETE
- [x] Implemented Gemini API for AI-powered video analysis
- [x] Created YouTube service and UI components
- [x] Integrated with Sources page
- [x] Tested with real videos

#### 3.4 Research Integrations
- [ ] Implement ArXiv API client (fetch by category/search)
- [ ] Implement Hugging Face Papers API integration
- [ ] Create specialized paper summary prompt
- [ ] Add PDF link extraction and storage
- [ ] Build research-specific UI (abstract view, authors)

### Phase 4: AI Integration & Compilation ⏳ (Planned)
**Timeline**: Q1 2026  
**Status**: ⏳ Not Started

#### 4.1 LangChain Setup
- [ ] Configure LangChain with Claude/GPT
- [ ] Implement prompt templates for compilation
- [ ] Create token tracking system
- [ ] Build cost analytics dashboard
- [ ] Implement tiered model strategy

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

#### 4.4 Advanced AI Features
- [ ] **Vault Assistant**: Q&A over archived content
- [ ] **Heat Engine**: Detect trending topics
- [ ] Implement meta-analysis capabilities
- [ ] Build signal verification system
- [ ] Create community signal detection

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
1. **Tier 1 - High Priority**: Claude 3.5 Sonnet
   - Content package generation
   - Complex summarization
   - Vault Assistant queries

2. **Tier 2 - Standard**: GPT-4o-mini
   - Simple compilations
   - Headline grouping
   - Basic summaries

3. **Tier 3 - Local**: Ollama (planned)
   - Privacy-sensitive operations
   - Offline mode
   - Cost-free experimentation

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

### In Progress 🚧
- Core data layer implementation
- News source integration
- IPC communication layer

### Blocked ⛔
- None currently

### Next Priorities 🎯
1. Complete database service layer
2. Implement RSS feed integration
3. Build basic compilation UI
4. Integrate Claude API for first AI features
5. Create settings page for API key configuration

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
