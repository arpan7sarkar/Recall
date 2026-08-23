# Recall Audit Ledger

This is the durable source of truth for problems discovered in `apps/api` and `apps/web`.
Every implementation branch must update the relevant row with reproduction, root cause, fix, and verification evidence.

## Status Vocabulary

| Status | Meaning |
|---|---|
| Confirmed | Directly supported by code, runtime output, or a repeatable check. |
| Needs reproduction | Supported by code or history but not yet reproduced in an end-user flow. |
| In progress | A failing test exists and implementation work has started. |
| Fixed | The focused regression test passes. |
| Verified | Focused, regression, E2E, and applicable visual or performance checks pass. |
| Deferred | Explicitly postponed with a documented reason. |

## Severity Vocabulary

| Severity | Meaning |
|---|---|
| Critical | Core product flow is unavailable, data can be lost, or the system can become operationally unsafe. |
| High | A major feature is broken, misleading, insecure, or materially unreliable. |
| Medium | A feature is incomplete, inconsistent, or difficult to use. |
| Low | Polish, documentation, or maintainability problem with limited immediate impact. |

## Runtime and Processing Pipeline

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| RUN-001 | Critical | Fixed | The root `npm run dev` command starts only the web app, leaving the API and worker stopped. | Root `scripts/dev.mjs` now starts web, API, and worker processes and forwards shutdown signals. | `recall-runtime` | `npm run test:runtime` passes; process smoke requires local dependencies |
| RUN-002 | Critical | Confirmed | The configured Redis currently has eight scraper jobs waiting and zero registered workers. | Read-only BullMQ inspection on 2026-08-24. | `recall-runtime` | Not started |
| RUN-003 | High | Confirmed | Redis uses `volatile-lru`, while BullMQ requires `noeviction` for reliable queues. | Runtime Redis warning during queue inspection. | `recall-runtime` | Not started |
| RUN-004 | High | Fixed | API and worker health endpoints report process uptime without checking PostgreSQL, Redis, queues, or worker liveness. | API `/ready` checks PostgreSQL, Redis, and BullMQ queues; worker `/ready` checks Redis; `/live` remains process liveness. | `recall-runtime` | Runtime readiness tests pass; live dependency smoke requires local services |
| RUN-005 | High | Confirmed | URL saves return success even when enqueueing fails, leaving items pending indefinitely. | `apps/api/src/routes/items.ts:331-337`; `apps/api/src/queues/index.ts:32-47`. | `recall-pipeline` | Not started |
| RUN-006 | High | Confirmed | File upload can persist an R2 object and database row before an awaited queue operation fails. | `apps/api/src/routes/items.ts:102-152`. | `recall-pipeline` | Not started |
| RUN-007 | High | Confirmed | Stable job IDs and retained failed jobs can make retry requests return an old failed job instead of scheduling new work. | `apps/api/src/queues/index.ts:28-38`; retry job IDs in `apps/api/src/routes/items.ts:594-608`. | `recall-pipeline` | Not started |
| RUN-008 | High | Confirmed | Successfully saved and scraped content cannot become ready when OpenAI or Pinecone is unavailable. | `apps/api/src/workers/embedWorker.ts:42-56,98-106`. | `recall-pipeline` | Not started |
| RUN-009 | High | Fixed | Worker health starts before Redis is validated and remains healthy during Redis failure. | Worker `/ready` returns 503 until Redis responds with `PONG`; `/live` remains available for liveness. | `recall-runtime` | Runtime readiness tests pass; live dependency smoke requires Redis |
| RUN-010 | High | Fixed | The API catches uncaught exceptions and deliberately keeps the process alive in an unknown state. | API and worker uncaught exception handlers now exit with status 1 for supervisor recovery. | `recall-runtime` | Runtime source contract test passes |
| RUN-011 | High | Needs reproduction | Dashboard polling plus stale-item requeueing may accumulate unbounded IORedis offline commands when Redis is unreachable. | `apps/web/hooks/useItems.ts:36-42`; `apps/api/src/routes/items.ts:170-226`; `apps/api/src/queues/index.ts:11-23`. | `recall-performance` | Controlled blackhole test required |

