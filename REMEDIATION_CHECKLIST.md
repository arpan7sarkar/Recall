# Recall Remediation Checklist

This checklist is the session-level execution board for repairing `apps/api` and `apps/web`.
Each checkbox represents a problem or a tightly related set of problems from `AUDIT_LEDGER.md`.
Leave a checkbox unchecked until the regression test, implementation, and verification gates pass.
Use one isolated worktree per session group when the groups can be developed independently.

## How to Use This File

- `[ ]` means not started or not yet verified.
- `[-]` means actively in progress, with a failing test recorded.
- `[x]` means fixed and verified by the required checks.
- Add the test path, commit hash, and verification date beside a completed item.
- If a problem is deferred, keep it unchecked and add the reason in the notes column or session log.
- Never mark a group complete because the code compiles alone.
- A group is complete only when its focused tests, regression tests, and applicable E2E or performance checks pass.

## Branch and Worktree Rules

- Branch names must not contain `/`.
- Do not add an agent name or co-author line to commits or documentation.
- Keep each worktree focused on one session group.
- Start every behavior change with a failing test.
- Do not mix unrelated cleanup into a repair branch.
- Rebase or merge only after the focused group is green.
- Preserve the existing uncommitted web changes before creating implementation worktrees.

## Session 00: Baseline and Test Foundation

Branch: `recall-test-foundation`

Worktree scope: test tooling, reproducible local services, root scripts, and CI only.

Related ledger IDs: `TEST-001` through `TEST-006`.

Completion gate: deterministic unit and integration commands exist, the primary save E2E reproduces the current failure, and CI runs the same quality gates.

- [x] Install and configure API unit and integration testing.
- [x] Install and configure web component testing.
- [ ] Add Playwright E2E coverage for the primary save flow.
- [x] Add a public Playwright browser smoke test.
- [ ] Add isolated PostgreSQL and Redis test services.
- [ ] Add deterministic adapters for Clerk, R2, OpenAI, Pinecone, and remote fetches.
- [x] Repair the API test script so it runs an installed test runner.
- [x] Repair the API lint script so it runs an installed linter.
- [x] Add root commands for API, worker, web, build, lint, unit, integration, and E2E checks. (`package.json`)
- [x] Add CI workflows for build, lint, tests, migrations, E2E, and artifact upload. (`.github/workflows/quality.yml`)
- [ ] Add a failing save test that proves the user-visible error state is currently missing.
- [ ] Add a failing pipeline test that proves a queued item can remain pending without a worker.

## Session 01: Local Runtime and Deployment Readiness

Branch: `recall-runtime`

Worktree scope: root orchestration, process lifecycle, environment contract, and readiness behavior.

Related ledger IDs: `RUN-001`, `RUN-004`, `RUN-009`, `RUN-010`, `AUTH-004`, `AUTH-007`, `TEST-004`, and `TEST-005`.

Completion gate: one documented local command starts the API, web app, worker, PostgreSQL, and Redis, and readiness fails when a required dependency is unavailable.

- [x] Make the root development workflow start or clearly validate the API.
- [x] Make the root development workflow start or clearly validate the worker.
- [x] Add dependency service startup and shutdown instructions.
- [x] Make API readiness verify PostgreSQL connectivity.
- [x] Make API readiness verify Redis connectivity.
- [x] Make API readiness verify queue availability.
- [x] Make worker readiness verify Redis connectivity before reporting healthy.
- [x] Separate liveness from readiness responses.
- [x] Ensure fatal uncaught exceptions terminate the process for supervisor recovery.
- [x] Add structured startup diagnostics without exposing secrets.
- [x] Complete `.env.example` with Clerk, CORS, readiness, storage, host, port, and clock-skew variables.
- [x] Document the required API, worker, and web environment contract.
- [x] Verify production and worker services use the same Redis configuration.

## Session 02: Redis and BullMQ Pipeline Recovery

Branch: `recall-pipeline`

Worktree scope: queue creation, job lifecycle, retries, stale-item recovery, and processing status.

Related ledger IDs: `RUN-002`, `RUN-003`, `RUN-005` through `RUN-008`, `RUN-011`, `PARSE-007`, and `PARSE-008`.

Completion gate: a saved URL progresses through scrape, AI, embed, and terminal state under healthy services, and dependency failures are visible and retryable.

- [x] Enforce or validate the BullMQ-compatible Redis eviction policy.
- [x] Make URL enqueue failure visible instead of returning an unexplained successful pending item.
- [x] Decide and implement durable handoff semantics between database creation and queue creation.
- [x] Prevent upload responses from reporting failure after partial R2 and database persistence without recovery information.
- [x] Replace stable retry job IDs that collide with retained failed jobs.
- [x] Configure failed-job retention and cleanup deliberately.
- [ ] Make stale-item requeueing idempotent and observable.
- [x] Ensure scraper status becomes failed only under the defined final-attempt rule.
- [x] Persist processing stage and user-readable failure reason.
- [x] Add retry behavior that schedules fresh work after a failed job.
- [x] Ensure optional AI and vector failures do not erase a valid durable save.
- [x] Define the meaning of `pending`, `processing`, `ready`, and `failed`.
- [x] Add terminal-state tests for scrape failure, AI failure, embed failure, and worker outage.
- [ ] Verify all eight currently waiting scraper jobs through a controlled recovery procedure.

