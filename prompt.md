# PROMPT.MD — SYSTEM SPECIFICATION & OPERATIONAL GUIDELINES

## Core Directive
Build, maintain, and operate the **APEX Dragon Tiger P2P Casino Platform** under strict zero-bot, zero-bonus, maximum mobile optimization, global build number visibility, and complete transparency principles.

---

## 1. Operating Rules & Constraints

1. **NO BOTS ALLOWED (`no bot allow`)**:
   - Zero automated bots, simulated opponents, or fake high-frequency bot bettors anywhere in the codebase.
   - All wagering and room matches must take place between authentic player accounts.
   - Matchmaking in 1v1 Arena (`OneOnOneArena.tsx`) creates authentic waiting rooms on `/api/rooms/create` for real peers; all bot auto-accept mocks (`ai_bot_opponent`, `TigerLord_Bot`, `DragonMaster_AI`) are strictly prohibited and removed.
   - Rate limiting and frequency detection thwart malicious scripts and automated scrapers.

2. **NO BONUSES ALLOWED (`no bonus allow`)**:
   - Zero artificial deposit matches, welcome signup bonuses, or phantom promotional balance inflations.
   - Real balance must strictly reflect 1:1 verified deposits and peer-to-peer winnings.
   - Demo balance must remain strictly separated and clearly distinguished from real funds.
   - Cosmetics, card skins, and titles are 100% free rewards earned purely through gameplay achievements without monetary bonus strings.

3. **BUILD NUMBER VISIBILITY EVERYWHERE**:
   - The active `BUILD_NUMBER` (imported from `src/config/version.ts`) must appear visibly in:
     - The **Login page footer** (`LoginScreen.tsx`).
     - The **Logged-in pages footer** (`RegulatoryFooter.tsx` via `App.tsx`).
     - The **In-game Table HUD Telemetry line** (`GameTable.tsx`).
     - The **1v1 Arena status footer** (`OneOnOneArena.tsx`).
     - The **Side Navigation Drawer** (`SideNavDrawer.tsx`).
     - The **Admin Login page footer** (`AdminLogin.tsx`).
     - The **Admin Dashboard console footer** (`AdminDashboard.tsx`).
     - The **Admin Quick Modal badge** (`AdminModal.tsx`).

4. **DIRECT 1-TAP PWA INSTALLATION & STANDALONE VISIBILITY (`Install App` / `Open App`)**:
   - Integrated `vite-plugin-pwa` with standalone Web App Manifest (`/public/manifest.json`).
   - Web App icons generated in all required formats: `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, and `apple-touch-icon.png`.
   - **Inside Installed App (`isStandalone`)**: The "Install App" button is completely hidden across all navigation headers, bottom nav, and drawer menus.
   - **In Web Browser**:
     - If the app is already installed (`isInstalled`), the button automatically displays **"Open App"** (or "অ্যাপ খুলুন") and launches the standalone app on tap.
     - If the app is not yet installed, the button displays **"Install App"** (or "ইনস্টল অ্যাপ") and executes native 1-tap installation directly with zero intermediate prompt dialogs.

5. **DEPOSIT & WALLET STABILITY (ZERO-SCROLL CASHIER)**:
   - Dedicated backend endpoints: `POST /api/wallet/deposit` and `POST /api/wallet/withdraw` alongside `POST /api/wallet/action` and `/api/wallet/transfer`.
   - Real-time balance updates with instant audio feedback (`sound.playCoinsClinking()`) and optimistic state fallbacks.
   - Strict zero-scroll cashier modal layout: clean 5-segment switcher (`Deposit`, `Withdraw`, `Transfer`, `History`, `Ledger`), compact payment method grid, and instant quick chips (`+500`, `+1,000`, `+2,500`, `+5,000`).

6. **FULL-SITE MOBILE OPTIMIZATION (`100dvh` ZERO SCROLL)**:
   - **Dynamic Viewport Height**: Root container and login screen utilize `h-[100dvh]` to eliminate mobile URL/bottom bar clipping.
   - **Game Arena Responsiveness**:
     - `ResizeObserver` dynamic card auto-scaling bounded within `[0.55, 1.15]` to ensure cards never clip or overlap on narrow mobile viewports.
     - Top bar table selector compact trigger (`max-w-[145px] sm:max-w-none`) with truncated limit range.
     - Central win/bet announcement sized responsively (`text-base sm:text-3xl`) to prevent horizontal collisions with side toolbars.
     - Top-right Iconic21 toolbar with compact `28px` minimum touch points and icon-only Lobby trigger on mobile.
     - Collapsed roadmap matrix on mobile viewports (< 1024px) by default with one-tap 📊 expander.
     - Chat input bar collapsed on mobile devices to preserve vertical table felt space and keep betting chips in thumb reach.
     - Elimination of stacked double bottom padding (`pb-12 md:pb-0` parent + `pb-14 sm:pb-2` HUD).
   - **Gesture Controls**: Touch-drag horizontal swiping between tabs with `@use-gesture/react` and Framer Motion transitions.

---

## 2. Technical Stack & Governance
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, `@use-gesture/react`, `vite-plugin-pwa`.
- **Backend**: Node.js, Express, `ws` (WebSockets), Cryptographic HMAC-SHA512.
- **Styling**: Modern dark luxury fintech aesthetic, zero pills, high-contrast gold/emerald/crimson accents.
- **Port**: 3000.
