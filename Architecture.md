# APEX CASINO — ARCHITECTURE.MD

## 1. High-Level Architectural Vision
APEX Casino is a full-stack, real-time gaming exchange designed for high concurrent throughput, transparent player-to-player matchmaking, and zero-trust provably fair verification.

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React 19 + TypeScript + Tailwind CSS + Framer Motion       │
│  ├── GameTable (Live Canvas, Smart Chips, Auto Bet Engine)  │
│  ├── OneOnOneArena & P2PLobby (100% Real P2P Duels)         │
│  ├── WalletModal (Zero-Scroll Cashier, Deposit, Transfer)   │
│  ├── MobileBottomNav & Responsive 100dvh Viewport Shell    │
│  ├── PWA Engine (vite-plugin-pwa, 1-Tap Home Screen Install)│
│  └── AdminDashboard (God-Mode Management Console)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket (Port 3000)
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Server                       │
│  Express.js + ws Native WebSocket Server (server.ts)        │
│  ├── REST API Gateway (/api/auth, /api/wallet/deposit, etc) │
│  ├── WebSocket Broadcast Engine (1s High-Frequency Tick)    │
│  ├── Provably Fair HMAC-SHA512 Engine                       │
│  ├── Real-Player P2P Matchmaking State Machine              │
│  └── In-Memory Auditable Ledger + Anti-Spam Gate            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Tenets

1. **Zero Bots (`no bot allow`)**:
   - The platform strictly facilitates real human versus real human competition.
   - Algorithmic bot wagering, simulated opponents, and mock bot auto-acceptors (`ai_bot_opponent`, `TigerLord_Bot`, `DragonMaster_AI`) are barred and purged.
   - P2P matchmaking queues authentic challenges until a real peer accepts.
   - Anti-spam frequency limiters protect room matchmaking from automated abuse.

2. **Zero Bonuses (`no bonus allow`)**:
   - No misleading deposit bonuses or fictitious promo credits exist in the accounting ledger.
   - Real funds are 100% matched to verified customer capital.
   - Demo balance is segregated and isolated from real balance.
   - Cosmetics, titles, and card backs are 100% free earned through genuine gameplay hands.

3. **Build Number Everywhere (`show build number everywhere footer`)**:
   - Version tracking (`BUILD_NUMBER`) is rendered in all page footers, including:
     - Public Login page footer (`LoginScreen.tsx`)
     - Logged-in Regulatory footer on all pages (`RegulatoryFooter.tsx` via `App.tsx`)
     - In-game Table HUD Telemetry line (`GameTable.tsx`)
     - 1v1 Arena status footer (`OneOnOneArena.tsx`)
     - Side Navigation Drawer footer (`SideNavDrawer.tsx`)
     - Admin Login footer (`AdminLogin.tsx`)
     - Admin Dashboard status bar (`AdminDashboard.tsx`)
     - Admin Quick Modal badge (`AdminModal.tsx`)

4. **Mobile Responsive Architecture (`100dvh` Zero-Scroll)**:
   - Clean viewport-adaptation with zero vertical scrollbars on mobile (`100dvh` dynamic viewport height).
   - `ResizeObserver` monitors game table dimensions and applies dynamic scaling `[0.55, 1.15]` to ensure cards never clip or overlap on narrow mobile screens.
   - Top table selector (`max-w-[145px] sm:max-w-none`), announcement (`max-w-[34%]`), and Iconic21 toolbar (`28px` minimum targets) prevent horizontal collisions.
   - Collapsible roadmap widgets start closed on mobile (< 1024px) to preserve felt space, toggleable via `📊`.
   - Single bottom padding offset (`pb-12 md:pb-0`) prevents stacked double padding above fixed `MobileBottomNav`.
   - `@use-gesture/react` touch drag swipe navigation with direction-aware slide-in transitions.

5. **1-Tap PWA Installation**:
   - Web App Manifest configured for standalone fullscreen mobile gameplay (`id: '/'`, `display: 'standalone'`).
   - `usePWAInstall` captures browser `beforeinstallprompt` to launch native 1-tap app install prompt from Navbar, Drawer, or Mobile Bottom Navigation.
   - `InstallAppModal` provides comprehensive iOS Safari and browser-specific home screen installation guides.

6. **Resilient Cashier Engine**:
   - Dedicated REST endpoints (`/api/wallet/deposit`, `/api/wallet/withdraw`, `/api/wallet/transfer`, `/api/wallet/action`) handle atomic deposits, withdrawals, and direct peer transfers.
   - Redesigned zero-scroll Cashier dialog with quick amount chips (`+500`, `+1,000`, `+2,500`, `+5,000`), tactile sounds (`sound.playCoinsClinking()`), and optimistic state fallbacks.
   - Immutable public transaction hashing provides auditable transparency across all account balance changes.
