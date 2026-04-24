# Keisando - Technical Specification

## 1. Goal
Keisando is a browser-based arithmetic practice game for children who need repetition with basic calculation.

Current product goals:
- Work in modern desktop and tablet browsers.
- Keep the main play loop short and tap-first.
- Support multiple local players without authentication.
- Persist local progress, ranking records, and play history per player.
- Provide Japanese and English UI text.

## 2. Current Tech Stack

### Frontend
- React 19
- TypeScript
- Vite

### Styling
- Hand-authored CSS in `src/index.css`

### Persistence
- `localStorage`

### Tooling
- Vitest
- Biome

See [package.json](../package.json) for exact scripts and versions.

## 3. Product Scope

### Core Flow
- The app starts on the stage-select screen.
- A player must be selected before a stage can start.
- During play, one arithmetic expression is shown with four answer options.
- A correct answer advances to the next question.
- A wrong answer increments the wrong-answer count and adds one extra required question.
- A stage clears after the current required question count is answered correctly.
- Clear results are recorded as elapsed time records for ranking.

### Supported Screens
- `stageSelect`
- `playerSelect`
- `playing`
- `ranking`
- `historyDetail`
- `debug`

### Players
- Players are local-only and do not require passwords.
- Each player has:
  - `id`
  - `name`
  - `createdAt`
- Player names are trimmed and validated against shared length constraints.
- The current active player is persisted separately from the player list.

### Localization
- Supported locales are `ja` and `en`.
- The default locale is detected from `navigator.languages` or `navigator.language`.
- Non-Japanese locales fall back to English.
- The debug screen can override the effective locale to:
  - System
  - Japanese
  - English
- Stage names, stage tags, status labels, history labels, ranking labels, and debug labels are localized through `src/shared/i18n.tsx`.

## 4. Gameplay Rules

### Time Attack Semantics
- There is no fixed countdown timer that ends the round.
- Faster clear time is better.
- Mistakes act as an indirect time penalty by increasing the number of questions required to clear.

