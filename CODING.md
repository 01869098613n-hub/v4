# APEX CASINO — CODING ARCHITECTURE & FRONTEND STANDARDS

## 1. Overview
APEX Dragon Tiger is an enterprise-grade, high-frequency Peer-to-Peer (P2P) live gaming and cashier exchange. The system is engineered as a Vite + React + Express full-stack single-page application (SPA) with native WebSocket real-time event broadcasting, cryptographic Provably Fair verification, and Progressive Web App (PWA) native installation.

---

## 2. Directory Layout & Source Tree
```text
/
├── server.ts                       # Express backend server with WebSocket server & game loop
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── App.tsx                     # Top-level state coordinator, routing, modals, & footer
│   ├── index.css                   # Global Tailwind CSS directives & custom styling
│   ├── config/
│   │   └── version.ts              # Global build constants & active BUILD_NUMBER
│   ├── types/
│   │   └── index.ts                # TypeScript interface definitions & data contracts
│   ├── utils/
│   │   ├── audio.ts                # HTML5 Audio + SpeechSynthesis voice manager & SFX
│   │   ├── currency.ts             # Exchange rate converter & multi-currency formatter
│   │   ├── usePWAInstall.ts        # Hook managing beforeinstallprompt & 1-tap installation
│   │   └── useSoundManager.ts      # Custom React hook for ambient audio & SFX
│   └── components/
│       ├── Navbar.tsx              # Double-row optimized responsive header & wallet summary
│       ├── MobileBottomNav.tsx     # Fixed bottom navigation bar for mobile devices
│       ├── SideNavDrawer.tsx       # Comprehensive drawer for audio, language, & shortcuts
│       ├── GameTable.tsx           # Live Dragon Tiger card table, Smart Chips grid, & Auto Bet Engine 2.0
│       ├── OneOnOneArena.tsx       # 1v1 P2P duel lobby, private rooms, & active duel table (100% human P2P)
│       ├── P2PLobby.tsx            # P2P challenges and multiplayer room matching
│       ├── WalletModal.tsx         # Redesigned zero-scroll Cashier (Deposit, Withdraw, Transfer, Ledger)
│       ├── LoginScreen.tsx         # Authentication screen with zero-scroll 100dvh layout & Build Number footer
│       ├── AdminDashboard.tsx      # God-mode admin console with user management & ledger auditing
│       ├── AdminLogin.tsx          # Dedicated admin authentication gate with build number
│       ├── AdminModal.tsx          # Quick admin parameter overlay with build number badge
│       ├── UserProfileModal.tsx    # Cosmetics, frames, card skins, ELO rank, & user stats (100% free earned)
│       ├── Leaderboard.tsx         # High rollers, ELO rankers, & daily streak rankings
│       ├── RegulatoryFooter.tsx    # Official licenses, SSL badges, & build number display
│       └── ...                     # Additional utility modals
├── Architecture.md                 # System architecture & high-level component blueprint
├── CODING.md                       # Coding standards and frontend guidelines
├── CODING_LOGIC.md                 # Data flow and automated strategy logic
├── FULL_CODEBASE_BLUEPRINT.md      # Exhaustive codebase file-by-file blueprint
├── prompt.md                       # Operational prompt & system rules
├── STRATEGY.md                     # Casino betting strategies & risk management
├── SYSTEM_CODING_LOGIC.md          # Server-client synchronization & state machine logic
└── TECHNICAL_BLUEPRINT.md          # Cryptographic RNG, matchmaking, & protocol specs
```

---

## 3. Strict Development Rules

1. **Zero Bots Allowed (`no bot allow`)**:
   - Automated simulated bots are prohibited across the entire codebase.
   - All table bets and P2P challenges must originate from real, authenticated user sessions.
   - P2P Matchmaking in `OneOnOneArena.tsx` creates authentic rooms on `/api/rooms/create` that wait for real peers (all mock bot auto-acceptors removed).
   - Frequency-based anti-bot detection rate-limits rapid room creation and protects matchmaking integrity.

2. **Zero Bonuses Allowed (`no bonus allow`)**:
   - No fictitious deposit multipliers, synthetic sign-up bonuses, or phantom credits are allowed in real balance calculations.
   - User balances strictly represent verified real deposits or direct player-to-player winnings.
   - Demo balance is kept completely isolated from real cash balances.
   - Social cosmetics and titles are 100% free rewards earned through actual gameplay achievements.

3. **Build Number Everywhere (`show build number everywhere footer`)**:
   - The active `BUILD_NUMBER` constant (`v2.8.5-BUILD-2026.09.26.105`) is prominently displayed on:
     - The public **Login Screen footer** (`LoginScreen.tsx`).
     - The persistent **Logged-in pages footer** (`RegulatoryFooter.tsx` via `App.tsx`).
     - The in-game **Live Game Table HUD Telemetry line** (`GameTable.tsx`).
     - The **1v1 Arena status footer** (`OneOnOneArena.tsx`).
     - The **Side Navigation Drawer** (`SideNavDrawer.tsx`).
     - The **Admin Login footer** (`AdminLogin.tsx`).
     - The **Admin Dashboard console footer** (`AdminDashboard.tsx`).
     - The **Admin Quick Modal badge** (`AdminModal.tsx`).

4. **1-Tap PWA Installation**:
   - Fast, seamless native home screen installation powered by `vite-plugin-pwa`.
   - 1-Tap installation prompt triggered directly from Navbar, Mobile Bottom Nav, and Side Drawer.

---

## 4. Design & Styling Constitution
- **Palette**:
  - Base Background: Midnight Obsidian `#07090e`, `#0a0d14`, `#0e131f`
  - Dragon Side: Electric Blue `#3B82F6`, Crimson Red `#DC2626`
  - Tiger Side: Golden Amber `#F59E0B`, Deep Ember `#B45309`
  - Accent / Gold: Amber Gold `#F59E0B`, `#FBBF24`
  - Auto Bet Glow: Cyber Cyan `#06B6D4`, `#0891B2`
- **Tailwind Utility Principles**:
  - Zero-margin overflow: All modal and drawer containers conform to viewport constraints (`max-w-[100vw]`).
  - Tactile Feedback: Touch and click targets feature active scaling (`active:scale-95`), focus rings, and high contrast text.

---

## 5. Wallet & Financial Actions (Redesigned Zero-Scroll Cashier)
- **Dedicated Deposits (`POST /api/wallet/deposit`)**:
  - Supports bKash, Nagad, Rocket, Upay, Bank Wire, UPI, and Crypto (USDT).
  - Automatically credits real user balance and switches active mode to real balance.
  - Quick amount presets: `+500`, `+1,000`, `+2,500`, `+5,000`.
  - Tactile coin sound feedback on execution (`sound.playCoinsClinking()`).
  - Registers each transaction in the immutable Global Public Financial Transparency Ledger (`recordGlobalTransaction`).
- **Dedicated Withdrawals (`POST /api/wallet/withdraw`)**:
  - Enforces atomic balance verification: Balance must be greater than or equal to the requested withdrawal amount.
  - Deducts funds immediately and posts a cryptographically hashed record to the public ledger.
- **P2P Send Money (`POST /api/wallet/transfer`)**:
  - Facilitates instant peer-to-peer balance transfer between authenticated players without intermediaries.
