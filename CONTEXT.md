# Skyjo Solo — Project Context

> Context document for coding agents. Read this fully before working on the repo.
> Written in English to match agent-tooling conventions; the product owner (bal7hazar) communicates in French — ask if a French version is preferred.

## 1. What we are building

A **full-client** (no backend, no smart contract) **solo** adaptation of the card game **Skyjo**, as a playable web prototype.

- **Scope of this phase:** a single-player, client-only game. All randomness (the deck) is generated client-side. There is **no** on-chain logic, server, or persistence yet.
- **Why solo Skyjo:** it is 100% number-themed and is the best showcase for a "generative privacy" reveal mechanic (a card's value is known to the player but still counts as hidden in game state — see the **Spy** rule). This prototype is the testbed for that feel.
- **Known design tradeoff (out of scope to fix here):** solo Skyjo reduces to an expected-value optimization, so it is **weak against bots / not bot-resistant**. That is a deliberate, accepted limitation for this client prototype — do not add anti-bot machinery.

## 2. Components & terms

- **Grid:** 3 rows × 4 columns = **12 cells**. A **column** is a set of 3 vertically-aligned cells. All cells start **hidden** (displayed as `?`).
- **Cell states:** `hidden` (face-down, `?`), `visible` (face-up, value shown and counted), `spied` (value known to the player but still treated as `hidden` for game state and end condition), `removed` (the cell was part of a cleared column — gone from the grid, counts 0).
- **Deck:** the draw pile. Each turn the player draws one card from it.
- **Discard:** where replaced/discarded cards go (out of play). There is **no** "draw from discard" action — drawn cards always come from the deck.

## 3. Deck composition (exact original Skyjo proportions)

**150 cards total**, values from **-2 to 12**:

| Value | Count |
|------:|------:|
| -2    | 5     |
| -1    | 10    |
| 0     | 15    |
| 1     | 10    |
| 2     | 10    |
| 3     | 10    |
| 4     | 10    |
| 5     | 10    |
| 6     | 10    |
| 7     | 10    |
| 8     | 10    |
| 9     | 10    |
| 10    | 10    |
| 11    | 10    |
| 12    | 10    |

Total = 5 + 10 + 15 + (12 × 10) = **150**.

- **Dealing:** shuffle the 150-card deck; deal 12 cards face-down into the grid; the remaining **138** form the draw deck.
- **Without replacement:** drawn and dealt cards are **removed** from the deck — already-seen cards reduce the odds of drawing them again. Card counting is therefore meaningful and is intentionally preserved.
- Deck exhaustion is effectively impossible (a game lasts on the order of ~12–24 turns vs. 138 remaining cards), so no reshuffle logic is required.

## 4. Turn structure

Start of game: score = **100 points**. Grid = 12 hidden cells.

Each turn:
1. The player **loses 1 point** (turn cost).
2. A card is drawn from the deck (a random value, respecting the depleting deck).
3. The player performs **exactly one** of these two actions:
   - **(A) Replace** **any** grid cell (hidden or visible) with the drawn card. The replaced card goes to the discard; the drawn card is placed **visible** in that cell. (Replacing a hidden cell discards the unknown card and reveals the new one.)
   - **(B) Discard + Flip:** discard the drawn card and turn one **hidden** cell **visible** (reveal it).
4. **Column clear (triggered, automatic) + Spy bonus (optional):** when a column's 3 cells are all **visible and equal in value** (original Skyjo trigger), that column is **automatically removed**: its 3 cells become `removed` and count **0** in the final score. Removal also grants the player an optional **spy** of one remaining hidden cell — they learn its value, but the cell stays `spied` (still hidden for state and end condition; only the player knows it). If no hidden cell remains, the spy is simply unavailable.

### End & scoring
- The game ends when **every remaining cell is visible** — i.e. all cells are `visible` or `removed`. (`spied` cells do **not** count as visible — they must still be flipped/replaced to end the game.)
- Final score = **100 − (number of turns taken) − (sum of remaining `visible` grid values)**. `removed` cells contribute 0.
- The grid total can be reduced two ways: replacing high cards with lower drawn cards, and clearing high-value columns to 0. The turn cost rewards finishing efficiently. The core tension is **fewer turns vs. lower grid total**.
- Note: column removal is automatic even for equal **low/negative** triples (e.g. three `-2`s), which can *raise* your total — a faithful original-Skyjo edge case.

## 5. Rules decisions & remaining open questions

### Resolved by the product owner
- **Replace targets any cell.** Replace (A) may target **any** grid cell, hidden or visible (original Skyjo behavior). Replacing a hidden cell discards the unknown card and reveals the new one. (Turn 1 with an all-hidden grid is therefore fine: you may Replace or Flip.)
- **Column trigger = 3 equal values.** A column is "completed" when its 3 cells are visible and hold **equal values** (original Skyjo trigger), not merely all-visible.
- **Completed columns are removed and score 0** (original Skyjo rule is kept) **and** additionally grant the optional spy. Removal is automatic; the spy is the bonus.

### Still open (minor — sensible defaults assumed)
1. **Spy count / re-spy:** assumed **one spy per column clear**, and a given hidden cell can be `spied` at most once. Confirm.
2. **Negative final scores** are possible (large grid total minus turn cost). Assumed **allowed**.
3. **Equal low/negative triples** (e.g. three `-2`s) clear automatically even though it raises the total — assumed faithful to original. Confirm whether removal should instead be optional.

## 6. Tech direction (proposed — confirm)

- **Full client**, web. Proposed stack: **React + Vite + TypeScript** (consistent with the owner's other repos), client-side RNG for the deck. No backend/contract.
- Keep game logic **pure and isolated** (a deck module + a game-state reducer) so it is easy to unit-test and could later be ported to an on-chain/Dojo context.
- UI: a 12-slot grid, the current drawn **number**, the running score and turn counter, and controls for Replace / Discard+Flip / Spy.
- Suggested first slices: (1) deck + dealing + draw logic with tests; (2) pure game-state reducer (actions, end condition, scoring) with tests; (3) minimal React UI on top.

### Visual direction (hard requirement)
- **No playing cards. No card metaphor at all.** We deliberately break from original Skyjo's look to make this feel like its own number game.
- Present the game as **numeric slots that reveal**, not cards that flip:
  - A `hidden` cell is an empty/blank slot showing `?` — revealing it **fills in a number**, it does **not** flip a card.
  - No card imagery: no suits, no card backs, no face-card art, no deck-of-cards visual, no flip animation. Use clean numeric tiles/slots.
  - The "deck" is just an abstract source of numbers — surface it as a single incoming **number**, not a stack of cards.
- Domain/code naming may still use `deck`/`card` internally for clarity, but **nothing card-like reaches the screen** — the player only ever sees numbers, slots, and reveals.

## 7. Status

- Initial spec. **No code yet.** Core rules are **locked** (Section 5 → "Resolved"); only minor points remain open.
- Next step: confirm the proposed tech stack (Section 6) and the minor open questions, then scaffold (deck + dealing → pure game-state reducer → minimal React UI), each slice with tests.