## Authentication and API Integration

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| AUTH-001 | Critical | Confirmed | `AuthGuard` marks synchronization complete after 401 and other sync failures, then exposes dashboard requests to the same broken state. | `apps/web/components/auth/AuthGuard.tsx:39-69`. | `recall-auth` | Not started |
| AUTH-002 | High | Confirmed | Clerk authentication middleware can continue without a valid local user after database lookup or auto-provisioning fails. | `apps/api/src/middleware/auth.ts:102-136`. | `recall-auth` | Not started |
| AUTH-003 | High | Needs reproduction | Placeholder Clerk email provisioning can conflict with an older account when `/auth/sync` updates to the real unique email. | `apps/api/src/middleware/auth.ts:115-127`; `apps/api/src/routes/auth.ts:216-240`. | `recall-auth` | Database fixture required |
| AUTH-004 | High | Fixed | Default CORS accepts only frontend port 3000, so Next falling back to port 3001 breaks every browser API request unless an undocumented variable is configured. | Default API origins now include localhost ports 3000 and 3001, with `CORS_ORIGINS` documented for additional origins. | `recall-runtime` | Runtime source contract test passes |
| AUTH-005 | Medium | Confirmed | Login and registration ignore the protected route redirect destination. | `apps/web/app/(auth)/login/[[...rest]]/page.tsx`; matching register page. | `recall-auth` | Not started |
| AUTH-006 | Medium | Confirmed | The API client has an empty 401 handling branch and provides no request timeout, abort, or offline classification. | `apps/web/lib/api.ts:71-102`. | `recall-api-client` | Not started |
| AUTH-007 | Medium | Confirmed | API base selection is computed once and includes a hardcoded production fallback, making environment mistakes difficult to diagnose. | `apps/web/lib/api.ts:1-32`. | `recall-config` | Not started |

## Saving, Parsing, and Content Enrichment

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| SAVE-001 | Critical | Confirmed | Save failures are logged only to the console, so the user receives no error, cause, or recovery action. | `apps/web/components/add-content/AddContentStepper.tsx:49-80`. | `recall-save-flow` | Not started |
| SAVE-002 | High | Confirmed | Invalid URL strings can be stored and acknowledged before the scraper fails on `new URL`. | `apps/api/src/routes/items.ts:32-57,282-337`; scraper URL parsing. | `recall-save-flow` | Not started |
| SAVE-003 | High | Confirmed | URL form fields for title, author, and podcast name are collected but discarded by the request and API contract. | `apps/web/components/add-content/ContentDetailsForm.tsx:224-289`; `AddContentStepper.tsx:21-45`. | `recall-save-flow` | Not started |
| SAVE-004 | High | Confirmed | YouTube timestamp text such as `1:23:45` is parsed as integer `1` instead of seconds. | `apps/web/components/add-content/ContentDetailsForm.tsx:203-219`; `apps/api/src/routes/items.ts:290-302`. | `recall-save-flow` | Not started |
| SAVE-005 | High | Confirmed | Upload size and MIME claims are not enforced consistently in the browser. | `apps/web/components/add-content/ContentDetailsForm.tsx:48-61,158-193`; unused upload-size environment value. | `recall-uploads` | Not started |
| SAVE-006 | Medium | Needs reproduction | PDF and image tab state can select the wrong save path after type and back-navigation transitions. | `apps/web/components/add-content/ContentDetailsForm.tsx:28,63`; shared mounted state. | `recall-save-flow` | Playwright reproduction required |
| PARSE-001 | High | Confirmed | Generic parsing relies on metascraper readability or concatenated paragraph text capped at 10,000 characters. | `apps/api/src/workers/scraperWorker.ts:242-268`. | `recall-parser` | Not started |
| PARSE-002 | High | Confirmed | YouTube is detected but has no YouTube-specific metadata or transcript processing. | URL type detection and scraper worker. | `recall-parser` | Not started |
| PARSE-003 | High | Confirmed | Social fallback failures are swallowed into empty metadata, hiding authentication, throttling, and response-format failures. | `apps/api/src/workers/scraperWorker.ts:112-190,216-240`. | `recall-parser` | Not started |
| PARSE-004 | Critical | Confirmed | Arbitrary remote pages, thumbnails, and PDFs are buffered without response-size limits, creating worker memory exhaustion risk. | `apps/api/src/workers/scraperWorker.ts:216-257`; `apps/api/src/lib/storage.ts:123-136`; `apps/api/src/workers/aiWorker.ts:73-83`. | `recall-parser-safety` | Not started |
| PARSE-005 | Critical | Confirmed | User-provided URLs and thumbnail URLs are fetched server-side without an SSRF policy. | Scraper and storage remote fetch paths. | `recall-parser-safety` | Not started |
| PARSE-006 | High | Confirmed | Seven-day signed R2 URLs are stored as permanent file and thumbnail URLs when no public URL is configured. | `apps/api/src/lib/storage.ts:49-60`; local configuration lacks public R2 URL. | `recall-storage` | Not started |
| PARSE-007 | Medium | Confirmed | The scraper marks the item failed on every attempt even while BullMQ may retry it. | `apps/api/src/workers/scraperWorker.ts:334-343`. | `recall-pipeline` | Not started |
| PARSE-008 | Medium | Confirmed | Pipeline errors do not persist a failure stage or user-readable reason. | Item schema contains only a status enum. | `recall-pipeline` | Not started |
| PARSE-009 | Medium | Confirmed | `readingTime` and `wordCount` exist in the schema but are never populated. | Prisma schema and worker data updates. | `recall-parser` | Not started |

