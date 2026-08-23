# Recall Recovery Plan

## Objective

Restore Recall as a reliable end-to-end product for saving, processing, organizing, and retrieving content through `apps/web` and `apps/api`.
The extension is outside the first recovery scope except where its token model affects shared API behavior.

## Confirmed Product Understanding

- Recall is a personal knowledge product for capturing URLs and files, enriching them asynchronously, and retrieving them through dashboard lists, search, collections, tags, related items, and a graph.
- The web application uses Next.js, React, Clerk, TanStack Query, Zustand, and a custom Tailwind design system.
- The API uses Express, Prisma/PostgreSQL, Redis/BullMQ, Cloudflare R2, OpenAI, Pinecone, metascraper, and separate workers.
- A successful save is not merely an HTTP 201 response.
- A successful save must result in durable persistence, observable processing, and a correct terminal state without silent partial failure.
- The dashboard is the primary UI optimization target.
- The landing page is lower priority unless performance testing reveals a critical regression.

## Assumptions

- PostgreSQL is the source of truth for saved content.
- Search vectors are an enhancement and must not determine whether otherwise valid content is considered saved.
- Dashboard synchronization should be predictable and close to immediate after user mutations.
- Failed processing must preserve the saved item and expose the failed stage, reason, and retry action.
- Existing visual identity should be refined rather than replaced.
- Quality, simplicity, robustness, scalability, and long-term maintainability take priority over development cost.
- Implementation will use isolated worktrees and branch names without forward slashes.

## Non-Functional Requirements

### Reliability

- A database write and processing handoff must have explicit, observable outcomes.
- Dependency failure must not silently report full success.
- Every item must reach a terminal state or expose a bounded, actionable retry state.
- Health and readiness must distinguish process liveness from dependency readiness.

### Performance

- Idle dashboard request rate must approach zero after data becomes stable.
- Dashboard animations must be state-driven and must stop when hidden or unnecessary.
- Remote fetches must have time, size, redirect, and concurrency limits.
- Browser and Node memory must plateau during the defined five-minute scenarios.
- Performance budgets will be fixed after the first controlled baseline rather than guessed from static code.

### Security and Privacy

- Every collection, tag, item, and token operation must enforce authenticated ownership.
- Remote content fetching must reject private, loopback, link-local, and unsafe redirect targets.
- Logs and tests must not expose authentication tokens, user content, or environment secrets.

### Maintenance

- Critical behavior must be protected by automated unit, integration, and E2E tests.
- Root commands must make the supported local topology obvious.
- CI must enforce the same quality gates used locally.
- The issue ledger must remain current throughout recovery.

## Testing Strategy

### Test Layers

1. Unit tests will cover URL normalization, type detection, timestamp parsing, payload validation, job retry policy, status transitions, cache keys, and UI state reducers.
2. API integration tests will exercise Express routes against isolated PostgreSQL and Redis instances with deterministic external-service adapters.
3. Web component tests will cover save error states, form transitions, failed item actions, pagination, cache invalidation, and accessible interaction states.
4. Playwright E2E tests will cover sign-in synchronization, URL save, file save, failed processing, retry, archive, favorite, collections, tags, search, graph refresh, and responsive dashboard navigation.
5. Visual regression tests will cover dashboard breakpoints, dark and light themes, loading, empty, error, disabled, success, and large-data states.
6. Performance tests will cover landing, dashboard, social previews, graph scale, Redis outage, oversized remote content, and worker concurrency.

### Test-Driven Rule

Every bug fix begins with the smallest failing test that reproduces the end-user behavior.
The failure must be observed for the expected reason before production code changes.
The focused test, surrounding suite, integration suite, and applicable E2E scenario must pass before a ledger item becomes verified.

### Proposed Tooling

- Use Vitest and Supertest for API unit and route-level integration tests.
- Use Vitest, React Testing Library, and MSW for web component and API-state tests.
- Use Playwright for end-to-end, responsive, screenshot, and browser performance scenarios.
- Use isolated PostgreSQL and Redis services through a reproducible local test topology.
- Use deterministic adapters or a local fake service for OpenAI, Pinecone, R2, Clerk, and remote scraping in automated tests.
- Keep a small separate live-service smoke suite that is opt-in and never required for ordinary deterministic CI.

## Dashboard Design Direction

### Purpose

The dashboard exists to let a user capture knowledge quickly, understand processing state, find saved material, and recover from failure without opening developer tools.

### Direction

The direction is a restrained knowledge cockpit with dense but calm information hierarchy.
It preserves Recall's dark, Obsidian-inspired character while removing decorative motion, ambiguous controls, inconsistent component states, and theme-specific hardcoding.

### Differentiation Anchor

