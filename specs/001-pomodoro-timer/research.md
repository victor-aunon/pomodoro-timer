# Phase 0 Research: Technical Decisions & Architectural Analysis

**Feature**: `001-pomodoro-timer` (Pomodoro Timer with Sound Notifications and Task History)  
**Date**: 2026-11-19  
**Status**: Completed

---

## 1. High-Precision Timing & Background Tab Drift Resilience

### Context & Challenge

Standard web timer implementations using incremental `setInterval(() => count--, 1000)` suffer severe cumulative drift. When browser tabs are moved to the background or minimized, Chromium, WebKit, and Gecko throttle timers to tick at intervals of 1000ms or longer, or suspend them completely. Furthermore, if the host OS enters sleep mode and later resumes, interval counters freeze entirely during sleep, resulting in negative or frozen timer states. Success criterion **SC-002** requires maintaining less than 1 second of cumulative drift over any 60-minute interval.

### Technical Decision

**Chosen Approach**: Absolute Timestamp Delta Synchronization with Multi-Rate Ticker.

- When an interval starts or resumes, the system captures `startedAt = Date.now()` and computes `targetEndTime = startedAt + (remainingSeconds * 1000)`.
- A lightweight ticker runs at 250ms intervals (using `setInterval` or `requestAnimationFrame`) to poll `Date.now()`. On each tick, the remaining time is deterministically computed as:
  $$\text{remainingSeconds} = \max\left(0, \lceil (\text{targetEndTime} - \text{Date.now()}) / 1000 \rceil\right)$$
- An event listener for `document.addEventListener('visibilitychange', ...)` and `window.addEventListener('focus', ...)` immediately triggers clock reconciliation upon tab re-activation.
- **Sleep/Wake Detection**: If the interval between ticks exceeds 2000ms, the system detects a sleep or heavy throttle event. If `Date.now() >= targetEndTime`, it immediately concludes the interval, triggers sound and visual alerts, transitions mode (Work $\to$ Break or vice versa), and appends to history without executing phantom intermediary ticks.

### Rationale

- Mathematical precision: Eliminates timer drift entirely because remaining duration is derived directly from the system wall clock rather than accumulated tick increments.
- Zero battery overhead: 250ms polling has negligible CPU impact while providing smooth sub-second UI transition responsiveness.
- Seamless wake recovery: Prevents negative countdown numbers or hung timers when resuming from laptop lid-close or system standby.

### Alternatives Considered & Rejected

- **Pure `setInterval(tick, 1000)`**: Discarded due to severe drift (> 15% drift in background tabs).
- **Dedicated Web Worker Timer**: Evaluated for continuous background execution. While workers avoid tab throttling, they are still frozen during OS sleep and introduce serialization overhead with `postMessage`. Absolute timestamp delta achieves superior accuracy with simpler, synchronous code.

---

## 2. Audio Notification Synthesis & Autoplay Mitigation

### Context & Challenge

The Pomodoro timer requires distinct audible alerts upon interval completion (Work Complete chime vs. Break Complete chime) with volume control, sound profile selection, and preview functionality (FR-006, FR-007, FR-008). Audio must function reliably offline without network latency, without inflating bundle size budgets (SC-003, performance budget $\le$ 250 KB chunk limit), and must handle browser autoplay restrictions gracefully (FR-019).

### Technical Decision