## Dashboard, Synchronization, and Product UI

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| UI-001 | High | Confirmed | Dashboard and archive expose only the first 20 items with no pagination or infinite loading. | `apps/web/hooks/useItems.ts:18-43`; dashboard and archive pages. | `recall-dashboard` | Not started |
| UI-002 | Medium | Confirmed | Dashboard totals use API-wide counts while processing counts use only loaded items and omit pending items. | `apps/web/app/dashboard/page.tsx:24-49`. | `recall-dashboard` | Not started |
| UI-003 | High | Confirmed | The dashboard polls every five seconds indefinitely while any loaded item remains pending or processing. | `apps/web/hooks/useItems.ts:36-42`. | `recall-performance` | Not started |
| UI-004 | High | Needs reproduction | Many Instagram iframes and repeated Twitter widget loads may drive dashboard renderer CPU and memory. | `apps/web/components/items/ItemCard.tsx`; social preview components. | `recall-performance` | Browser profile required |
| UI-005 | High | Confirmed | Graph resync can return the same stale API Redis cache because browser invalidation does not clear server cache. | `apps/web/app/dashboard/graph/page.tsx`; `apps/api/src/routes/graph.ts:20-27,120-125`. | `recall-sync` | Not started |
| UI-006 | High | Confirmed | Save, update, archive, tag, and collection mutations invalidate inconsistent query and server caches. | Web hooks and API graph invalidation paths. | `recall-sync` | Not started |
| UI-007 | High | Confirmed | Favorite control is visible but has no action or mutation. | `apps/web/app/dashboard/items/[id]/page.tsx:295-305`. | `recall-item-actions` | Not started |
| UI-008 | Medium | Confirmed | Tags page presents clickable-looking cards without create, edit, delete, attach, or navigation behavior. | `apps/web/app/dashboard/tags/page.tsx:43-64`. | `recall-tags-ui` | Not started |
| UI-009 | High | Confirmed | Failed items have no failure reason or retry action despite the API exposing a retry endpoint. | Item card and `POST /items/:id/retry`. | `recall-item-actions` | Not started |
| UI-010 | Medium | Confirmed | Search failures are rendered as empty results rather than error states. | Search page and top-bar dropdown. | `recall-search-ui` | Not started |
| UI-011 | Medium | Confirmed | Mobile sidebar starts open and initially covers the dashboard. | `apps/web/store/uiStore.ts`; `apps/web/components/layout/Sidebar.tsx`. | `recall-dashboard-ui` | Not started |
| UI-012 | Medium | Confirmed | Light theme contains hardcoded dark-theme colors and root dark color-scheme behavior. | Item cards, collection cards, and `apps/web/app/globals.css`. | `recall-dashboard-ui` | Not started |
| UI-013 | Medium | Confirmed | Theme, view mode, and sidebar preferences reset on reload. | `apps/web/store/uiStore.ts`; `ThemeProvider.tsx`. | `recall-dashboard-ui` | Not started |
| UI-014 | Medium | Confirmed | Graph sizing assumes a fixed sidebar width and can overflow when the actual sidebar state changes. | `apps/web/components/graph/KnowledgeGraph.tsx:62-69`; Sidebar widths. | `recall-graph-ui` | Not started |
| UI-015 | Medium | Confirmed | Graph legend and colors omit supported podcast and link item types. | Graph page, graph component, and item type definitions. | `recall-graph-ui` | Not started |
| UI-016 | Low | Confirmed | Source picker selected background contains an invalid CSS value. | `apps/web/components/add-content/SourceTypePicker.tsx:33-37`. | `recall-save-flow` | Not started |
| UI-017 | Medium | Needs reproduction | Landing page WebGL, SVG path, and infinite-slider animation create sustained CPU/GPU load by design. | Landing animation components and commit `c500471`. | `recall-performance` | Lower-priority browser profile |
| UI-018 | Medium | Needs reproduction | Knowledge graph directional particles create a continuous animation that may become expensive at scale. | `apps/web/components/graph/KnowledgeGraph.tsx:119-146`. | `recall-performance` | Large graph benchmark required |