### Stage Catalog
- `stage1`
  - Theme: addition
  - Expression range: single-digit addition, `0-9 + 0-9`
  - Answer range: `0-18`
  - Zero-valued operands remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage2`
  - Theme: subtraction
  - Expression range: single-digit subtraction, `0-9 - 0-9`
  - Answer range: `0-9`
  - Zero-valued operands/results remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage3`
  - Theme: subtraction+
  - Expression range: `1-2` digit minus `1` digit, result constrained to `0-9`
  - Answer range: `0-9`
  - Zero-valued results remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage4`
  - Theme: multiplication
  - Expression range: single-digit multiplication, `0-9 × 0-9`
  - Answer range: `0-81`
  - Zero-valued operands remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage5`
  - Theme: multiplication fill-in
  - Expression range: fill-in form like `56 = 8 × ?`, answer constrained to `0-9`
  - Answer range: `0-9`
  - Zero-valued and one-valued answers remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage6`
  - Theme: division
  - Expression range: exact division, dividend up to `2` digits, divisor `1-9`, result `0-9`
  - Answer range: `0-9`
  - Zero-valued and one-valued answers remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage7`
  - Theme: multiplication fill-in+
  - Expression range: fill-in form with remainder like `58 = 7 × ? + 2`, answer constrained to `0-9`
  - Answer range: `0-9`
  - One-valued answers remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage8`
  - Theme: division+
  - Expression range: division with remainder, divisor `2-9`, quotient `0-9`, remainder `0-(divisor-1)`
  - Answer range: quotient and remainder pairs shown as localized labels like `8 R 1`
  - Zero-valued quotients, zero remainders, and one-valued quotients remain possible, but generation retries probabilistically to reduce over-frequency.
- `stage9`
  - Theme: mixed arithmetic
  - Expression range: random mix of question patterns from `stage1`, `stage3`, `stage4`, and `stage8`
  - Answer range: depends on the generated source pattern
  - Uses numeric options for standard arithmetic and quotient/remainder options for division-with-remainder questions.

### Default Stage Parameters
- All current stages use:
  - `baseQuestionCount = 10`
  - `maxElapsedMs = 15000`
  - `maxMistakes = 0`

### Unlock Rules
- The first stage is always available.
- Later stages unlock per player through the stage-clear flow.
- Unlock progress can be reset for the active player from the debug screen.

## 5. Records and History

### Ranking Records
- A clear writes a `StageRunRecord` with:
  - `id`
  - `stageId`
  - `playerId`
  - `elapsedMs`
  - `requiredCount`
  - `wrongCount`
  - `recordedAt`
- Rankings support:
  - Global Top 10
  - Active-player Top 10

### Play History
- Per-player history stores `PlayHistoryRecord` entries with:
  - `id`
  - `playerId`
  - `playedAt`
  - `stageId`
  - `durationMs`
  - `mistakeCount`
  - `appVersion`
- The history screen also shows:
  - Lifetime summary
  - Lifetime correct-answer streaks
  - Recent history for the last 10 days
  - Per-stage lifetime aggregates

### Stage Clear Conditions
- Each stage has a default clear condition.
- The debug screen can override clear conditions per stage:
  - Maximum elapsed time
  - Maximum mistakes allowed
- The debug screen can also override per-stage question counts.
- Overrides are persisted locally.

## 6. Architecture Overview

### Top-Level Structure
- `src/App.tsx`
  - App orchestration, screen switching, top-level wiring
- `src/features/*`
  - Screen components, hooks, and feature-specific logic
- `src/shared/*`
  - Shared types, constants, formatters, i18n helpers, stage definitions
- `src/storage/repositories/*`
  - `localStorage` read/write helpers and validation

### Design Direction
- Keep UI composition in components and hooks.
- Prefer pure helpers for branching rules that need tests.
- Keep persistence concerns inside storage repositories instead of UI components.

## 7. Persistence Model

### Storage Keys
- `keisando:users`
- `keisando:current-user-id`
- `keisando:records:v1`
- `keisando:sound-muted`
- `keisando:stage-clear-conditions:v1`
- `keisando:stage-question-counts:v1`
- `keisando:unlocked-stage-ids-by-player:v1`
- `keisando:user:<PLAYER_ID>:history`
- `keisando:user:<PLAYER_ID>:lifetime-summary`
- `keisando:user:<PLAYER_ID>:stage-lifetime-summary`

### Persistence Boundaries
- Persisted:
  - Players
  - Active player id
  - Ranking records
  - Per-player history and summary data
  - Per-player unlock progress
  - Stage clear condition overrides
  - Stage question count overrides
  - Sound mute preference
- Not persisted:
  - Active in-progress stage session state
  - Temporary animation/effect state
  - Current screen selection after reload

## 8. Input and Interaction

### Tablet
- Tap answer options and navigation controls.

### Desktop
- Click answer options and navigation controls.
- Keyboard shortcuts are supported for gameplay and navigation flows.

### Accessibility Baseline
- Visible focus states for keyboard use.
- Text and controls must remain readable at tablet sizes.
- Localization must not break core navigation or status visibility.

## 9. Debug Capabilities
- Change effective language.
- Unlock all stages for the active player.
- Reset unlock progress for the active player.
- Clear all local data.
- Override per-stage clear conditions.
- Override per-stage question counts.
- Trigger visual effect previews.
- Trigger sound effect previews.

These tools are development-facing and not part of the main player flow.

## 10. Non-Functional Requirements
- Responsive layout for desktop and tablet play.
- Fast stage restarts and low-latency answer input.
- Deterministic validation and ranking behavior.
- No backend dependency in the current version.

## 11. Future Extensions
- Additional stage patterns and difficulty curves.
- Broader localization coverage beyond `ja` and `en`.
- Export/import or sync for local player data.
- PWA packaging and install support.