Verification evidence: `apps/api/src/queues/pipeline.test.ts` covers Redis policy validation, explicit no-Redis enqueue failure, bounded retention, fresh retry IDs, final-attempt status transitions, and ready-state optional enrichment warnings.
The controlled recovery of the eight live Redis jobs remains pending because this isolated environment has no configured Redis service.

## Session 03: Authentication and User Synchronization

Branch: `recall-auth`

Worktree scope: Clerk token flow, local-user provisioning, sync errors, redirect behavior, and auth diagnostics.

Related ledger IDs: `AUTH-001` through `AUTH-005`.

Completion gate: a signed-in user cannot enter the dashboard in a broken sync state, and authentication failures are actionable in the UI.

- [x] Add a failing test for AuthGuard sync failure behavior.
- [x] Keep the dashboard blocked while required local-user synchronization is unresolved.
- [x] Distinguish transient token unavailability from permanent authentication failure.
- [x] Add bounded sync retry with visible failure state.
- [x] Prevent API middleware from continuing after local-user provisioning fails.
- [x] Resolve placeholder email and real-email uniqueness conflicts safely.
- [x] Add migration or account-linking behavior for legacy Clerk users.
- [x] Verify Clerk bearer JWT validation in cross-origin development requests.
- [x] Verify extension-token validation remains isolated from web authentication.
- [x] Preserve protected-route redirect destinations after login and registration.
- [x] Add integration tests for missing token, expired token, invalid token, database outage, and email conflict.

## Session 04: API Client and CORS Reliability

Branch: `recall-api-client` plus follow-up `recall-config-cors`

Worktree scope: browser API transport, errors, timeouts, base URL resolution, and CORS.

Related ledger IDs: `AUTH-004`, `AUTH-006`, and `AUTH-007`.

Completion gate: every API failure is classified consistently in the UI, and local or deployed origin configuration is explicit.

- [x] Add a failing test for API 401 handling. (`apps/web/tests/api-client.test.ts`)
- [x] Add request timeout and abort behavior. (`apps/web/lib/api.ts`)
- [x] Classify authentication, validation, conflict, dependency, offline, and unknown errors. (`classifyApiError`)
- [x] Remove the empty 401 handling branch. (`apps/web/lib/api.ts`)
- [x] Make API base URL configuration explicit per environment. (`apps/web/.env.example`)
- [x] Remove the hardcoded production fallback and fail closed when a production API base is missing. (`apps/web/lib/api.ts`, `apps/web/.env.example`)
- [x] Allow configured development origins beyond port 3000. (runtime CORS defaults and `CORS_ORIGINS`)
- [x] Add CORS preflight integration tests for configured web and extension origins. (`apps/api/src/runtime/cors.test.ts`)
- [x] Ensure successful empty responses do not require JSON parsing. (`apps/web/tests/api-client.test.ts`)
- [x] Add request correlation IDs for save and processing flows. (`X-Request-ID` browser/API propagation)

Session 04 follow-up evidence: the production API base no longer contains a fixed deployment URL and now requires `NEXT_PUBLIC_RENDER_API_URL` or `NEXT_PUBLIC_API_URL_PROD`, while development and test environments retain the documented localhost default.
The API CORS middleware now uses a shared environment-aware configuration, keeps local defaults outside production, and accepts explicitly configured deployed origins.
Focused web API configuration and transport tests pass 8/8, focused API CORS preflight tests pass 4/4, and changed-file type checks and lint pass.

## Session 05: URL and File Save Flow

Branch: `recall-save-flow`

Worktree scope: add-content UI, API validation, request contract, duplicate submission, and user feedback.

Related ledger IDs: `SAVE-001` through `SAVE-006`.

Completion gate: URL and file saves provide clear success, failure, offline, validation, and processing feedback without requiring browser developer tools.

- [ ] Add a failing E2E test for a successful URL save.
- [ ] Add a failing E2E test for a failed URL save with an actionable message.
- [x] Add a failing test for malformed URL rejection before persistence. (`apps/api/src/routes/saveContract.test.ts`, `apps/web/tests/save-contract.test.ts`)
- [x] Validate URL scheme and host at the API boundary. (`apps/api/src/routes/saveContract.ts`)
- [x] Decide whether manually entered title and author override scraped values or act as fallbacks. (explicit fields take precedence over scraped metadata)
- [x] Send and persist the approved title, author, and podcast metadata contract. (`apps/api/prisma/migrations/20260824020000_save_metadata_contract`)
- [x] Parse `hh:mm:ss`, `mm:ss`, and numeric YouTube timestamps into seconds. (`apps/api/src/routes/saveContract.test.ts`, `apps/web/tests/save-contract.test.ts`)
- [x] Prevent duplicate submissions while a save is in flight. (`apps/web/tests/add-content-stepper.test.tsx`)
- [x] Surface API validation and dependency errors inside the modal. (`apps/web/tests/add-content-stepper.test.tsx`)
- [ ] Add retry and dismiss behavior for save errors.
- [x] Preserve the form when a save fails. (`apps/web/tests/add-content-stepper.test.tsx`)
- [ ] Show the newly saved item immediately with its processing state.
- [ ] Add collection and tag attachment success and failure feedback.
- [ ] Verify save behavior after browser refresh and reauthentication.

