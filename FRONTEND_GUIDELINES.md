# 📄 FRONTEND_GUIDELINES.md

**Product:** OmniRoute AI
**Purpose:** Define strict frontend design standards, component system, and development rules.
**Status:** LOCKED DESIGN SYSTEM — deviations require code review approval.
**Last Updated:** 2026-02-27

---

# 1. Design Philosophy

OmniRoute AI is a **Morphing Product Platform**.

Design must satisfy two competing goals:

1. Each industry mode feels like a completely different product.
2. Core interaction patterns remain learnable across modes.

```
Experience = Variable (layouts, dashboards, terminology)
Design Language = Constant (spacing, typography, interactions, motion)
```

Users feel transformation without confusion. Muscle memory survives mode switching.

---

# 2. Core Design Principles

### Rule 1 — Functional First

UI exists to support decision-making under movement and time pressure. Every element must answer: *"Does this help routing decisions?"*

### Rule 2 — Map is Primary Object (Isolated Render System)

Maps are operational surfaces, never decorative. They occupy dominant screen space and receive highest rendering priority.

**Map runs in an isolated rendering boundary, NOT inside the React component tree.**

React controls overlays and UI panels — never the map lifecycle.

```
Map Rendering Architecture:
- Map instance created ONCE at app boot via imperative controller
- Map is NOT destroyed during navigation, mode switch, or panel toggle
- UI communicates with map via Command Bus (events), NOT props
- Map state lives in external store (Zustand), never React state
- Overlays rendered via React Portals into map container
- Sidebar/panel state changes NEVER trigger map re-render
```

**Implementation pattern:**

```typescript
// ✅ CORRECT — Map as render island
const mapController = createMapController(); // singleton, created at boot
mapController.on('viewChange', handler);      // imperative event binding
mapController.setLayers(layerConfig);          // command bus, not props

// Overlays use portals, not map children
<MapPortal target={mapController}>
  <RouteOverlay data={routeData} />
</MapPortal>

// ❌ FORBIDDEN — Map as React child
<App>
  <Sidebar onChange={setState} />  // state change here...
  <MapComponent layers={layers} /> // ...causes re-render here
</App>
```

**Why this matters:** Without render isolation, React's cascading render model causes FPS drops, WebGL layer rebuilds, marker jitter, and memory leaks. This is the #1 failure mode of map-heavy dashboards (solved by Uber, Mapbox Studio, and Linear Maps using this exact pattern).

### Rule 3 — Information Density Scales With Role

| Role | Density | Touch Target | Navigation |
| --- | --- | --- | --- |
| Driver | Minimal (3–4 visible elements) | 48px minimum | Bottom nav + gestures |
| Operator | Medium (8–12 visible elements) | 40px | Sidebar + shortcuts |
| Admin/Analyst | High (15+ data points visible) | 36px | Full sidebar + command palette |

### Rule 4 — Zero Decorative Complexity

No ornamental borders, shadows-for-depth-illusion, or "cool-looking" elements. Every pixel exists for function.

### Rule 5 — Progressive Disclosure

Show essential information first. Reveal details on demand (expand, drawer, modal). Never overwhelm.

---

# 3. Design Tokens (LOCKED)

All styling must use tokens. No hardcoded values in component code.

---

## 3.1 Color System

### Implementation (CSS Custom Properties)

```css
/* File: packages/ui/tokens/colors.css */

:root {
  /* Neutral Base (Global — NEVER changes between modes) */
  --color-bg-primary: #0B0F14;
  --color-bg-secondary: #111827;
  --color-bg-elevated: #1A2332;
  --color-surface: #1F2937;
  --color-surface-hover: #283548;
  --color-border: #374151;
  --color-border-subtle: #1F2937;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --color-text-disabled: #4B5563;

  /* Semantic Colors (Global) */
  --color-success: #22C55E;
  --color-success-muted: rgba(34, 197, 94, 0.15);
  --color-warning: #F59E0B;
  --color-warning-muted: rgba(245, 158, 11, 0.15);
  --color-error: #EF4444;
  --color-error-muted: rgba(239, 68, 68, 0.15);
  --color-info: #3B82F6;
  --color-info-muted: rgba(59, 130, 246, 0.15);

  /* Mode Accent (set dynamically by Experience Engine) */
  --color-accent: #2563EB;        /* Default: logistics blue */
  --color-accent-hover: #1D4ED8;
  --color-accent-muted: rgba(37, 99, 235, 0.15);
}
```

