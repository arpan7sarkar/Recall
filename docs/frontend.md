# Second Brain (Recall) — Frontend Design Document

**Version:** 1.0  
**Date:** March 2026  
**Status:** Ready to Build  
**Framework:** Next.js 16 (App Router) + TypeScript  
**Constraint:** No axios — all HTTP via native `fetch` wrapper

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Key Differences from PRD](#2-key-differences-from-prd)
3. [Design System & Tokens](#3-design-system--tokens)
4. [Project Initialisation](#4-project-initialisation)
5. [Folder Structure](#5-folder-structure)
6. [Core Library Layer](#6-core-library-layer)
7. [State Management](#7-state-management)
8. [Custom Hooks](#8-custom-hooks)
9. [Component Specifications](#9-component-specifications)
10. [Page-by-Page Implementation](#10-page-by-page-implementation)
11. [Add Content Flow (Deep Dive)](#11-add-content-flow-deep-dive)
12. [Knowledge Graph (D3.js)](#12-knowledge-graph-d3js)
13. [Search System](#13-search-system)
14. [Accessibility & Responsiveness](#14-accessibility--responsiveness)
15. [Performance Optimisation](#15-performance-optimisation)
16. [Error Handling & Loading States](#16-error-handling--loading-states)
17. [Testing Strategy](#17-testing-strategy)
18. [Production Deployment](#18-production-deployment)
19. [Build Checklist](#19-build-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                       │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Layouts  │  │ Pages (RSC)  │  │ Client Components        │  │
│  │ (auth,   │  │ (server-     │  │ ('use client' — forms,   │  │
│  │ dash)    │  │  rendered)   │  │  interactivity, graphs)  │  │
│  └──────────┘  └──────────────┘  └──────────────────────────┘  │
│                        │                      │                 │
│              ┌─────────▼──────────────────────▼──────────┐      │
│              │         Shared Layer                       │      │
│              │  lib/api.ts    — fetch wrapper (no axios)  │      │
│              │  lib/utils.ts  — formatters, helpers        │      │
│              │  store/*       — Zustand stores             │      │
│              │  hooks/*       — React Query + custom       │      │
│              └────────────────────┬──────────────────────┘      │
│                                   │                             │
└───────────────────────────────────┼─────────────────────────────┘
                                    │ fetch()
                                    ▼
                        ┌──────────────────────┐
                        │  Express API (v1)     │
                        │  localhost:4000       │
                        └──────────────────────┘
```

### Rendering Strategy

| Route Pattern | Rendering | Reason |
|---|---|---|
| `/` (landing) | SSG | Static marketing page |
| `/login`, `/register` | SSR | SEO + fast first paint |
| `/dashboard` (feed) | CSR with React Query | Real-time data, user-specific |
| `/items/[id]` | SSR + CSR hydration | SEO for public items, interactive UI |
| `/graph` | CSR only | Heavy D3.js client-side rendering |
| `/add` | CSR only | Form-heavy, no SEO value |
| `/search` | CSR | Dynamic results from user input |
| `/collections`, `/collections/[id]` | CSR with React Query | User-specific, paginated |

---

## 2. Key Differences from PRD

The PRD (Section 5 and Phase 2) specifies `axios` for HTTP requests. **This frontend document removes axios entirely** and replaces it with a typed `fetch` wrapper.

| Area | PRD Says | This Document |
|---|---|---|
| **HTTP client** | `axios` with interceptors | Native `fetch` with typed wrapper (`lib/api.ts`) |
| **Upload progress** | `axios.onUploadProgress` | `XMLHttpRequest` progress events (only for file uploads) |
| **API instance** | `axios.create({ baseURL })` | Custom `apiFetch<T>()` generic function |
| **Error handling** | Axios error interceptors | Custom `ApiError` class + `handleResponse()` |
| **JWT injection** | Axios request interceptor | `getAuthHeaders()` utility merged into every request |
| **CSS framework** | Tailwind CSS | Tailwind CSS (retained from PRD) |
| **Component library** | shadcn/ui | shadcn/ui (retained — accessible, customisable) |

> **Why no axios?** The native `fetch` API in modern browsers and Next.js is fully capable. Removing axios reduces bundle size by ~13KB (gzipped) and eliminates a dependency. The only trade-off is file upload progress tracking, which we solve with a thin `XMLHttpRequest` wrapper used exclusively in `FileUploadForm.tsx`.

---

## 3. Design System & Tokens

### 3.1 Colour Palette

Following the design constraints — muted, neutral, earthy tones. No neon blues or vibrant purples.

```css
/* globals.css — CSS Custom Properties */

:root {
  /* --- Base neutrals (slate/charcoal range) --- */
  --color-bg-primary:       hsl(220, 14%, 96%);
  --color-bg-secondary:     hsl(220, 14%, 100%);
  --color-bg-tertiary:      hsl(220, 13%, 91%);
  --color-bg-elevated:      hsl(0, 0%, 100%);

  --color-text-primary:     hsl(220, 14%, 10%);
  --color-text-secondary:   hsl(220, 9%, 46%);
  --color-text-tertiary:    hsl(220, 9%, 64%);
  --color-text-inverse:     hsl(0, 0%, 100%);

  /* --- Accent: muted teal (not neon, not blue) --- */
  --color-accent-50:        hsl(168, 30%, 95%);
  --color-accent-100:       hsl(168, 30%, 89%);
  --color-accent-200:       hsl(168, 28%, 78%);
  --color-accent-400:       hsl(168, 26%, 50%);
  --color-accent-500:       hsl(168, 32%, 42%);
  --color-accent-600:       hsl(168, 34%, 35%);
  --color-accent-700:       hsl(168, 36%, 28%);

  /* --- Warm accent (for tags, highlights) --- */
  --color-warm-100:         hsl(30, 40%, 92%);
  --color-warm-300:         hsl(30, 38%, 72%);
  --color-warm-500:         hsl(30, 42%, 52%);

  /* --- Status colours (desaturated) --- */
  --color-success:          hsl(152, 30%, 42%);
  --color-warning:          hsl(38, 40%, 52%);
  --color-error:            hsl(0, 35%, 52%);
  --color-info:             hsl(200, 25%, 50%);

  /* --- Border & shadow --- */
  --color-border:           hsl(220, 13%, 87%);
  --color-border-focus:     var(--color-accent-400);
  --shadow-sm:              0 1px 2px hsla(220, 14%, 10%, 0.05);
  --shadow-md:              0 4px 12px hsla(220, 14%, 10%, 0.08);
  --shadow-lg:              0 8px 24px hsla(220, 14%, 10%, 0.10);
  --shadow-card:            0 2px 8px hsla(220, 14%, 10%, 0.06);

  /* --- Spacing scale (4px base) --- */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* --- Border radius --- */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* --- Typography --- */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  /* --- Transitions --- */
  --transition-fast:   150ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   300ms ease;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg-primary:     hsl(220, 14%, 10%);
  --color-bg-secondary:   hsl(220, 14%, 14%);
  --color-bg-tertiary:    hsl(220, 13%, 18%);
  --color-bg-elevated:    hsl(220, 14%, 16%);
  --color-text-primary:   hsl(220, 14%, 92%);
  --color-text-secondary: hsl(220, 9%, 62%);
  --color-text-tertiary:  hsl(220, 9%, 45%);
  --color-border:         hsl(220, 13%, 22%);
  --shadow-card:          0 2px 8px hsla(0, 0%, 0%, 0.3);
}
```

### 3.2 Typography Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `heading-1` | 36px | 700 | Page titles |
| `heading-2` | 24px | 600 | Section headers |
| `heading-3` | 20px | 600 | Card titles |
| `body-lg` | 18px | 400 | Featured text |
| `body` | 16px | 400 | Default body |
| `body-sm` | 14px | 400 | Secondary text, metadata |
| `caption` | 12px | 500 | Labels, tags, timestamps |

### 3.3 Content Type Colour Map

Each content type gets a distinct muted tag colour for badges and graph nodes:

| Type | Colour | HSL |
|---|---|---|
| Article | Slate blue (muted) | `hsl(215, 20%, 55%)` |
| YouTube | Warm terracotta | `hsl(8, 30%, 55%)` |
| Tweet | Sage grey-green | `hsl(160, 15%, 50%)` |
| PDF | Sandy amber | `hsl(35, 30%, 55%)` |
| Podcast | Dusty mauve | `hsl(280, 12%, 55%)` |
| Image | Moss green | `hsl(100, 18%, 50%)` |
| Other Link | Neutral grey | `hsl(220, 10%, 55%)` |

---

## 4. Project Initialisation

```bash
# Step 1 — Create Next.js app (inside apps/web of monorepo)
cd apps/web
npx -y create-next-app@latest . --typescript --tailwind --app --no-src-dir --use-npm

# Step 2 — Install dependencies (NO axios)
npm i @tanstack/react-query zustand
npm i @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm i framer-motion d3
npm i -D @types/d3

# Step 3 — shadcn/ui setup
npx -y shadcn@latest init
npx -y shadcn@latest add button input card badge dialog dropdown-menu toast tabs select textarea

# Step 4 — Google Font (Inter)
# Add to app/layout.tsx via next/font/google
```

### Environment Variables

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
NEXT_PUBLIC_APP_NAME=Recall
NEXT_PUBLIC_MAX_UPLOAD_MB=20
```

---

## 5. Folder Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── add/page.tsx
│   │   ├── items/[id]/page.tsx
│   │   ├── graph/page.tsx
│   │   ├── collections/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── tags/page.tsx
│   │   └── archive/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeToggle.tsx
│   ├── add-content/
│   │   ├── SourceTypePicker.tsx
│   │   ├── UrlInputForm.tsx
│   │   ├── FileUploadForm.tsx
│   │   ├── MetadataForm.tsx
│   │   └── AddContentStepper.tsx
│   ├── items/
│   │   ├── ItemCard.tsx
│   │   ├── ItemCardSkeleton.tsx
│   │   ├── ItemGrid.tsx
│   │   ├── ItemFilters.tsx
│   │   ├── ItemActions.tsx
│   │   └── ProcessingBadge.tsx
│   ├── collections/
│   │   ├── CollectionCard.tsx
│   │   └── CollectionGrid.tsx
│   ├── graph/
│   │   ├── KnowledgeGraph.tsx
│   │   ├── GraphControls.tsx
│   │   ├── GraphLegend.tsx
│   │   └── GraphTooltip.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchOverlay.tsx
│   │   └── SearchResultCard.tsx
│   ├── resurfacing/
│   │   ├── MemoryWidget.tsx
│   │   └── MemoryCard.tsx
│   ├── highlights/
│   │   ├── HighlightToolbar.tsx
│   │   └── HighlightsSidebar.tsx
│   ├── shared/
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── TagChip.tsx
│   │   ├── TagInput.tsx
│   │   ├── TypeBadge.tsx
│   │   ├── UploadProgress.tsx
│   │   └── Avatar.tsx
│   └── AddContentModal.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useItems.ts
│   ├── useSearch.ts
│   ├── useCollections.ts
│   ├── useTags.ts
│   ├── useGraph.ts
│   ├── useResurface.ts
│   ├── useHighlights.ts
│   ├── useDebounce.ts
│   ├── useKeyboardShortcut.ts
│   ├── useUploadProgress.ts
│   └── useMediaQuery.ts
│
├── lib/
│   ├── api.ts
│   ├── queryClient.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
│
├── store/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── addContentStore.ts
│
├── types/
│   ├── item.ts
│   ├── user.ts
│   ├── collection.ts
│   ├── tag.ts
│   ├── graph.ts
│   ├── highlight.ts
│   ├── resurface.ts
│   └── api.ts
│
├── styles/globals.css
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Core Library Layer

### 6.1 `lib/api.ts` — Fetch Wrapper (No Axios)

This is the **single most important difference from the PRD**.

```typescript
// lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, { ...options, headers });
  return handleResponse<T>(res);
}

export const api = {
  get:    <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post:   <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData) =>
    apiFetch<T>(url, { method: 'POST', body: formData }),
};
```

### 6.2 File Upload with Progress (XHR fallback)

The PRD uses `axios.onUploadProgress`. Since we removed axios, file uploads that need a progress bar use `XMLHttpRequest`:

```typescript
// hooks/useUploadProgress.ts
import { useState, useCallback } from 'react';

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

export function useUploadProgress() {
  const [state, setState] = useState<UploadState>({
    progress: 0, uploading: false, error: null,
  });

  const upload = useCallback(<T>(url: string, formData: FormData): Promise<T> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const token = localStorage.getItem('jwt');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setState(s => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
        }
      });

      xhr.addEventListener('load', () => {
        setState({ progress: 100, uploading: false, error: null });
        try { resolve(JSON.parse(xhr.responseText) as T); }
        catch { resolve(undefined as T); }
      });

      xhr.addEventListener('error', () => {
        setState(s => ({ ...s, uploading: false, error: 'Upload failed' }));
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${apiBase}${url}`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      setState({ progress: 0, uploading: true, error: null });
      xhr.send(formData);
    });
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null });
  }, []);

  return { ...state, upload, reset };
}
```

### 6.3 `lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
```

### 6.4 `lib/validators.ts`

```typescript
import { z } from 'zod';

export const urlSchema = z.string().url('Enter a valid URL');

export const addContentUrlSchema = z.object({
  url: urlSchema,
  itemType: z.enum(['article', 'youtube', 'tweet', 'podcast', 'link']),
  title: z.string().optional(),
  note: z.string().optional(),
  youtubeTimestamp: z.string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, 'Format: MM:SS or HH:MM:SS')
    .optional(),
  tags: z.array(z.string()).max(5).optional(),
  collectionId: z.string().uuid().optional(),
});

export const addContentFileSchema = z.object({
  itemType: z.enum(['pdf', 'image']),
  title: z.string().min(1, 'Title is required for file uploads'),
  note: z.string().optional(),
  tags: z.array(z.string()).max(5).optional(),
  collectionId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
```

---

## 7. State Management

### 7.1 `store/authStore.ts` (Zustand + Persist)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('jwt', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('jwt');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' },
  ),
);
```

### 7.2 `store/uiStore.ts`

```typescript
import { create } from 'zustand';

type ViewMode = 'grid' | 'list';
type Theme = 'light' | 'dark';

interface UIState {
  sidebarOpen: boolean;
  viewMode: ViewMode;
  theme: Theme;
  addContentModalOpen: boolean;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  openAddContent: () => void;
  closeAddContent: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  viewMode: 'grid',
  theme: 'light',
  addContentModalOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) => set({ theme }),
  openAddContent: () => set({ addContentModalOpen: true }),
  closeAddContent: () => set({ addContentModalOpen: false }),
}));
```

### 7.3 `store/addContentStore.ts`

```typescript
import { create } from 'zustand';
import type { ItemType } from '@/types/item';

type AddStep = 'type' | 'input' | 'metadata';

interface AddContentState {
  step: AddStep;
  selectedType: ItemType | null;
  url: string;
  file: File | null;
  title: string;
  note: string;
  youtubeTimestamp: string;
  tags: string[];
  collectionId: string | null;
  setStep: (step: AddStep) => void;
  setSelectedType: (type: ItemType) => void;
  setUrl: (url: string) => void;
  setFile: (file: File | null) => void;
  setTitle: (title: string) => void;
  setNote: (note: string) => void;
  setYoutubeTimestamp: (ts: string) => void;
  setTags: (tags: string[]) => void;
  setCollectionId: (id: string | null) => void;
  resetForm: () => void;
  resetForAnotherSave: () => void;
}

const initialState = {
  step: 'type' as AddStep,
  selectedType: null,
  url: '',
  file: null,
  title: '',
  note: '',
  youtubeTimestamp: '',
  tags: [],
  collectionId: null,
};

export const useAddContentStore = create<AddContentState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setSelectedType: (type) => set({ selectedType: type, step: 'input' }),
  setUrl: (url) => set({ url }),
  setFile: (file) => set({ file }),
  setTitle: (title) => set({ title }),
  setNote: (note) => set({ note }),
  setYoutubeTimestamp: (ts) => set({ youtubeTimestamp: ts }),
  setTags: (tags) => set({ tags }),
  setCollectionId: (id) => set({ collectionId: id }),
  resetForm: () => set(initialState),
  resetForAnotherSave: () => set((s) => ({
    ...initialState,
    step: 'input',
    selectedType: s.selectedType,
  })),
}));
```

---

## 8. Custom Hooks

### 8.1 `hooks/useItems.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Item, PaginatedResponse } from '@/types';

interface UseItemsOptions {
  page?: number;
  limit?: number;
  type?: string;
  tag?: string;
  source?: string;
}

export function useItems(opts: UseItemsOptions = {}) {
  const { page = 1, limit = 20, type, tag, source } = opts;
  const params = new URLSearchParams({
    page: String(page), limit: String(limit),
    ...(type && { type }), ...(tag && { tag }), ...(source && { source }),
  });
  return useQuery({
    queryKey: ['items', opts],
    queryFn: () => api.get<PaginatedResponse<Item>>(`/items?${params}`),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      url: string; itemType?: string; tags?: string[];
      collectionId?: string; note?: string; youtubeTimestamp?: string;
    }) => api.post<Item>('/items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUploadItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.upload<Item>('/items/upload', formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.patch<Item>(`/items/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['item', vars.id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}
```

### 8.2 `hooks/useSearch.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useDebounce } from './useDebounce';
import type { Item } from '@/types';

export function useSearch(query: string, type: 'semantic' | 'keyword' = 'semantic') {
  const debouncedQuery = useDebounce(query, 300);
  return useQuery({
    queryKey: ['search', debouncedQuery, type],
    queryFn: () => api.get<Item[]>(
      `/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`
    ),
    enabled: debouncedQuery.length >= 2,
  });
}
```

### 8.3 `hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### 8.4 `hooks/useKeyboardShortcut.ts`

```typescript
import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string, callback: () => void, meta = true
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaPressed = meta ? (e.metaKey || e.ctrlKey) : true;
      if (metaPressed && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, meta]);
}
```

---

## 9. Component Specifications

### 9.1 `ItemCard.tsx`

**Props:**
```typescript
interface ItemCardProps {
  item: Item;
  viewMode: 'grid' | 'list';
  onFavourite?: (id: string) => void;
  onArchive?: (id: string) => void;
}
```

**Grid mode layout:**
```
┌──────────────────────────────┐
│  ┌──────────────────────┐    │
│  │    Thumbnail /        │    │
│  │    Gradient Placeholder│   │
│  └──────────────────────┘    │
│  [Article]  · medium.com     │
│  Title of the Saved Item     │
│  Description snippet here... │
│  ┌─────┐ ┌─────┐ ┌─────┐    │
│  │ #AI │ │#web │ │#dev │    │
│  └─────┘ └─────┘ └─────┘    │
│                  2 days ago  │
│              ♡    📁    ⋮   │
└──────────────────────────────┘
```

**Behaviours:**
- Shows `ProcessingBadge` (pulsing skeleton) when `item.status === 'processing'`
- Thumbnail: `next/image` with R2 URL; fallback gradient with content type icon
- Click navigates to `/items/[id]`
- `⋮` menu: Add to Collection, Archive, Delete
- Hover: subtle lift (`translateY(-2px)`) + shadow increase

### 9.2 `Sidebar.tsx`

```
┌─────────────────────┐
│  ◆ Recall            │
│  🏠  Home            │
│  🔍  Search          │
│  ➕  Add Content     │
│  📁  Collections     │
│  🏷️  Tags            │
│  🕸️  Graph           │
│  ─────────────────   │
│  📑  Archive         │
│  ⚙️  Settings        │
│  ─────────────────   │
│  👤  User            │
│      [Sign Out]      │
└─────────────────────┘
```

- Collapsible to icon-only (64px) on desktop
- Hidden on mobile, slides in from left
- Active route highlighted with accent tint

### 9.3 `Topbar.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  ☰  │  Search...                   │  [+ Add Content]  │ 👤 │
└──────────────────────────────────────────────────────────────┘
```

### 9.4 `AddContentModal.tsx`

Full-screen dialog wrapping `AddContentStepper`. Opens via:
- `+ Add Content` button in Topbar
- `Cmd/Ctrl + K` keyboard shortcut
- Empty state CTA on dashboard

Uses `@radix-ui/react-dialog` for accessible modal with focus trap.

---

## 10. Page-by-Page Implementation

### 10.1 Landing Page — `app/page.tsx`
Static SSG page. Hero with animated gradient, feature grid, CTA to register.

### 10.2 Login — `app/(auth)/login/page.tsx`
Centred card with email + password. Google OAuth button. Uses `loginSchema`.

### 10.3 Register — `app/(auth)/register/page.tsx`
Same layout + name field. Uses `registerSchema`.

### 10.4 Dashboard — `app/(dashboard)/page.tsx`
- Memory widget (3 resurfaced items)
- Filter bar: All | Articles | Videos | PDFs | Tweets | Podcasts | Images
- View toggle: Grid / List
- `ItemGrid` with infinite scroll/pagination
- Empty state: "Save your first item" → opens Add Content

### 10.5 Item Detail — `app/(dashboard)/items/[id]/page.tsx`
Two-column: Left (70%) content/reader view; Right (30%) tags, collections, related items, actions.

### 10.6 Graph — `app/(dashboard)/graph/page.tsx`
Full-viewport D3.js force-directed graph. See Section 12.

### 10.7 Collections — `app/(dashboard)/collections/page.tsx`
Grid of `CollectionCard` components.

### 10.8 Search — `app/(dashboard)/search/page.tsx`
Full results with semantic/keyword toggle and type filters.

---

## 11. Add Content Flow (Deep Dive)

### Step 1 — Source Type Picker
Seven cards: Article, YouTube, Tweet, PDF, Podcast, Image, Other Link. Fallback URL paste at bottom.

### Step 2a — URL Input (Article, YouTube, Tweet, Podcast, Other)

| Field | Required | Notes |
|---|---|---|
| URL | Yes | Live validation |
| Title | No | Placeholder: "Leave blank to auto-detect" |
| Note | No | Multi-line textarea |
| Timestamp | No (YouTube only) | `HH:MM:SS` format |

### Step 2b — File Upload (PDF, Image)
Drag-and-drop zone, title (required), note. Progress bar via `useUploadProgress` (XHR, not axios).

### Step 3 — Tags & Collection
`TagInput` typeahead, `TagChip` removable chips (max 5), collection `<Select>`, Save + Save & Add Another buttons.

### Save Behaviour — URL
```typescript
const { mutateAsync: createItem } = useCreateItem();
await createItem({ url, itemType, tags, collectionId, note, youtubeTimestamp });
// Toast: "Saved! We're processing your content."
```

### Save Behaviour — File Upload
```typescript
const { upload, progress } = useUploadProgress();
const formData = new FormData();
formData.append('file', file);
formData.append('title', title);
formData.append('itemType', itemType);
tags.forEach(t => formData.append('tags[]', t));
await upload<Item>('/items/upload', formData);
```

---

## 12. Knowledge Graph (D3.js)

### Data Types
```typescript
interface GraphNode {
  id: string;
  label: string;
  type: ItemType;
  tags: string[];
  connectionCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: 'semantic' | 'tag';
}
```

### Implementation
1. Fetch from `GET /graph` via `useGraph` hook
2. SVG with `d3.zoom()` for pan/zoom
3. `d3.forceSimulation()` with `forceLink`, `forceManyBody`, `forceCenter`
4. Nodes: `<circle>` sized by connections, coloured by type (Section 3.3)
5. Edges: `<line>` with opacity from strength
6. Interactions: drag, hover tooltip, click → `/items/[id]`
7. Controls: zoom, cluster toggle, type filter

---

## 13. Search System

### SearchBar
- In Topbar, debounced 300ms via `useSearch`
- Results dropdown (`SearchOverlay`) with top 5
- Enter → `/search?q=...`

### Search Page
- Pre-fills from URL query
- Semantic / Keyword toggle
- Filter by type, date, tags

---

## 14. Accessibility & Responsiveness

### Accessibility
- `aria-label` and `role` on all interactive elements
- Focus trap in modals (Radix)
- Keyboard nav for dropdowns, tabs, modals
- WCAG AA contrast (4.5:1 min)
- Skip-to-content link
- `prefers-reduced-motion` respected

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| Mobile | <640px | Single column, bottom nav |
| Tablet | 640–1024px | Collapsed sidebar, 2-col grid |
| Desktop | >1024px | Full sidebar, 3–4 col grid |

---

## 15. Performance Optimisation

| Technique | Implementation |
|---|---|
| Image optimisation | `next/image` with R2 loader |
| Code splitting | `lazy()` for KnowledgeGraph + D3 |
| Virtualised lists | `@tanstack/react-virtual` for 100+ items |
| React Query caching | 2-min stale time |
| Skeleton loading | Every page has skeleton variant |
| Prefetch | `next/link` prefetch for nav links |
| Bundle analysis | `@next/bundle-analyzer` |

---

## 16. Error Handling & Loading States

### Error Boundary — `app/error.tsx`
```typescript
'use client';
export default function ErrorPage({
  error, reset
}: { error: Error; reset: () => void }) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Toast Notifications (shadcn/ui)
- Success: "Saved! We're processing your content."
- Error: "Failed to save. Please try again."
- Info: "3 items resurfaced from your memory."

---

## 17. Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | Utilities, validators, store logic |
| Component | React Testing Library | Render, events, a11y |
| Integration | Playwright | Full user flows |
| Visual | Storybook (optional) | Component variants |

---

## 18. Production Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| CDN | Vercel Edge Network |
| Error tracking | Sentry |
| Analytics | Optional |

```bash
cd apps/web && npx vercel --prod
```

---

## 19. Build Checklist

### Foundation
- [ ] Create Next.js app with TypeScript + Tailwind
- [ ] Install deps (no axios)
- [ ] Set up shadcn/ui
- [ ] Configure `globals.css` with design tokens
- [ ] Set up Inter font

### Core Library
- [ ] `lib/api.ts` — fetch wrapper
- [ ] `lib/queryClient.ts`
- [ ] `lib/validators.ts` — Zod schemas
- [ ] `lib/utils.ts` — `cn()`, dates
- [ ] `lib/constants.ts` — types, colours, routes

### Types
- [ ] All TypeScript types in `types/`

### State
- [ ] `authStore.ts` (Zustand + persist)
- [ ] `uiStore.ts`
- [ ] `addContentStore.ts`

### Hooks
- [ ] useAuth, useItems, useSearch, useCollections
- [ ] useTags, useGraph, useResurface, useHighlights
- [ ] useDebounce, useKeyboardShortcut, useUploadProgress, useMediaQuery

### Components
- [ ] Layout: Sidebar, Topbar, MobileNav, ThemeToggle
- [ ] Items: ItemCard, Skeleton, Grid, Filters, Actions, ProcessingBadge
- [ ] Add Content: Modal, Stepper, SourceTypePicker, UrlInputForm, FileUploadForm, MetadataForm
- [ ] Search: SearchBar, Overlay, ResultCard
- [ ] Collections: Card, Grid
- [ ] Graph: KnowledgeGraph, Controls, Legend, Tooltip
- [ ] Shared: EmptyState, ErrorState, TagChip, TagInput, TypeBadge, UploadProgress, Avatar

### Pages
- [ ] Landing, Login, Register
- [ ] Dashboard feed, Add Content, Item detail
- [ ] Graph, Collections, Collection detail
- [ ] Search, Tags, Archive
- [ ] 404, Error, Loading pages
- [ ] Auth middleware

### Polish
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Skeletons everywhere
- [ ] Toast notifications
- [ ] Responsive tested
- [ ] Accessibility audit
- [ ] Lighthouse >= 90
- [ ] Confirm no axios in bundle

### Production
- [ ] Deploy to Vercel
- [ ] Set production env vars
- [ ] Custom domain + SSL
- [ ] Sentry frontend
- [ ] Analytics (optional)

---

*End of Frontend Design Document — Second Brain / Recall v1.0*
