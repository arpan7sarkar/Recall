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
- [ ] Add root commands for API, worker, web, build, lint, unit, integration, and E2E checks.
- [ ] Add CI workflows for build, lint, tests, migrations, E2E, and artifact upload.
- [ ] Add a failing save test that proves the user-visible error state is currently missing.
- [ ] Add a failing pipeline test that proves a queued item can remain pending without a worker.

## Session 01: Local Runtime and Deployment Readiness

Branch: `recall-runtime`

Worktree scope: root orchestration, process lifecycle, environment contract, and readiness behavior.

Related ledger IDs: `RUN-001`, `RUN-004`, `RUN-009`, `RUN-010`, `AUTH-004`, `AUTH-007`, `TEST-004`, and `TEST-005`.

Completion gate: one documented local command starts the API, web app, worker, PostgreSQL, and Redis, and readiness fails when a required dependency is unavailable.

- [ ] Make the root development workflow start or clearly validate the API.
- [ ] Make the root development workflow start or clearly validate the worker.
- [ ] Add dependency service startup and shutdown instructions.
- [ ] Make API readiness verify PostgreSQL connectivity.
- [ ] Make API readiness verify Redis connectivity.
- [ ] Make API readiness verify queue availability.
- [ ] Make worker readiness verify Redis connectivity before reporting healthy.
- [ ] Separate liveness from readiness responses.
- [ ] Ensure fatal uncaught exceptions terminate the process for supervisor recovery.
- [ ] Add structured startup diagnostics without exposing secrets.
- [ ] Complete `.env.example` with Clerk, CORS, readiness, storage, host, port, and clock-skew variables.
- [ ] Document the required API, worker, and web environment contract.
- [ ] Verify production and worker services use the same Redis configuration.

## Session 02: Redis and BullMQ Pipeline Recovery

Branch: `recall-pipeline`

Worktree scope: queue creation, job lifecycle, retries, stale-item recovery, and processing status.

Related ledger IDs: `RUN-002`, `RUN-003`, `RUN-005` through `RUN-008`, `RUN-011`, `PARSE-007`, and `PARSE-008`.

Completion gate: a saved URL progresses through scrape, AI, embed, and terminal state under healthy services, and dependency failures are visible and retryable.

- [ ] Enforce or validate the BullMQ-compatible Redis eviction policy.
- [ ] Make URL enqueue failure visible instead of returning an unexplained successful pending item.
- [ ] Decide and implement durable handoff semantics between database creation and queue creation.
- [ ] Prevent upload responses from reporting failure after partial R2 and database persistence without recovery information.
- [ ] Replace stable retry job IDs that collide with retained failed jobs.
- [ ] Configure failed-job retention and cleanup deliberately.
- [ ] Make stale-item requeueing idempotent and observable.
- [ ] Ensure scraper status becomes failed only under the defined final-attempt rule.
- [ ] Persist processing stage and user-readable failure reason.
- [ ] Add retry behavior that schedules fresh work after a failed job.
- [ ] Ensure optional AI and vector failures do not erase a valid durable save.
- [ ] Define the meaning of `pending`, `processing`, `ready`, and `failed`.
- [ ] Add terminal-state tests for scrape failure, AI failure, embed failure, and worker outage.
- [ ] Verify all eight currently waiting scraper jobs through a controlled recovery procedure.

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

Branch: `recall-api-client`

Worktree scope: browser API transport, errors, timeouts, base URL resolution, and CORS.

Related ledger IDs: `AUTH-004`, `AUTH-006`, and `AUTH-007`.

Completion gate: every API failure is classified consistently in the UI, and local or deployed origin configuration is explicit.

- [ ] Add a failing test for API 401 handling.
- [ ] Add request timeout and abort behavior.
- [ ] Classify authentication, validation, conflict, dependency, offline, and unknown errors.
- [ ] Remove the empty 401 handling branch.
- [ ] Make API base URL configuration explicit per environment.
- [ ] Remove or formally document the hardcoded production fallback.
- [ ] Allow configured development origins beyond port 3000.
- [ ] Add CORS preflight integration tests for web and extension origins.
- [ ] Ensure successful empty responses do not require JSON parsing.
- [ ] Add request correlation IDs for save and processing flows.

