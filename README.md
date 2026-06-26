# ArenaGo

> Book your court. Show up and play.

A sports arena booking platform MVP for Pakistan — connecting players with football turfs, cricket nets, badminton halls, basketball courts, and more in Lahore. Built as a frontend-only prototype with hardcoded mock data.

**Live demo:** [arenago.vercel.app](https://arenago.vercel.app)

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Player | `player@arenago.com` | `play123` |
| Arena Owner | `owner@arenago.com` | `own123` |

---

## Features

### For Players
- Browse and search arenas by sport, city, and availability
- View arena details, amenities, ratings, and busy times
- Book time slots with real-time availability display
- Dashboard to manage bookings, favourites, and activity history

### For Arena Owners
- Overview dashboard with revenue stats and occupancy rates
- Manage bookings and weekly booking trends
- Analytics with revenue charts, booking heatmaps, and sport breakdown
- Slot manager to block/unblock availability per arena

### Platform
- Dark/light theme with system preference detection
- Smooth scroll and scroll-driven animations (GSAP/Lenis)
- Page transitions with Framer Motion
- WebGL aurora shader background on About page
- Fully responsive (mobile-first with bottom nav)

---

## Tech Stack

| Category | Libraries |
|----------|-----------|
| **Framework** | React 19.2, TypeScript 6.0 |
| **Build** | Vite 8.0 |
| **Routing** | React Router 7.16 |
| **Styling** | Tailwind CSS 3.4, PostCSS |
| **Animation** | Framer Motion 12.40, GSAP 3.15 + ScrollTrigger, Lenis 1.3 |
| **Charts** | Recharts 3.8 |
| **Carousel** | Embla Carousel 8.6 |
| **3D / WebGL** | OGL 1.0 (Aurora shader) |
| **Icons** | Lucide React 1.17 |
| **Dates** | date-fns 4.4 |
| **Utilities** | clsx, tailwind-merge |
| **Linting** | ESLint 10, typescript-eslint |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build   # outputs to dist/
```

Deploy the `dist` folder to any static host (Vercel preset included, no env vars required).

---

## Project Structure

```
src/
├── main.tsx                     # React root mount
├── App.tsx                      # Router, providers, error boundary
├── index.css                    # Tailwind, theme variables, button/chip system
├── types/index.ts               # All TypeScript interfaces
├── data/                        # Mock data (arenas, bookings, slots, reviews, users, analytics, activity)
├── context/                     # AuthContext, ThemeContext, BookingContext
├── hooks/                       # useLenis, useCountUp, useScrollReveal, useChartTheme
├── utils/                       # formatters.ts, chartTheme.ts
├── components/
│   ├── ui/                      # 20 reusable UI components (Btn, ArenaCard, SlotGrid, etc.)
│   ├── layout/                  # Navbar, Footer, DashboardLayout, MobileBottomNav, etc.
│   └── sections/                # Landing page sections (Hero, FeatureShowcase, HowItWorks, etc.)
└── pages/                       # 10 route pages
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Marketing site with hero, features, testimonials, CTA |
| `/home` | Home | Signed-in user dashboard |
| `/about` | About | Company vision, values, creator profiles |
| `/arenas` | ArenaListings | Search, filter, sort arenas |
| `/arenas/:slug` | ArenaDetail | Arena info, reviews, slot booking |
| `/booking/confirmed` | BookingConfirmed | Success page after booking |
| `/dashboard/player/*` | PlayerDashboard | Player stats, bookings, favourites, activity |
| `/dashboard/owner/*` | OwnerDashboard | Owner analytics, bookings, arenas, slot manager |
| `/login` | Login | Role switcher with demo account pre-fill |

---

## Design System

- **Colors:** Sports-field metaphor — `ground`, `turf`, `chalk`, `lime` (primary accent), `amber`, `slate`, `mist`
- **Typography:** Bebas Neue (display), DM Sans (body), JetBrains Mono (mono/times)
- **Buttons:** `.arena-btn` system with three variants — primary, outline, inverse; asymmetrical morph hover (slow in, fast out)
- **Animations:** Page transitions via AnimatePresence, scroll reveals via whileInView, GSAP pinning for feature sections, horizontal scroll for How It Works

---

## License

MIT