**Chosen Approach**: Procedural Audio Synthesis via Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`).

- **Sound Profiles**:
  1. _Digital Bell_ (Work Complete default): Dual sine-wave oscillators ($880\text{ Hz}$ fundamental + $1760\text{ Hz}$ harmonic overtone) with exponential decay envelope over 1.2s.
  2. _Soft Chime_ (Break Complete default): Harmonious ascending triad ($523.25\text{ Hz}$ C5, $659.25\text{ Hz}$ E5, $783.99\text{ Hz}$ G5) with staggered note onset and smooth release envelope over 1.5s.
  3. _Marimba_: Warm triangle-wave tone with rapid exponential attack ($0.01\text{s}$) and short decay ($0.4\text{s}$) at $440\text{ Hz}$ and $660\text{ Hz}$.
- **Autoplay Handling**: `AudioContext` is lazily instantiated on the user's first interaction (e.g. clicking "Start", "Preview", or modifying settings). If browser policy suspends the audio context (`state === 'suspended'`), the service calls `audioContext.resume()` within the interaction event.
- **Resilience & Fallback**: If audio output fails (e.g., hardware disconnected, permissions blocked, or autoplay denied), the `AudioNotificationPort` implementation catches the rejection and fires a visual alert signal to display a non-blocking notification banner and UI flash/pulse animation.

### Rationale

- **Zero Asset Footprint**: No binary audio files (`.mp3`, `.wav`) need to be bundled, loaded over HTTP, or stored in local assets, ensuring compliance with bundle size budgets.
- **Dynamic Parameterization**: Master volume ($0.0$ to $1.0$) directly modulates the master `GainNode`, avoiding clipping or distortion.
- **Zero Latency**: Procedural audio generates immediately in the browser thread with no decode or fetch delay.

### Alternatives Considered & Rejected

- **Static Audio Files (`<audio src="...">`)**: Bundling 3 sound profiles in 2 formats would add 150–300 KB to the asset payload, risking 404s, MIME-type issues, and decode delays.
- **External CDN Audio URLs**: Strictly rejected due to offline requirement and vulnerability to network failures.

---

## 3. Resilient Local Storage Engine & Quota/Corrupt Recovery

### Context & Challenge

The application must persist timer preferences, active tasks, and historical session logs locally across page reloads (FR-015, SC-005). In restricted environments (e.g. Safari Private Browsing, storage quota exhaustion, or corrupted JSON strings from previous versions), naive `localStorage.getItem`/`setItem` calls can throw fatal uncaught exceptions (`QuotaExceededError`, `SecurityError`) or result in white-screen crashes.

### Technical Decision

**Chosen Approach**: Hexagonal `PersistencePort` with `LocalStorageAdapter` and Automatic In-Memory Degradation (`MemoryStorageAdapter`).

- **Safe Serialization & Defensive Deserialization**:
  - Keys are namespaced: `pomodoro_timer_v1_prefs`, `pomodoro_timer_v1_tasks`, `pomodoro_timer_v1_history`.
  - Every retrieved payload passes through schema validation type guards.
  - If JSON parsing fails or schema structure is corrupted: the adapter catches the error, writes the malformed payload to a quarantine key (`pomodoro_quarantine_<timestamp>`), logs an architectural warning, and returns the verified default state without interrupting the user.
- **Quota & Permission Trap**:
  - All write operations are wrapped in try-catch handlers.
  - If `setItem` throws `DOMException` (Quota Exceeded or Access Denied): the adapter automatically switches to an internal `MemoryStorageAdapter` for the duration of the browser session and dispatches an event (`storage-degraded`).
  - The UI layer listens for `storage-degraded` and presents a non-intrusive warning banner informing the user that data will persist for the active session only.

### Rationale

- **100% Zero-Crash Guarantee**: The application will never crash or fail to boot, regardless of browser privacy modes, disabled cookies, or corrupted storage.
- **Data Integrity**: Quarantining malformed payloads prevents accidental overwrites while preserving recovery data for debugging.

### Alternatives Considered & Rejected

- **IndexedDB**: Asynchronous API adds unwarranted complexity (schema migrations, transaction management, connection handling) for a total data payload under 100 KB.
- **Raw `localStorage` without fallback**: Prone to catastrophic unhandled exceptions in private windows or full disks.

---

## 4. Clean Architecture Vertical Slice & State Orchestration

### Context & Challenge

The codebase must enforce strict Clean Architecture boundaries and vertical slices under `src/features/pomodoro/`, adhering to the non-negotiable rules of the project constitution (`AGENTS.md` and `constitution.md`). The domain layer must remain pure (zero external dependencies, zero browser API imports). Presentation components must follow Atomic Design with strictly one component per file (`react/no-multi-comp`).

### Technical Decision

**Chosen Approach**: Hexagonal Architecture Vertical Slice with Container-Presentational Pattern.

- **Layer Breakdown**:
  - `domain/`: Entities (`TimerState`, `Task`, `HistoryEntry`, `SoundProfile`, `UserPreferences`), value objects (`DurationSeconds`, `TimerMode`), and pure domain transition functions (`calculateNextMode`, `computeRemainingTime`, `validateTaskTitle`).
  - `application/`: Application services (`TimerService`, `TaskService`) orchestrating use cases, plus ports (`AudioNotificationPort`, `PersistencePort`).
  - `infrastructure/`: Implementations of ports (`WebAudioAdapter`, `LocalStorageAdapter`, `MemoryStorageAdapter`).
  - `ui/`: Custom React hook `usePomodoro` providing state and dispatch actions to presentational components. Atomic components (`TimerDisplay`, `TimerControls`, `TaskForm`, `TaskList`, `TaskItem`, `TaskHistory`, `SettingsDialog`, `AlertBanner`, `EmptyState`) isolated to single files.
- **Centralized Env Configuration**: Any global configurations are routed through `src/config/env.ts` with typed validation.

### Rationale

- Completely decoupled domain logic allows 100% test coverage with fast, deterministic unit tests without mocking browser DOM or Web Audio APIs.
- Presentation components remain lean, accessible, and testable with Vitest and Playwright.

### Alternatives Considered & Rejected

- **Global External State Libraries (Redux, MobX, Zustand)**: Adds external dependency weight and violates the simplicity and bundle budget mandates for a single focused vertical slice.
- **Coupled UI & Browser APIs in Components**: Directly invoking `localStorage` or `AudioContext` within React components violates layer boundaries and fails `check-quality-gate.sh`.

---

## 5. Visual Hierarchy, Design Tokens & Impeccable UI Craft

### Context & Challenge

The application must provide high-fidelity visuals adhering to the Impeccable UI craft lifecycle (Conception critique, Robustness hardening, and Polish animations) and Google Stitch design tokens. Class names must not use arbitrary Tailwind brackets or ghost classes (`check-ghost-classes.sh`).

### Technical Decision

**Chosen Approach**: Design Tokens with CSS Custom Properties and Semantic Utility Classes.

- Design tokens defined in `:root`:
  - Colors: `--color-background`, `--color-surface`, `--color-surface-hover`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-break-short`, `--color-break-long`, `--color-accent`.
  - Radii: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (16px), `--radius-full` (9999px).
  - Typography: System font stack (`Inter`, `-apple-system`, `sans-serif`) with standard size steps (`xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`).
  - Spacing: 4px grid rhythm (`space-1` to `space-8`).