Recall should be recognizable through a compact processing timeline and relationship-aware content presentation rather than generic gradient cards or decorative dashboard widgets.

### Design Feasibility and Impact

| Dimension | Score |
|---|---:|
| Aesthetic impact | 3 |
| Context fit | 5 |
| Implementation feasibility | 5 |
| Performance safety | 4 |
| Consistency risk | 2 |
| DFII | 15 |

The direction is in the excellent band and can proceed with disciplined visual and performance validation.

### Product UI Rules

- Use a restrained color system with the accent reserved for primary actions, selection, and state.
- Standardize default, hover, focus, active, disabled, loading, error, warning, and success states.
- Prefer skeletons for content loading and actionable empty states for missing content.
- Use motion only to communicate state, generally within 150 to 250 milliseconds.
- Make responsive behavior structural, including navigation collapse and item-layout changes.
- Avoid adding Ant Design as a second component system unless a later architectural decision explicitly replaces the current system.
- Render and inspect every changed dashboard surface at phone, tablet, laptop, and wide desktop sizes.

## Recovery Phases

### Phase 0: Preserve and Baseline

Target branch: `recall-audit-baseline`.

- Record and preserve all existing uncommitted changes.
- Capture current builds, lint results, runtime topology, environment contract, database migration state, Redis policy, queue counts, and dependency versions.
- Reproduce save and resource problems through controlled end-user flows.
- Capture dashboard screenshots and performance traces before changing behavior.
- Update every reproduced issue in `AUDIT_LEDGER.md` with exact steps and artifacts.

Exit criteria:

- Current user changes are safe.
- Critical failures have deterministic reproductions or explicit evidence gaps.
- Baseline artifacts contain no secrets or private content.

### Phase 1: Test and Runtime Foundation

Target branches: `recall-test-foundation`, `recall-runtime`, and `recall-ci`.

- Install and configure the agreed API, web, and E2E test tooling.
- Add root commands for web, API, worker, dependency services, build, lint, unit tests, integration tests, and E2E tests.
- Add isolated test database and Redis topology.
- Add CI quality gates and migration checks.
- Replace broken advertised API scripts with executable commands.

Exit criteria:

- One command starts the supported local stack.
- One command runs deterministic validation.
- The initial save-path E2E test fails for the current confirmed reason.

### Phase 2: Restore Core Runtime and Pipeline

Target branches: `recall-readiness` and `recall-pipeline`.

- Make readiness verify database, Redis, queue, and worker availability.
- Enforce the BullMQ-compatible Redis eviction policy in deployment configuration and diagnostics.
- Make processing handoff durable and observable.
- Redesign retry job identity and failed-job retention so retries schedule real work.
- Decouple durable saving from optional vector enrichment.
- Define explicit processing stages and terminal-state rules.
- Make fatal process failures exit cleanly for orchestration recovery.

Exit criteria:

- A saved URL progresses through a deterministic state machine.
- A dependency outage produces an accurate degraded or failed state.
- Restoring the dependency allows a safe retry without duplicate items.

### Phase 3: Repair Authentication and Saving

Target branches: `recall-auth`, `recall-api-client`, `recall-save-flow`, and `recall-uploads`.

- Make Clerk synchronization explicit, retryable, and visible.
- Prevent protected content from rendering after failed local-user provisioning.
- Resolve legacy-user email conflicts through a deliberate migration and account-linking policy.
- Validate URLs and item types at the API boundary.
- Align form fields with the API contract and persistence model.
- Parse YouTube timestamps correctly.
- Enforce upload size and MIME rules in browser and API.
- Show actionable save success, failure, offline, authentication, validation, and processing feedback.

Exit criteria:

- URL and file saves pass E2E tests under success and dependency-failure conditions.
- Users never need the console to understand a save failure.
- Duplicate submission and partial-persistence behavior are covered by integration tests.

### Phase 4: Make Parsing Safe and Useful

Target branches: `recall-parser`, `recall-parser-safety`, and `recall-storage`.

- Introduce a content-source adapter contract with typed results and typed failure reasons.
- Separate article, social, YouTube, PDF, image, and generic-link processing.
- Add fetch timeouts, byte limits, content-type limits, redirect limits, concurrency controls, and SSRF protection.
- Preserve durable storage identifiers instead of expiring signed URLs.
- Generate reading time and word count from validated extracted content.
- Add parser fixtures for representative HTML, redirects, blocked pages, social fallbacks, malformed documents, and oversized responses.

Exit criteria:

- Each supported content type has deterministic fixtures and integration coverage.
- Oversized or unsafe content fails without unbounded memory growth.
- Parser failures retain the item and expose a specific recovery path.

