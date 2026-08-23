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
| RUN-005 | High | Fixed | URL saves return success even when enqueueing fails, leaving items pending indefinitely. | Queue enqueue is awaited and failures persist a queue stage/reason with a retryable 503 response. | `recall-pipeline` | API pipeline tests and integrated API suite pass |
| RUN-006 | High | Fixed | File upload can persist an R2 object and database row before an awaited queue operation fails. | Upload failures clean up orphaned storage objects and return recovery information when cleanup fails. | `recall-pipeline` | Upload compensation regression test and integrated API suite pass |
| RUN-007 | High | Fixed | Stable job IDs and retained failed jobs can make retry requests return an old failed job instead of scheduling new work. | Attempt-based job IDs and bounded failed/completed retention are enforced by the queue wrapper. | `recall-pipeline` | Pipeline recovery tests pass |
| RUN-008 | High | Fixed | Successfully saved and scraped content cannot become ready when OpenAI or Pinecone is unavailable. | Optional enrichment failures preserve a ready item with an enrichment warning. | `recall-pipeline` | Pipeline recovery tests and integrated API suite pass |
| RUN-009 | High | Fixed | Worker health starts before Redis is validated and remains healthy during Redis failure. | Worker `/ready` returns 503 until Redis responds with `PONG`; `/live` remains available for liveness. | `recall-runtime` | Runtime readiness tests pass; live dependency smoke requires Redis |
| RUN-010 | High | Fixed | The API catches uncaught exceptions and deliberately keeps the process alive in an unknown state. | API and worker uncaught exception handlers now exit with status 1 for supervisor recovery. | `recall-runtime` | Runtime source contract test passes |
| RUN-011 | High | Needs reproduction | Dashboard polling plus stale-item requeueing may accumulate unbounded IORedis offline commands when Redis is unreachable. | `apps/web/hooks/useItems.ts:36-42`; `apps/api/src/routes/items.ts:170-226`; `apps/api/src/queues/index.ts:11-23`. | `recall-performance` | Controlled blackhole test required |

## Authentication and API Integration

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| AUTH-001 | Critical | Fixed | `AuthGuard` marks synchronization complete after 401 and other sync failures, then exposes dashboard requests to the same broken state. | Auth synchronization now blocks the dashboard, exposes retry/sign-in states, and fails closed. | `recall-auth` | Auth regression tests and integrated web suite pass |
| AUTH-002 | High | Fixed | Clerk authentication middleware can continue without a valid local user after database lookup or auto-provisioning fails. | Middleware now fails closed when local identity synchronization cannot complete. | `recall-auth` | Auth regression tests and API suite pass |
| AUTH-003 | High | Needs reproduction | Placeholder Clerk email provisioning can conflict with an older account when `/auth/sync` updates to the real unique email. | `apps/api/src/middleware/auth.ts:115-127`; `apps/api/src/routes/auth.ts:216-240`. | `recall-auth` | Database fixture required |
| AUTH-004 | High | Fixed | Default CORS accepts only frontend port 3000, so Next falling back to port 3001 breaks every browser API request unless an undocumented variable is configured. | Default API origins now include localhost ports 3000 and 3001 outside production, while deployed origins are configured through `CORS_ORIGINS`; the shared CORS middleware answers preflight requests before body/auth middleware. | `recall-runtime`, `recall-config-cors` | `apps/api/src/runtime/cors.test.ts` passes 4/4 configured web, extension, rejection, and production-gating preflight/transport cases |
| AUTH-005 | Medium | Fixed | Login and registration ignore the protected route redirect destination. | Login and registration preserve the AuthGuard redirect query. | `recall-auth` | Auth redirect regression tests pass |
| AUTH-006 | Medium | Fixed | The API client has an empty 401 handling branch and provides no request timeout, abort, or offline classification. | API transport now has timeout/abort, structured 401, offline classification, and request IDs. | `recall-api-client` | API client regression tests pass |
| AUTH-007 | Medium | Fixed | API base selection was computed once and included a hardcoded production fallback, making environment mistakes difficult to diagnose and potentially routing a deployed app to an unrelated host. | `apps/web/lib/api.ts` now requires an explicit production API base, keeps a localhost fallback only for development/test, and fails with an actionable error when production configuration is missing. | `recall-config-cors` | `apps/web/tests/api-config.test.ts` and `apps/web/tests/api-client.test.ts` pass 8/8; web typecheck and changed-file lint pass |