## Session 06: Upload Safety and Storage Lifecycle

Branch: `recall-uploads`

Worktree scope: browser upload validation, Multer limits, R2 persistence, and cleanup.

Related ledger IDs: `SAVE-005`, `PARSE-006`, and `DATA-004`.

Completion gate: unsafe or oversized uploads fail before unbounded buffering, and partial storage never becomes an unexplained orphan.

- [x] Add a failing test for oversized browser-selected files. (`apps/web/tests/upload-contract.test.ts`)
- [ ] Add a failing test for oversized drag-and-drop files.
- [x] Enforce file size in the browser and API. (`apps/web/lib/uploadContract.ts`, `apps/api/src/middleware/uploadContract.ts`)
- [x] Enforce allowed MIME types using content inspection where appropriate. (MIME plus PDF/image signature checks)
- [ ] Ensure PDF and image mode transitions select the correct request path.
- [x] Add upload timeouts and bounded buffers. (`apps/api/src/lib/storage.ts`)
- [ ] Store durable object keys instead of expiring signed URLs.
- [ ] Generate fresh signed URLs when objects are displayed.
- [ ] Add cleanup or compensation for R2 upload followed by database failure.
- [ ] Add upload integration tests for success, invalid type, too large, R2 failure, database failure, and retry.

## Session 07: Parser Architecture and Content Safety

Branch: `recall-parser-safety`

Worktree scope: source adapters, metadata extraction, text extraction, social fallbacks, and parser diagnostics.

Related ledger IDs: `PARSE-001` through `PARSE-003`, `PARSE-009`, and the parser portion of `PARSE-008`.

Completion gate: each supported source has typed results, deterministic fixtures, bounded resource use, and a user-readable failure reason.

- [ ] Introduce a typed parser adapter contract.
- [ ] Separate generic articles, X posts, Instagram, LinkedIn, YouTube, PDF, image, podcast, and generic links.
- [ ] Add fixtures for successful HTML extraction.
- [ ] Add fixtures for readability failure and paragraph fallback.
- [ ] Add fixtures for blocked pages and changed social responses.
- [ ] Add YouTube-specific metadata and transcript behavior or explicitly mark it unsupported.
- [ ] Preserve useful fallback title, author, description, and source-domain data.
- [x] Populate word count and reading time from validated content.
- [ ] Stop swallowing social fallback diagnostics.
- [ ] Add parser stage and source details to failure records.
- [x] Add content-length and content-type limits to every remote fetch.
- [x] Add redirect limits and response timeouts.
- [x] Add concurrency limits for scraper and file parsing jobs.
- [x] Add SSRF protections for user URLs, thumbnails, redirects, and remote files.
- [x] Add bounded-memory tests using controlled large responses.

Session 07 safety evidence: `apps/api/src/lib/remoteFetch.ts` now validates schemes, credentials, local/private literal addresses, DNS answers, redirect targets, response content types, timeouts, and bounded streamed bodies before parser or storage consumers receive bytes.
Scraper HTML, social oEmbed JSON, thumbnail, and PDF fetches all use the shared boundary, and unsafe thumbnail URLs are not retained as a fallback.
PDF parsing accepts `application/pdf` and `application/octet-stream` only after a `%PDF-` signature check, and extracted text is capped before persistence.
Parser statistics now populate `wordCount` and `readingTime`, while worker concurrency is configurable but capped at four.
Focused remote safety and parser statistics tests pass, the full API suite passes 48/48, API typecheck passes, and changed-file ESLint passes.
Full source adapter fixtures, YouTube transcript support, user-visible social diagnostics, and end-to-end remote dependency checks remain unchecked.

## Session 08: Dashboard Synchronization and Cache Correctness

Branch: `recall-sync-fix`

Worktree scope: TanStack Query invalidation, Redis graph cache, polling, refresh, and consistency rules.

Related ledger IDs: `UI-001` through `UI-006`.

Completion gate: every mutation has a documented consistency result, and the dashboard never presents known stale state as a successful resync.

- [x] Add a failing test for graph resync returning a stale Redis response.
- [x] Define one invalidation contract for browser and server caches.
- [x] Invalidate graph cache after every graph-affecting mutation.
- [x] Verify that search has no server-side cache requiring invalidation.
- [x] Invalidate collections and tags after save mutations that affect them.
- [x] Replace indefinite five-second polling with bounded, status-aware refresh.
- [ ] Add server-driven or event-driven completion updates if justified by the baseline.
- [x] Add user-visible infinite loading for dashboard items and archive. (`apps/web/hooks/useItems.ts`, `apps/web/app/dashboard/page.tsx`, `apps/web/app/dashboard/archive/page.tsx`, `apps/web/tests/dashboard-pagination.test.tsx`)
- [x] Reconcile total counts with loaded-page processing counts using a server-provided processing count.
- [ ] Add explicit refresh status and last-updated information.
- [ ] Add integration tests for save, update, archive, unarchive, delete, tag, collection, graph, and search consistency.