### Phase 5: Repair Synchronization and Dashboard Behavior

Target branches: `recall-sync`, `recall-dashboard`, `recall-item-actions`, `recall-tags-ui`, and `recall-search-ui`.

- Define a single cache-invalidation contract across web query cache, Redis graph cache, and persistence mutations.
- Replace indefinite polling with bounded, status-aware refresh behavior.
- Add complete pagination or infinite loading.
- Make favorite, retry, tags, search errors, and collection membership fully functional.
- Display the actual processing stage, elapsed state, error reason, and retry state.
- Reconcile global totals with loaded-page metrics.

Exit criteria:

- Dashboard state changes become visible without stale double caching.
- Every visible action works or is removed.
- Loading, empty, failure, partial, offline, and success states are covered.

### Phase 6: Dashboard UI and Performance Refinement

Target branches: `recall-dashboard-ui`, `recall-graph-ui`, and `recall-performance`.

- Standardize component states, spacing, typography, color tokens, focus behavior, and responsive structure.
- Fix mobile navigation defaults, theme persistence, light-theme contrast, graph sizing, legends, and item-card hierarchy.
- Lazy-load or replace expensive social embeds until the user requests them.
- Pause animation, polling, and graph simulation when hidden or stable.
- Use windowing when item or graph scale makes it necessary.
- Compare each change against the preserved performance and screenshot baseline.

Exit criteria:

- Dashboard passes accessibility, responsive, visual-regression, and performance checks.
- Five-minute browser memory measurements plateau in every required scenario.
- No decorative motion competes with content tasks.

### Phase 7: Authorization, Data Integrity, and Migration Repair

Target branches: `recall-authorization` and `recall-migrations`.

- Enforce ownership in every nested relation and mutation.
- Add negative cross-user integration tests.
- Reconcile the live schema with the Prisma migration ledger through a reviewed baseline strategy.
- Add cleanup or compensation for partial R2 and database failures.
- Decide whether highlights and resurfacing are active roadmap features or should be removed from the immediate product surface.

Exit criteria:

- Cross-user access tests fail closed.
- A clean database and the existing database reach the same reviewed schema through documented commands.
- Partial failures have deterministic compensation or recovery.

### Phase 8: Production Verification

Target branch: `recall-release-verification`.

- Run builds, lint, unit, integration, E2E, accessibility, visual, security, and performance suites.
- Exercise production-like PostgreSQL, Redis, worker, R2, OpenAI, and Pinecone configuration through smoke checks.
- Confirm readiness alerts and queue monitoring.
- Verify browser behavior on phone, tablet, laptop, and wide desktop sizes.
- Update the audit ledger only from actual evidence.

Exit criteria:

- All critical and high issues are verified or explicitly deferred with user approval.
- No unresolved test, lint, build, flaky-test, visual, accessibility, security, or performance failures remain.
- Rollback and recovery procedures are documented and exercised.

## Branch and Worktree Sequence

1. Create `recall-audit-baseline` after the existing uncommitted changes are safely accounted for.
2. Build the test foundation before changing production behavior.
3. Keep runtime, auth/save, parser, synchronization, UI, and authorization work isolated until their focused suites pass.
4. Merge dependency branches in causal order rather than merging by visual completion.
5. Use a final `recall-release-verification` worktree for integration and production-like validation.

No branch name may contain a forward slash.
No commit may add an agent name or co-author line.

## Decision Log

| Decision | Alternatives | Reason |
|---|---|---|
| Treat dashboard as the primary UI optimization scope. | Redesign landing and dashboard together. | The user identified dashboard flaws and said the landing page is generally acceptable. |
| Build testing infrastructure before fixes. | Continue manual debugging. | The repository has no regression safety net and core failures cross several processes. |
| Require E2E reproduction before each bug fix. | Start from static code hypotheses. | End-user behavior crosses Clerk, web, API, PostgreSQL, Redis, workers, and external services. |
| Preserve and refine the custom design system. | Add Ant Design beside it. | A second component system would increase inconsistency and bundle cost without solving the product hierarchy problem. |
| Separate durable save from optional enrichment. | Require embeddings before ready. | Persistence should remain useful during OpenAI or Pinecone degradation. |
| Use narrow branches without forward slashes. | Use conventional slash-prefixed branches. | This is an explicit user requirement and makes isolated worktrees straightforward. |

## Open Product Decisions

- Define whether `ready` means durably saved, fully parsed, or fully enriched.
- Define the expected consistency delay for dashboard, search, collections, and graph.
- Decide whether manually entered title and author override scraped metadata or act only as fallbacks.
- Decide which social and YouTube sources are officially supported rather than best-effort.
- Decide whether highlights and resurfacing remain in the near-term product.