## Saving, Parsing, and Content Enrichment

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| SAVE-001 | Critical | Fixed | Save failures are logged only to the console, so the user receives no error, cause, or recovery action. | Save failures now render an actionable inline error and preserve the modal for retry. | `recall-save-flow` | Save-flow regression tests pass |
| SAVE-002 | High | Fixed | Invalid URL strings can be stored and acknowledged before the scraper fails on `new URL`. | URL normalization rejects invalid and unsafe save URLs before persistence. | `recall-save-flow` | Save-contract tests pass |
| SAVE-003 | High | Fixed | URL form fields for title, author, and podcast name are collected but discarded by the request and API contract. | Metadata fields are normalized, sent, stored, and carried into scraper precedence. | `recall-save-flow` | Save-contract and stepper tests pass |
| SAVE-004 | High | Fixed | YouTube timestamp text such as `1:23:45` is parsed as integer `1` instead of seconds. | Timestamp normalization supports clock notation and stores total seconds. | `recall-save-flow` | Save-contract tests pass |
| SAVE-005 | High | Fixed | Upload size and MIME claims are not enforced consistently in the browser. | Browser and API upload contracts enforce size, MIME, signatures, and bounded remote buffers. | `recall-uploads` | Upload contract tests and integrated suites pass |
| SAVE-006 | Medium | Needs reproduction | PDF and image tab state can select the wrong save path after type and back-navigation transitions. | `apps/web/components/add-content/ContentDetailsForm.tsx:28,63`; shared mounted state. | `recall-save-flow` | Playwright reproduction required |
| PARSE-001 | High | Confirmed | Generic parsing relies on metascraper readability or concatenated paragraph text capped at 10,000 characters. | `apps/api/src/workers/scraperWorker.ts:242-268`. | `recall-parser` | Not started |
| PARSE-002 | High | Confirmed | YouTube is detected but has no YouTube-specific metadata or transcript processing. | URL type detection and scraper worker. | `recall-parser` | Not started |
| PARSE-003 | High | Confirmed | Social fallback failures are swallowed into empty metadata, hiding authentication, throttling, and response-format failures. | `apps/api/src/workers/scraperWorker.ts:112-190,216-240`. | `recall-parser` | Not started |
| PARSE-004 | Critical | Fixed | Arbitrary remote pages, thumbnails, and PDFs are buffered without response-size limits, creating worker memory exhaustion risk. | Shared bounded streamed fetch and PDF signature/text limits in `apps/api/src/lib/remoteFetch.ts`, `apps/api/src/workers/scraperWorker.ts`, `apps/api/src/lib/storage.ts`, and `apps/api/src/workers/aiWorker.ts`. | `recall-parser-safety` | Integrated API 52/52; focused oversized-stream and parser-stat tests; API typecheck and changed-file ESLint pass |
| PARSE-005 | Critical | Fixed | User-provided URLs and thumbnail URLs are fetched server-side without an SSRF policy. | Shared URL scheme, credential, literal-address, DNS-answer, and redirect-target checks in `apps/api/src/lib/remoteFetch.ts`; scraper and storage consumers migrated. | `recall-parser-safety` | Focused SSRF tests cover loopback, private, link-local, metadata, credential, private-DNS, and unsafe-redirect targets |
| PARSE-006 | High | Confirmed | Seven-day signed R2 URLs are stored as permanent file and thumbnail URLs when no public URL is configured. | `apps/api/src/lib/storage.ts:49-60`; local configuration lacks public R2 URL. | `recall-storage` | Not started |
| PARSE-007 | Medium | Fixed | The scraper marks the item failed on every attempt even while BullMQ may retry it. | Worker failure updates preserve retryable status until the final attempt. | `recall-pipeline` | Pipeline recovery tests pass |
| PARSE-008 | Medium | Fixed | Pipeline errors do not persist a failure stage or user-readable reason. | Item processing stage, error, and attempt fields are persisted and surfaced to the web UI. | `recall-pipeline` | API and web regression suites pass |
| PARSE-009 | Medium | Fixed | `readingTime` and `wordCount` exist in the schema but are never populated. | `calculateTextStats` is persisted by scraper and AI workers after bounded text extraction. | `recall-parser-safety` | Parser statistics tests pass; integrated API suite 52/52 |

