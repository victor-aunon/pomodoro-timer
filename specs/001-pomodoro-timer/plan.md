# Implementation Plan: Pomodoro Timer with Sound Notifications and Task History

**Branch**: `001-pomodoro-timer` | **Date**: 2026-11-19 | **Spec**: `/specs/001-pomodoro-timer/spec.md`

**Input**: Feature specification from `/specs/001-pomodoro-timer/spec.md`

---

## Summary

The Pomodoro Timer is a local-first, distraction-free productivity web application built with React 19, TypeScript, and Vite+. It structures work and rest through customizable intervals (Work: 25m, Short Break: 5m, Long Break: 15m), provides auditory completion feedback via procedural Web Audio API synthesis (eliminating external asset overhead), links focus intervals to user tasks, and maintains an immutable local task history.

The technical architecture implements Clean Architecture vertical slices under `src/features/pomodoro/`, isolating pure domain business logic from browser infrastructure (`AudioContext`, `localStorage`). To defeat background tab throttling and device sleep drift, timing is synchronized against absolute wall-clock deltas (`targetEndTime - Date.now()`). Persistence uses a defensive LocalStorage adapter backed by transparent in-memory fallback and corrupt data quarantine. UI presentation adheres to Atomic Design (strictly one component per file) and Google Stitch design tokens.

---

## Technical Context

**Language/Version**: TypeScript 5.7+, React 19.3  
**Primary Dependencies**: React 19, React DOM 19, Vite+ (`vp` 1.3+), `@shadcn/lint`  
**Storage**: Client-side `localStorage` with defensive schema validation, corrupt payload quarantine, and automated fallback to `MemoryStorageAdapter` for private browsing and quota-exceeded environments  
**Testing**: `vp test` (Vitest-compatible test runner for unit, domain, and service tests), Playwright (for route & design audit tests)  
**Target Platform**: Modern Evergreen Browsers (Chrome, Firefox, Safari, Edge) across desktop and mobile responsive viewports  
**Project Type**: Client-side Web Application (SPA) structured as a Clean Architecture vertical slice  
**Performance Goals**:

- UI interaction response time $< 50\text{ ms}$ (SC-001)
- Cumulative timer drift $< 1\text{ second}$ over any 60-minute duration (SC-002)
- Production build bundle budget: max $250\text{ KB}$ per chunk, max $1000\text{ KB}$ total bundle  
  **Constraints**:
- Fully offline-capable; zero external HTTP/API dependencies
- 0 KB external audio asset footprint: procedural Web Audio synthesis (`AudioContext`, `OscillatorNode`, `GainNode`)
- Web Audio autoplay compliance with automatic fallback to visual alert animations and status banner
- Full WCAG 2.1 AA accessibility (color contrast $\ge 4.5:1$, keyboard navigation, accessible names, `@media (prefers-reduced-motion: reduce)`)
- Strictly one React component per file (`react/no-multi-comp`)  
  **Scale/Scope**: Local personal productivity suite handling up to 100 active tasks and thousands of historical focus sessions efficiently

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitutional Rule                  | Compliance Status | Technical Implementation & Evidence                                                                                                                                                                                                                           |
| :----------------------------------- | :---------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Clean Architecture Boundaries** |     **PASS**      | Vertical slice under `src/features/pomodoro/` structured into `domain/`, `application/`, `infrastructure/`, and `ui/`. Domain contains pure TypeScript models and logic with zero external or browser imports. Unidirectional dependencies strictly observed. |
| **2. Quality Gate Integrity**        |     **PASS**      | No modifications to Vite settings, quality gate scripts, or lint configurations. All checks (`vp check`, `check-quality-gate.sh`, `check-contracts.sh`) are respected.                                                                                        |
| **3. Centralized Typed Environment** |     **PASS**      | Any environment configuration is strictly routed through `src/config/env.ts`. No raw `import.meta.env` access in feature code.                                                                                                                                |
| **4. Impeccable UI Craft Lifecycle** |     **PASS**      | Conforms to 3-stage lifecycle: Conception (Stitch tokens, WCAG AA contrast), Robustness (loading skeletons, friendly empty states with CTAs, error boundaries), Polish (micro-interactions with `prefers-reduced-motion`).                                    |
| **5. Atomic Design & Isolation**     |     **PASS**      | Strictly one React component per file (`TimerDisplay.tsx`, `TimerControls.tsx`, `TaskForm.tsx`, etc.). No inline multi-component declarations.                                                                                                                |
| **6. Performance & Bundle Budget**   |     **PASS**      | Procedural Web Audio API synthesis adds 0 KB asset weight. Production chunks kept strictly under 250 KB limit.                                                                                                                                                |
| **7. Blast Radius Guard**            |     **PASS**      | All modifications strictly confined to `src/features/pomodoro/`, `src/config/`, `src/core/`, `src/styles/`, and `specs/001-pomodoro-timer/`. Tooling scripts remain untouched.                                                                                |

**Verdict**: All constitutional gates verified and passing.

