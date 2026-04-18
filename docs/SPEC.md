# Keisando - Technical Specification (Draft)

## 1. Goal
Build a browser-based arithmetic practice game for children who struggle with calculation.

Primary gameplay mode for Phase 1 is **Time Attack**:
- Clear each stage as fast as possible.
- Mistakes apply a time-related penalty indirectly by increasing total questions.
- Rankings are based on clear time records.

Core constraints:
- Works in modern browsers.
- Usable on tablets (tap-first) and desktop (click + keyboard).
- Supports multiple local users without password authentication.
- Tracks per-user progress and ranking metrics.

## 2. Selected Tech Stack

### Frontend
- React
- TypeScript
- Vite

### UI
- Tailwind CSS

### State Management
- Jotai

### Persistence
- localStorage

Reasoning:
- React + TypeScript provides maintainable UI and domain logic boundaries.
- Tailwind enables fast iteration for responsive layouts.
- Jotai is lightweight and suitable for composable game/user state.
- localStorage is sufficient for local, no-auth, per-device persistence in the initial phase.

## 3. Product Scope (Phase 1)

### Game Flow
- Show one expression at the top.
- Show 4 answer options arranged in a diamond layout (A/B/X/Y-like positions).
- Player selects one option:
  - Correct: move to next question.
  - Incorrect: add one extra question to the stage total.
- Stage clears when required question count is completed.
- Elapsed time is measured from stage start to clear and used as the main result metric.

### Stage Rules
- Stage-specific arithmetic types (addition/subtraction first).
- Questions are generated randomly per run.
- Avoid duplicates within a stage as much as possible.
- Time Attack semantics for Phase 1:
  - No fixed countdown timer.
  - Faster clear time is better.
  - Wrong answers increase effective completion time by increasing the number of questions to clear.

### Users
- No password/authentication.
- Create/switch users from the top screen.
- Keep user-specific data isolated:
  - Progress
  - Best clear times
  - Basic ranking/score records

## 4. Architecture Overview

## 4.1 Layering
- `domain`: pure logic (question generation, validation, scoring, stage constraints)
- `state`: Jotai atoms and derived atoms
- `ui`: React components/pages
- `storage`: localStorage serialization/deserialization and versioning

### 4.2 Recommended Directory Shape
```txt
src/
  domain/
    stageRules.ts
    questionGenerator.ts
    scoring.ts
    types.ts
  state/
    atoms/
      gameAtoms.ts
      userAtoms.ts
      progressAtoms.ts
    selectors/
  storage/
    schema.ts
    keys.ts
    migrations.ts
  ui/
    pages/
      TopPage.tsx
      StagePage.tsx
      ResultPage.tsx
    components/
      DiamondChoices.tsx
      ExpressionPanel.tsx
      Timer.tsx
```

## 5. State Design (Jotai)

## 5.1 Core Atoms
- `usersAtom`
  - List of local users and profile metadata.
- `currentUserIdAtom`
  - Active user id.
- `gameSessionAtom`
  - Current stage session state:
  - stage id, current question, remaining question count, mistake count, elapsed time.
- `progressAtomFamily(userId)`
  - Per-user progress and records by stage.

## 5.2 Persistence Strategy
Use `atomWithStorage` for persisted atoms where practical.

Persistence boundaries:
- Persist:
  - users
  - current user id
  - per-user progress/records
- Do not persist transient runtime-only session details unless required.

## 6. localStorage Data Model

## 6.1 Key Naming
Use explicit namespaced keys:
- `keisando:users`
- `keisando:current-user-id`
- `keisando:user:<USER_ID>:progress`

## 6.2 Versioning
Persisted payloads should include a version field:

```ts
{
  version: 1,
  data: ...
}
```

Add migration handlers in `storage/migrations.ts` when schema changes.

## 7. Input and Interaction

### Tablet
- Tap on choices.

### Desktop
- Click on choices.
- Keyboard mapping for 4 options (to be finalized, e.g. arrow keys + confirm or direct keys).

Accessibility baseline:
- Focus-visible styles for keyboard users.
- Sufficient contrast for text and buttons.

## 8. Non-Functional Requirements (Initial)
- Responsive layout for tablet and desktop.
- Fast stage restart and low input latency.
- Deterministic scoring behavior.
- No backend dependency for Phase 1.

## 9. Risks and Tradeoffs
- localStorage limitations:
  - Per-origin size limits.
  - No cross-device sync.
  - Synchronous API (avoid excessive write frequency).
- Mitigation:
  - Save on meaningful events (answer/clear), not every frame.
  - Keep payload small and normalized.
  - Consider IndexedDB migration if data grows.

## 10. Future Extensions
- More stage patterns and difficulty curves.
- Better ranking metrics.
- Optional cloud sync/account system.
- PWA install support.