## Dashboard, Synchronization, and Product UI

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| UI-001 | High | Fixed | Dashboard and archive exposed only the first 20 items with no pagination or infinite loading. | `useInfiniteItems` consumes the API page/totalPages contract, flattens loaded pages, and dashboard/archive render visible Load more controls with next-page loading and retry states. | `recall-pagination-consistency` | `apps/web/tests/dashboard-pagination.test.tsx` passes; full web suite 49/49 and web typecheck pass |
| UI-002 | Medium | Fixed | Dashboard totals use API-wide counts while processing counts use only loaded items and omit pending items. | Dashboard consumes the API-wide `processingTotal` count, including pending and processing items. | `recall-sync` | Dashboard synchronization tests pass |
| UI-003 | High | Fixed | The dashboard polls every five seconds indefinitely while any loaded item remains pending or processing. | Processing refresh is bounded to a recovery window and disabled in background tabs. | `recall-performance` | Performance policy tests pass |
| UI-004 | High | Needs reproduction | Many Instagram iframes and repeated Twitter widget loads may drive dashboard renderer CPU and memory. | `apps/web/components/items/ItemCard.tsx`; social preview components. | `recall-performance` | Browser profile required |
| UI-005 | High | Fixed | Graph resync can return the same stale API Redis cache because browser invalidation does not clear server cache. | Graph refresh bypasses the Redis cache and all graph-affecting mutations invalidate the server key. | `recall-sync` | Graph cache and resync tests pass |
| UI-006 | High | Fixed | Save, update, archive, tag, and collection mutations invalidate inconsistent query and server caches. | Shared invalidation keys and server graph invalidation cover graph-affecting mutations; archive, unarchive, and delete now share one item projection contract across items, item detail, collections, collection detail, search, and graph. | `recall-pagination-consistency` | `apps/web/tests/item-actions-hooks.test.tsx` covers archive, unarchive, and delete; full web suite 49/49 and changed-file ESLint pass |
| UI-007 | High | Fixed | Favorite control is visible but has no action or mutation. | Favorite mutation and cache update are wired into card and detail controls. | `recall-item-actions` | Item action tests pass |
| UI-008 | Medium | Fixed | Tags page presents clickable-looking cards without create, edit, delete, attach, or navigation behavior. | Tag management controls and attach navigation are now visible and actionable. | `recall-tags-ui` | Dashboard feature tests pass |
| UI-009 | High | Fixed | Failed items have no failure reason or retry action despite the API exposing a retry endpoint. | Item cards and detail views render failure stage/reason and retry states. | `recall-item-actions` | Item action tests pass |
| UI-010 | Medium | Fixed | Search failures are rendered as empty results rather than error states. | Search page and top-bar dropdown expose distinct error and retry states. | `recall-search-ui` | Dashboard feature and feedback tests pass |
| UI-011 | Medium | Fixed | Mobile sidebar starts open and initially covers the dashboard. | Sidebar state defaults closed on mobile and hidden content is inert. | `recall-dashboard-ui` | Dashboard shell tests pass |
| UI-012 | Medium | Fixed | Light theme contains hardcoded dark-theme colors and root dark color-scheme behavior. | Item and collection cards now use semantic background, text, border, and danger tokens; root color-scheme tokens remain theme-aware in `apps/web/app/globals.css`. | `recall-graph-theme` | `apps/web/tests/graph-theme.test.tsx` and web typecheck/lint pass |
| UI-013 | Medium | Confirmed | Theme, view mode, and sidebar preferences reset on reload. | `apps/web/store/uiStore.ts`; `ThemeProvider.tsx`. | `recall-dashboard-ui` | Not started |
| UI-014 | Medium | Fixed | Graph sizing assumes a fixed sidebar width and can overflow when the actual sidebar state changes. | Graph dimensions are derived from the measured content container with `ResizeObserver`. | `recall-graph-ui` | Graph sizing regression tests pass |
| UI-015 | Medium | Fixed | Graph legend and colors omit supported podcast and link item types. | Shared graph palette now covers every `ItemType`, including podcast and link, for both legend entries and canvas nodes. | `recall-graph-theme` | `apps/web/tests/graph-theme.test.tsx` passes |
| UI-016 | Low | Fixed | Source picker selected background contains an invalid CSS value. | Selected source cards now set background, foreground, focus ring, and pressed state through valid semantic styles. | `recall-graph-theme` | `apps/web/tests/graph-theme.test.tsx` passes |
| UI-017 | Medium | Needs reproduction | Landing page WebGL, SVG path, and infinite-slider animation create sustained CPU/GPU load by design. | Landing animation components and commit `c500471`. | `recall-performance` | Lower-priority browser profile |
| UI-018 | Medium | Needs reproduction | Knowledge graph directional particles create a continuous animation that may become expensive at scale. | `apps/web/components/graph/KnowledgeGraph.tsx:119-146`. | `recall-performance` | Large graph benchmark required |

