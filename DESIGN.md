# ArenaGo — Design Document

## 1. Project Overview

ArenaGo is a sports arena booking platform for Lahore, Pakistan. It serves two user roles: **players** who discover and book time slots at sports venues, and **arena owners** who manage their venues, bookings, and promotions. The design philosophy is bold, high-contrast, and sports-forward — intentionally dark-first with a neon-lime accent system that reads as fast, energetic, and professional.

---

## 2. Design System

### 2.1 Color Tokens

Colors are defined as CSS custom properties on `:root` and toggled via `[data-theme]` attributes. All Tailwind classes (`bg-ground`, `text-chalk`, etc.) map to these variables using `rgb(var(--color-*))` syntax, enabling seamless dark/light switching without re-rendering.

| Token | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `ground` | `#0A0A0A` | `#F7F5F0` | Page background |
| `turf` | `#1A1F1A` | `#EBF0E6` | Sidebar, card backgrounds, footer |
| `chalk` | `#F5F0E8` | `#121818` | Primary text, headings |
| `lime` | `#C8FF00` | `#628C00` | Primary accent — CTAs, active states, highlights |
| `lime-btn` | `#C8FF00` | `#A8D600` | Button background (slightly adjusted for light) |
| `amber` | `#FF9500` | `#CC6600` | Secondary accent — warnings, peak hours, trending badges |
| `slate` | `#2E3A2E` | `#E4EBE0` | Card surface, input backgrounds |
| `mist` | `#8A9A8A` | `#566556` | Secondary text, labels, placeholders |
| `line` | `#1F2B1F` | `#CDD8CD` | Borders, dividers |
| `booked` | `#FF4444` | `#D22D2D` | Unavailable slots |
| `pending` | `#FF9500` | `#CC6600` | Pending/in-progress states |
| `success` | `#00D46A` | `#009650` | Confirmation, completed states |
| `on-lime` | `#0A0A0A` | `#0A0A0A` | Text on lime-colored surfaces |

**Special utility tokens:**
- `nav-scrim` — frosted background for the sticky navbar
- `shimmer-mid` — midpoint color for skeleton loading animations
- `scrollbar-thumb` / `scrollbar-track` — custom scrollbar coloring (themed)

### 2.2 Typography

Three font families compose the type system, loaded from Google Fonts:

| Family | Variable | Role |
|---|---|---|
| **Bebas Neue** | `font-display` | Hero headings, section titles, stat numbers, card names — all-caps, high impact |
| **DM Sans** | `font-body` | Body text, labels, navigation, UI copy — neutral and readable |
| **JetBrains Mono** | `font-mono` | Tags, prices, times, slot IDs, status indicators — technical, data-driven |

**Scale usage:**
- Hero headings: `clamp(2.8rem, 10vw, 7rem)` — fluid scaling across viewports
- Section headings: `clamp(2rem, 7vw, 5rem)` — proportionally sized
- Arena names on cards: `text-[22px]` to `text-[26px]`
- Body copy: `text-[15px]`, line-height `1.65`
- Labels and metadata: `text-[13px]` (mist), `text-xs` (mono)
- Micro labels / tags: `text-[10px]` to `text-[11px]` uppercase tracked mono

**Text effect:**
- `.text-stroke-lime` — outlined/hollow text using `-webkit-text-stroke` with `color: transparent`. Used in the hero section for the word "PLAY."

### 2.3 Spacing & Layout

- Max content width: `max-w-7xl` (80rem) with `px-4 md:px-8` horizontal padding
- Base border radius: `rounded-sm` (4px) throughout — cards, buttons, inputs
- Dashboard sidebar: `w-60` (240px) desktop, `lg:w-72` (288px) at large breakpoint
- Section vertical rhythm: `py-20` standard, `py-12 lg:py-0` for hero

### 2.4 Surface Hierarchy

```
ground (background)
  └── turf (sidebar, footer, section alternates)
        └── slate (cards, inputs, stat blocks)
              └── line (borders, dividers)
```

This three-level depth creates natural visual layering without shadows being the primary separator. Shadows are used sparingly for modals and drawers: `shadow-[0_4px_12px_rgba(0,0,0,0.3)]`.

---

## 3. Component Library

### 3.1 Btn / BtnLink / BtnMorphLabel

**File:** `src/components/ui/Btn.tsx` + `src/index.css` (`.arena-btn`)

Three variants, one underlying class system:

| Variant | Appearance | Usage |
|---|---|---|
| `primary` | Lime background, dark text | Main CTAs: "Book Now", "Sign Up", "Confirm Booking" |
| `outline` | Transparent, lime border + text | Secondary actions: "View Details", "View Schedule" |
| `inverse` | Dark background, lime text (dark) / chalk text (light) | Contrast use on light sections |

**Shape variants:** `default` (5px radius), `attached-right` (0px left radius for grouped buttons).

#### The Asymmetric Border-Radius Morph Effect

This is the signature button interaction in ArenaGo. The trick is an intentional asymmetry between hover-in and hover-out transitions:

**Resting state** — the button carries this `transition` definition:
```css
border-radius: 5px;
transition:
  border-radius 0.3s cubic-bezier(0.25, 1, 0.5, 1),
  filter 0.2s ease,
  background-color 0.2s ease;
```

**On hover** — the `:hover` rule **replaces** the transition, omitting `border-radius` entirely:
```css
.arena-btn:hover {
  filter: brightness(1.05);
  transition:
    filter 0.4s ease,
    background-color 0.4s ease;
}
```

Because there is no `border-radius` in the hover transition list, when the button receives a hover class that sets `border-radius: 9999px` (pill shape), the browser snaps the radius **instantly** (no transition). When the cursor leaves, the resting state's transition re-applies, and the radius morphs **slowly back** to `5px` over `0.3s` with `cubic-bezier(0.25, 1, 0.5, 1)`.

**Result:** hover-in feels instant and snappy (the pill shape appears immediately), hover-out feels slow and elastic (the rectangle shape eases back). This asymmetry is the entire effect — no JavaScript, no animation library, just CSS transition timing manipulation.

The same mechanic applies to `.btn-day` (date picker chips) and `.btn-chip` (sport filter chips), which use `cubic-bezier(0.34, 1.25, 0.64, 1)` (spring overshoot) for their radius morph on hover-in.

**`BtnMorphLabel`** uses the `.arena-btn--in-group` modifier — a `<span>` inside a `group` parent `<Link>`. The parent card is the actual click target, but the label span still morphs on `.group:hover` via the same asymmetric pattern, making the pill effect work on the trending card "Book Now" label without nesting interactive elements.

**Additional interaction states:**
- Active/pressed: `filter: brightness(0.95)` for tactile press feedback
- Focus-visible: `outline: 2px solid lime`, `outline-offset: 3px`
- `@media (prefers-reduced-motion)`: All transition durations set to `0.01ms`

### 3.2 ArenaCard

**File:** `src/components/ui/ArenaCard.tsx`

Three visual variants for different contexts:

| Variant | Context | Layout |
|---|---|---|
| `listing` (default) | Arena listings grid | Vertical card with full image, amenity bar, two CTA buttons. Hover lifts with lime shadow. |
| `carousel` | Featured arenas carousel | Taller card (220px image), minimal metadata, single CTA. Used inside `ArenaSpotlight`. |
| `trending` | Home trending row | Horizontal landscape card (280px–350px × 200px), image-first with text overlay gradient. The entire card is a `<Link>`. |

All variants show: arena image, `SportTag`, name, location, rating, pricing from PKR.
`listing` and `carousel` also show `OccupancyBar` and review count.

### 3.3 SportTag

**File:** `src/components/ui/SportTag.tsx`

Mono-font uppercase pill with sport-specific accent colors:

| Sport | Color |
|---|---|
| Football / Futsal | Lime |
| Cricket | Amber |
| Badminton | `#00B4D8` (cyan) |
| Basketball | `#FF6B35` (orange) |
| Tennis | `#F7DC6F` (yellow) |
| Padel | `#C39BD3` (mauve) |
| Squash | Mist |

Three sizes: `sm` (10px), `md` (12px), `lg` (14px). Background uses `bg-ground/70 backdrop-blur-sm` so it works over both images and solid surfaces.

### 3.4 SlotGrid

**File:** `src/components/ui/SlotGrid.tsx`

Renders a grid of 80×40px time-slot buttons. Visual states:

| State | Style |
|---|---|
| Available | Lime border, lime text on slate background |
| Selected | Solid lime background, dark text, `scale(1.05)` |
| Booked/Blocked | Red tint background, strikethrough text, disabled |
| Pending | Amber border, reduced opacity |
| Peak | Amber left border accent (3px) |