## Session 05: URL and File Save Flow

Branch: `recall-save-flow`

Worktree scope: add-content UI, API validation, request contract, duplicate submission, and user feedback.

Related ledger IDs: `SAVE-001` through `SAVE-006`.

Completion gate: URL and file saves provide clear success, failure, offline, validation, and processing feedback without requiring browser developer tools.

- [ ] Add a failing E2E test for a successful URL save.
- [ ] Add a failing E2E test for a failed URL save with an actionable message.
- [ ] Add a failing test for malformed URL rejection before persistence.
- [ ] Validate URL scheme and host at the API boundary.
- [ ] Decide whether manually entered title and author override scraped values or act as fallbacks.
- [ ] Send and persist the approved title, author, and podcast metadata contract.
- [ ] Parse `hh:mm:ss`, `mm:ss`, and numeric YouTube timestamps into seconds.
- [ ] Prevent duplicate submissions while a save is in flight.
- [ ] Surface API validation and dependency errors inside the modal.
- [ ] Add retry and dismiss behavior for save errors.
- [ ] Preserve the form when a save fails.
- [ ] Show the newly saved item immediately with its processing state.
- [ ] Add collection and tag attachment success and failure feedback.
- [ ] Verify save behavior after browser refresh and reauthentication.

## Session 06: Upload Safety and Storage Lifecycle

Branch: `recall-uploads`

Worktree scope: browser upload validation, Multer limits, R2 persistence, and cleanup.

Related ledger IDs: `SAVE-005`, `PARSE-006`, and `DATA-004`.

Completion gate: unsafe or oversized uploads fail before unbounded buffering, and partial storage never becomes an unexplained orphan.

- [ ] Add a failing test for oversized browser-selected files.
- [ ] Add a failing test for oversized drag-and-drop files.
- [ ] Enforce file size in the browser and API.
- [ ] Enforce allowed MIME types using content inspection where appropriate.
- [ ] Ensure PDF and image mode transitions select the correct request path.
- [ ] Add upload timeouts and bounded buffers.
- [ ] Store durable object keys instead of expiring signed URLs.
- [ ] Generate fresh signed URLs when objects are displayed.
- [ ] Add cleanup or compensation for R2 upload followed by database failure.
- [ ] Add upload integration tests for success, invalid type, too large, R2 failure, database failure, and retry.

## Session 07: Parser Architecture and Content Safety

Branch: `recall-parser`

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
- [ ] Populate word count and reading time from validated content.
- [ ] Stop swallowing social fallback diagnostics.
- [ ] Add parser stage and source details to failure records.
- [ ] Add content-length and content-type limits to every remote fetch.
- [ ] Add redirect limits and response timeouts.
- [ ] Add concurrency limits for scraper and file parsing jobs.
- [ ] Add SSRF protections for user URLs, thumbnails, redirects, and remote files.
- [ ] Add bounded-memory tests using controlled large responses.

## Session 08: Dashboard Synchronization and Cache Correctness

Branch: `recall-sync`

Worktree scope: TanStack Query invalidation, Redis graph cache, polling, refresh, and consistency rules.

Related ledger IDs: `UI-001` through `UI-006`.

Completion gate: every mutation has a documented consistency result, and the dashboard never presents known stale state as a successful resync.

- [ ] Add a failing test for graph resync returning a stale Redis response.
- [ ] Define one invalidation contract for browser and server caches.
- [ ] Invalidate graph cache after every graph-affecting mutation.
- [ ] Invalidate search cache or remove server-side search caching where appropriate.
- [ ] Invalidate collections and tags after save mutations that affect them.
- [ ] Replace indefinite five-second polling with bounded, status-aware refresh.
- [ ] Add server-driven or event-driven completion updates if justified by the baseline.
- [ ] Add pagination or infinite loading for items and archive.
- [ ] Reconcile total counts with loaded-page processing counts.
- [ ] Add explicit refresh status and last-updated information.
- [ ] Add integration tests for save, update, archive, unarchive, delete, tag, collection, graph, and search consistency.

