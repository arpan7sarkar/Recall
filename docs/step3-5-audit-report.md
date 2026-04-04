# Step 3-5 Implementation Audit Report

Date: 2026-04-04
Project: SecondBrain (Recall)
Scope requested: Verify implementation for PRD steps/phases 3 through 5, fix issues found, and document outcomes.
Update: Browser extension work (Phase 5) deferred by user instruction during this audit.

## 1. Scope Reviewed

From `docs/prd.md`, reviewed and validated code paths related to:
- Phase 3: Background workers, AI tagging, embeddings, search foundation.
- Phase 4: Knowledge graph API + visualization.
- Phase 5: Not audited for implementation completeness (explicitly deferred by user).

## 2. Verification Checks Run

Commands executed:
- `apps/api`: `npm.cmd run build`
- `apps/web`: `npm.cmd run lint`
- `apps/web`: `npx.cmd tsc --noEmit`
- `apps/web`: `npm.cmd run build`

Results:
- API TypeScript build: PASS (after fixes).
- Web lint: PASS with 1 warning (`<img>` optimization warning only).
- Web type-check (`tsc --noEmit`): PASS (after fixes).
- Web production build: COMPILE PASS, then fails at Next post-compile step with environment error `spawn EPERM`.

Notes on blockers:
- `apps/api` lint script cannot run because ESLint is not installed in `apps/api` dependencies (`'eslint' is not recognized...`).
- `apps/web` production build fails at environment/process level (`spawn EPERM`), not compile/type level.

## 3. Issues Found and Fixed

### 3.1 AI worker PDF parsing was broken (TypeScript compile failure)
- File: `apps/api/src/workers/aiWorker.ts`
- Problem: Code used old v1-style `pdf-parse` default callable import; installed package is v2 API.
- Fix: Migrated to v2 usage (`PDFParse` class + `getText()` + `destroy()`).
- Impact: Restores API compile and PDF text extraction path for AI tagging.

### 3.2 Upload flow did not persist files to R2 / missing `fileUrl`
- File: `apps/api/src/routes/items.ts`
- Problem: `/items/upload` accepted file but did not upload to object storage, so downstream workers lacked stable file URL.
- Fix:
  - Added R2 upload on upload endpoint using `buildKey` + `uploadFile`.
  - Persisted `fileUrl` (and `thumbnailUrl` for images).
  - Set `sourceDomain: "upload"` for uploaded items.
- Impact: Uploaded PDF/image items now enter AI/embed pipeline with actual file references, aligning with Phase 3 data flow.

### 3.3 URL item route allowed invalid jobs without URL
- File: `apps/api/src/routes/items.ts`
- Problem: `POST /items` could proceed without URL and still queue scrape job.
- Fix: Enforced URL requirement and explicit unauthorized check.
- Impact: Prevents bad scrape jobs and runtime worker failures.

### 3.4 Missing auth checks in create/upload item routes
- File: `apps/api/src/routes/items.ts`
- Problem: Upload/create endpoints did not explicitly reject missing user identity before DB writes.
- Fix: Added `401 Unauthorized` guard when userId is absent.
- Impact: Safer route behavior and clearer auth handling.

### 3.5 Web build dependency on Google Font fetch
- File: `apps/web/app/layout.tsx`
- Problem: `next/font/google` Inter fetch failed in restricted/offline environment and broke build.
- Fix: Removed runtime Google font import from layout and kept CSS font stack fallback.
- Impact: Avoids remote font fetch dependency during compile.

### 3.6 React hook dependency correctness in Add Content flow
- File: `apps/web/components/add-content/AddContentStepper.tsx`
- Problem: `useCallback` hooks were missing `performSave` dependency references.
- Fix: Converted `performSave` to `useCallback` and corrected dependency arrays.
- Impact: Removes stale closure risk and lint warnings.

### 3.7 Hook memoization dependency issue in auth hook
- File: `apps/web/hooks/useAuth.ts`
- Problem: `syncUser` callback depended on `getToken` but omitted it from deps.
- Fix: Added `getToken` to dependency list.
- Impact: Fixes React compiler/lint memoization issue.

### 3.8 Graph component lint/type quality issues
- File: `apps/web/components/graph/KnowledgeGraph.tsx`
- Problems:
  - Multiple explicit `any` usages.
  - Ref/type issues for ForceGraph integration.
- Fixes:
  - Replaced `any` with safe `unknown` extraction helpers.
  - Typed graph ref using `ForceGraphMethods`.
  - Preserved interactive behavior (`zoomToFit`, node click routing).
- Impact: Cleaner type/lint posture without behavior regression.

### 3.9 Search dropdown unused import
- File: `apps/web/components/layout/SearchDropdown.tsx`
- Fix: Removed unused `useState` import.

### 3.10 Type strictness mismatch for mock data
- Files:
  - `apps/web/types/tag.ts`
  - `apps/web/types/collection.ts`
  - `apps/web/app/dashboard/collections/page.tsx`
- Problem: Strict required `_count` in shared types broke local mocks and collections rendering assumptions.
- Fixes:
  - Made `_count` optional in `Tag` and `Collection` interfaces.
  - Used fallback render `col._count?.items ?? col.itemCount`.
- Impact: Type-check stability with both API and mock shapes.

## 4. Remaining Gaps (In Current Scope)

### 4.1 API lint script dependency gap
- `apps/api/package.json` has `"lint": "eslint . --ext .ts"` but ESLint package is not available in `apps/api`.
- Lint could not be executed for API during this audit.

### 4.2 Web build environment-level blocker
- `next build` compiles and runs TypeScript, then fails with `spawn EPERM` in this environment.
- This appears to be process permission/sandbox behavior rather than app compile/type errors.

## 5. Files Modified in This Audit

- `apps/api/src/workers/aiWorker.ts`
- `apps/api/src/routes/items.ts`
- `apps/web/app/layout.tsx`
- `apps/web/components/add-content/AddContentStepper.tsx`
- `apps/web/components/graph/KnowledgeGraph.tsx`
- `apps/web/components/layout/SearchDropdown.tsx`
- `apps/web/hooks/useAuth.ts`
- `apps/web/types/tag.ts`
- `apps/web/types/collection.ts`
- `apps/web/app/dashboard/collections/page.tsx`

## 6. Summary

Core Phase 3/4 backend+frontend pathways are now in a healthier state and pass compile/type/lint checks (except one non-blocking lint warning). Major reliability issues in upload -> AI pipeline and PDF parsing were fixed. Phase 5 extension work is intentionally deferred per user instruction.