Selected state uses `border-radius: 10px` vs `4px` for unselected — transition via `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot). Focus state: 2px lime outline.

### 3.5 StatCard

**File:** `src/components/ui/StatCard.tsx`

Dashboard metric card on `bg-slate`, `rounded-sm`, `p-5`.
- Value: `font-display text-display-md text-lime`
- Optional unit: inline in `font-body text-mist`
- Label: `text-[13px] text-mist`
- Optional trend: `TrendingUp` (lime) or `TrendingDown` (amber) with percentage in mono

### 3.6 OccupancyBar

**File:** `src/components/ui/OccupancyBar.tsx`

Thin progress bar showing arena occupancy. Color transitions from lime (low) to amber (high > 70%). Used in `ArenaCard` (listing variant).

### 3.7 PeakHoursChart

**File:** `src/components/ui/PeakHoursChart.tsx`

Recharts-based bar chart showing hourly booking density on arena detail pages. Styled to match the design system via `useChartTheme` hook which supplies theme-aware colors.

### 3.8 ArenaGoLogo

**File:** `src/components/ui/ArenaGoLogo.tsx`

Theme-aware logo component. Uses `ArenaGoIconB.png` (dark logo) in dark mode and `ArenaGoIconW.png` (light logo) in light mode. Text: "ARENA" in chalk + "GO" in lime, `font-display`. Accepts `iconSize` and `textSize` props for use at different scales across the app.

### 3.9 ThemeToggle

**File:** `src/components/ui/ThemeToggle.tsx`

Icon-only button (9×9 default). Shows `Sun` icon (lime) in dark mode, `Moon` icon in light mode. Styled as `bg-slate/60 border-line`, hover `border-lime/40`. Full keyboard focus support with 2px lime outline.

### 3.10 CountUp

**File:** `src/components/ui/CountUp.tsx`

Animated number counter using `react-countup`. Triggered once on mount. Used in `HeroSection` and `AuthSidebar` for stats (players, arenas, bookings).

### 3.11 Aurora

**File:** `src/components/ui/Aurora.tsx`

Custom WebGL shader-based animated aurora effect using the `ogl` library. Renders a GLSL simplex noise fragment shader that produces an organic, flowing color wave. Used on the `About` page as a background visual. Accepts `colorStops` (3-stop gradient), `amplitude`, `blend`, and `speed` props. Transparent background — composited over page content.

---

## 4. Layout System

### 4.1 Navbar

**File:** `src/components/layout/Navbar.tsx`

Fixed top navigation, `z-50`, `h-14/h-16`. Two states:
- **Transparent**: Used on Landing — no background until scroll
- **Scrolled/Solid**: `bg-nav-scrim backdrop-blur-md border-b border-line` applied once `scrollY > 40px`

**Desktop:** Logo left, flat text links center (`text-[14px] font-body font-semibold`), right side: ThemeToggle + auth actions + "Book Now" CTA. Active route indicated by a 4px lime dot below the link (`w-1 h-1 bg-lime rounded-full`).

**Mobile:** Logo left, ThemeToggle + `PillNav` hamburger right. Opening the hamburger reveals a full-width frosted-glass popover anchored just below the header. The popover uses `bg-[rgb(18_24_18)]`, `border border-[rgba(200,255,0,0.12)]`, `rounded-2xl`, and `shadow-[0_24px_60px_rgba(0,0,0,0.7)]`. GSAP animates the popover open/close and the hamburger → X morphing.

### 4.2 PillNav

**File:** `src/components/layout/PillNav.tsx`

Custom GSAP-animated pill navigation. Each nav item has a circular "bubble" element absolutely positioned below it. On hover, the circle scales up (using the circle-morphing illusion where a large circle's edge creates a pill fill), and the label morphs out while a duplicate label morphs in from below. The animation uses a pre-computed GSAP timeline that tweens to its end on hover-enter and back to start on hover-leave. Supports active state, controlled close via `forceClose` prop, and emits open/close via `onToggle`.

### 4.3 DashboardLayout

**File:** `src/components/layout/DashboardLayout.tsx`

Two-column layout for authenticated dashboards:

- **Desktop sidebar** (`md:flex`): Fixed `w-60/w-72`, `bg-turf border-r border-line`. Contains logo, user avatar/name/role, nav links with lime left-border active indicator, and logout at bottom.
- **Mobile tab bar** (below `md`): Fixed bottom strip with abbreviated link labels.
- **Main content**: `md:ml-60 lg:ml-72`, padded `p-4 sm:p-6 md:p-8 lg:p-10`, `pb-24 md:pb-10` to clear bottom nav on mobile.
- Active link: `border-l-2 border-lime text-chalk bg-slate/50`. Inactive: `text-mist hover:text-chalk`.

### 4.4 AuthSidebar

**File:** `src/components/layout/AuthSidebar.tsx`

Full-height left panel on auth pages (Login, Signup, CompleteProfile). Hidden on mobile (`hidden md:flex`). Contains a full-bleed Unsplash background image with a `bg-gradient-to-r from-ground/90` overlay. Shows the ArenaGoLogo at top, a tagline copy string in the middle, and three CountUp stats at the bottom.

### 4.5 PageWrapper

**File:** `src/components/layout/PageWrapper.tsx`

Framer Motion wrapper applied to most pages. Entry: `opacity: 0, y: 16 → opacity: 1, y: 0`. Exit: `opacity: 1, y: 0 → opacity: 0, y: -8`. Duration `0.45s`, easing `[0.22, 1, 0.36, 1]` (custom ease-out). Provides consistent page transitions as `AnimatePresence` swaps routes in `App.tsx`.

### 4.6 MobileBottomNav

**File:** `src/components/layout/MobileBottomNav.tsx`

Global fixed bottom nav visible only on `md:hidden` when the user is on player-facing routes (`/home`, `/arenas/*`, `/booking/*`, `/dashboard/player/*`). Four items: Home, Arenas, Book, Profile — each with a Lucide icon and a 10px label. Active state uses `text-lime` with increased `strokeWidth`.

### 4.7 Footer

**File:** `src/components/layout/Footer.tsx`

Four-column grid (`md:grid-cols-4`): brand/tagline, Platform links, Company links, Sports links. Bottom row: copyright left, social links right. Background `bg-turf border-t border-line`. All link text in `text-[13px] text-mist hover:text-chalk`.

---

## 5. Page Designs

### 5.1 Landing (`/`)

Full marketing page. Sections in order:

1. **HeroSection** — full-viewport, `grid-bg` dot-grid background, ghosted "ARENAGO" watermark text at `text-[20vw] text-chalk/[0.03]`. Left: animated staggered headings, subtitle, two CTAs, three CountUp stats separated by `border-t border-line`. Right (desktop only): three floating `motion` cards with continuous `y` oscillation.
2. **TrustMarquee** — `react-fast-marquee` scrolling strip of trust/feature badges.
3. **FeatureShowcase** — pinned scroll section with GSAP ScrollTrigger. Tabs through platform features with live demo components (SlotGrid, ArenaCard).
4. **HowItWorks** — numbered step-by-step section with scroll-reveal animations.
5. **LiveActivityFeed** — real-time-style activity ticker showing recent bookings.
6. **ArenaSpotlight** — `embla-carousel-react` horizontal carousel of featured arenas. Adjacent cards scale to `0.93` and drop to `0.6` opacity. Custom animated scrollbar below.
7. **SportCategories** — grid of sport filter chips with scroll-reveal.
8. **Testimonials** — `ReviewCard` grid with scroll-reveal entrance.
9. **CtaSection** — full-width dark CTA block with CountUp stats and dual CTAs.

### 5.2 Arena Listings (`/arenas`)

Navbar + `PageWrapper`. Filter bar with sport chips (`btn-chip` style) and `SortDropdown`. Responsive grid of `ArenaCard` (listing variant). Fetches from Supabase.

### 5.3 Arena Detail (`/arenas/:slug`)

- Full-bleed hero image (`h-[300px] md:h-[500px]`) with share/favourite action buttons.
- Four-slot image thumbnail strip below the hero for gallery navigation.
- Two-column layout (`lg:grid-cols-[65%_35%]`):
  - **Left**: description, amenity icon grid (8 items, dimmed if unavailable), `PeakHoursChart`, player reviews with `ReviewCard`.
  - **Right (sticky)**: booking panel — 7-day date picker (`btn-day` chips), `SlotGrid`, total price summary, "Confirm Booking" CTA.
- On mobile, the booking panel renders inline above the amenities.
- `BookingSteps` drawer slides in over the page when slots are selected.

### 5.4 Booking Flow (`/booking`)

Multi-step booking flow using `BookingContext` for state. Rendered inside `BookingSteps` drawer component.

### 5.5 Booking Confirmed (`/booking/confirmed`)

Success state page with confirmation details.

### 5.6 Player Dashboard (`/dashboard/player/*`)

`DashboardLayout` with role `player`. Sub-routes:
- **Home** — stats grid (`StatCard`), upcoming bookings, trending arenas
- **Bookings** — full booking history table with status filters
- **Profile** — editable profile fields

### 5.7 Owner Dashboard (`/dashboard/owner/*`)

`DashboardLayout` with role `owner`. Sub-routes:
- **Home** — revenue stats, occupancy overview, recent bookings
- **Bookings** — owner's incoming booking management
- **Campaigns** — promotions/discounts management
- Analytics includes `PeakHoursChart` and `StatCard` grids

### 5.8 Auth Pages (`/login`, `/signup`, `/complete-profile`)

Split-screen layout: `grid md:grid-cols-[55%_45%]`.
- Left: `AuthSidebar` (hidden on mobile)
- Right: `bg-ground`, centered form with max-width `max-w-md`

Form inputs: `bg-slate border-line focus:outline-lime`. Error states animate the submit button to `bg-booked` with a timed reset.

### 5.9 About (`/about`)

Uses the `Aurora` WebGL background component and `ProfileCard` components for the team section.

---

## 6. Interaction Patterns

### 6.1 Scroll Animations
`useScrollReveal` hook wraps `react-intersection-observer`. Sections animate from `opacity: 0, y: 32` to `opacity: 1, y: 0` at `0.1` threshold. Transition: `0.7s ease [0.22, 1, 0.36, 1]`.

### 6.2 Page Transitions
Framer Motion `AnimatePresence` in `App.tsx` wraps all routes via `PageWrapper`. Mode `wait` ensures the exiting page finishes before the entering page begins.

### 6.3 Smooth Scroll
`useLenis` hook initializes Lenis for momentum-based smooth scrolling globally. GSAP ScrollTrigger is used for the `FeatureShowcase` section's pin-and-scrub behavior.

### 6.4 Booking Drawer
`BookingSteps` renders as a fixed overlay drawer (slide-up from bottom on mobile, side panel on desktop) using Framer Motion `AnimatePresence`. Controlled by `BookingContext` which tracks selected arena, selected slots, and booking step state.

### 6.5 Skeleton Loading
`.skeleton-shimmer` utility class applies a CSS `background` gradient animation from `slate → shimmer-mid → slate` over 1.5s for loading placeholder states.

---

## 7. Theme System

**File:** `src/context/ThemeContext.tsx`

- Default theme is resolved from `localStorage` key `arenago-theme`, falling back to `prefers-color-scheme`.
- Theme is applied by setting `data-theme` attribute on `<html>` and `colorScheme` style.
- A blocking inline script in `index.html` applies the stored theme before React mounts to eliminate flash of wrong theme (FOUT).
- Favicons also switch: `favicon-dark.png` in dark mode, `favicon-light.png` in light mode — toggled by the same inline script.
- All transitions between themes animate smoothly via `body { transition: background-color 0.25s ease, color 0.25s ease }`.

---

## 8. Custom Scrollbar

Styled globally in `src/index.css`:
- Width: 12px with 3px border creating a floating-thumb effect
- Track: `scrollbar-track` token (near-black in dark, light green-gray in light)
- Thumb: `scrollbar-thumb` token (lime in dark, dark lime in light)
- Hover: `scrollbar-thumb-hover` token (brighter lime)
- Firefox: `scrollbar-width: thin` + `scrollbar-color`

---

## 9. Utility Patterns

| Class | Description |
|---|---|
| `.grid-bg` | Subtle 40×40px dot-grid overlay using `linear-gradient` lines at `opacity: 0.15` |
| `.noise-overlay::after` | SVG fractalNoise pseudo-element at `opacity: 0.04` for texture on `bg-turf` sections |
| `.play-grid-bg` | Dense grid pattern used on booking/schedule views |
| `.bg-nav-scrim` | Themed frosted navbar background |
| `.bg-overlay-scrim` | Themed overlay for modals/drawers |
| `cn()` | `clsx` + `tailwind-merge` utility from `src/utils/formatters.ts` |
| `formatPKR()` | Formats numbers as Pakistani Rupees (₨ 3,200) |
| `formatTime()` | Formats 24h time strings for display |

---

## 10. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 + custom CSS (`index.css`) |
| Routing | React Router DOM 7 (lazy-loaded routes) |
| Animation | Framer Motion 12, GSAP 3 (ScrollTrigger, pill nav, hamburger) |
| Scroll | Lenis 1.3 (smooth scroll), GSAP ScrollTrigger (section pin) |
| Carousel | Embla Carousel React |
| Charts | Recharts 3 |
| WebGL | OGL (Aurora background on About page) |
| Icons | Lucide React |
| Backend | Supabase (auth, database, realtime) |
| HTTP Client | `@supabase/supabase-js` |
| Date Utils | date-fns 4 |
| Marquee | react-fast-marquee |
| Misc | clsx, tailwind-merge, react-countup, react-intersection-observer |