## Session 09: Dashboard Item Actions and Recovery UX

Branch: `recall-item-actions`

Worktree scope: favorite, archive, retry, failure detail, and item action states.

Related ledger IDs: `UI-007` and `UI-009`.

Completion gate: every visible item action works, reports its state, and is covered by a browser-level regression test.

- [ ] Add a failing test for the inert favorite control.
- [ ] Implement favorite mutation and cache updates.
- [ ] Add failed-state display to item cards and detail views.
- [ ] Add failure stage and reason display.
- [ ] Add retry action to item cards and detail views.
- [ ] Show retry loading, success, duplicate, and failure states.
- [ ] Confirm archive and unarchive update all affected screens.
- [ ] Confirm delete updates items, collections, graph, and search.
- [ ] Add keyboard and screen-reader labels for every item action.
- [ ] Add browser tests for action success and server failure.

## Session 10: Search, Tags, and Collections UX

Branch: `recall-dashboard-features`

Worktree scope: search errors, tag management, collection membership, and related navigation.

Related ledger IDs: `UI-008` and `UI-010`.

Completion gate: search, tags, and collections are fully functional and do not disguise errors as empty data.

- [ ] Render search errors distinctly from empty results.
- [ ] Render search loading and retry states in the page and top-bar dropdown.
- [ ] Connect tag create, rename, delete, and attach actions to visible controls.
- [ ] Add tag validation and duplicate-name feedback.
- [ ] Verify collection ownership and membership feedback.
- [ ] Add collection pagination where needed.
- [ ] Add collection and tag empty states that teach the next action.
- [ ] Add integration and E2E tests for search, tag, and collection failures.

## Session 11: Dashboard UI System and Responsive Quality

Branch: `recall-dashboard-ui`

Worktree scope: dashboard visual consistency, themes, layout, accessibility, and responsive behavior.

Related ledger IDs: `UI-011` through `UI-013`, `UI-016`, and the dashboard portion of `UI-006`.

Completion gate: dashboard screens pass visual, accessibility, and responsive checks across loading, empty, error, disabled, success, and dense states.

- [ ] Establish the restrained dashboard color and semantic-state token map.
- [ ] Remove hardcoded dark-theme colors from item and collection cards.
- [ ] Fix root color-scheme behavior for light mode.
- [ ] Persist theme, view mode, and sidebar preferences safely.
- [ ] Start the mobile sidebar closed unless explicitly restored by the user.
- [ ] Standardize button, form, icon, card, modal, toast, and error component states.
- [ ] Add visible focus states and keyboard navigation.
- [ ] Fix invalid selected-source CSS.
- [ ] Verify text contrast in dark and light themes.
- [ ] Verify responsive structure at phone, tablet, laptop, and wide desktop sizes.
- [ ] Replace decorative dashboard motion with state-driven transitions.
- [ ] Render and inspect screenshots for every changed dashboard surface.
- [ ] Avoid introducing Ant Design as a parallel component system unless explicitly approved after the audit.

## Session 12: Graph UI and Visualization Performance

Branch: `recall-graph-ui`

Worktree scope: graph sizing, legends, simulation lifecycle, loading states, and graph accessibility.

Related ledger IDs: `UI-014`, `UI-015`, and `UI-018`.

Completion gate: graph layout remains usable across sidebar states and dataset sizes without unnecessary continuous work.

- [ ] Add a failing responsive test for graph sizing with expanded and collapsed sidebar.
- [ ] Measure graph render cost for small, medium, and large datasets.
- [ ] Remove the fixed sidebar-width assumption.
- [ ] Add podcast and link legend entries and color mappings.
- [ ] Pause or dispose graph simulation when the page is hidden or unmounted.
- [ ] Reduce or gate directional particles based on dataset size and user preference.
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
- [ ] Compare dashboard behavior with polling disabled and enabled.
- [ ] Measure Instagram iframe and Twitter widget cost per card.
- [ ] Lazy-load or replace social embeds until explicitly opened.
- [ ] Ensure third-party widget loading is deduplicated and cleaned up.
- [ ] Pause hidden or unnecessary animations.
- [ ] Investigate graph particles and animation frame loops at scale.
- [ ] Measure API memory while Redis is unavailable and stale items are requeued.
- [ ] Bound scraper, thumbnail, PDF, and remote response memory.
- [ ] Add performance budgets to CI or scheduled performance checks.
- [ ] Verify memory plateaus rather than relying only on a fast initial render.

