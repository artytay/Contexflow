# ContextFlow — Dynamic Context Questionnaire & Notion Memory Engine

An intelligent, full-stack adaptive questionnaire and context synthesis engine built in Google Antigravity. ContextFlow connects directly to a multi-database relational Notion architecture, combining personal profile telemetry (INTJ cognitive profile, skills, CareerExplorer ratings, boundaries) with dynamic diagnostic questioning to generate highly customized deliverables with Gemini models.

---

## 🏗️ System Architecture & Notion Relational Mesh

ContextFlow is deeply integrated with a 5-database relational mesh in Notion. Every question set, question, answer option, response record, and master vault block is maintained as a synchronized, relational node:

```
[Master Profile Vault Database]
  (412138c8-20f3-8190-b661-cc316102d4fc)
    │
    ├── Line-by-Line Context Blocks (Categorized into Grouped Headings)
    ├── Protected Pinned Memory (📌 isPinned)
    ├── Relational History Versioning (Edited From self-relation)
    └── Notion Source Artifact Citations
         │
         ▼
[Question Sets | Draft Source] (135d08ada33d4c0d987c370d939b3f11)
  │  Properties: Response Status (Ready / Started / Fully Answered), Category, Parent/Sub Set
  │  Page Body: Auto-Appended Gemini Deliverable & Response Audit Summary
  │
  ├──► [Questions | Draft Source] (8aa4565541fd4e49b157c6ebbc1d7ea7)
  │      Properties: Answer type, Question set relation, Context & Workspace Hints
  │      │
  │      └──► [Answer Options | Draft Source] (1c80472918b54f7190d2d1259d7c7a9e)
  │             Properties: Explanation, Examples & Guiding Hints, Workspace Alignment, Confidence Score
  │
  └───────────────────────────────┐
                                  ▼
                    [Responses | Draft Source] (d120bddac12646d490a8d9fa02a800d2)
                      Dual Relations: Question (relation) + Selected options (relation)
                      Telemetry: Number answer, Text answer, Round key, Rollup to Question Set
```

---

## 🚀 Key Capabilities & Today's Updates

### 1. Master Profile & Context Vault 2.0 (Notion Artifacts & Block Canvas)
- **Notion Workspace Artifact Search & Picker**:
  - Live, instantaneous search across your entire Notion workspace for any page, database, or research document.
  - Multi-select capability to attach specific Notion documents as active grounding sources for profile synthesis.
- **Line-by-Line Atomic Context Blocks**:
  - Instead of static textareas, context is synthesized and broken down into individual, discrete context blocks/bullets.
  - Context is organized under structured, editable **Heading Title Groups** (e.g. *System Architecture*, *Working Preferences*, *Core Skills*, *Cognitive Architecture*, *Operational Boundaries*).
  - Each heading group includes an **editable description field** clarifying what types of context belong within that category.
- **Drag-and-Drop Organization**:
  - Drag handles (`⋮⋮`) allow smooth reordering and drag-and-drop between different heading groups, automatically updating their parent group in Notion.
- **📌 Pinned Memory (Protected Memory Engine)**:
  - Any context block can be **Pinned** (highlighted in gold with a protected badge).
  - Pinned blocks are **guaranteed never to be overwritten or altered** when generating or refreshing context from new Notion pages.
- **✏️ Manual Editing with Relational Version History**:
  - Editing a block inline automatically creates a new revision page in Notion.
  - Sets `Status = Edited`, preserves the previous text in `Original Text`, and creates a relational link back to the previous block via the Notion **`Edited From`** self-relation.
- **🗑️ Soft Deletion**:
  - Deleted blocks have their Notion `Status` updated to **`Deleted`**, keeping your Notion workspace clean while preserving an immutable historical audit trail.
- **Saved Blocks Filter**:
  - Quick-toggle filter bar to inspect `All Blocks`, `📌 Pinned Only`, `✏️ Edited`, or `✨ New`.
- **Dual View Mode**:
  - One-click toggle between the **Interactive Blocks Organizer Canvas** and classic **Raw Text** mode.

### 2. Notion AI Hints, Definitions & Workspace Confidence Scores
- **Collapsible Per-Option Details**:
  - Under every choice card, an expandable **"💡 Details & Workspace Rationale"** dropdown provides:
    - **Definition**: Clear, precise definition of what the option represents in cognitive or operational terms.
    - **Self-Check Prompt**: Concrete guiding scenarios (*"Do you see yourself [specific scenario / thought pattern]?"*).
    - **Notion Workspace Rationale**: Evidence and citations cross-referenced with your INTJ cognitive profile, CareerExplorer ratings, and preferences.
- **Predicted Fit & Confidence Scores**:
  - Visual badges displayed directly on option cards (e.g., `★ 98% Fit`, `★ 85% Fit`).
- **Interactive Trigger**:
  - **"✨ Notion AI Hints & Fit Scores"** button on the question card triggers real-time workspace analysis and persists the generated fields back into Notion's `Answer Options | Draft Source` database (`Explanation`, `Examples & Guiding Hints`, `Workspace Alignment`, `Confidence Score`).
- **Question Context Banner**:
  - Overall diagnostic context box explaining what the question evaluates and how it impacts downstream deliverables.

### 3. Pre-Persisted Relational Question Sets & Auto-Sync
- **Pre-Persistence Before Display**:
  - When new questionnaires are generated, ContextFlow writes the Question Set, Questions, and Answer Options directly into Notion **before displaying the questionnaire**.
  - Prevents data loss if a session is interrupted halfway through and guarantees every question and option has a permanent UUID relation.