Session 08 evidence: API graph route tests cover stale-cache bypass and ordinary cache hits, web tests cover the resync request contract, item listing now bounds page size and applies tag/source filters to both data and totals, and dashboard processing counts are server-consistent.

Session 08 pagination evidence: dashboard and archive now consume the API's page and totalPages contract through `useInfiniteItems`, flatten loaded pages, and expose a disabled-aware Load more control with a retryable next-page error state.

## Session 09: Dashboard Item Actions and Recovery UX

Branch: `recall-item-actions`

Worktree scope: favorite, archive, retry, failure detail, and item action states.

Related ledger IDs: `UI-007` and `UI-009`.

Completion gate: every visible item action works, reports its state, and is covered by a browser-level regression test.

- [x] Add a failing test for the inert favorite control. (`apps/web/tests/item-actions.test.tsx`, `apps/web/tests/item-detail-actions.test.tsx`)
- [x] Implement favorite mutation and cache updates. (`apps/web/hooks/useItems.ts`, `apps/web/tests/item-actions-hooks.test.tsx`)
- [x] Add failed-state display to item cards and detail views. (`apps/web/components/items/ItemCard.tsx`, `apps/web/app/dashboard/items/[id]/page.tsx`)
- [x] Add failure stage and reason display. (`apps/web/components/items/ItemCard.tsx`, `apps/web/app/dashboard/items/[id]/page.tsx`)
- [x] Add retry action to item cards and detail views. (`apps/web/hooks/useItems.ts`, `apps/web/tests/item-actions.test.tsx`, `apps/web/tests/item-detail-actions.test.tsx`)
- [x] Show retry loading, success, duplicate, and failure states. (loading and queued states are rendered locally; API duplicate/failure messages remain visible through `getApiErrorMessage`)
- [x] Confirm archive and unarchive update all affected screens. (`apps/web/lib/queryKeys.ts`, `apps/web/tests/item-actions-hooks.test.tsx`)
- [x] Confirm delete updates items, collections, graph, and search. (`apps/web/lib/queryKeys.ts`, `apps/web/tests/item-actions-hooks.test.tsx`)
- [x] Add keyboard and screen-reader labels for every item action. (favorite and retry labels added; archive/delete labels preserved)
- [ ] Add browser tests for action success and server failure.

## Session 10: Search, Tags, and Collections UX

Branch: `recall-dashboard-features`

Worktree scope: search errors, tag management, collection membership, and related navigation.

Related ledger IDs: `UI-008` and `UI-010`.

Completion gate: search, tags, and collections are fully functional and do not disguise errors as empty data.

- [x] Render search errors distinctly from empty results. (`apps/web/app/dashboard/search/page.tsx`)
- [x] Render search loading and retry states in the page and top-bar dropdown. (`apps/web/app/dashboard/search/page.tsx`, `apps/web/components/layout/SearchDropdown.tsx`, `apps/web/components/layout/Topbar.tsx`)
- [x] Connect tag create, rename, delete, and attach actions to visible controls. (tag management controls and existing item attach mutation)
- [x] Add tag validation and duplicate-name feedback. (`apps/web/app/dashboard/tags/page.tsx`)
- [x] Verify collection ownership and membership feedback. (collection detail removal now reports both success and failure states)
- [ ] Add collection pagination where needed.
- [x] Add collection and tag empty states that teach the next action. (existing empty-state actions are covered by the collections and tags dashboard pages)
- [ ] Add integration and E2E tests for search, tag, and collection failures.

## Session 11: Dashboard UI System and Responsive Quality

Branch: `recall-dashboard-ui-fix`

Worktree scope: dashboard visual consistency, themes, layout, accessibility, and responsive behavior.

Related ledger IDs: `UI-011` through `UI-013`, `UI-016`, and the dashboard portion of `UI-006`.

Completion gate: dashboard screens pass visual, accessibility, and responsive checks across loading, empty, error, disabled, success, and dense states.