---

## Project Structure

### Documentation (`specs/001-pomodoro-timer/`)

```text
specs/001-pomodoro-timer/
├── plan.md                             # This file (master implementation plan)
├── research.md                         # Phase 0: Technical decisions & research findings
├── data-model.md                       # Phase 1: Domain entities, invariants & state machine
├── quickstart.md                       # Phase 1: End-to-end runnable validation scenarios
├── contracts/                          # Phase 1: Application ports & component prop contracts
│   ├── timer-service.contract.ts       # ITimerService interface
│   ├── audio-port.contract.ts          # IAudioNotificationPort interface
│   ├── persistence-port.contract.ts    # IPersistencePort interface
│   ├── task-service.contract.ts        # ITaskService interface
│   └── ui-contracts.contract.ts        # UI component props contracts
├── SPEC_AUDIT.md                       # Spec quality audit report (Score: 98.5%)
├── spec.md                             # Feature specification
└── tasks.md                            # Phase 2 output (generated by /speckit.tasks)
```

### Source Code (`src/`)

```text
src/
├── config/
│   └── env.ts                          # Centralized typed environment configuration
├── core/
│   └── utils/
│       ├── id-generator.ts             # Deterministic / unique ID generation
│       └── time-formatter.ts           # MM:SS string formatting & date helpers
├── features/
│   └── pomodoro/
│       ├── domain/                     # Pure business logic (zero browser dependencies)
│       │   ├── entities.ts             # TimerState, Task, HistoryEntry, UserPreferences
│       │   ├── value-objects.ts        # TimerMode, TimerStatus, SoundAlertProfile, StorageHealth
│       │   └── timer-engine.ts         # Pure countdown delta calculation & transition rules
│       ├── application/                # Application services & ports
│       │   ├── timer-service.ts        # Concrete TimerService orchestrating interval engine
│       │   ├── task-service.ts         # Concrete TaskService managing tasks & history records
│       │   └── ports.ts                # AudioNotificationPort and PersistencePort definitions
│       ├── infrastructure/             # Concrete platform adapters
│       │   ├── web-audio-adapter.ts    # Procedural AudioContext oscillator synthesis
│       │   ├── local-storage-adapter.ts# Safe localStorage adapter with quarantine logic
│       │   └── memory-storage-adapter.ts# In-memory fallback for private mode / quota errors
│       └── ui/                         # React presentation layer (Atomic Design)
│           ├── hooks/
│           │   └── usePomodoro.ts      # UI container hook binding services to React state
│           ├── components/
│           │   ├── TimerDisplay.tsx    # Circular progress ring and MM:SS readout
│           │   ├── TimerControls.tsx   # Start, Pause, Resume, Reset, Skip button group
│           │   ├── TaskForm.tsx        # Task title input and Pomodoro count selector
│           │   ├── TaskList.tsx        # Scrollable active tasks container
│           │   ├── TaskItem.tsx        # Individual task row with active badge and complete CTA
│           │   ├── TaskHistory.tsx     # Chronological grouped history entries viewer
│           │   ├── SettingsDialog.tsx  # Modal for interval durations and sound configuration
│           │   ├── StorageBanner.tsx   # Dismissible notification banner for degraded storage
│           │   └── EmptyState.tsx      # Friendly illustration and CTA for empty lists
│           └── PomodoroContainer.tsx   # Top-level screen assembling feature components
├── styles/
│   └── tokens.css                      # Google Stitch canonical CSS design tokens (:root)
├── App.tsx                             # Application shell
├── main.tsx                            # React 19 root bootstrap
└── index.html                          # HTML shell with accessibility metadata

tests/
├── unit/
│   ├── timer-engine.test.ts            # Mathematical delta and transition unit tests
│   ├── timer-service.test.ts           # Service lifecycle and event dispatch tests
│   ├── task-service.test.ts            # Task creation, validation and history recording tests
│   ├── local-storage-adapter.test.ts   # Serialization, corruption quarantine and quota tests
│   └── web-audio-adapter.test.ts       # Procedural tone synthesis and fallback tests
└── integration/
    └── pomodoro-flow.test.tsx          # Full component integration test with user interactions
```

**Structure Decision**: Clean Architecture vertical slice under `src/features/pomodoro/` combined with Atomic Design in `ui/components/`. Completely satisfies unidirectional dependency rules, function complexity thresholds ($\le 10$), and strict file isolation.

---

## Complexity Tracking

> **No constitutional violations detected.**  
> All architectural decisions directly serve concrete requirements:

- Hexagonal Ports (`AudioNotificationPort`, `PersistencePort`): Essential for isolating untrusted browser APIs (`AudioContext`, `localStorage`) and providing automated unit testability and graceful degradation.
- Timestamp Delta Ticker: Essential for meeting the $<1\text{ second}$ drift requirement (SC-002) in background tabs and during OS sleep.
- Procedural Audio: Eliminates 150–300 KB of binary asset weight, strictly preserving bundle size budgets.
