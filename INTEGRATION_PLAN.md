# Integration Plan

## Goal
Connect the existing ArenaGo frontend to the existing Supabase backend without altering the UI, components, or design language. All mock data will be replaced by live data fetched from Supabase, mapped to match the expected frontend data structures.

## 1. Pages Using Mock Data
- **Home (`src/pages/Home.tsx`)**: Uses mock `arenas`, `activityFeed`, `getPlayerBookings`, and `demoOwner`.
- **ArenaListings (`src/pages/ArenaListings.tsx`)**: Uses mock `arenas`.
- **ArenaDetail (`src/pages/ArenaDetail.tsx`)**: Uses mock `arenas` and `reviews`.
- **PlayerDashboard (`src/pages/PlayerDashboard.tsx`)**: Uses mock `arenas`, `analytics`, `getPlayerBookings`, `demoPlayer`.
- **OwnerDashboard (`src/pages/OwnerDashboard.tsx`)**: Uses mock `arenas`, `analytics`, `demoOwner`.
- **Login (`src/pages/Login.tsx`)**: Simulates login using `demoPlayer` / `demoOwner`.

## 2. Components Needing Integration
- **AuthContext (`src/context/AuthContext.tsx`)**: Currently uses hardcoded demo users. Needs to be connected to Supabase Auth (`supabase.auth.getSession`, `onAuthStateChange`, `signInWithPassword`, etc.).
- **ArenaCard (`src/components/ui/ArenaCard.tsx`)** (Indirectly): Uses data passed down from pages. We will ensure the data passed maintains the existing `Arena` type.

## 3. Supabase Tables to be Used
- `arenas`
- `bookings`
- `cities`
- `courts`
- `favorites`
- `profiles`
- `reviews`
- `sports`
- `time_slots`

## 4. Schema Mismatches & Compatibility Layer
The frontend expects a specific `Arena` type that includes fields not directly present in the Supabase `arenas` table.

**Frontend `Arena` Fields vs Supabase Schema:**
- `location.city`: Frontend expects a string. Supabase has `city_id` which links to the `cities` table. *Mapping: Join with `cities` table or create a compatibility layer to extract `cities.name`.*
- `location.area`, `location.address`, `location.coordinates`: Can be mapped from Supabase `area`, `address`, `latitude`, `longitude`.
- `images`: Frontend expects an array of URLs. Supabase has `cover_image` and `gallery`. *Mapping: Combine `cover_image` and `gallery` into a single array.*
- `sport`: Frontend expects a string. Supabase arenas don't have a direct sport, but `courts` have `sport_id`. *Mapping: Join `courts` and `sports` to find available sports for an arena, or use a default if no courts are created yet.*
- `pricing`: Frontend expects an object (`{ weekday, weekend, peak }`). Supabase has `time_slots` with `price` and `is_peak`. *Mapping: Compute pricing ranges from `time_slots` or provide a default mock object in the compatibility layer.*
- `rating`, `reviewCount`: Expected as numbers. *Mapping: Compute by aggregating the `reviews` table, or use defaults until reviews are seeded.*
- `totalBookings`, `occupancyRate`: Expected as numbers. *Mapping: Compute from `bookings` and `time_slots`, or use defaults.*
- `amenities`, `highlights`, `operatingHours`, `isPopular`, `isFeatured`: Not explicitly present in the DB schema. *Mapping: Mock these in the compatibility layer to preserve the UI design.*

**Strategy**: We will create a robust "compatibility layer" (e.g., `src/services/supabaseData.ts` or modifying `src/data/*.ts`) that fetches the raw Supabase data and transforms it into the exact TypeScript types expected by the frontend (like `Arena`, `Booking`, `Review`).

## 5. Files to be Modified
- `src/context/AuthContext.tsx`: Replace mock auth with Supabase Auth.
- `src/pages/Login.tsx`: Update login submission to use the updated AuthContext.
- `src/data/arenas.ts`: Replace static arrays with async functions fetching from Supabase (or create a `src/services/arenaService.ts` and update imports).
- `src/data/bookings.ts`: Replace static functions with Supabase queries.
- `src/data/reviews.ts`: Replace static data with Supabase queries.
- `src/data/users.ts` / `src/data/activity.ts` / `src/data/analytics.ts`: Replace with actual data queries or sensible mock data mapping if DB tables don't exist yet for these specific metrics.
- `src/pages/*.tsx`: Update components to use `useEffect` and React state to fetch data asynchronously since data will now come from network requests instead of synchronous static arrays. 

## Next Steps
1. Create the compatibility layer and data fetching services.
2. Update Auth context.
3. Refactor pages to handle asynchronous data loading (adding loading states without changing the UI design).
4. Verify the UI remains 100% identical.