## Data Integrity and Security

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| DATA-001 | Critical | Confirmed | Item creation can connect a collection without verifying that it belongs to the authenticated user. | `apps/api/src/routes/items.ts:121-125,305-310`. | `recall-authorization` | Not started |
| DATA-002 | Critical | Confirmed | Tag attachment does not consistently verify item and supplied tag ownership. | `apps/api/src/routes/tags.ts:99-128`. | `recall-authorization` | Not started |
| DATA-003 | High | Confirmed | The live schema matches the repository model, but both repository migrations are absent from the live migration ledger. | Read-only `prisma migrate status` and `prisma db pull --print` on 2026-08-24. | `recall-migrations` | Not started |
| DATA-004 | Medium | Confirmed | R2 upload precedes database persistence, allowing orphaned objects after database failure. | `apps/api/src/routes/items.ts:102-152`. | `recall-storage` | Not started |
| DATA-005 | Low | Confirmed | Highlight and resurfacing models have no corresponding API or web behavior. | Prisma schema and route inventory. | Unassigned | Product decision required |

## Testing, Tooling, and Delivery

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| TEST-001 | Critical | Confirmed | There are no automated API, web, integration, or E2E tests. | Repository file and package-script inventory. | `recall-test-foundation` | Not started |
| TEST-002 | High | Confirmed | API test and lint scripts reference Jest and ESLint binaries that are not installed. | `apps/api/package.json`; direct command failures. | `recall-test-foundation` | Not started |
| TEST-003 | High | Confirmed | No CI workflow enforces builds, tests, lint, migrations, or E2E checks. | Repository inventory. | `recall-ci` | Not started |
| TEST-004 | High | Fixed | Root scripts do not orchestrate build, lint, test, API, worker, or dependency services. | Root package now exposes dev, API, worker, build, lint, test, E2E, service, environment, and readiness commands. | `recall-runtime` | `npm run test:runtime` passes |
| TEST-005 | High | Fixed | API environment template omits required authentication, CORS, readiness, and public storage variables. | `apps/api/.env.example` now documents runtime, Clerk, CORS, storage, enrichment, host, port, and upload variables. | `recall-runtime` | Runtime environment contract tests pass |
| TEST-006 | Medium | Confirmed | Historic error output files are stale, platform-specific, and easy to mistake for current failures. | `apps/api/prisma_error.txt`; `apps/api/test-output.txt`. | `recall-maintenance` | Not started |

## Performance Baseline to Capture

The performance investigation must compare the landing page, an empty dashboard, a 20-card dashboard, a social-heavy dashboard, and a large graph.
Each scenario must record browser renderer RSS, total browser RSS, CPU, request count per minute, long tasks, frame rate, and detached DOM nodes over at least five minutes.
API and worker scenarios must record process RSS, heap usage, event-loop delay, Redis offline queue length, BullMQ job counts, response sizes, and terminal item state.

## Branch and Worktree Rules

Branch names must not contain `/`.
No commit or document may add an agent name or co-author line.
Each branch must own a narrow problem group and begin with a failing regression test.
The existing uncommitted web changes must be preserved and reconciled before implementation worktrees are created.
No generated changelog or generated artifact may be edited manually.