- **Robustness (Impeccable Harden)**:
  - Form validation with immediate inline feedback for task titles (1–100 chars) and duration boundaries.
  - Dedicated empty states for Task List and Task History with friendly iconography and actionable CTAs.
  - Non-blocking dismissible warning banners for storage or audio degradation.
- **Polish (Impeccable Animate & Audit)**:
  - Smooth radial progress transition on the timer ring.
  - Micro-interactions for buttons (hover lift, active scale, focus-visible outline).
  - All animations respect `@media (prefers-reduced-motion: reduce)`.
  - Full WCAG 2.1 AA accessibility (color contrast $\ge 4.5:1$, accessible button names, ARIA progressbar roles).

---

## 6. Summary of Architectural Decisions

| Area             | Decision                                                                                | Primary Benefit                                                          |
| :--------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Timer Engine** | Wall-clock delta sync (`targetEndTime - Date.now()`)                                    | 0 cumulative drift, robust to background tab throttling and device sleep |
| **Audio Alerts** | Web Audio API procedural synthesis (Sine/Triangle oscillators)                          | 0 KB bundle weight, offline-capable, dynamic pitch/volume envelope       |
| **Persistence**  | Resilient `LocalStorageAdapter` with `MemoryStorageAdapter` fallback                    | Zero-crash guarantee across private browsing and quota limits            |
| **Architecture** | Vertical slice Clean Architecture (`domain/`, `application/`, `infrastructure/`, `ui/`) | Strict boundary enforcement, 100% testable domain, atomic components     |
| **UI Craft**     | Stitch design tokens, atomic design, WCAG AA contrast, reduced-motion                   | Production-grade aesthetic, accessible, passes all automated gates       |
