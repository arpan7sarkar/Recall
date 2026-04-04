# Second Brain — Product Requirements Document (PRD)
**Version:** 1.1  
**Date:** March 2026  
**Status:** Ready to Build  
**Changelog (v1.2):** Completed Phase 1 (Backend Core) and Phase 2 (Frontend Core). All core CRUD operations, manual content addition UI, and Clerk authentication are functional. Ready to start Phase 3 (Background Workers & AI).
**Changelog (v1.1):** Added full Manual Content Addition feature for the web app — dedicated Add Content page, source type selection UI, type-specific input forms, and updated data flow.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Feature List (Full Scope)](#4-feature-list-full-scope)
5. [Tech Stack (Detailed)](#5-tech-stack-detailed)
6. [System Architecture](#6-system-architecture)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Build Phases & Mini Steps](#9-build-phases--mini-steps)
10. [Environment & DevOps Setup](#10-environment--devops-setup)
11. [Production Checklist](#11-production-checklist)

---

## 1. Project Overview

**App Name (Working Title):** Recall

**One-line pitch:** A personal knowledge base where anything saved from the internet is automatically organised, connected, and surfaced back to you at the right time.

**The core problem:** People save articles, tweets, videos, and PDFs constantly but never revisit them. There is no system that automatically organises this content, connects related ideas, or remembers *for you* what you once found interesting.

**The solution:** A web app + browser extension that captures any internet content, uses AI to tag and cluster it, builds a visual knowledge graph, and resurfaces relevant memories when you need them. Content can be added both via the browser extension (one-click save) and via a full-featured manual Add Content interface directly in the web app.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Users actively save content | Items saved per user per week | ≥ 10 |
| AI organisation is useful | % of AI tags accepted by user | ≥ 70% |
| Resurfacing is valued | Click-through rate on resurface suggestions | ≥ 25% |
| Search is fast and relevant | Semantic search latency | < 1 second |
| Graph is used | Users who visit graph view weekly | ≥ 30% |
| Retention | Day-30 retention | ≥ 40% |
| Manual saves used | % of saves made via web app Add Content UI | ≥ 30% |

---

## 3. User Personas

**Persona 1 — The Researcher (Primary)**
- Saves academic papers, articles, YouTube lectures
- Wants to connect ideas across topics
- Uses semantic search daily

**Persona 2 — The Content Creator**
- Saves tweets, newsletters, inspiration
- Wants to build collections for projects
- Uses highlight and re-read features

**Persona 3 — The Casual Learner**
- Saves things impulsively, forgets them
- Needs resurfacing feature most
- Wants zero setup, auto-organisation

---

## 4. Feature List (Full Scope)

### Core Features (MVP — Phase 1 & 2)
- User authentication (email + Google OAuth)
- Browser extension (Chrome) to save any URL
- **Manual content addition via web app — dedicated Add Content page with source type selection and type-specific forms (see Section 4a below)**
- Content type detection: article, tweet, YouTube, PDF, image
- Automatic metadata extraction (title, description, thumbnail, author)
- Basic tagging (manual)
- Search (keyword first, then semantic)
- Dashboard / Feed view of saved items
- Collections (user-created folders)

### 4a. Manual Add Content Feature (Web App)

This is a first-class feature of the web app. Users can add any type of content directly from the website without needing the browser extension.

**Entry Points:**
- Prominent "+ Add Content" button in the top navigation bar (always visible)
- "+ Add Content" button in the empty state of the dashboard
- Keyboard shortcut: `Cmd/Ctrl + K` opens the Add Content flow

**Add Content Page / Modal — Step 1: Choose Source Type**

When the user clicks "+ Add Content", they are shown a full-screen modal or dedicated page (`/add`) with a visual source type picker:

```
┌─────────────────────────────────────────────────────────────┐
│  What are you saving?                                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 📄       │  │ ▶️        │  │ 🐦       │  │ 📁       │   │
│  │ Article  │  │ YouTube  │  │ Tweet /  │  │  PDF /   │   │
│  │  / Blog  │  │  Video   │  │   Post   │  │   Doc    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 🎙️       │  │ 🖼️        │  │ 🔗       │                  │
│  │ Podcast  │  │  Image   │  │  Other   │                  │
│  │          │  │  / GIF   │  │   Link   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  Or just paste any URL and we'll detect it automatically ▼  │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Type-Specific Input Form**

Once a source type is selected, the form adapts to show relevant fields for that type:

| Source Type | Fields Shown |
|-------------|--------------|
| **Article / Blog** | URL (required), Title (optional override), Author (optional), Note |
| **YouTube Video** | YouTube URL (required), Note, Start Timestamp (optional, e.g. "1:23:45") |
| **Tweet / Post** | Tweet/X URL (required), Note |
| **PDF / Doc** | URL *or* File Upload (drag and drop), Title (required for uploads), Note |
| **Podcast** | Episode URL (required), Podcast name (optional), Episode title (optional), Note |
| **Image / GIF** | URL *or* File Upload, Title (required), Source credit (optional), Note |
| **Other Link** | URL (required), Title (optional override), Note |

**Step 3: Quick Tags Before Saving (Optional)**

Below the type-specific form, always show:
- A tag input (typeahead from existing tags) — user can add 1–5 tags before saving
- A "Add to Collection" dropdown — optionally assign to an existing collection at save time
- A "Save" button and a "Save & Add Another" button

**Behaviour after Save:**
- Item appears in the feed immediately with a "Processing…" skeleton badge
- A toast notification confirms: "Saved! We're processing your content."
- The modal/page resets so the user can add another item if they chose "Save & Add Another"
- Once background processing completes, the badge updates to show content type and tags

### AI Features (Phase 3)
- AI tag suggestions (powered by LLM)
- Topic clustering (group similar items automatically)
- Related items suggestions (semantic similarity)
- Knowledge graph visualisation (D3.js)
- Highlight system (save specific text from articles)

### Advanced Features (Phase 4)
- Memory resurfacing ("You saved this 2 months ago")
- Smart notifications / weekly digest email
- Graph exploration (click a node, see connections)
- Export (PDF, markdown)
- Public collections (shareable links)

---

## 5. Tech Stack (Detailed)

### Frontend
| Tool | Purpose | Why |
|------|---------|-----|
| Next.js 16 (App Router) | Web app framework | Server-side rendering, API routes, good DX |
| TypeScript | Type safety | Fewer runtime bugs |
| Tailwind CSS | Styling | Fast, consistent UI |
| D3.js v7 | Knowledge graph | Most powerful graph library for custom visuals |
| Zustand | Client state management | Lightweight, simple |
| TanStack | Server state / caching | Handles loading, caching, refetch |
| shadcn/ui | Component library | Beautiful, accessible, customisable |

### Browser Extension
| Tool | Purpose |
|------|---------|
| Plasmo Framework | Build Chrome extension with React |
| Chrome Extension Manifest V3 | Required for Chrome Web Store |

### Backend
| Tool | Purpose | Why |
|------|---------|-----|
| Node.js + Express | REST API server | You likely know JS already |
| TypeScript | Type safety on backend | |
| BullMQ | Job queue (background workers) | For async AI processing |
| Redis | Queue broker + caching | Required by BullMQ |
| Cheerio + Puppeteer | Web scraping / metadata extraction | Get content from URLs |
| OpenAI API (or Anthropic) | AI tagging + embeddings | GPT-4 for tags, text-embedding-3 for vectors |
| Multer | File upload handling | For PDF and image uploads from the web app |

### Database
| Tool | Purpose | Why |
|------|---------|-----|
| PostgreSQL | Primary relational DB | Reliable, powerful |
| Prisma ORM | Database queries | Type-safe, easy migrations |
| Pinecone (or pgvector) | Vector/embedding storage | Semantic search |
| Redis | Caching + sessions | Fast key-value storage |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Cloudflare R2 | Object storage (images, PDFs, thumbnails) |
| **Render** | Backend API + Worker hosting (free tier → paid as needed) |
| **Vercel** | Frontend hosting (Next.js native, auto-deploys from GitHub) |
| Upstash Redis | Managed Redis (free tier available) |
| Neon (or Supabase) | Managed PostgreSQL (free tier available) |
| Pinecone | Managed vector DB (free tier available) |

### DevOps / Tooling
| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD pipeline |
| ESLint + Prettier | Code quality |
| Husky | Pre-commit hooks |

---

## 6. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              USER                                     │
│   Browser Extension  │  Web App (Next.js)  │  Add Content Page/Modal │
└──────────┬───────────┴──────────┬──────────┴──────────┬──────────────┘
           │                      │                      │
           │  (URL only)          │  (URL or File Upload)│
           ▼                      ▼                      ▼
 ┌──────────────────┐   ┌──────────────────────────────────┐
 │   Next.js API    │   │         Express API (Node.js)    │
 │   Routes         │◄──►  POST /items  │  POST /items/upload │
 └──────────────────┘   └─────────────────┬────────────────┘
                                           │
              ┌────────────────────────────┼──────────────────────┐
              │                            │                      │
              ▼                            ▼                      ▼
     ┌──────────────┐          ┌──────────────────┐   ┌──────────────────┐
     │ PostgreSQL   │          │  BullMQ Queue    │   │ Pinecone (Vector)│
     │ (Neon)       │          │  (Redis)         │   │ DB               │
     └──────────────┘          └────────┬─────────┘   └──────────────────┘
                                        │
                     ┌──────────────────┼────────────────────┐
                     │                  │                    │
                     ▼                  ▼                    ▼
           ┌──────────────┐   ┌──────────────────┐  ┌──────────────┐
           │  Scraper     │   │  AI Worker        │  │ Embed Worker │
           │  Worker      │   │  (OpenAI Tags)    │  │ (Vectorise)  │
           └──────────────┘   └──────────────────┘  └──────────────┘
                                                              │
                                                 ┌────────────▼──────────────┐
                                                 │   Cloudflare R2            │
                                                 │   (Images, PDFs, Files)   │
                                                 └────────────────────────────┘
```

### Data Flow A — Browser Extension Save (URL only)

```
1. User clicks extension → sends URL to POST /items
2. API creates a "pending" item in PostgreSQL → returns item ID
3. API pushes job to BullMQ scrapeQueue → responds 200 immediately
4. Worker 1 (Scraper): fetches URL, extracts metadata, saves thumbnail to R2
5. Worker 2 (AI Tagger): sends content to OpenAI → gets tag suggestions
6. Worker 3 (Embedder): generates text embedding → stores in Pinecone
7. Item status updated to "ready" in PostgreSQL
8. Frontend polls or receives WebSocket update → shows item
```

### Data Flow B — Web App Manual Save (URL input)

```
1. User opens Add Content page/modal → selects source type → pastes URL
2. User optionally adds manual tags and selects a collection
3. User clicks Save → POST /items is called with { url, itemType, tags[], collectionId? }
4. API creates a "pending" item in PostgreSQL with the provided itemType hint
5. API immediately attaches any manually provided tags to the item
6. If a collectionId was provided, item is added to that collection
7. API pushes job to BullMQ scrapeQueue → responds 200 immediately
8. Workers 1–3 run identically to Flow A above
9. Frontend shows optimistic "Processing…" card → updates to "ready" when done
```

### Data Flow C — Web App Manual Save (File Upload — PDF or Image)

```
1. User opens Add Content page/modal → selects PDF or Image type → uploads file
2. User provides a title (required for uploads), optional tags and collection
3. User clicks Save → POST /items/upload (multipart/form-data) with file + metadata
4. API receives file via Multer → immediately uploads raw file to Cloudflare R2
5. API creates item in PostgreSQL with status "processing" (no scraping needed)
6. API pushes job to BullMQ aiQueue (skip scraper, file is already stored)
7. Worker 2 (AI Tagger): reads text content from PDF (via pdf-parse) or image OCR → generates tags
8. Worker 3 (Embedder): generates embedding from extracted text → stores in Pinecone
9. Item status updated to "ready" in PostgreSQL
10. Frontend shows optimistic card → updates when ready
```

---

## 7. Database Schema

### Tables Overview

**users**
```sql
id              UUID PRIMARY KEY
email           VARCHAR UNIQUE NOT NULL
name            VARCHAR
avatar_url      VARCHAR
google_id       VARCHAR UNIQUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**items** (the core table — every saved piece of content)
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
url             TEXT                -- nullable for direct file uploads
title           VARCHAR
description     TEXT
content_text    TEXT                -- extracted readable text
thumbnail_url   VARCHAR             -- stored in R2
file_url        VARCHAR             -- for uploaded PDFs/images stored in R2
item_type       ENUM('article','tweet','youtube','pdf','image','podcast','link')
save_source     ENUM('extension','web_url','web_upload')  -- how it was saved
status          ENUM('pending','processing','ready','failed')
reading_time    INTEGER             -- in minutes
word_count      INTEGER
source_domain   VARCHAR             -- e.g. medium.com
author          VARCHAR
published_at    TIMESTAMP
saved_at        TIMESTAMP
last_viewed_at  TIMESTAMP
view_count      INTEGER DEFAULT 0
is_archived     BOOLEAN DEFAULT false
is_favourite    BOOLEAN DEFAULT false
user_note       TEXT                -- note added at save time (from web app form)
youtube_timestamp INTEGER           -- start timestamp in seconds (YouTube saves)
```

**tags**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
name            VARCHAR NOT NULL
color           VARCHAR             -- hex color code
is_ai_generated BOOLEAN DEFAULT false
created_at      TIMESTAMP
```

**item_tags** (many-to-many)
```sql
item_id         UUID REFERENCES items(id)
tag_id          UUID REFERENCES tags(id)
confidence      FLOAT               -- AI confidence score (0.0 to 1.0); 1.0 for manual tags
PRIMARY KEY (item_id, tag_id)
```

**collections**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
name            VARCHAR NOT NULL
description     TEXT
cover_image     VARCHAR
is_public       BOOLEAN DEFAULT false
public_slug     VARCHAR UNIQUE
created_at      TIMESTAMP
```

**collection_items** (many-to-many)
```sql
collection_id   UUID REFERENCES collections(id)
item_id         UUID REFERENCES items(id)
position        INTEGER             -- for ordering
added_at        TIMESTAMP
PRIMARY KEY (collection_id, item_id)
```

**highlights**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
item_id         UUID REFERENCES items(id)
text            TEXT NOT NULL
note            TEXT                -- user's annotation
color           VARCHAR             -- yellow, blue, pink, green
position_start  INTEGER             -- character position in content
position_end    INTEGER
created_at      TIMESTAMP
```

**resurface_log** (tracks resurfacing for avoiding repeats)
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
item_id         UUID REFERENCES items(id)
resurfaced_at   TIMESTAMP
was_clicked     BOOLEAN DEFAULT false
```

---

## 8. API Design

Base URL: `https://api.yourdomain.com/v1`

### Authentication (Powered by Clerk)
```
Middleware will verify Clerk JWT session tokens on every request.
The frontend handles the login/register flows using Clerk's SDK.
Backend uses @clerk/express for session verification.
```

### Items
```
GET    /items                  List all items (with pagination, filters)
POST   /items                  Save a new item via URL (extension or web app)
                               Body: { url, itemType?, tags[]?, collectionId?, note?, youtubeTimestamp? }
POST   /items/upload           Save a new item via file upload (web app only)
                               Body: multipart/form-data — file, title, itemType, tags[]?, collectionId?, note?
GET    /items/:id              Get single item
PATCH  /items/:id              Update item (title, notes, favourite, archive)
DELETE /items/:id              Delete item

GET    /items/:id/related      Get semantically related items
POST   /items/:id/tags         Add tags to item
DELETE /items/:id/tags/:tagId  Remove tag from item
```

### Search
```
GET    /search?q=&type=semantic|keyword    Search items
GET    /search/suggestions?q=             Autocomplete
```

### Collections
```
GET    /collections            List user's collections
POST   /collections            Create collection
GET    /collections/:id        Get collection with items
PATCH  /collections/:id        Update collection
DELETE /collections/:id        Delete collection
POST   /collections/:id/items  Add item to collection
DELETE /collections/:id/items/:itemId  Remove item
```

### Graph
```
GET    /graph                  Get full knowledge graph data
                               Returns: { nodes: [...], edges: [...] }
GET    /graph/node/:id         Get single node's connections
```

### Tags
```
GET    /tags                   List all user tags
POST   /tags                   Create tag
PATCH  /tags/:id               Update tag
DELETE /tags/:id               Delete tag
```

### Highlights
```
GET    /items/:id/highlights   List highlights for item
POST   /items/:id/highlights   Create highlight
DELETE /highlights/:id         Delete highlight
```

### Resurfacing
```
GET    /resurface              Get today's resurface suggestions (3 items)
POST   /resurface/:id/seen     Mark as seen
POST   /resurface/:id/clicked  Mark as clicked (analytics)
```

---

## 9. Build Phases & Mini Steps

> **How to read this:** Each Phase is a milestone. Each Phase has Steps. Each Step has Mini-Steps (the actual tasks you do). Do not move to the next Phase until the current one is working.

---

### PHASE 0 — Setup & Foundation (Week 1)

**Goal:** Working local dev environment, git repo, project structure ready.

---

#### Step 0.1 — Machine Setup

- [x] 0.1.1 Install Node.js v20 LTS from nodejs.org
- [x] 0.1.2 Install npm: `npm install -g npm`
- [x] 0.1.3 Install VS Code + extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, GitHub Copilot (optional)
- [x] 0.1.4 Create a GitHub account if you don't have one
- [x] 0.1.5 Install Git and configure `git config --global user.name` and `user.email`

#### Step 0.2 — Create GitHub Repository

- [x] 0.2.1 Go to github.com → New repository → name it `second-brain`
- [x] 0.2.2 Clone it locally: `git clone https://github.com/yourusername/second-brain.git`
- [x] 0.2.3 Create the monorepo folder structure:
  ```
  second-brain/
  ├── apps/
  │   ├── web/          (Next.js frontend)
  │   ├── api/          (Express backend)
  │   └── extension/    (Chrome extension)
  ├── packages/
  │   └── shared/       (shared TypeScript types)
  ├── .env.example
  └── README.md
  ```
- [ ] 0.2.4 Initialise npm workspace: create `npm-workspace.yaml` at root
- [x] 0.2.5 Add `.gitignore` (node_modules, .env, .next, dist)

#### Step 0.3 — Local Database & Redis (Cloud-based, no Docker needed)

> **No Docker required.** Use free cloud-hosted services even in local development — they're easier to set up and match the production environment exactly.

- [x] 0.3.1 **PostgreSQL**: Create a [Neon](https://neon.tech) account → create a project → copy the connection string. Use this as `DATABASE_URL`.
- [x] 0.3.2 **Redis**: Create an [Upstash](https://upstash.com) account → create a Redis database → copy the REST URL. Use this as `REDIS_URL`.
- [x] 0.3.3 Test the DB connection: run `npx prisma db pull` from `apps/api` — if it succeeds, the connection works.
- [x] 0.3.4 (Optional) Install [TablePlus](https://tableplus.com) or [DBeaver](https://dbeaver.io) as a visual Postgres client.

#### Step 0.4 — Environment Variables

- [x] 0.4.1 Create `.env.example` file listing all required variables:
  ```
  DATABASE_URL=
  REDIS_URL=
  OPENAI_API_KEY=
  PINECONE_API_KEY=
  PINECONE_INDEX=
  CLOUDFLARE_R2_BUCKET=
  CLOUDFLARE_R2_ACCESS_KEY=
  CLOUDFLARE_R2_SECRET_KEY=
  CLOUDFLARE_R2_ENDPOINT=
  CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_API_URL=
  MAX_FILE_UPLOAD_MB=20
  ```
- [x] 0.4.2 Copy `.env.example` to `.env` and fill in local values
- [x] 0.4.3 Never commit `.env` — confirm it is in `.gitignore`

---

### PHASE 1 — Backend Core (Week 2–3)

**Goal:** Working API with auth, item saving (sync only), and database.

---

#### Step 1.1 — Initialise Express API

- [x] 1.1.1 `cd apps/api && npm init`
- [x] 1.1.2 Install core dependencies:
  ```
  npm i  express cors dotenv helmet morgan multer
  npm i  -D typescript ts-node-dev @types/express @types/node @types/multer
  ```
- [x] 1.1.3 Create `tsconfig.json` with strict mode enabled
- [x] 1.1.4 Create `src/index.ts` — basic Express server on port 4000
- [x] 1.1.5 Add `scripts` to `package.json`: `dev`, `build`, `start`
- [x] 1.1.6 Test: `npm dev` → `GET http://localhost:4000/health` returns `{ status: "ok" }`

#### Step 1.2 — Set Up Prisma & Database

- [x] 1.2.1 Install Prisma: `npm i  prisma @prisma/client`
- [x] 1.2.2 Run `npx prisma init` — this creates `prisma/schema.prisma`
- [x] 1.2.3 Set `DATABASE_URL` in `.env` to your local PostgreSQL connection string
- [x] 1.2.4 Write the Prisma schema based on Section 7 (all tables above, including new `save_source`, `file_url`, `user_note`, `youtube_timestamp` fields)
- [x] 1.2.5 Run `npx prisma migrate dev --name init` — creates all tables
- [x] 1.2.6 Run `npx prisma studio` — opens visual DB browser, verify tables exist
- [x] 1.2.7 Create `src/lib/prisma.ts` — singleton Prisma client

#### Step 1.3 — Authentication System (Clerk Integration)

- [x] 1.3.1 Install Clerk Express SDK:
  ```
  npm install @clerk/express
  ```
- [x] 1.3.2 Create `src/middleware/auth.ts` — Clerk session verification middleware
- [x] 1.3.3 Configure Clerk environment variables in `.env`:
  - `CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- [x] 1.3.4 Sync Clerk Users with Database:
  - Implement a webhook listener or use the `clerkClient` to fetch/store user details on first request
- [x] 1.3.5 Test: verify that requests without a valid Clerk session token are rejected

#### Step 1.4 — Items CRUD API (URL-based Save)

- [x] 1.4.1 Create `src/routes/items.ts`
- [x] 1.4.2 Implement `POST /items`:
  - Accept `{ url, itemType?, tags[], collectionId?, note?, youtubeTimestamp? }` in request body
  - Validate URL format
  - Create item in database with status `pending`, save_source = `web_url` or `extension` (detect from User-Agent or an explicit source field)
  - If `tags[]` provided: find or create each tag, immediately create `item_tags` records with confidence = 1.0
  - If `collectionId` provided: create `collection_items` record
  - For now, just save the URL — no scraping yet
  - Return created item
- [x] 1.4.3 Implement `GET /items`:
  - Fetch all items for authenticated user
  - Add pagination: `?page=1&limit=20`
  - Add filtering: `?type=article&tag=science&source=web_upload`
  - Return items with total count
- [x] 1.4.4 Implement `GET /items/:id` — return single item
- [x] 1.4.5 Implement `PATCH /items/:id` — update title, notes, favourite, archive
- [x] 1.4.6 Implement `DELETE /items/:id` — soft delete (set `is_archived = true`)
- [x] 1.4.7 Apply auth middleware to all item routes
- [x] 1.4.8 Test all routes with Postman — ensure you cannot access another user's items

#### Step 1.5 — File Upload API

- [x] 1.5.1 Configure Multer middleware:
  - Accept PDF (`application/pdf`) and images (`image/*`)
  - Max file size: 20MB (configurable via `MAX_FILE_UPLOAD_MB` env var)


---

### PHASE 2 — Frontend Core (Week 3–4)

**Goal:** Working Next.js app with auth, dashboard, item saving via URL, and full manual Add Content UI.

---

#### Step 2.1 — Initialise Next.js App

- [x] 2.1.1 `cd apps/web && npm create next-app@latest . --typescript --tailwind --app --no-src-dir`
- [x] 2.1.2 Install UI dependencies:
  ```
  npm i  @tanstack/react-query zustand axios
  npm i  @radix-ui/react-dialog @radix-ui/react-dropdown-menu
  npm dlx shadcn@latest init
  npm dlx shadcn@latest add button input card badge dialog dropdown-menu toast tabs
  ```
- [x] 2.1.3 Configure `NEXT_PUBLIC_API_URL` in `.env.local` pointing to `http://localhost:4000/v1`
- [x] 2.1.4 Create `lib/api.ts` — axios instance with base URL and JWT interceptor
- [x] 2.1.5 Create `lib/queryClient.ts` — React Query client setup

#### Step 2.2 — Authentication UI

- [x] 2.2.1 Create `app/(auth)/login/page.tsx` — login form
- [x] 2.2.2 Create `app/(auth)/register/page.tsx` — register form
- [x] 2.2.3 Create `store/authStore.ts` with Zustand — stores user + JWT token
- [x] 2.2.4 Create `hooks/useAuth.ts` — login, register, logout functions that call API
- [x] 2.2.5 Create `middleware.ts` at root of web app — redirect unauthenticated users to /login
- [x] 2.2.6 Store JWT in localStorage (or httpOnly cookie — cookie is more secure)
- [x] 2.2.7 Test: Register, login, refresh page and stay logged in, logout clears session

#### Step 2.3 — Dashboard Layout

- [x] 2.3.1 Create `app/(dashboard)/layout.tsx` — sidebar + top nav structure
- [x] 2.3.2 Build Sidebar component with links: Home, Collections, Graph, Tags, Archive
- [x] 2.3.3 Create `app/(dashboard)/page.tsx` — main feed page
- [x] 2.3.4 Create `components/ItemCard.tsx` — card showing item thumbnail, title, tags, type badge, date
- [x] 2.3.5 Create `hooks/useItems.ts` — React Query hook to fetch items list
- [x] 2.3.6 Render items grid/list on dashboard using `useItems`
- [x] 2.3.7 Add view toggle: Grid view vs List view
- [x] 2.3.8 Add basic filters bar: All, Articles, Videos, PDFs, Images, Tweets, Podcasts

#### Step 2.4 — Add Content Flow (Manual Web App Save)

This step implements the full manual content addition UI described in Section 4a.

- [x] 2.4.1 Add a prominent "+ Add Content" button in the top nav bar (always visible, primary colour)
- [x] 2.4.2 Register keyboard shortcut `Cmd/Ctrl + K` globally — opens Add Content flow
- [x] 2.4.3 Create `app/(dashboard)/add/page.tsx` — the dedicated Add Content page (also usable as a route for direct navigation)
- [x] 2.4.4 Create `components/AddContentModal.tsx` — a full-screen modal that wraps the same Add Content UI. The nav button opens this modal; navigating to `/add` shows the page version
- [x] 2.4.5 Build **Step 1 of the form — Source Type Picker**:
  - Create `components/add-content/SourceTypePicker.tsx`
  - Render a visual grid of source type cards: Article/Blog, YouTube Video, Tweet/Post, PDF/Doc, Podcast, Image/GIF, Other Link
  - Each card has an icon, label, and a brief description
  - Highlight selected card on click
  - Include a "Just paste a URL" fallback input at the bottom that skips type selection and auto-detects
- [x] 2.4.6 Build **Step 2 of the form — Type-Specific Input Form**:
  - Create `components/add-content/UrlInputForm.tsx` — shown for Article, YouTube, Tweet, Podcast, Other Link
    - URL field (required, with live URL validation)
    - For YouTube only: optional "Start at timestamp" field (format: `HH:MM:SS`)
    - Title field (optional override — placeholder: "Leave blank to auto-detect")
    - Note field (optional, multi-line)
  - Create `components/add-content/FileUploadForm.tsx` — shown for PDF/Doc and Image/GIF
    - Drag-and-drop zone (dashed border, icon, "Drop your file here or click to browse")
    - Accept `.pdf` for PDF/Doc; `.jpg,.jpeg,.png,.gif,.webp` for Image/GIF
    - Max size indicator: "Max 20MB"
    - Title field (required for file uploads)
    - Note field (optional)
    - Show file preview after selection: file name + size for PDFs; thumbnail preview for images
  - Switch between these forms based on the selected source type
- [x] 2.4.7 Build **Step 3 of the form — Tags & Collection (shown for all types)**:
  - Create `components/add-content/MetadataForm.tsx`
  - Tag input with typeahead — shows existing user tags as suggestions, allows creating new tags inline
  - "Add to Collection" dropdown — lists existing collections, includes an "New Collection…" option
  - Display selected tags as removable chips
- [x] 2.4.8 Add form navigation: Back button to return to Step 1, Save button and "Save & Add Another" button
- [x] 2.4.9 On Save (URL):
  - Call `POST /items` with `{ url, itemType, tags, collectionId, note, youtubeTimestamp }`
  - Show optimistic "Processing…" card on the dashboard
  - Close modal / reset page with a success toast
- [x] 2.4.10 On Save (File Upload):
  - Use `FormData` to call `POST /items/upload` as `multipart/form-data`
  - Show a progress bar during upload (track with `axios` `onUploadProgress`)
  - Show optimistic card after upload completes
  - Close modal / reset with success toast
- [x] 2.4.11 Handle "Save & Add Another": after a successful save, reset only Step 2 + Step 3 fields, keep the selected source type from Step 1 so the user can quickly add another item of the same type
- [x] 2.4.12 Add empty state to the dashboard: if no items exist, show a large "+ Add your first item" CTA that opens the Add Content modal

#### Step 2.5 — Item Detail Page

- [x] 2.5.1 Create `app/(dashboard)/items/[id]/page.tsx`
- [x] 2.5.2 Show full item details: title, source, reading time, full description, tags
- [x] 2.5.3 For uploaded files: show a "View File" button that opens the R2 URL; for PDFs render an inline `<iframe>` preview
- [x] 2.5.4 Add favourite button, archive button
- [x] 2.5.5 Show tag editor — click to add/remove tags
- [x] 2.5.6 "Open original" button that opens the saved URL in a new tab (hidden for file-upload items with no URL)
- [x] 2.5.7 "Related items" section (empty for now, will fill in Phase 3)

---

### PHASE 3 — Background Workers & AI (Week 5–6)

**Goal:** URLs get scraped automatically, files get parsed, AI tags are generated, semantic search works.

---

#### Step 3.1 — Set Up BullMQ Queue System [COMPLETED]

- [x] 3.1.1 Install BullMQ and Redis client: `npm i bullmq ioredis`
- [x] 3.1.2 Create `src/queues/index.ts` — define queue instances:
  - `scrapeQueue` — for scraping URLs
  - `aiQueue` — for AI tag generation
  - `embedQueue` — for generating embeddings
- [x] 3.1.3 Create `src/workers/` folder
- [x] 3.1.4 Update `POST /items` — after creating the DB record, push job to `scrapeQueue`
- [x] 3.1.5 Update `POST /items/upload` — after creating the DB record, push job directly to `aiQueue`
- [x] 3.1.6 Create a separate worker process `src/workers/index.ts` that starts all workers
- [x] 3.1.7 Add worker start script to `package.json`: `"worker": "ts-node-dev src/workers/index.ts"`

#### Step 3.2 — URL Scraper Worker [COMPLETED]

- [x] 3.2.1 Install scraping tools: `npm i cheerio axios metascraper ...`
- [x] 3.2.2 Create `src/workers/scraperWorker.ts`
- [x] 3.2.3 For each job: Fetch from DB, detect type, scrape with axios/metascraper, re-upload thumbnail, update DB, push to `aiQueue`.
- [x] 3.2.4 Handle errors — set status = `failed` on crash
- [x] 3.2.5 Test: save a URL and verify DB update to `processing`.

#### Step 3.3 — Cloudflare R2 Object Storage [COMPLETED]

- [x] 3.3.1 Create a Cloudflare account → R2 bucket
- [x] 3.3.2 Create API tokens correctly
- [x] 3.3.3 Install AWS SDK: `@aws-sdk/client-s3`
- [x] 3.3.4 Create `src/lib/storage.ts` with `uploadFile`, `uploadFromUrl`, and signed URL support
- [x] 3.3.5 Test: Verified R2 upload and pre-signed URL generation via test script.

#### Step 3.4 — AI Tagging Worker [COMPLETED]

- [x] 3.4.1 Install OpenAI SDK and PDF parser: `npm i openai pdf-parse`
- [x] 3.4.2 Create `src/workers/aiWorker.ts`
- [x] 3.4.3 For each job: 
  - Download and parse PDFs from R2 using `pdf-parse`.
  - Build prompt with content snippet.
  - Call `gpt-4o-mini` with JSON response format.
  - Find or create AI-suggested tags and link them to items.
- [x] 3.4.4 Test: Items now automatically receive AI-driven tags after the scraping step.

#### Step 3.5 — Embedding Worker (Semantic Search Foundation)

- [ ] 3.5.1 Create a Pinecone account (free) → create an index with dimension 1536 and metric `cosine`
- [ ] 3.5.2 Install Pinecone SDK: `npm i  @pinecone-database/pinecone`
- [ ] 3.5.3 Create `src/lib/vectorDB.ts` with `upsertEmbedding(itemId, vector)` and `queryEmbedding(vector, topK)` functions
- [ ] 3.5.4 Create `src/workers/embedWorker.ts`
- [ ] 3.5.5 For each job:
  - Fetch item content_text from DB
  - Build embedding text: `title + " " + description + " " + content_text.substring(0, 2000)`
  - Call OpenAI `text-embedding-3-small` to generate a 1536-dim vector
  - Upsert vector to Pinecone with metadata `{ userId, itemId, itemType, saveSource, tags }`
  - Update item status to `ready`
- [ ] 3.5.6 Test: after saving 3 items, check Pinecone dashboard — embeddings should appear

#### Step 3.6 — Semantic Search API

- [ ] 3.6.1 Create `src/routes/search.ts`
- [ ] 3.6.2 Implement `GET /search?q=&type=`:
  - If `type=keyword`: use `ILIKE` query in PostgreSQL against title, description, content_text
  - If `type=semantic` (default): generate embedding → query Pinecone → fetch from PostgreSQL
- [ ] 3.6.3 Add search bar to the frontend in the top nav
- [ ] 3.6.4 Create `hooks/useSearch.ts` — debounced React Query hook (waits 300ms before firing)
- [ ] 3.6.5 Show search results in a dropdown overlay as user types
- [ ] 3.6.6 Full search results page at `app/(dashboard)/search/page.tsx`

#### Step 3.7 — Related Items API

- [ ] 3.7.1 Implement `GET /items/:id/related`:
  - Fetch the item's embedding from Pinecone
  - Query Pinecone for top 5 similar items (excluding the item itself)
  - Return those items from PostgreSQL
- [ ] 3.7.2 Update Item Detail page to show Related Items section (cards at the bottom)

---

### PHASE 4 — Knowledge Graph (Week 7)

**Goal:** Visual knowledge graph of all saved items and their connections.

---

#### Step 4.1 — Graph Data API [DONE]

- [x] 4.1.1 Create `src/routes/graph.ts`
- [x] 4.1.2 Implement `GET /graph` — builds graph data structure:
  ```typescript
  // Algorithm:
  // 1. Fetch all user items (id, title, type, tags, saveSource)
  // 2. Fetch top 3 related items for each item from Pinecone (batch)
  // 3. Build nodes array: each item is a node { id, label, type, saveSource, tags, size }
  // 4. Build edges array: each similarity relationship is an edge { source, target, strength }
  // 5. Also add edges when two items share the same tag
  // 6. De-duplicate edges
  // Return { nodes, edges }
  ```
- [x] 4.1.3 Add in-memory caching with Redis — graph takes time to build, cache for 5 minutes
- [x] 4.1.4 Test: call the endpoint and inspect the JSON structure

#### Step 4.2 — Knowledge Graph Visualization [DONE]

- [x] 4.2.1 Install React Force Graph: `npm i react-force-graph-2d`
- [x] 4.2.2 Create `app/(dashboard)/graph/page.tsx`
- [x] 4.2.3 Create `components/KnowledgeGraph.tsx`
- [x] 4.2.4 Implement force-directed graph with `react-force-graph-2d`:
  - Fetch graph data from API
  - Draw similarity edges as dashed lines, tag edges as solid
  - Colour nodes by item type
  - Add node labels, zoom + pan, hover tooltips, click-to-navigate
- [x] 4.2.5 Add legend showing node colours by type
- [x] 4.2.6 Responsive Handling (Resize Observer)

---

### PHASE 5 — Browser Extension (Week 8) 

**Goal:** One-click save from any browser tab.

---

#### Step 5.1 — Set Up Plasmo Extension Project

- [ ] 5.1.1 `cd apps/extension`
- [ ] 5.1.2 Run: `npm create plasmo --with-react-swc`
- [ ] 5.1.3 Install dependencies: `npm i  axios`
- [ ] 5.1.4 Configure `package.json` manifest: set extension name, description, icons

#### Step 5.2 — Extension Authentication

- [ ] 5.2.1 Create `popup.tsx` — shown when user clicks the extension icon
- [ ] 5.2.2 If not logged in: show "Login to Second Brain" button → opens `auth.tsx` in a new tab
- [ ] 5.2.3 `auth.tsx` — shows login form that calls your API, stores JWT in `chrome.storage.local`
- [ ] 5.2.4 Create `lib/storage.ts` utility that wraps `chrome.storage.local` get/set

#### Step 5.3 — Save Current Page

- [ ] 5.3.1 In `popup.tsx`:
  - Get the active tab URL using `chrome.tabs.query({ active: true, currentWindow: true })`
  - Show the current page title and URL
  - Show "Save to Second Brain" button
- [ ] 5.3.2 On button click:
  - Get JWT from `chrome.storage.local`
  - Call `POST /items` API with `{ url, saveSource: 'extension' }`
  - Show success state: "Saved! Processing..."
- [ ] 5.3.3 Add optional note field — user can add a quick note before saving
- [ ] 5.3.4 Show tag suggestions (from previously saved tags) as quick-add chips

#### Step 5.4 — Context Menu Save

- [ ] 5.4.1 Create `background.ts` (service worker)
- [ ] 5.4.2 Register a right-click context menu item: "Save to Second Brain"
- [ ] 5.4.3 When triggered, send the current page URL or selected link to the API
- [ ] 5.4.4 Show a browser notification: "Saved to Second Brain!"

#### Step 5.5 — Build & Test Extension

- [ ] 5.5.1 Run `npm build` — generates `build/chrome-mv3-prod` folder
- [ ] 5.5.2 Open Chrome → `chrome://extensions` → Enable "Developer mode"
- [ ] 5.5.3 Click "Load unpacked" → select the build folder
- [ ] 5.5.4 Test: visit any webpage → click extension → save it → verify it appears in the web app
- [ ] 5.5.5 Fix any CORS issues — API must allow requests from `chrome-extension://`

---

### PHASE 6 — Advanced Features (Week 9–10)

**Goal:** Highlights, collections, resurfacing, and memory system.

---

#### Step 6.1 — Collections Feature

- [ ] 6.1.1 Create collections API routes (Section 8 above)
- [ ] 6.1.2 Create `app/(dashboard)/collections/page.tsx` — grid of collection cards
- [ ] 6.1.3 Create `app/(dashboard)/collections/[id]/page.tsx` — items inside a collection
- [ ] 6.1.4 Add "Add to collection" option on item card (dropdown menu)
- [ ] 6.1.5 Allow drag-and-drop reordering within collections (use `@hello-pangea/dnd`)
- [ ] 6.1.6 Allow making collections public — generates a shareable link at `/c/[public_slug]`

#### Step 6.2 — Highlight System

- [ ] 6.2.1 Create highlights API routes
- [ ] 6.2.2 In item detail page, render article content in a special reader view
- [ ] 6.2.3 Detect text selection using `window.getSelection()`
- [ ] 6.2.4 Show a small highlight toolbar when text is selected (yellow, pink, blue, green)
- [ ] 6.2.5 On colour click: call `POST /items/:id/highlights` with selected text + position
- [ ] 6.2.6 When rendering content, wrap highlight text in `<mark>` elements with background colour
- [ ] 6.2.7 Show all highlights in a sidebar panel on the item detail page

#### Step 6.3 — Memory Resurfacing System

- [ ] 6.3.1 Create a BullMQ scheduled job (CRON) that runs once daily at 9am user time
- [ ] 6.3.2 Resurfacing algorithm:
  ```
  For each user:
  1. Find items saved 7, 30, 90, or 180 days ago
  2. Prefer items that: have highlights, are favourited, or have been viewed >3 times
  3. Prefer items saved via the web app (manually added = higher intent)
  4. Exclude items resurfaced in the last 14 days (check resurface_log)
  5. Pick 3 items, create resurface_log records
  6. Store in Redis with key `resurface:{userId}` for 24 hours
  ```
- [ ] 6.3.3 Create `GET /resurface` API — reads from Redis cache
- [ ] 6.3.4 Add "Memory" widget on the dashboard — shows 3 resurfaced items with "Saved X days ago" label
- [ ] 6.3.5 Track clicks using `POST /resurface/:id/clicked`

---

### PHASE 7 — Production Deployment (Week 11–12)

**Goal:** Live, secure, scalable production environment.

> **Deployment Stack:** Frontend on **Vercel**, Backend API + Worker on **Render**. No Docker, no containers, no AWS. Everything deploys straight from GitHub.

---

#### Step 7.1 — Set Up Production Services

- [ ] 7.1.1 **PostgreSQL**: Create [Neon](https://neon.tech) account → create project → get the production connection string
- [ ] 7.1.2 **Redis**: Create [Upstash](https://upstash.com) account → create Redis database → get REST URL
- [ ] 7.1.3 **Vector DB**: Create [Pinecone](https://pinecone.io) account → create index (dimension: 1536, metric: cosine) → get API key
- [ ] 7.1.4 **Object Storage**: Set up [Cloudflare R2](https://dash.cloudflare.com) bucket with a public access domain
- [ ] 7.1.5 Run Prisma migrations on the production DB:
  ```bash
  DATABASE_URL=<your-neon-url> npx prisma migrate deploy
  ```

#### Step 7.2 — Deploy Backend API & Worker (Render)

- [ ] 7.2.1 Create a [Render](https://render.com) account
- [ ] 7.2.2 Connect your GitHub repo to Render
- [ ] 7.2.3 Create two **Web Service** entries on Render (both pointing to `apps/api`):
  - **API service**
    - Build command: `npm install && npm run build`
    - Start command: `node dist/index.js`
  - **Worker service**
    - Build command: `npm install && npm run build`
    - Start command: `node dist/workers/index.js`
- [ ] 7.2.4 Add all production environment variables in the Render dashboard for both services (under **Environment** tab)
- [ ] 7.2.5 Enable **Auto-Deploy** on `main` branch push
- [ ] 7.2.6 Test: hit `https://your-api.onrender.com/health` → should return `{ status: "ok" }`
- [ ] 7.2.7 Note: on Render's free tier, services spin down after inactivity. Upgrade to the **Starter** plan ($7/mo) to keep-alive for production use.

#### Step 7.3 — Deploy Frontend (Vercel)

- [ ] 7.3.1 Create a [Vercel](https://vercel.com) account (or log in)
- [ ] 7.3.2 Click **"Add New Project"** → import your GitHub repo
- [ ] 7.3.3 Set the **Root Directory** to `apps/web`
- [ ] 7.3.4 In **Environment Variables**, add:
  - `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://recall-api.onrender.com/v1`)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Any other `NEXT_PUBLIC_*` variables
- [ ] 7.3.5 Click **Deploy** → Vercel builds and publishes automatically
- [ ] 7.3.6 Each push to `main` triggers an auto-redeploy on Vercel
- [ ] 7.3.7 (Optional) Add a custom domain in Vercel → **Settings → Domains**

#### Step 7.4 — Security Hardening

- [ ] 7.4.1 Enable Helmet.js middleware on Express
- [ ] 7.4.2 Set up rate limiting: `npm i  express-rate-limit` — max 100 req/15 min per IP; reduce to 10/min for `POST /items/upload`
- [ ] 7.4.3 Add request validation with Zod: `npm i  zod` — validate all request bodies and file upload metadata
- [ ] 7.4.4 Validate uploaded file MIME types server-side (don't trust client-provided type) using `file-type` package: `npm i  file-type`
- [ ] 7.4.5 Enable CORS with a whitelist — only allow requests from your Vercel domain and the extension
- [ ] 7.4.6 Use parameterised queries only (Prisma does this by default)
- [ ] 7.4.7 Store JWTs with short expiry (15 minutes) + refresh tokens (7 days)
- [ ] 7.4.8 Set up HTTPS everywhere (Railway and Vercel handle this automatically)

#### Step 7.5 — Performance Optimisation

- [ ] 7.5.1 Add database indexes:
  ```sql
  CREATE INDEX idx_items_user_id ON items(user_id);
  CREATE INDEX idx_items_status ON items(status);
  CREATE INDEX idx_items_saved_at ON items(saved_at DESC);
  CREATE INDEX idx_items_save_source ON items(save_source);
  CREATE INDEX idx_item_tags_item_id ON item_tags(item_id);
  ```
- [ ] 7.5.2 Add pagination to all list endpoints
- [ ] 7.5.3 Add Redis caching for expensive queries
- [ ] 7.5.4 Optimise images with Next.js `<Image>` component
- [ ] 7.5.5 Add loading skeletons everywhere

#### Step 7.6 — Monitoring & Logging

- [ ] 7.6.1 Install Sentry for error tracking (frontend + backend)
- [ ] 7.6.2 Set up structured logging with `pino`
- [ ] 7.6.3 Log every API request with: timestamp, method, path, status, duration, userId, saveSource
- [ ] 7.6.4 Set up BullMQ dashboard (Bull Board) at `/admin/queues`
- [ ] 7.6.5 Set up uptime monitoring with Better Uptime (free tier)

---

## 10. Environment & DevOps Setup

### Local Development Workflow

> **No Docker required.** All external services (Postgres via Neon, Redis via Upstash) are cloud-hosted and accessed via connection strings in your `.env` file.

```bash
# Terminal 1: Start API
cd apps/api && npm run dev

# Terminal 2: Start Worker
cd apps/api && npm run worker

# Terminal 3: Start Frontend
cd apps/web && npm run dev

# Terminal 4: Open Prisma Studio (optional, visual DB browser)
cd apps/api && npx prisma studio
```

### Git Branching Strategy

```
main          → production (auto-deploys to Vercel + Render)
develop       → staging (test here before merging to main)
feature/*     → individual features (e.g. feature/add-content-ui)
fix/*         → bug fixes (e.g. fix/file-upload-mime)
```

**Workflow:**
1. Create a branch from `develop`: `git checkout -b feature/your-feature`
2. Build and test locally
3. Open a Pull Request to `develop`
4. Review and merge to `develop`
5. When stable, merge `develop` → `main` → Vercel and Render auto-redeploy

### CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
```

---

## 11. Production Checklist

Before going live, verify all of these:

### Security
- [ ] All API routes require authentication
- [ ] Rate limiting is enabled (stricter limits on file upload endpoint)
- [ ] File upload MIME types are validated server-side
- [ ] All environment variables are set in production
- [ ] CORS is restricted to known origins
- [ ] Input validation is on every endpoint

### Performance
- [ ] Database indexes are created (including `save_source` index)
- [ ] Image optimisation is working
- [ ] Background jobs process within 30 seconds
- [ ] File uploads stream directly to R2 (no disk writes)
- [ ] Search returns results in under 1 second

### Reliability
- [ ] Failed jobs are retried (BullMQ retry config: 3 attempts, exponential backoff)
- [ ] File upload failures clean up partial R2 uploads
- [ ] Error tracking (Sentry) is active
- [ ] Uptime monitoring is configured
- [ ] Database backups are enabled

### User Experience
- [ ] Add Content modal opens instantly (< 100ms)
- [ ] File upload shows real-time progress bar
- [ ] All loading states have skeletons
- [ ] All error states have useful messages
- [ ] The app works on mobile (responsive layout)
- [ ] Empty state on the dashboard has a clear "+ Add your first item" CTA

### Legal / Privacy
- [ ] Privacy policy page exists (required for Chrome Web Store)
- [ ] Terms of service page exists
- [ ] User data (including uploaded files) can be exported and deleted (GDPR)
- [ ] Uploaded files are stored under a user-scoped path in R2 (e.g. `uploads/{userId}/{itemId}/filename`)

---

## Appendix: Folder Structure (Final)

```
apps/
└── web/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   └── layout.tsx
    │   │
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx               # feed
    │   │   ├── add/
    │   │   │   └── page.tsx           # Add Content page (standalone route)
    │   │   ├── items/
    │   │   │   └── [id]/page.tsx
    │   │   ├── graph/page.tsx
    │   │   ├── collections/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   └── search/page.tsx
    │   │
    │   ├── layout.tsx
    │   ├── page.tsx                   # landing page
    │   ├── loading.tsx
    │   ├── error.tsx
    │   └── not-found.tsx
    │
    ├── components/
    │   ├── ui/                        # buttons, inputs, etc.
    │   ├── layout/                    # navbar, sidebar
    │   ├── add-content/               # Add Content feature components
    │   │   ├── SourceTypePicker.tsx
    │   │   ├── UrlInputForm.tsx
    │   │   ├── FileUploadForm.tsx
    │   │   └── MetadataForm.tsx
    │   ├── AddContentModal.tsx        # wraps the add-content flow in a modal
    │   ├── ItemCard.tsx
    │   └── KnowledgeGraph.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useItems.ts
    │   └── useSearch.ts
    │
    ├── lib/
    │   ├── api.ts
    │   ├── queryClient.ts
    │   └── utils.ts
    │
    ├── store/
    │   └── authStore.ts
    │
    ├── styles/globals.css
    ├── middleware.ts
    ├── next.config.ts
    ├── tsconfig.json
    └── package.json
```

---

*End of PRD — Second Brain / Recall v1.1*