- **Countdown Overlay & Multi-Step Progress**:
  - Visual animated overlay with step indicators (*1. Synthesizing questions → 2. Creating Question Set → 3. Linking Questions → 4. Connecting Options*) and approximate completion countdown.
- **⚡ Add Similar Question**:
  - Generates an adjacent question with Gemini on demand, creates the question and option pages in Notion, and inserts it directly after the active question in the live workflow.
- **Automatic Deliverable & Response Sync**:
  - Upon completing a question set, responses are written to `Responses | Draft Source` with dual relations.
  - The synthesized deliverable and response summary are appended directly into the Question Set page body.
  - The Question Set's `Response Status` automatically transitions to `Fully Answered`.

### 4. Category Navigation & Grouped Sets Hub
- **Category Chips Scroll Bar**:
  - Filter question sets by category (*All*, *Clothing Preferences*, *Career*, *Productivity*, *Personalized Workflows*).
- **Grouped Sets Hub**:
  - Card-grid modal presenting all 30+ question sets grouped by their respective categories.
  - Badges display live progress and remaining questions:
    - `✓ Complete (4/4)` (Green)
    - `⏳ 2 left (2/4)` (Yellow)
    - `🔵 Ready • 4 to answer` (Blue)
  - One-click jumping between workflows.
- **Three-State Notion Status**:
  - `Ready for Responses` (blue)
  - `Incomplete - Started` (yellow)
  - `Fully Answered` (green)

### 5. Living Context Compilation & Daily Cron
- **Dynamic Vault Aggregator** (`GET /api/vault/compile-from-notion`):
  - Aggregates recorded responses across all 30 Question Sets (including CareerExplorer report scores and ratings) and compiles them into structured Master Vault categories.
- **Automated Daily Sync (Cron)**:
  - Registered background cron (`0 9 * * *`, standing daily job) that re-analyzes Notion databases every morning at 09:00, compiles the living profile rollup into `vault_snapshot.json`, and refreshes grounded context.

---

## 🏃 Getting Started

### 1. Environment Configuration (`.env`)
Ensure your `.env` file in the project root contains:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key

# Notion Integration Credentials
NOTION_TOKEN=ntn_your_bot_token
NOTION_DATABASE_ID=123138c820f3816db50bdef75bc4b6bc
NOTION_VAULT_DATABASE_ID=412138c820f38190b661cc316102d4fc
```

### 2. Universal Access in Notion
To ensure all databases, sub-pages, questions, and newly created blocks are universally accessible:
1. Open Notion in your browser.
2. Go to the top-level container page: [`Questionnaire System Draft Source Databases`](https://app.notion.com/p/artytaylor/Questionnaire-System-Draft-Source-Databases-330706b568c149c3b99f710845878bb7).
3. Click the `•••` (three dots) in the top-right corner.
4. Select **Connections** (or **Add connections**) and choose your integration.
5. Click **Confirm** when asked *"Allow access to this page and all child pages?"*.
6. All child databases and pages automatically inherit full Read, Write, and Edit permissions!

### 3. Launch the Server
```bash
# Start with live reloading
node --watch server.js
```

Open your browser to:
**[http://localhost:3000](http://localhost:3000)**

---

## 🔌 API Endpoints Reference

### Notion Integration Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notion/questionnaires` | Fetches question sets, questions, option details (explanations, hints, fit scores), and statuses from Notion. |
| `POST` | `/api/notion/create-question-set` | Pre-persists a new Question Set, questions, and options to Notion before display. |
| `POST` | `/api/notion/add-similar-question` | Generates a companion question with Gemini and persists it to Notion. |
| `POST` | `/api/notion/generate-option-hints` | Analyzes options against the Master Vault, computes confidence scores, generates definitions/examples, and saves to Notion Answer Options DB. |
| `POST` | `/api/notion/append-deliverable-to-set` | Appends deliverable markdown blocks and response summary into Question Set page body. |
| `POST` | `/api/notion/update-set-status` | Updates `Response Status` (`Incomplete - Started`, `Fully Answered`). |
| `POST` | `/api/notion/export-responses` | Records response rows in `Responses | Draft Source` with dual relations. |

### Master Vault & Artifacts Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/notion/search-workspace` | Searches Notion workspace for pages and databases matching a query. |
| `POST` | `/api/notion/generate-vault-blocks` | Extracts content from selected Notion sources, synthesizes line-by-line blocks, preserves pinned blocks, and writes to `Master Profile & Context Vault Database`. |
| `GET` | `/api/notion/vault-blocks` | Fetches active (non-deleted) blocks from Notion grouped by tab and section heading. |
| `POST` | `/api/notion/update-vault-block` | Handles pinning, unpinning, editing (with `Edited From` relational history), section re-grouping, and soft deletion. |
| `GET` | `/api/vault/compile-from-notion` | Compiles entire living profile vault from all Notion sets and responses into `vault_snapshot.json`. |

---

## 📂 Project Structure

```
├── .env                  # API keys and Notion database IDs
├── .env.example          # Environment template
├── package.json          # Node.js project manifest
├── server.js             # Core server, Gemini proxy, and full Notion API integration
├── vault_snapshot.json   # Cached living profile snapshot compiled from Notion
├── public/
│   ├── index.html        # UI, questionnaire view, modals, and block organizer canvas
│   ├── style.css         # Styling, dark mode, card transitions, drag-and-drop states
│   ├── app.js            # Frontend state, drag-and-drop controller, and Notion client
│   └── workflows.js      # Base static workflows and system prompts
└── README.md             # System documentation and developer guide
```