## Session 14: Authorization and Data Integrity

Branch: `recall-authorization`

Worktree scope: ownership checks, nested relations, token boundaries, and negative tests.

Related ledger IDs: `DATA-001` and `DATA-002`.

Completion gate: every cross-user access attempt fails closed and every nested relation is ownership-checked.

- [ ] Add failing tests for cross-user collection attachment.
- [ ] Add failing tests for cross-user tag attachment.
- [ ] Verify item, collection, tag, graph, search, and related-item ownership filters.
- [ ] Verify extension tokens cannot access unrelated users.
- [ ] Verify public collection access exposes only intentionally public data.
- [ ] Add authorization checks before nested Prisma writes.
- [ ] Add security logging that excludes secrets and content.
- [ ] Run dependency and static security checks.

## Session 15: Migration and Storage Reconciliation

Branch: `recall-migrations`

Worktree scope: Prisma migration history, live schema reconciliation, and storage cleanup.

Related ledger IDs: `DATA-003`, `DATA-004`, and `TEST-005`.

Completion gate: a clean database and the current database reach the same schema through documented, reviewed commands.

- [ ] Inspect the live migration ledger and schema in a protected read-only environment.
- [ ] Decide the reviewed baseline strategy for the two unapplied repository migrations.
- [ ] Add a migration smoke test to CI.
- [ ] Verify extension-token tables and constraints in a clean database.
- [ ] Verify indexes and foreign keys for all ownership-sensitive paths.
- [ ] Inventory and clean orphaned R2 objects through a recoverable process.
- [ ] Add compensation or cleanup tests for partial storage and database failures.
- [ ] Document rollback and forward migration procedures.

## Session 16: Release Verification

Branch: `recall-release-verification`

Worktree scope: integration of completed groups and production-like verification.

Completion gate: all critical and high checklist items are verified or explicitly deferred with approval.

- [ ] Run API build and type checks.
- [ ] Run web build, type checks, and lint.
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
- [ ] Update `AUDIT_LEDGER.md` with test paths, commits, dates, and evidence.
- [ ] Mark only genuinely verified items as `[x]` in this checklist.
- [ ] Document rollback, recovery, and known deferred work.

## Session Log

| Session | Branch | Worktree | Started | Finished | Test evidence | Verification evidence | Notes |
|---|---|---|---|---|---|---|---|
| 00 | `recall-test-foundation` |  |  |  |  |  |  |
| 01 | `recall-runtime` |  |  |  |  |  |  |
| 02 | `recall-pipeline` |  |  |  |  |  |  |
| 03 | `recall-auth` | `/tmp/recall-worktrees/auth` | 2026-08-24 | 2026-08-24 | API 12/12; web 6/6; API `tsc --noEmit` | Web `next build`; commit `5694038` | Web lint has pre-existing errors outside Session 03. |
| 04 | `recall-api-client` |  |  |  |  |  |  |
| 05 | `recall-save-flow` |  |  |  |  |  |  |
| 06 | `recall-uploads` |  |  |  |  |  |  |
| 07 | `recall-parser` |  |  |  |  |  |  |
| 08 | `recall-sync` |  |  |  |  |  |  |
| 09 | `recall-item-actions` |  |  |  |  |  |  |
| 10 | `recall-dashboard-features` |  |  |  |  |  |  |
| 11 | `recall-dashboard-ui` |  |  |  |  |  |  |
| 12 | `recall-graph-ui` |  |  |  |  |  |  |
| 13 | `recall-performance` |  |  |  |  |  |  |
| 14 | `recall-authorization` |  |  |  |  |  |  |
| 15 | `recall-migrations` |  |  |  |  |  |  |
| 16 | `recall-release-verification` |  |  |  |  |  |  |
