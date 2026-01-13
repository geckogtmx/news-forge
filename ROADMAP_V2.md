# NewsForge V2.0 Roadmap (The "Blue Sky" Doc)

This document serves as a "parking lot" for advanced features, architectural shifts, and "wow" factors planned for the post-v1.0.0 era.

## 🎙️ Audio Intelligence ("The NotebookLM Killer")
**Goal**: Transform static news into immersive audio experiences.
*Inspiration: SurfSense, NotebookLM*

### 1. AI Podcasts
- **Concept**: Convert a compiled news briefing or research run into a 3-5 minute audio podcast.
- **Format**: Two-host "Banacast" style (Host & Specialist) discussing the headlines.
- **Tech Stack**:
    - **Script Gen**: LLM (Claude/GPT) generates a dialogue script from the `ContentPackage`.
    - **Audio Gen**: Integration with OpenAI Audio API (TTS-1-HD) or local Kokoro models.
    - **Assembly**: Node.js audio concatenation (ffmpeg) to stitch clips.

### 2. Daily Audio Briefing
- **Concept**: "NewsForge Morning Report" - auto-generated audio waiting for you when you wake up.
- **Feature**: Personalized playlist of your top tracked topics.

---

## 🔌 Advanced Connectors (Universal Ingestion)
**Goal**: Move beyond "News" into "Personal Knowledge Engine."
*Inspiration: SurfSense ETL*

### 1. Workplace Integrations
- **Slack**: Monitor channels for keywords/links.
- **Notion**: Index private wikis.
- **GitHub**: Track release notes and "starred" repos (Awesome Lists).

### 2. Local File Graph
- **PDF/Docx Ingestion**: Drag-and-drop research papers.
- **Unified Search**: Search across web news AND local docs simultaneously.

---

## 🧠 The "Second Brain" Chat
**Goal**: Conversational Interface for the Archive.

### 1. Vector Archive (RAG)
- **Concept**: Every cached headline and summary is embedded into a local vector store (`sqlite-vec`).
- **Query**: "What did we learn about Fusion Energy last month?" → Retreives and synthesizes answers from the Archive.

### 2. Graph View
- **Concept**: Visual node graph of connected entities (People, Companies, Topics) across different news sources.

---

## 🛠️ Architectural Shifts
- **Plugin System**: Allow community to write Source Connectors (JavaScript plugins).
- **Mobile Companion**: Read-only companion app for consuming compilations on the go.