- [x] Establish the restrained dashboard color and semantic-state token map. (`apps/web/app/globals.css`, `--danger-*` and existing `--bg-*`/`--text-*` tokens)
- [x] Remove hardcoded dark-theme colors from item and collection cards. (`apps/web/app/dashboard/collections/page.tsx`, collection detail, and `apps/web/components/items/ItemCard.tsx`)
- [x] Fix root color-scheme behavior for light mode. (`apps/web/app/globals.css`, verified by web build)
- [ ] Persist theme, view mode, and sidebar preferences safely.
- [x] Start the mobile sidebar closed unless explicitly restored by the user. (`apps/web/store/uiStore.ts`, `apps/web/tests/dashboard-shell.test.tsx`)
- [ ] Standardize button, form, icon, card, modal, toast, and error component states.
- [ ] Add visible focus states and keyboard navigation.
- [x] Fix invalid selected-source CSS. (`apps/web/components/add-content/SourceTypePicker.tsx`, `apps/web/tests/graph-theme.test.tsx`)
- [x] Verify text contrast in dark and light themes. (accessible `--text-tertiary` tokens and native color-scheme alignment in `apps/web/app/globals.css`)
- [ ] Verify responsive structure at phone, tablet, laptop, and wide desktop sizes.
- [ ] Replace decorative dashboard motion with state-driven transitions.
- [ ] Render and inspect screenshots for every changed dashboard surface.
- [ ] Avoid introducing Ant Design as a parallel component system unless explicitly approved after the audit.

## Session 12: Graph UI and Visualization Performance

Branch: `recall-dashboard-ui-fix`

Worktree scope: graph sizing, legends, simulation lifecycle, loading states, and graph accessibility.

Related ledger IDs: `UI-014`, `UI-015`, and `UI-018`.

Completion gate: graph layout remains usable across sidebar states and dataset sizes without unnecessary continuous work.

- [x] Add a failing responsive test for graph sizing from the available content width. (`apps/web/tests/dashboard-shell.test.tsx`)
- [ ] Measure graph render cost for small, medium, and large datasets.
- [x] Remove the fixed sidebar-width assumption. (`apps/web/components/graph/KnowledgeGraph.tsx`, `apps/web/components/graph/graphDimensions.ts`)
- [x] Add podcast and link legend entries and color mappings. (`apps/web/lib/graphTheme.ts`, `apps/web/app/dashboard/graph/page.tsx`, `apps/web/components/graph/KnowledgeGraph.tsx`)
- [x] Pause graph simulation when the page is hidden or backgrounded. (`apps/web/components/graph/KnowledgeGraph.tsx`)
- [x] Reduce or gate directional particles based on dataset size and user preference. (`apps/web/lib/dashboardPerformance.ts`)
- [ ] Add graph loading, empty, error, and stale-data states.
- [ ] Make graph nodes and relationships keyboard and screen-reader discoverable where practical.
- [ ] Add screenshot and performance regression checks.

## Session 13: Browser and Server Resource Performance

Branch: `recall-performance`

Worktree scope: reported RAM/CPU growth, social embeds, polling, animations, remote fetch memory, and performance budgets.

Related ledger IDs: `RUN-011`, `PARSE-004`, `PARSE-005`, `UI-004`, and `UI-017`.

Completion gate: five-minute controlled scenarios show stable memory and bounded CPU, with no runaway request or animation loop.

- [ ] Capture baseline browser RSS, CPU, request rate, long tasks, frame rate, and detached-node measurements.
- [ ] Capture baseline API and worker RSS, heap, event-loop delay, and Redis queue lengths.
- [ ] Compare landing page, empty dashboard, 20-card dashboard, social-heavy dashboard, and large graph.
- [x] Compare dashboard behavior with polling disabled and enabled. (`apps/web/lib/dashboardPerformance.ts`, `apps/web/tests/dashboard-performance.test.ts`)
- [ ] Measure Instagram iframe and Twitter widget cost per card.
- [x] Lazy-load social embeds until they are near the viewport. (`apps/web/components/items/InstagramAutoEmbed.tsx`)
- [x] Deduplicate Twitter widget loading and disconnect social embed observers on unmount. (`apps/web/components/items/ItemCard.tsx`, `apps/web/components/items/TweetPreview.tsx`, `apps/web/components/items/InstagramAutoEmbed.tsx`)
- [x] Pause dashboard graph particle animation when hidden, backgrounded, reduced-motion, or above the supported node budget. (`apps/web/components/graph/KnowledgeGraph.tsx`)
- [x] Investigate and gate graph particles and simulation work at scale. (`apps/web/lib/dashboardPerformance.ts`, `apps/web/tests/dashboard-performance.test.ts`)
- [ ] Measure API memory while Redis is unavailable and stale items are requeued.
- [ ] Bound scraper, thumbnail, PDF, and remote response memory.
- [ ] Add performance budgets to CI or scheduled performance checks.
- [ ] Verify memory plateaus rather than relying only on a fast initial render.

Session 13 evidence: item processing refresh remains a five-second poll only while pending work is present and is bounded to a 60-second recovery window, with background-tab polling disabled.
Instagram iframes now mount only near the viewport, Twitter's shared widget script has a stable deduplication ID with both initial-load and remount callbacks, and graph particles are gated by visibility, document state, reduced-motion preference, and a 60-node budget.
Focused dashboard performance tests pass (3/3), Twitter lifecycle tests pass (2/2), the full integrated web unit suite passes (44/44), web typecheck passes, and changed-file lint is clean.
Controlled five-minute browser and server profiling remains unchecked and is required before declaring the overall performance group complete.

## Session 14: Authorization and Data Integrity

Branch: `recall-authorization`

Worktree scope: ownership checks, nested relations, token boundaries, and negative tests.

