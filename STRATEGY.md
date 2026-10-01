# APEX CASINO — STRATEGY & RISK MANAGEMENT FRAMEWORK

## 1. Automated Betting Strategies

### 1. Flat Staking (`FLAT`)
- **Execution**: Stakes the exact configured base amount every round regardless of previous outcomes.
- **Risk Profile**: Minimal variance, ideal for players seeking disciplined bankroll management over extended sessions.

### 2. Martingale Strategy (`MARTINGALE`)
- **Execution**:
  - Upon a Loss: The next stake is doubled ($2 \times \text{Current Stake}$).
  - Upon a Win: The stake resets to the configured base amount.
- **Goal**: Recovers all accumulated losses from a losing sequence in a single winning round, yielding a net profit equal to 1 base unit.
- **Safety Cap**: Stake doubling is bounded by `maxStakeCap` and table maximum limits to protect against liquidation.

### 3. Anti-Martingale / Reverse Martingale (`ANTI_MARTINGALE`)
- **Execution**:
  - Upon a Win: The next stake is doubled ($2 \times \text{Current Stake}$).
  - Upon a Loss: The stake resets immediately to the base amount.
- **Goal**: Maximizes capitalization during hot winning streaks while minimizing downside during drawdowns.

### 4. Alternating Sides (`ALTERNATE`)
- **Execution**: Alternates target wagering side every round ($\text{Dragon} \rightarrow \text{Tiger} \rightarrow \text{Dragon}$).
- **Goal**: Counteracts pattern runs and mitigates bias on choppy roads.

### 5. Streak Chaser (`STREAK_CHASER`)
- **Execution**: Automatically inspects the outcome of the immediate previous round and wagers on that exact side.
- **Goal**: Capitalizes on extended dragon or tiger streak runs (often referred to as "the dragon tail" on Baccarat and Dragon Tiger roadmaps).

---

## 2. Quantitative Risk Control Parameters
- **Take Profit Target (`stopProfitTarget`)**: Stops the automated session immediately when net cumulative profit meets or exceeds the target.
- **Stop Loss Limit (`stopLossLimit`)**: Stops the automated session immediately if cumulative drawdown reaches the specified threshold.
- **Stop on Single Win (`stopOnWin`)**: Halts execution after the first winning round.
- **Stop on Single Loss (`stopOnLoss`)**: Halts execution after the first losing round.
- **Emergency Kill Switch**: A 1-tap floating red button allows instant termination of any automated sequence.

---

## 3. Transparency & Edge Minimization
- Unlike traditional casinos with large house edges (e.g. 14.36% on Tie), APEX P2P operates purely as a peer-to-peer liquidity exchange where matched bets pay 1:1 and unmatched stakes are refunded 100% with zero penalties.
- Zero bot opponents and zero synthetic bonus locks guarantee authentic mathematical expectations for disciplined bankroll strategies.
