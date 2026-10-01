# APEX CASINO — CODING_LOGIC & DATA FLOW BLUEPRINT

## 1. High-Frequency Game Loop & WebSocket Flow
```text
Client Application                                Server (server.ts)
      |                                                   |
      | ----------> [WebSocket Connection] -------------> |
      |                                                   |
      | <---------- TIMER_TICK (Every 1s) <-------------- |
      |             (Seconds remaining, Pool volumes)     |
      |                                                   |
      | ----------> Place Bet (POST /api/game/bet) -----> |
      |             { userId, side, amount, type }        |
      |                                                   |
      | <---------- NEW_BET broadcast <------------------ |
      |                                                   |
      | <---------- ROUND_PHASE: MATCHING <-------------- |
      |             (Calculate matched vs unmatched)      |
      |                                                   |
      | <---------- ROUND_DEALING <---------------------- |
      |             (Dragon Card, Tiger Card, Result)     |
      |                                                   |
      | <---------- ROUND_SETTLED <---------------------- |
      |             (Winners paid, Unmatched refunded)    |
      |                                                   |
      | <---------- NEW_ROUND <-------------------------- |
```

---

## 2. Dedicated Cashier & Wallet Logic (`WalletModal.tsx` & `server.ts`)
```text
Client Modal (WalletModal.tsx)                     Server (server.ts)
      |                                                   |
      | --- (1) User Selects Method & Amount -----------> |
      |     (bKash / Nagad / Rocket / UPI / Card / USDT)  |
      |     Quick Chips: +500, +1,000, +2,500, +5,000     |
      |                                                   |
      | --- (2) POST /api/wallet/deposit ---------------> |
      |     { userId, username, amount, method }          |
      |                                                   |
      | <-- (3) 200 OK + Updated User Balance <---------- |
      |                                                   |
      | --- (4) Client Actions: ------------------------> |
      |     ├── sound.playCoinsClinking()                 |
      |     ├── onUpdateWallet(user)                      |
      |     ├── fetchGlobalLedger()                       |
      |     └── Set Zero-Scroll Success State             |
```

---

## 3. Strict Real-Player P2P Matchmaking Logic (Zero Bots)
```text
User Initiates Matchmaking (OneOnOneArena.tsx)
      │
      ├── 1. Query Existing Rooms (GET /api/rooms)
      │      └── If open room from real peer exists → Accept and Start Duel
      │
      └── 2. If No Open Room Exists:
             ├── POST /api/rooms/create (amount, choice, user credentials)
             ├── Deduct ante from real balance
             ├── Enter Live Waiting Queue (`createdRoomId`)
             └── Await Real Peer Challenge (NO bot auto-acceptance or mock bots permitted)
```

---

## 4. Mobile Viewport Zero-Scroll State Logic
```text
Viewport Sizing & Layout Pipeline
      │
      ├── Root & Login Viewport:
      │     └── Uses dynamic `h-[100dvh]` to track true visual height minus browser bars
      │
      ├── Table Felt Auto-Scaling (ResizeObserver):
      │     ├── Measures container width and height in real time
      │     ├── scale = Math.min(width / 740, height / 540)
      │     └── Bounded safely within [0.55, 1.15] for zero clipping on narrow phones
      │
      ├── Responsive Table Header:
      │     ├── Selector: max-w-[145px] sm:max-w-none with truncated text
      │     ├── Announcement: max-w-[34%] sm:max-w-none with responsive font scaling
      │     └── Iconic21 Toolbar: compact 28px buttons and icon-only Lobby trigger on mobile
      │
      ├── Bottom HUD Layout:
      │     ├── Roadmaps: start collapsed (< 1024px) to preserve felt space, toggleable via 📊
      │     ├── Chat Input: collapsed on mobile (< sm)
      │     └── Telemetry & BUILD_NUMBER: always rendered cleanly with balance
      │
      └── Single Bottom Padding:
            └── Parent `pb-12 md:pb-0` perfectly offsets fixed `MobileBottomNav` (h-14)
```

---

## 5. Pro Auto Bet Engine 2.0 Automation State Machine
```text
Round Status == "BETTING" & Seconds > 2
  ├── Read autoBetConfig (Active, Strategy, Base Stake, Current Stake, Side)
  ├── Check Risk Stop Controls (Take Profit Target, Stop Loss Limit, Max Stake Cap)
  ├── Determine Next Side (Flat, Martingale, Anti-Martingale, Alternate, Streak Chaser)
  ├── Place Automated Bet via POST /api/game/bet
  └── On Round Settle:
        ├── Win -> Apply Strategy Rule & Update Cumulative PnL
        └── Loss -> Double Stake (Martingale) or Reset & Check Stop Loss
```

---

## 6. Progressive Web App (PWA) Lifecycle
```text
Browser Loads Application
  ├── Service Worker Registered via vite-plugin-pwa
  ├── window.addEventListener('beforeinstallprompt', handlePrompt)
  ├── If User Taps "Install App" in Navbar / Bottom Nav:
  │     ├── If deferredPrompt is available -> Trigger prompt() -> Outcome captured
  │     └── If deferredPrompt not available or iOS -> Open InstallAppModal with visual steps
  └── Once Installed:
        └── window.addEventListener('appinstalled') -> Set isInstalled state & dismiss prompt
```