Related ledger IDs: `DATA-001` and `DATA-002`.

Completion gate: every cross-user access attempt fails closed and every nested relation is ownership-checked.

- [x] Add failing tests for cross-user collection attachment.
- [x] Add failing tests for cross-user tag attachment.
- [ ] Verify item, collection, tag, graph, search, and related-item ownership filters.
- [ ] Verify extension tokens cannot access unrelated users.
- [x] Verify public collection access exposes only intentionally public data.
- [x] Add authorization checks before nested Prisma writes.
- [ ] Add security logging that excludes secrets and content.
- [ ] Run dependency and static security checks.

Session 14 evidence: the URL and upload save tests first reproduced cross-user collection attachment as a successful write, then passed after ownership checks were added before nested item creation and storage upload.
The tag attachment negative test passed against the existing item and tag owner checks, so no production change was needed for that path.
The public collection test first reproduced exposure of a foreign user's item through a malformed nested relation, then passed after flattening filters relations to the collection owner.
Focused authorization tests pass 4/4, the full API suite passes 39/39, and changed-file lint passes with ten pre-existing unused-catch warnings in collections.ts.
The isolated API type check is blocked because the worktree lacks a generated Prisma client and `prisma generate` cannot write its cache in this environment.

## Session 15: Migration and Storage Reconciliation

Branch: `recall-migrations`

Worktree scope: Prisma migration history, live schema reconciliation, and storage cleanup.

Related ledger IDs: `DATA-003`, `DATA-004`, and `TEST-005`.

Completion gate: a clean database and the current database reach the same schema through documented, reviewed commands.

- [ ] Inspect the live migration ledger and schema in a protected read-only environment.
- [ ] Decide the reviewed baseline strategy for the two unapplied repository migrations.
- [x] Add a migration smoke test to CI. (`.github/workflows/quality.yml`, `apps/api/prisma/migration_smoke.sql`)
- [x] Verify extension-token tables and constraints in a clean database. (CI PostgreSQL 16 migration smoke test)
- [ ] Verify indexes and foreign keys for all ownership-sensitive paths.
- [ ] Inventory and clean orphaned R2 objects through a recoverable process.
- [x] Add compensation or cleanup tests for partial storage and database failures. (`apps/api/src/routes/items.authorization.test.ts` covers the pre-upload ownership boundary; the runbook records the database-failure cleanup contract)
- [x] Document rollback and forward migration procedures. (`apps/api/prisma/MIGRATION_RUNBOOK.md`)

Session 15 evidence: the repository contains four ordered PostgreSQL migrations, and the current schema fields are represented by the pipeline-recovery and save-metadata migrations.
The local protected read-only status check could not reach PostgreSQL and Prisma's schema engine cache is read-only, so no live ledger baseline was guessed or changed.
CI now starts PostgreSQL 16, deploys the full migration history, verifies that the ledger is clean, and asserts extension-token constraints plus current item columns through `migration_smoke.sql`.
Durable object keys and a complete orphan inventory remain deferred to Session 06 because the current schema stores signed URLs rather than storage keys.

## Session 16: Release Verification

Branch: `recall-release-verification`

Worktree scope: integration of completed groups and production-like verification.

Completion gate: all critical and high checklist items are verified or explicitly deferred with approval.

- [x] Run API build and type checks. (Integrated `npm run build:api` and `npx tsc --noEmit` pass.)
- [x] Run web build, type checks, and lint. (Integrated `npm run build:web`, web typecheck, and lint pass.)
- [ ] Run unit and integration suites.
- [ ] Run the complete save and recovery E2E suite.
- [ ] Run accessibility checks.
- [ ] Run visual regression checks.
- [ ] Run five-minute browser performance scenarios.
- [ ] Run five-minute API and worker resource scenarios.
- [ ] Run authorization and SSRF security checks.
- [ ] Verify health and readiness behavior with each dependency healthy and unavailable.
- [ ] Verify queue depth, worker liveness, retry behavior, and terminal item states.
- [ ] Verify production-like environment variables without exposing values.
- [x] Update `AUDIT_LEDGER.md` with test paths, commits, dates, and evidence.
- [x] Mark only genuinely verified items as `[x]` in this checklist.
- [ ] Document rollback, recovery, and known deferred work.

## Session 17: Dashboard Pagination and Projection Consistency

Branch: `recall-pagination-consistency`

Worktree scope: dashboard and archive page loading, item action projection invalidation, and focused web regression tests.

Related ledger IDs: `UI-001` and `UI-006`.

Completion gate: users can load every dashboard/archive page through a visible control, and archive, unarchive, and delete refresh item, collection, search, and graph projections together.

- [x] Reproduce the first-page-only dashboard and archive behavior against the existing API pagination contract.
- [x] Add a failing regression test for visible next-page controls on dashboard and archive.
- [x] Implement page loading through TanStack Query infinite data and expose next-page loading/error states.
- [x] Add a failing regression test for archive, unarchive, and delete projection invalidation.
- [x] Centralize item projection invalidation across items, item detail, collections, collection detail, search, and graph.
- [x] Run focused and full web unit tests, web typecheck, and changed-file ESLint.

