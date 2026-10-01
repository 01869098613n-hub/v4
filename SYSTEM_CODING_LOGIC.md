# APEX CASINO — SYSTEM_CODING_LOGIC & RUNTIME GOVERNANCE

## 1. Zero-Bot & Zero-Bonus Integrity Rule
- **No Bots Allowed (`no bot allow`)**:
  - The entire gaming core operates on 100% human-to-human matching.
  - Automated bot generators, artificial table fillers, simulated players, and bot auto-acceptors (`ai_bot_opponent`, `TigerLord_Bot`, `DragonMaster_AI`) are strictly prohibited and purged from the codebase.
  - When a player starts matchmaking without an available peer, the system places them into the authentic server room queue awaiting another real player.
  - The server employs an anti-spam rate limiter on private challenge creation (`recentRoomAttempts`) to prevent script abuse.
- **No Bonuses Allowed (`no bonus allow`)**:
  - Synthetic deposit bonuses, artificial wagering multipliers, and phantom credits are barred from the platform ledger.
  - User real balance strictly corresponds 1:1 to verified deposits or P2P winnings.
  - Social cosmetics, titles, and card skins are 100% free rewards earned through actual gameplay hands.

---

## 2. Cashier Architecture & Dedicated Routes
- **Dedicated Deposit & Withdraw APIs**:
  - `POST /api/wallet/deposit`: Credits real user balance, updates user transaction history, and records entry on the public transparency ledger.
  - `POST /api/wallet/withdraw`: Verifies available funds, deducts balance, and logs withdrawal request.
  - Client interface (`WalletModal.tsx`) maintains a strict zero-scroll fixed layout with tactile quick chips (`+500`, `+1,000`, `+2,500`, `+5,000`) and audio confirmation (`sound.playCoinsClinking()`).

---

## 3. Server-Authoritative State Synchronization
The backend (`server.ts`) is the single source of truth for:
1. **RNG Derivation**: Cards are pre-committed cryptographically using HMAC-SHA512 with modulo bias rejection before betting begins.
2. **Escrow Pool Custody**: When a bet is placed, funds are deducted from the user's active balance and committed to the table's escrow pool.
3. **Round Settlement**:
   - **Equal-Pool Matching**: Dragon and Tiger stakes are matched 1:1.
   - **Unmatched Refunds**: Any stake amount exceeding the opponent pool is immediately returned to the player's wallet with zero deductions.
   - **Tie Resolution**: On a tie, both Dragon and Tiger cards share rank, and the tie pot is settled according to transparent platform liquidity rules.

---

## 4. Mobile Zero-Scroll Viewport Governance
- **`100dvh` Viewport Discipline**:
  - Root viewport uses `h-[100dvh]` to align strictly with modern mobile browsers without overflow or bounce.
  - Double bottom padding eliminated: parent uses `pb-12 md:pb-0` to compensate for fixed `MobileBottomNav` without stacking extra bottom margin.
- **Dynamic Element Scaling**:
  - `ResizeObserver` applies dynamic `transform: scale()` bounded between `[0.55, 1.15]` to ensure cards never clip on narrow screens.
  - Header controls (table selector `max-w-[145px]`, toolbar `28px` buttons, announcement `max-w-[34%]`) are sized to guarantee zero collisions on mobile viewports.
  - Roadmaps collapsed by default on mobile (`< 1024px`), chat input tucked away on mobile phones.

---

## 5. Persistent Build Number Visibility
The build identifier (`BUILD_NUMBER`) is hardcoded in `/src/config/version.ts` and visibly integrated into:
- The **Login Screen** bottom footer.
- The **Main App Footer** (`RegulatoryFooter.tsx`) rendered on all logged-in views.
- The **Live Game Table HUD Telemetry** line (`GameTable.tsx`).
- The **1v1 Arena status footer** (`OneOnOneArena.tsx`).
- The **Side Navigation Drawer** (`SideNavDrawer.tsx`).
- The **Admin Login Gate** (`AdminLogin.tsx`).
- The **Admin God-Mode Console** (`AdminDashboard.tsx`).
- The **Admin Quick Modal badge** (`AdminModal.tsx`).

---

## 6. Error Handling & Resilience
- **API Guardrails**: Every `/api/*` route is wrapped in defensive try/catch blocks that return JSON error responses rather than throwing unhandled exceptions.
- **Auto-Hydration**: If a client makes a wallet action with a valid `userId` but server memory was restarted, the server auto-hydrates the player profile instead of failing with 404.
- **Speech Recognition Sandbox Resilience**: Fallbacks for browser speech recognition errors (`not-allowed`, `service-not-allowed`) allow smooth voice bet simulation without interruptions.