### Mode Accent Colors (Only Variable Layer)

| Mode | Accent | Contrast on #0B0F14 | WCAG Rating |
| --- | --- | --- | --- |
| Logistics | `#2563EB` | 4.7:1 | ✅ AA |
| Food Delivery | `#F97316` | 7.2:1 | ✅ AAA |
| Agriculture | `#16A34A` | 4.8:1 | ✅ AA |
| Smart City | `#8B5CF6` | 5.1:1 | ✅ AA |
| Emergency | `#DC2626` | 5.3:1 | ✅ AA |
| Driver | `#06B6D4` | 6.4:1 | ✅ AAA |

> ⚠️ Accent colors change tints and focus rings ONLY. They do NOT change layout, spacing, or typography.

---

## 3.2 Contrast Validation

All text combinations must pass WCAG 2.2 AA:

| Foreground | Background | Ratio | Pass |
| --- | --- | --- | --- |
| `--text-primary` (#F9FAFB) | `--bg-primary` (#0B0F14) | 17.4:1 | ✅ AAA |
| `--text-secondary` (#9CA3AF) | `--bg-primary` (#0B0F14) | 6.8:1 | ✅ AAA |
| `--text-muted` (#6B7280) | `--bg-primary` (#0B0F14) | 4.1:1 | ⚠️ AA (large text only) |
| `--text-primary` (#F9FAFB) | `--surface` (#1F2937) | 11.2:1 | ✅ AAA |

> Do NOT use `--text-muted` for small text or interactive elements.

---

# 4. Typography System

## Font Stack

```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

| Usage | Font | Weight |
| --- | --- | --- |
| Body text, labels, buttons | Inter | 400 (regular), 500 (medium), 600 (semibold) |
| Data values, timestamps, IDs | JetBrains Mono | 400, 500 |

## Type Scale (LOCKED)

```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */

  --leading-tight: 1.2;   /* headings */
  --leading-normal: 1.5;  /* body */
  --leading-relaxed: 1.75; /* long-form content */
}
```

---

# 5. Spacing System (8pt Grid)

All layout spacing follows an 8px base grid:

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

**No arbitrary spacing values. Use tokens only.**

---

# 6. Layout Structure

## Application Shell

```
┌─ Top Navigation Bar (64px) ───────────────────────────────────┐
│  Logo │ Mode Badge │ Search (⌘K) │ Notifications │ Profile    │
├───────┬───────────────────────────────────────┬───────────────┤
│       │                                       │               │
│ Side  │         Main Canvas                   │   AI Panel    │
│ bar   │    (map + content area)               │   (360px)     │
│ 280px │                                       │               │
│       │                                       │  Collapsible  │
│ Dynamic│                                      │  context-     │
│ from   │                                      │  aware        │
│ mode   │                                      │  assistant    │
│       │                                       │               │
└───────┴───────────────────────────────────────┴───────────────┘
```

## Layout Tokens

```css
:root {
  --layout-sidebar-width: 280px;
  --layout-sidebar-collapsed: 64px;
  --layout-ai-panel-width: 360px;
  --layout-header-height: 64px;
  --layout-border-radius: 12px;
  --layout-border-radius-sm: 8px;
  --layout-border-radius-lg: 16px;
}
```

---

# 7. Component System

All components live in `packages/ui/`. Built with React 19 patterns.

---

## 7.1 Component Architecture (React 19)

```typescript
// ✅ Server Components by default (no "use client" unless needed)
// ✅ Use React 19 `use()` for async data in components
// ✅ Use `useActionState` for form mutations
// ✅ Use `useOptimistic` for immediate UI feedback
// ✅ Every component: TypeScript strict, forwardRef, accessible

// Example: Button component contract
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}
```

---

## 7.2 Buttons

| Variant | Use Case | Accent Color |
| --- | --- | --- |
| Primary | Main actions | `--color-accent` |
| Secondary | Secondary actions | `--color-surface` |
| Ghost | Tertiary, in toolbars | Transparent |
| Danger | Destructive actions | `--color-error` |

**Rules:**
- Height: 36px (sm), 40px (md), 48px (lg)
- Border radius: 10px
- Icon spacing: 8px from label
- Loading state: spinner replaces icon, text preserved
- Disabled: 50% opacity, `cursor: not-allowed`

---

## 7.3 Cards

Dashboard widgets only. Never nested more than 2 levels.

```css
.card {
  padding: var(--space-4);
  border-radius: var(--layout-border-radius);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
}
```

---

## 7.4 Tables (DataTable)

Must support:

- [x] Virtualization (TanStack Virtual for 1000+ rows)
- [x] Column sorting (client + server-side)
- [x] Column filtering
- [x] Sticky headers
- [x] Row selection (checkbox)
- [x] Keyboard navigation (arrow keys, Enter to select)
- [x] Responsive: horizontal scroll on mobile

Row height: `48px`. Header height: `40px`.

---

## 7.5 Map Container (Critical Component — Render Island)

Map rules:

- Occupies dominant screen space (never boxed or rounded)
- Allows transparent overlays (stats cards, controls)
- Map never re-renders when sidebar/panel state changes
- **Map instance is a singleton**, created once at app boot, never destroyed
- **Map lifecycle managed imperatively**, not through React props
- **All map communication via Command Bus pattern** (see Rule 2)

**Render Isolation Contract:**

```typescript
// Map store (Zustand — external to React tree)
interface MapStore {
  viewport: Viewport;
  layers: LayerConfig[];
  selectedFeature: Feature | null;
  // Imperative actions (NOT React state setters)
  panTo: (coords: LatLng) => void;
  setLayers: (layers: LayerConfig[]) => void;
  fitBounds: (bounds: BBox) => void;
}

// Command Bus events the map listens to:
type MapCommand =
  | { type: 'PAN_TO'; payload: LatLng }
  | { type: 'FIT_BOUNDS'; payload: BBox }
  | { type: 'SET_LAYERS'; payload: LayerConfig[] }
  | { type: 'HIGHLIGHT_FEATURE'; payload: string }
  | { type: 'CLEAR_SELECTION' };
```

**Z-index order:**

```
1. Base map tiles
2. Route paths (animated)
3. Stop markers (numbered)
4. Vehicle markers (real-time)
5. Cluster layers
6. Alert overlays
7. Map controls (zoom, style toggle)
8. UI overlay panels (React Portals)
```

---

## 7.6 Forms

Built with React Hook Form + Zod:

- Validation errors appear below field (not tooltip)
- Required fields marked with `*` (screen reader accessible via `aria-required`)
- Submit button disabled while submitting
- Error summary announced to screen readers via `aria-live="polite"`

---

# 8. Motion System

Animation serves three purposes only:

1. **Explain change** — what just happened (mode switch, route optimization)
2. **Guide attention** — where to look next (new alert, completed step)
3. **Show intelligence** — system working (optimization progress, quantum processing)

## Motion Tokens

```css
:root {
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 320ms;
  --duration-mode-switch: 500ms;

  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
}
```

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

> **Required.** All animations must respect `prefers-reduced-motion`.

## Forbidden Animations

❌ Bouncing / elastic motion
❌ Decorative loaders (use skeleton screens instead)
❌ Parallax scrolling
❌ Auto-playing video backgrounds

---

# 9. Morphing Experience Rules (MOST IMPORTANT)

When mode changes, the following **CAN change:**

✅ Layout structure (command center vs. fleet dashboard vs. mobile driver)
✅ Dashboard widgets (different data, different charts)
✅ Workflows (different step sequences)
✅ Icon sets (truck vs. ambulance vs. tractor)
✅ Terminology ("Delivery Route" vs. "Response Path")
✅ Accent color
✅ Map layer configurations

The following **CANNOT change:**

❌ Spacing scale
❌ Typography (font, sizes, weights)
❌ Core interaction patterns (how buttons, modals, forms work)
❌ Animation timing
❌ Keyboard shortcuts
❌ Component API surface

**User muscle memory must survive morphing.**

---

## 9.1 Experience Behavior Adapters (REQUIRED PATTERN)

Component APIs remain stable. Behavior differences across modes are injected via **Experience Adapters**, NOT conditional props.

**Problem this prevents:**

Without adapters, morphing creates mega-components with dozens of optional props → design system collapse by v2.

**Architectural rule:**

```
Component APIs = STABLE (same props interface across ALL modes)
Behavior = INJECTED via Experience Adapter layer
```

**Implementation pattern:**

```typescript
// ✅ CORRECT — Behavior Adapter pattern

// Stable component API (never changes per mode)
interface ActionButtonProps {
  label: string;
  onAction: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// Experience Adapter injects mode-specific behavior
interface ExperienceAdapter {
  mode: ExperienceMode;
  // Adapters transform BEHAVIOR, not component interfaces
  getActionBehavior: (action: string) => ActionBehavior;
  getWorkflowSteps: () => WorkflowStep[];
  getValidationRules: () => ValidationSchema;
  getDataTransform: () => DataTransformer;
}

// Usage: adapter wraps behavior, component API stays clean
const adapter = useExperienceAdapter();
const behavior = adapter.getActionBehavior('dispatch');

<ActionButton
  label={behavior.label}        // "Dispatch" vs "Deploy" vs "Send"
  onAction={behavior.handler}   // different workflow per mode
  variant="primary"             // same API always
/>

// ❌ FORBIDDEN — mode-conditional props (leads to mega-components)
<ActionButton
  isLogistics={mode === 'logistics'}
  isEmergency={mode === 'emergency'}
  showBatchOps={mode === 'logistics'}
  showPriorityFlags={mode === 'emergency'}
  // ... 20 more conditional props
/>
```

**Adapter registration:**

```typescript
// Each experience mode registers its adapter at boot
const adapters: Record<ExperienceMode, ExperienceAdapter> = {
  logistics: LogisticsAdapter,
  emergency: EmergencyAdapter,
  food_delivery: FoodDeliveryAdapter,
  agriculture: AgricultureAdapter,
  smart_city: SmartCityAdapter,
  driver: DriverAdapter,
};
```

**Rules:**

- Components NEVER import mode-specific logic directly
- All mode differences flow through adapter layer
- Adapters are the ONLY place where `if (mode === ...)` logic exists
- New modes require only a new adapter, never component changes

---

# 10. Responsive Behavior

## Breakpoints

```css
/* TailwindCSS 4 breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Adaptive Layout Rules

| Breakpoint | Sidebar | AI Panel | Map |
| --- | --- | --- | --- |
| ≥ 1280px | Full (280px) | Full (360px) | Fill remaining |
| 1024–1279px | Collapsed (64px) | Hidden (toggle) | Fill remaining |
| 768–1023px | Bottom drawer | Hidden | Full width |
| < 768px | Bottom nav (56px) | Full-screen overlay | Full screen |

## Mobile Rules (Driver Mode)

```
Bottom navigation (4 tabs max)
Full map view (edge-to-edge)
Large touch targets (48px minimum)
Swipe gestures for common actions
No hover-dependent interactions
```

---

# 11. Accessibility (WCAG 2.2 AA — Required)

### Color & Contrast

- [x] Text contrast ≥ 4.5:1 (regular text)
- [x] Text contrast ≥ 3:1 (large text, 18px+)
- [x] Non-text contrast ≥ 3:1 (icons, borders, focus rings)
- [x] Never use color alone to convey information (add icon or text label)

### Keyboard Navigation

- [x] All interactive elements focusable via Tab
- [x] Focus ring visible: `2px solid var(--color-accent)`, `2px offset`
- [x] Escape closes modals, drawers, dropdowns
- [x] Arrow keys navigate lists, tables, menus
- [x] Enter/Space activates buttons and links
- [x] Skip-to-content link on every page

### Screen Readers

- [x] All images have `alt` text
- [x] All form fields have `<label>` or `aria-label`
- [x] Dynamic content changes announced via `aria-live`
- [x] Route changes announced via `aria-live="polite"`
- [x] Modal focus trap (focus stays within modal until closed)

### Focus Management

- [x] On mode switch: focus moves to main heading
- [x] On modal open: focus moves to first interactive element
- [x] On modal close: focus returns to triggering element
- [x] On route navigation: focus moves to `<main>` heading

### Accessible Map Mode (REQUIRED)

Interactive maps are the hardest accessibility challenge. Map-heavy SaaS products increasingly face accessibility audits. Without non-visual map equivalents, the platform fails WCAG despite perfect UI elsewhere.

**Every map interaction MUST have a non-visual equivalent:**

```
Accessible Map Features:

1. List-based Navigation Mirror
   - Searchable, filterable list of all map entities
   - Each item shows: name, coordinates, status, distance
   - Selecting an item focuses the corresponding map marker
   - Same data as visual map, alternative presentation

2. Keyboard-Navigable Markers
   - Tab/Shift+Tab cycles through markers in logical order
   - Arrow keys move between nearby markers spatially
   - Enter/Space opens marker detail panel
   - Escape returns focus to map navigation mode
   - Focus ring visible on active marker (3px solid)

3. Route Summary Table
   - Tabular view of route waypoints with:
     → Stop number, name, ETA, distance from previous
     → Status (pending / active / completed)
     → Actions (skip, reorder, details)
   - Fully keyboard navigable
   - Screen reader announces row context on focus

4. Spatial Audio Cues (optional enhancement)
   - Directional audio hints for spatial orientation
   - Tone variations for entity density

5. Screen Reader Announcements
   - aria-live region for map viewport changes
   - "Showing 12 vehicles in downtown area"
   - "Route recalculated: 3 new stops added"
   - "Alert: Vehicle #7 delayed at Stop 4"

6. Focus Commands
   - "Focus nearest marker" keyboard shortcut
   - "Read map summary" announces entity counts + area
   - "List all alerts" opens accessible alert queue
```

**Implementation:**

```typescript
// Toggle between visual map and accessible list view
<MapAccessibilityToggle>
  <MapView />           {/* Visual — default */}
  <MapListView />       {/* List mirror — accessible alternative */}
  <MapTableView />      {/* Route table — accessible alternative */}
</MapAccessibilityToggle>

// Screen reader live region for map state
<div aria-live="polite" aria-atomic="false" className="sr-only">
  {mapStateAnnouncement}
</div>
```

**Legal context:** Map-heavy SaaS increasingly faces ADA/WCAG audits. This accessible map mode is a legal requirement, not an enhancement.

---

# 12. Iconography

```
Library: lucide-react@0.470+
Default size: 20px
Stroke width: 1.75
Color: currentColor (inherits text color)
```

Rules:

- Icons always accompanied by text label (toolbar tooltips count)
- Decorative icons use `aria-hidden="true"`
- Interactive icons wrapped in `<button>` with `aria-label`

---

# 13. Data Visualization

Charts (Recharts + @visx/visx):

- Prioritize readability over aesthetics
- Max 5 colors per chart
- No gradients (accessibility)
- Color-blind safe palette required
- All charts have text alternatives (`aria-label` or data table fallback)
- Responsive: charts resize with container (no fixed dimensions)

---

# 14. Loading States

| State | Component | Behavior |
| --- | --- | --- |
| Initial load | Skeleton screens | Gray animated placeholders matching final layout |
| Data fetching | Spinner (inline) | 16px spinner next to action that triggered fetch |
| Route optimizing | Progress indicator | Determinate if possible, indeterminate otherwise |
| Quantum processing | Status card | Shows job status, elapsed time, estimated remaining |
| Map loading | Placeholder + spinner | Gray map area with centered loader |

**Never show blank screens. Never show generic "Loading..." text without context.**

---

# 15. Error UI

Every error must include:

1. **What happened** — clear, human-readable message
2. **Why** — brief technical context if helpful
3. **What to do** — retry button, alternative action, or support link
4. **Fallback state** — component degrades gracefully (show stale data with "last updated" timestamp)

```typescript
// Error boundary wraps every major section independently
<ErrorBoundary fallback={<SectionErrorFallback />}>
  <FleetDashboard />
</ErrorBoundary>
```

---

# 16. Dark Mode Policy

**Dark mode = default and primary.** All design tokens defined for dark mode first.

Light mode is a future optional feature. Do not build light mode tokens until explicitly requested.

---

# 17. Performance Constraints

Performance budgets are split by loading strategy to reflect real-world constraints. Map engines (Mapbox GL / Deck.gl) are excluded from bundle budgets since they are loaded once as a separate entry point.

### Bundle Budgets

| Metric | Budget | Notes |
| --- | --- | --- |
| Core application shell | < 200KB gzipped | Router, shell, auth, design system |
| Per-experience lazy chunk | < 150KB gzipped | Mode-specific UI (dashboard, workflows) |
| Map engine | Excluded from budget | Loaded once at boot, cached aggressively |
| Shared vendor chunk | < 250KB gzipped | React, Zustand, TanStack, utilities |

### Runtime Budgets

| Metric | Budget |
| --- | --- |
| Component render | < 16ms (60fps) |
| Map layer update | < 8ms |
| Mode switch (total) | < 500ms |
| Time to Interactive (TTI) | < 3s on 4G |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |

### Loading Strategy

```
Boot sequence:
1. Core shell + router          → immediate (< 200KB)
2. Map engine                   → parallel load (separate entry)
3. Active experience chunk      → lazy import on mode select (< 150KB)
4. AI panel                     → deferred load (non-blocking)
5. Secondary experience chunks  → prefetch during idle
```

> **Reality check:** Map-heavy dashboards (Uber, Linear, Mapbox Studio) ship 400KB–1MB initial JS. Our split strategy keeps perceived performance fast while acknowledging real bundle sizes.

Rules:

- No component may trigger full re-render of map layer
- Use `React.memo` only when profiler shows unnecessary re-renders (React Compiler handles most cases in React 19)
- Use TanStack Virtual for lists > 100 items
- Images: WebP format, lazy loaded, responsive `srcSet`
- Fonts: `font-display: swap`, preloaded
- Map engine: loaded via `<script async>` or dynamic import, never in main bundle
- Experience chunks: loaded via `React.lazy()` + `Suspense` boundary

---

# 18. Testing Strategy

| Type | Tool | Coverage Target | What to Test |
| --- | --- | --- | --- |
| Unit | Vitest | 80% | Pure functions, hooks, utilities |
| Component | React Testing Library | 70% | Interactions, accessibility, state changes |
| Visual Regression | Storybook + Chromatic | Key components | Layout stability across modes |
| E2E | Playwright | Critical paths | Auth flow, route creation, mode switch |
| Accessibility | axe-core + Playwright | All pages | WCAG 2.2 AA compliance |
| Performance | Lighthouse CI | Every PR | Core Web Vitals thresholds |

---

# 19. Code Standards

```typescript
// TypeScript: strict mode, no `any`
// All components: forwardRef + accessible props
// File naming: PascalCase for components, camelCase for hooks/utils
// Max component file size: 200 lines (extract to sub-components)
// CSS: Tailwind utilities + design tokens only (no inline styles)
```

### Naming Conventions

| Type | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `FleetDashboard.tsx` |
| Hooks | useCamelCase | `useRouteOptimization.ts` |
| Utilities | camelCase | `formatDistance.ts` |
| Types | PascalCase | `RouteStop.ts` |
| Constants | SCREAMING_SNAKE | `MAX_STOPS_PER_ROUTE` |

---

# 20. Design Review Checklist

Before merge, every PR must pass:

- [ ] Spacing token used (no arbitrary px values)?
- [ ] Semantic colors only (no hardcoded hex)?
- [ ] Responsive tested at sm, md, lg, xl?
- [ ] Keyboard accessible (Tab, Enter, Escape)?
- [ ] Screen reader tested (VoiceOver or NVDA)?
- [ ] `prefers-reduced-motion` respected?
- [ ] Animation justified (explain, guide, or show intelligence)?
- [ ] Component has Storybook story?
- [ ] Error state handled?
- [ ] Loading state implemented?

---

# 21. State Ownership Model (REQUIRED)

All state must have a single, clearly defined owner. Ambiguous ownership causes state chaos at scale.

```
State Ownership Boundaries:

┌─────────────────────────────────────────────────────────────┐
│  SERVER STATE (TanStack Query)                              │
│  → API responses, route data, fleet status, user data       │
│  → Cached, deduplicated, background-refreshed               │
│  → Single source of truth for all server-derived data       │
│  → Invalidation via mutation callbacks                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MAP STATE (Zustand — External Store)                       │
│  → Viewport, layers, selected features, drawing state       │
│  → Lives OUTSIDE React tree (render island pattern)         │
│  → Only modified via Command Bus                            │
│  → Persisted across mode switches                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GLOBAL INTERACTION STATE (Zustand)                          │
│  → Current experience mode, sidebar open/closed             │
│  → AI panel state, notification queue                       │
│  → Active modal/drawer, command palette                     │
│  → Cross-component coordination                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LOCAL UI STATE (React useState / useReducer)                │
│  → Form input values, dropdown open, hover state            │
│  → Ephemeral, component-scoped                              │
│  → Never lifted to Zustand unless 2+ components need it    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  URL STATE (Router params + search params)                   │
│  → Current page, active entity ID, filter/sort params       │
│  → Shareable, bookmarkable                                  │
│  → Synced bidirectionally with Zustand on navigation        │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**

- Every piece of state has ONE owner. No duplicates across stores.
- Server state NEVER copied into Zustand (use TanStack Query selectors).
- Map state NEVER stored in React state (use external Zustand store).
- When uncertain where state belongs → default to most local scope.

---

# 22. Experience Switching State Persistence

Mode switching must NOT reset user context. Users hate losing their place.

**Persisted across mode switches:**

```
Experience State Persistence Layer:

1. Map Viewport (ALWAYS preserved)
   - Center coordinates, zoom level, rotation
   - Active layers (restored per-mode defaults + user overrides)

2. Panel States (preserved)
   - Sidebar expanded/collapsed
   - AI panel open/closed
   - Panel scroll positions

3. Workflow Progress (preserved with warning)
   - Partially completed forms → saved to draft
   - Multi-step wizard position → preserved with stale indicator
   - Unsaved changes → prompt before switch

4. Navigation Stack (preserved per-mode)
   - Each mode maintains independent navigation history
   - Returning to a mode restores last-visited page

5. Selection State (cleared with announcement)
   - Selected entities cleared (modes have different entity types)
   - Screen reader announces: "Selection cleared — switched to [mode]"
```

**Implementation:**

```typescript
// Experience state persistence store
interface ExperienceStateCache {
  // Per-mode state snapshots
  snapshots: Record<ExperienceMode, ModeSnapshot>;

  // Save current mode state before switching
  captureSnapshot: (mode: ExperienceMode) => void;

  // Restore mode state after switching
  restoreSnapshot: (mode: ExperienceMode) => void;
}

interface ModeSnapshot {
  navigationPath: string;
  scrollPositions: Record<string, number>;
  panelStates: PanelStateMap;
  draftForms: Record<string, FormData>;
  lastVisited: Date;
}
```

---

# 23. AI Panel Architecture (System Actor, Not Layout Element)

The AI Panel is a **contextual agent service**. The panel UI is just its visual surface.

**The AI Panel is NOT a chat widget.** It is a system participant that:

```
AI Panel = Contextual Agent Service

1. Awareness Layer
   - Observes current experience mode
   - Reads active route / entity context
   - Monitors user workflow position
   - Receives real-time alerts and anomalies

2. Action Layer
   - Can trigger map commands (pan, highlight, layer toggle)
   - Can pre-fill forms with suggested values
   - Can navigate user to relevant pages
   - Can execute route optimizations on behalf of user

3. Context Persistence
   - Conversation history persisted per experience mode
   - Context survives mode switches
   - Agent remembers cross-session patterns

4. Integration Points
   - Listens to: Command Bus, Experience Adapter, Route Events
   - Emits to: Map Controller, Navigation Router, Notification Queue
   - NOT limited to: chat input → text output
```

**Architectural rule:**

```typescript
// AI Panel service (headless — logic separate from UI)
interface AIAgentService {
  // Context awareness
  setContext: (ctx: AgentContext) => void;
  onModeSwitch: (mode: ExperienceMode) => void;
  onEntityFocus: (entity: Entity) => void;

  // Agentic actions (can affect application state)
  suggestAction: () => AgentSuggestion;
  executeAction: (action: AgentAction) => Promise<void>;

  // UI surface (thin layer)
  getMessages: () => AgentMessage[];
  sendMessage: (input: string) => Promise<AgentMessage>;
}

// Usage: service injected, UI is just a consumer
const agent = useAIAgent(); // service hook
<AIPanelUI agent={agent} /> // thin UI shell
```

**Rules:**

- AI logic lives in service layer, NOT in panel component
- Panel component is < 100 lines (display only)
- AI service communicates via Command Bus, like any other system actor
- Future: agent can operate headlessly (no panel open) for background tasks

---

# ✅ Outcome

Following this file guarantees:

- Consistent UX across 6 different product experiences
- WCAG 2.2 AA accessibility compliance (including interactive maps)
- Scalable team development with enforced patterns
- Sub-16ms render performance on all interactions
- Enterprise-level polish with measured quality gates
- Map renders at 60fps regardless of UI state changes
- Mode switching preserves user context and workflow progress
- AI agent participates in workflows as system actor, not just chat
- Component APIs remain stable as new experiences are added
- State ownership is unambiguous across all stores
