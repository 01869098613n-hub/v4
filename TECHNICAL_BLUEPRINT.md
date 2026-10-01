# APEX CASINO — TECHNICAL_BLUEPRINT

## 1. Cryptographic Provably Fair Architecture
The platform implements a verifiable Provably Fair algorithm utilizing **HMAC-SHA512** with strict modulo bias rejection.

### Seed Generation & Pre-commitment:
1. **Server Seed**: A high-entropy 256-bit cryptographic hex string generated on the server prior to round initiation.
2. **Server Seed Hash**: A SHA-256 hash of the server seed is broadcast to all players before betting opens.
3. **Client Seed**: A player-supplied or table-derived entropy string.
4. **Nonce**: An incrementing round index.

### Derivation Algorithm:
$$\text{Hash} = \text{HMAC-SHA512}(\text{serverSeed}, \text{clientSeed} + \text{"-"} + \text{nonce})$$

### Modulo Bias Rejection:
To convert the resulting 128-character hex string into uniform card values without statistical skew:
```typescript
function deriveCard(hashSlice: string): { suit: string; rank: number } {
  const intVal = parseInt(hashSlice.substring(0, 8), 16);
  // Rejection sampling against 2^32 bias
  const maxUnbiased = Math.floor(0xffffffff / 52) * 52;
  if (intVal >= maxUnbiased) {
    return deriveCard(hashSlice.substring(8)); // Re-sample next slice
  }
  const cardIndex = intVal % 52;
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  return {
    suit: suits[Math.floor(cardIndex / 13)],
    rank: (cardIndex % 13) + 1, // Ace (1) to King (13)
  };
}
```

---

## 2. Matchmaking & Escrow Protocol (Zero-Bot Authenticity)
- **Zero-House Edge Model**:
  - Dragon and Tiger bets are pooled separately.
  - $\text{Matched Amount} = \min(\text{Dragon Pool}, \text{Tiger Pool})$.
  - Any unmatched stake is completely refunded to players with zero commission.
  - Winning bets on the winning side receive a proportional share of the matched opposing pool, less a fixed 5% platform liquidity rake.
- **P2P 1v1 Arena State Machine**:
  - `ROOM_CREATED` $\rightarrow$ `WAITING_FOR_REAL_OPPONENT` $\rightarrow$ `ROLE_COIN_FLIP` $\rightarrow$ `PEEK_CARDS` $\rightarrow$ `BETTING_PHASE` (Check / Call / Raise) $\rightarrow$ `SHOWDOWN` $\rightarrow$ `SETTLED`.
  - Zero simulated bots or bot auto-acceptors: rooms await authentic peer challenge acceptance.

---

## 3. Financial Infrastructure & Dedicated Cashier Endpoints
- **Dedicated Wallet Endpoints**:
  - `POST /api/wallet/deposit`: Authenticates deposit, updates cash balance, logs audit trail, publishes to transparency ledger.
  - `POST /api/wallet/withdraw`: Verifies cash solvency, deducts balance, and submits to processing queue.
  - `POST /api/wallet/transfer`: Peer-to-peer transfer between users.
- **Global Transparency Ledger**: Every deposit, withdrawal, and peer-to-peer transfer generates a unique SHA-256 transaction hash (`txHash`), recorded immutably in memory and publicly queryable via `GET /api/transparency/transactions`.
- **Atomic Operations**: All balance modifications occur within synchronous transaction wrappers preventing race conditions or double-spending.

---

## 4. Responsive Viewport & ResizeObserver Card Auto-Scaling
- **Container Observability**: A dedicated `ResizeObserver` monitors the primary `GameTable` DOM container bounds (`entry.contentRect`).
- **Aspect & Dimension Calculation**:
  - Dynamically calculates responsive horizontal and vertical scaling coefficients (`scaleByWidth = width / 740`, `scaleByHeight = height / 540`).
  - Clamps scale to `[0.55, 1.15]` to guarantee zero clipping, zero overflow, and proportional positioning across ultra-compact smartphones (down to 320px width), tablets, and wide monitors.
- **Hardware Acceleration**: Scales cards and deck shoe containers utilizing CSS GPU transform matrix (`transform: scale(...)`), preventing layout reflows and preserving sub-pixel font sharpness.
- **Mobile Viewport Height**: Enforces `h-[100dvh]` to eliminate mobile browser navigation bar clipping and unwanted vertical scrolling.

---

## 5. Progressive Web App (PWA) & 1-Tap Installation
- **Vite PWA Plugin**: Integrated `vite-plugin-pwa` with automatic service worker registration and background updates.
- **Web App Manifest**: Full standalone manifest with `id: '/'`, `display: 'standalone'`, theme colors, and icons (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`).
- **Direct 1-Tap Prompt Hook**: `usePWAInstall` captures browser `beforeinstallprompt` event and directly triggers native app installation on 1-tap when clicking "Install App" in Navbar, Drawer, or Mobile Bottom Navigation.
- **Guided Fallback**: Provides visual step-by-step installation instructions for iOS Safari and manual browser additions.