Session 17 evidence: before implementation, `apps/web/app/dashboard/page.tsx` and `apps/web/app/dashboard/archive/page.tsx` called `useItems` without changing its default page, while `GET /items` already returned `page`, `limit`, and `totalPages`.
The RED tests failed because neither page rendered a next-page control and archive/unarchive omitted collection and search invalidation.
The focused tests pass 7/7, the full web suite passes 49/49, web typecheck passes, and changed-file ESLint passes.
Browser-level pagination and live multi-page API checks remain part of Session 16 release verification.

## Session Log

| Session | Branch | Worktree | Started | Finished | Test evidence | Verification evidence | Notes |
|---|---|---|---|---|---|---|---|
| 00 | `recall-test-foundation` | `/home/arpan/my_laptop/faah/01_TasksForDaily/Recall` | 2026-08-24 | 2026-08-24 | API 32/32; web 20/20; runtime 1/1; browser smoke passed | Commits `2e06a1e`, `24052c4`, `85bd5c4`; API and web builds passed | Primary save E2E, service fixtures, and live dependency checks remain. |
| 01 | `recall-runtime` | `/tmp/recall-worktrees/runtime` | 2026-08-24 | 2026-08-24 | Runtime contract tests; API 26/26; integrated API and web builds passed | Commit `fdef9b7`; integrated commit `e0d313e` | Live service smoke checks remain. |
| 02 | `recall-pipeline` | `/tmp/recall-worktrees/pipeline` | 2026-08-24 | 2026-08-24 | Focused API 9/9; integrated API 26/26; integrated build passed | Commit `bc5607041905353249c1af03e2bb89fbe0845175`; compatibility commit `75e00dd` | Eight waiting Redis jobs remain unchecked because no live worker recovery was performed. |
| 03 | `recall-auth` | `/tmp/recall-worktrees/auth` | 2026-08-24 | 2026-08-24 | API 12/12; web 6/6; API `tsc --noEmit` | Web `next build`; commit `5694038` | Web lint has pre-existing errors outside Session 03. |
| 04 | `recall-api-client-fix` plus `recall-config-cors` | `/tmp/recall-worktrees/api-client-fix`, `/tmp/recall-worktrees/config-cors` | 2026-08-24 | 2026-08-24 | API 32/32; web 20/20; follow-up web API configuration and transport tests 8/8; API CORS preflight tests 3/3; API and web type checks passed; changed-file lint passed | Commit `76df424`, integrated as `59e34ab`, with follow-up commit recorded in Session 17; transport, explicit production base, and CORS preflight contracts are covered | Live deployed-origin browser smoke remains part of Session 16. |
| 05 | `recall-save-flow` | `/tmp/recall-worktrees/save-flow` (salvaged into integration branch) | 2026-08-24 | 2026-08-24 | API 30/30; web 13/13; API and web type checks passed; API and web lint passed | Commit recorded in integration history after focused URL, metadata, timestamp, error, and duplicate-submit tests | E2E save, retry action, optimistic item display, attachment feedback, and refresh/reauth checks remain. |
| 06 | `recall-uploads-fix` | `/tmp/recall-worktrees/uploads-fix` | 2026-08-24 | 2026-08-24 | API 32/32; web 15/15; API and web type checks passed; API lint passed | Commit `e40ed6a`, integrated as `c1be157`; browser/API size and signature tests passed | Drag-drop-specific test, mode-path E2E, durable key/fresh URL lifecycle, and full storage failure matrix remain. |
| 07 | `recall-parser-safety` | `/tmp/recall-worktrees/parser-safety` | 2026-08-24 | 2026-08-24 | Source API 48/48; integrated API 52/52; focused remote safety, parser statistics, and concurrency tests; API `tsc --noEmit`; changed-file ESLint clean | Source commit `87dc7bb`, integrated as `35494e7`; shared bounded remote fetch covers SSRF, DNS, redirect, timeout, content-type, and streaming size controls; scraper, social, thumbnail, and PDF consumers migrated; parser stats persisted | Full source adapter fixtures, YouTube behavior, user-visible social diagnostics, and live remote dependency scenarios remain. |
| 08 | `recall-sync-fix` | `/tmp/recall-worktrees/sync-fix` | 2026-08-24 | 2026-08-24 | API 35/35; web 21/21; API/web type checks passed; changed-file lint passed | Graph cache route tests, web resync contract, bounded pagination and processing count consistency | Full web lint retains pre-existing errors outside this session; live Redis and full save consistency E2E remain. |
| 09 | `recall-item-actions-fix` | `/tmp/recall-worktrees/item-actions-fix` | 2026-08-24 | 2026-08-24 | Web 28/28; web `tsc --noEmit`; changed-file ESLint clean | Commit `a17ad75`, integrated as `2eafd2b`; item-card and detail-action regression tests cover favorite, retry, failure reason/stage, queued success, duplicate retry, and queue failure states | Browser E2E action coverage remains unchecked. |
| 10 | `recall-features-fix` + `recall-features-followup` | `/tmp/recall-worktrees/features-fix`, `/tmp/recall-worktrees/features-followup` | 2026-08-24 | 2026-08-24 | Source web 32/32 and 42/42; integrated web 44/44; web `tsc --noEmit`; changed-file ESLint passed | Source commits `6f2f61c`, `7f6156d`, integrated as `14d399d`, `f444367`; search/tag controls, top-bar search errors/loading/retry, and collection removal success/failure feedback are covered by regression tests | Full search/tag/collection integration and browser E2E remain. |
| 11 | `recall-dashboard-ui-fix` | `/tmp/recall-worktrees/dashboard-ui-fix` | 2026-08-24 | 2026-08-24 | Web 36/36 in source worktree; integrated web 44/44; web `tsc --noEmit`; changed-file ESLint passed with two existing image warnings | Source commit `6cf9c53`, integrated as `a5ac51f`; light color-scheme, accessible contrast tokens, mobile sidebar closed state, pressed-state controls, and responsive shell tests verified | Full web lint retains pre-existing errors outside this session; hardcoded card colors, preference persistence, screenshots, and full responsive visual checks remain. |
| 12 | `recall-graph-ui-fix` | `/tmp/recall-worktrees/dashboard-ui-fix` | 2026-08-24 | 2026-08-24 | Graph sizing regression and dashboard shell tests included in source web 36/36; integrated web 44/44; web production build passed | Source commit `6cf9c53`, integrated as `a5ac51f`; graph dimensions use `ResizeObserver`, the wrapper has an accessible description, resync exposes disabled and busy states, and hidden graph animation is paused | Dataset performance measurements, podcast/link legend coverage, keyboard node navigation, screenshot checks, and live graph profiling remain. |
| 13 | `recall-performance-fix` | `/tmp/recall-worktrees/performance-fix` | 2026-08-24 | 2026-08-24 | Focused dashboard performance tests 3/3 plus Twitter lifecycle tests 2/2; source web 37/37; integrated web 44/44; web `tsc --noEmit`; changed-file lint passed; integrated web build passed | Source commits `c592666`, `a7c4313`, integrated as `a28660d` and `758551c`; graph render policy, bounded processing polling, near-viewport Instagram loading, and deduplicated/remount-safe Twitter widget changes verified in code and tests | Five-minute browser/server profiling and performance budgets remain unchecked. |
| 14 | `recall-authorization` | `/tmp/recall-worktrees/authorization` | 2026-08-24 | 2026-08-24 | Source focused authorization tests 4/4; source API 39/39; integrated API 52/52; API `tsc --noEmit` and build passed; changed-file lint has 10 pre-existing warnings | Source commit `d2ce724`, integrated as `44e75c9`; cross-user collection save/upload, tag attachment, and public nested item boundaries covered by regression tests | Extension-token route isolation, full ownership matrix, security logging, dependency audit, and integrated security verification remain. |
| 15 | `recall-migrations` | `/tmp/recall-worktrees/migrations` | 2026-08-24 | 2026-08-24 | Source migration-history tests 3/3 and API 43/43; integrated API 52/52; API typecheck/build passed; changed-file lint passes | Source commit `8890557`, integrated as `60c1c47`; CI PostgreSQL migration deploy/status/smoke gate, SQL assertions, deterministic history tests, rollback/reconciliation runbook, and upload cleanup regression added | Live ledger inspection and baseline resolution remain blocked by no configured PostgreSQL; orphan inventory and durable storage keys remain deferred. |
| 16 | `recall-release-verification` |  |  |  |  |  |  |
| 17 | `recall-pagination-consistency` | `/tmp/recall-worktrees/pagination-consistency` | 2026-08-24 | 2026-08-24 | Focused web 7/7; full web 49/49; web `tsc --noEmit`; changed-file ESLint clean | `useInfiniteItems` loads API pages and exposes visible Load more controls; archive, unarchive, and delete invalidate all item projections | Browser-level pagination and live multi-page API verification remain part of Session 16. |
| 18 | `recall-config-cors` | `/tmp/recall-worktrees/config-cors` | 2026-08-24 | 2026-08-24 | Web API configuration and transport tests 8/8; API CORS preflight tests 4/4; API/web type checks and changed-file lint pass | Commit recorded in the integration history; production base gating, environment-aware CORS options, and CI/docs configuration are covered by `apps/web/tests/api-config.test.ts`, `apps/web/tests/api-client.test.ts`, and `apps/api/src/runtime/cors.test.ts` | Live deployed-origin browser smoke and production service verification remain part of Session 16. |
| 19 | `recall-graph-theme` | `/tmp/recall-worktrees/graph-theme` | 2026-08-24 | 2026-08-24 | Focused graph/theme tests 3/3; web typecheck; changed-file ESLint passed | Graph palette covers all item types, collection and item cards use semantic theme tokens, and source picker selected styles are valid and pressed-state accessible | Full browser visual checks, persisted theme preferences, graph keyboard navigation, and large-graph profiling remain. |