## Data Integrity and Security

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| DATA-001 | Critical | Fixed | Item creation can connect a collection without verifying that it belongs to the authenticated user. | URL and upload routes verify collection ownership before nested persistence and storage upload. | `recall-authorization` | Authorization tests pass |
| DATA-002 | Critical | Fixed | Tag attachment does not consistently verify item and supplied tag ownership. | Item and tag ownership checks fail closed before the item-tag upsert. | `recall-authorization` | Authorization tests pass |
| DATA-003 | High | Confirmed | The live schema matches the repository model, but both repository migrations are absent from the live migration ledger. | Read-only `prisma migrate status` and `prisma db pull --print` on 2026-08-24. | `recall-migrations` | Not started |
| DATA-004 | Medium | Fixed | R2 upload precedes database persistence, allowing orphaned objects after database failure. | Failed item persistence triggers compensating object deletion and reports cleanup recovery information. | `recall-storage` | Upload cleanup regression test passes |
| DATA-005 | Low | Confirmed | Highlight and resurfacing models have no corresponding API or web behavior. | Prisma schema and route inventory. | Unassigned | Product decision required |

## Testing, Tooling, and Delivery

| ID | Severity | Status | Problem | Evidence | Target branch | Verification |
|---|---|---|---|---|---|---|
| TEST-001 | Critical | Fixed | There are no automated API, web, integration, or E2E tests. | API/web Vitest suites, runtime tests, and Playwright smoke coverage now run from root scripts. | `recall-test-foundation` | Integrated API 52/52, web 44/44, runtime, and browser smoke pass |
| TEST-002 | High | Fixed | API test and lint scripts reference Jest and ESLint binaries that are not installed. | Package scripts now use installed Vitest and ESLint tooling. | `recall-test-foundation` | Root test and lint commands pass |
| TEST-003 | High | Fixed | No CI workflow enforces builds, tests, lint, migrations, or E2E checks. | Quality workflow now gates Prisma migrations, API/web tests, runtime, lint, builds, and browser smoke. | `recall-ci` | Workflow present and local gates pass |
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
