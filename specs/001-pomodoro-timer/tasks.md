# Tasks: Pomodoro Timer with Sound Notifications and Task History

**Input**: Design documents from `/specs/001-pomodoro-timer/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `data-model.md`, `contracts/`, `research.md`, `quickstart.md`, `designs/`  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.  
**Lifecycle**: Conforms to the Impeccable UI Craft Lifecycle (Conception critique, Robustness hardening, Polish animations & accessibility audit).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths are specified in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, typed environment configuration, design tokens, and core shared utilities.

- [x] T001 Configure centralized typed environment config in src/config/env.ts with schema validation for application settings
- [x] T002 [P] Initialize core utility for time formatting (MM:SS string formatting and date helpers) in src/core/utils/time-formatter.ts
- [x] T003 [P] Initialize core utility for deterministic and collision-free unique ID generation in src/core/utils/id-generator.ts
- [x] T004 [P] Setup and verify Stitch canonical design tokens CSS variables (:root) with dark/light themes and WCAG AA contrast in src/styles/tokens.css
- [x] T005 [P] Initialize root HTML shell with accessible viewport, title, and metadata in index.html

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities, value objects, application ports, memory fallback adapter, and application shell.

**⚠️ CRITICAL**: Core foundation that MUST be complete before ANY user story can be implemented.

- [x] T006 [P] Define core value objects in src/features/pomodoro/domain/value-objects.ts with enum values: TimerMode ('work' | 'shortBreak' | 'longBreak'), TimerStatus ('idle' | 'running' | 'paused' | 'completed'), SoundAlertProfile ('bell' | 'chime' | 'marimba'), and StorageHealth (status: 'healthy' | 'degraded', storageType: 'localStorage' | 'memory', warningMessage: string | null)
- [x] T007 [P] Define domain entity types and interfaces in src/features/pomodoro/domain/entities.ts quoting data-model constraints: TimerState (durationSeconds: "Integer, 60 <= val <= 7200 (1 to 120 minutes)", remainingSeconds: "Integer, 0 <= val <= durationSeconds", startedAt: "Epoch timestamp in milliseconds or null if idle", targetEndTime: "Epoch timestamp in ms (>= startedAt) or null", completedCyclesCount: "Non-negative integer (>= 0)", activeTaskId: "Valid UUID string or null"), Task (id: "Non-empty UUID v4 or timestamp-derived unique ID", title: "Trimmed string, length 1 <= len <= 100. Rejects whitespace-only", estimatedPomodoros: "Integer, 1 <= val <= 20. Default: 1", completedPomodoros: "Integer, >= 0. Default: 0", status: "'active' | 'completed' | 'archived'", createdAt and updatedAt: "Epoch timestamp in milliseconds"), HistoryEntry (id: "Non-empty UUID or unique identifier", taskId: "Valid task ID or null if session was unassigned", taskTitle: "Snapshot string, length 1 <= len <= 100. Default: 'General Focus Session'", mode: "Must be 'work'", durationMinutes: "Integer, 1 <= val <= 120", completedAt: "Epoch timestamp in milliseconds"), and UserPreferences (workDurationMinutes: "Integer, 1 <= val <= 120, Default: 25", shortBreakDurationMinutes: "Integer, 1 <= val <= 60, Default: 5", longBreakDurationMinutes: "Integer, 1 <= val <= 60, Default: 15", longBreakInterval: "Integer, 1 <= val <= 12, Default: 4", autoStartBreaks: "boolean, Default: false", autoStartPomodoros: "boolean, Default: false", sound: "SoundSettings with volume: Normalized float between 0.0 and 1.0, Default: 0.8")
- [x] T008 [P] Define application port interfaces (IPersistencePort, IAudioNotificationPort) in src/features/pomodoro/application/ports.ts matching contracts in specs/001-pomodoro-timer/contracts/persistence-port.contract.ts and audio-port.contract.ts
- [x] T009 [P] Implement MemoryStorageAdapter conforming to IPersistencePort in src/features/pomodoro/infrastructure/memory-storage-adapter.ts for safe in-memory fallback during private mode or quota exhaustion
- [x] T010 [P] Implement React defensive ErrorBoundary with reload CTA and accessible alert presentation in src/features/pomodoro/ui/components/ErrorBoundary.tsx
- [x] T011 Setup root application bootstrap and mount point with ErrorBoundary and design tokens import in src/main.tsx and src/App.tsx

**Checkpoint**: Core domain models, port interfaces, memory storage adapter, and React root shell established. User story implementation can now begin.

---

## Phase 3: User Story 1 - Core Pomodoro Interval Cycle & Timer Controls (Priority: P1) 🎯 MVP

**Goal**: Deliver core countdown timer engine with wall-clock delta calculation (zero drift in background tabs/sleep), controls (Start, Pause, Resume, Reset, Skip with confirmation), and automatic transition between Work, Short Break, and Long Break (4-cycle milestone).

**Independent Test**: Start timer from 25:00 Work, pause and resume, reset back to 25:00, let timer reach 00:00 and observe auto-transition to Short Break (05:00) with tally 1; repeat to 4 completed cycles and observe transition to Long Break (15:00); trigger Skip button to verify confirmation dialog advances interval without incrementing tally.

### Tests for User Story 1

- [x] T012 [P] [US1] Unit test for pure timer countdown calculations, wall-clock delta sync, and mode transition rules in tests/unit/timer-engine.test.ts
- [x] T013 [P] [US1] Unit test for ITimerService lifecycle events (start, pause, resume, reset, skip confirmation, tick) in tests/unit/timer-service.test.ts

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement pure domain countdown engine and cycle transition state machine in src/features/pomodoro/domain/timer-engine.ts with delta calculation remainingSeconds = max(0, ceil((targetEndTime - Date.now()) / 1000)) and mode transition rules enforcing completedCyclesCount % longBreakInterval === 0 for long break
- [x] T015 [US1] Implement concrete TimerService implementing ITimerService in src/features/pomodoro/application/timer-service.ts managing 250ms multi-rate ticker, visibilitychange clock reconciliation, and state subscriber notifications
- [x] T016 [P] [US1] Implement TimerDisplay component in src/features/pomodoro/ui/components/TimerDisplay.tsx featuring 320px SVG radial progress ring, 88px tabular monospace MM:SS readout (font-variant-numeric: tabular-nums), active mode badge, and active task display conforming to TimerDisplayProps
- [x] T017 [P] [US1] Implement TimerControls component in src/features/pomodoro/ui/components/TimerControls.tsx providing Start, Pause, Resume, Reset, and Skip controls with keyboard hotkey badge hints ([Space], [R], [S]) and skip confirmation dialog conforming to TimerControlsProps
- [x] T018 [US1] Implement usePomodoro custom hook timer state slice binding TimerService to React state with ticker subscription and keyboard shortcuts listener in src/features/pomodoro/ui/hooks/usePomodoro.ts
- [x] T019 [US1] Integrate TimerDisplay and TimerControls into top-level container in src/features/pomodoro/ui/PomodoroContainer.tsx with dynamic page document title updates (MM:SS - Mode | Pomodoro)

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently. The timer runs, pauses, resets, skips with confirmation, and transitions between work and break intervals without drift.

---

## Phase 4: User Story 2 - Distinct Sound Notifications & Audio Controls (Priority: P2)

**Goal**: Auditory completion alerts using procedural Web Audio synthesis (0 KB asset weight) with distinct Work Complete (Digital Bell) and Break Complete (Soft Chime) sounds, Marimba option, master toggle, volume control (0.0 to 1.0), sound preview, and graceful autoplay/device fallback.

**Independent Test**: Trigger session completion in work mode to verify "Digital Bell" plays; trigger session completion in break mode to verify "Soft Chime" plays; preview Marimba in sound settings; test volume slider at 0% and muted state (no audio plays); simulate blocked audio context to verify non-blocking visual fallback pulse/banner.

### Tests for User Story 2

- [x] T020 [P] [US2] Unit test for Web Audio oscillator synthesis, profile envelopes, volume gain, and autoplay rejection fallback in tests/unit/web-audio-adapter.test.ts

### Implementation for User Story 2

- [x] T021 [US2] Implement WebAudioAdapter implementing IAudioNotificationPort in src/features/pomodoro/infrastructure/web-audio-adapter.ts utilizing AudioContext, OscillatorNode, and GainNode for Digital Bell (880Hz + 1760Hz), Soft Chime (C5, E5, G5 triad), and Marimba (440Hz + 660Hz), with lazy user-gesture initialization, volume constraint ("Volume must be between 0.0 and 1.0"), and catch-all fallback returning false
- [x] T022 [US2] Integrate IAudioNotificationPort into TimerService in src/features/pomodoro/application/timer-service.ts to trigger work and break completion sounds when countdown reaches 00:00
- [x] T023 [US2] Add visual completion pulse animation and audio fallback alert trigger in src/features/pomodoro/ui/components/TimerDisplay.tsx for when audio is disabled, blocked, or unavailable

**Checkpoint**: User Stories 1 AND 2 work together. Timers provide distinct procedural audio alerts upon interval completion with zero binary asset overhead and visual fallback resilience.

---

## Phase 5: User Story 3 - Task Association & Task History Tracking (Priority: P3)

**Goal**: Link focus intervals to user tasks, manage active task list (create, select active, complete, delete), auto-increment task completed Pomodoro counter, and maintain an immutable chronological task history log grouped by date with clear confirmation.

**Independent Test**: Create task with valid title and estimated Pomodoros (verify empty title rejection "Task title must be between 1 and 100 characters." and estimated bounds "Estimated Pomodoros must be an integer between 1 and 20."); select task as focus target; complete work interval to verify task completed count increments and history entry appears in grouped history list; mark task complete; clear history with confirmation modal.

### Tests for User Story 3

- [x] T024 [P] [US3] Unit test for TaskService task validation rules, task completion lifecycle, active task selection, and history recording in tests/unit/task-service.test.ts

### Implementation for User Story 3

- [x] T025 [US3] Implement TaskService implementing ITaskService in src/features/pomodoro/application/task-service.ts enforcing constraints on task.title ("Task title must be between 1 and 100 characters.") and task.estimatedPomodoros ("Estimated Pomodoros must be an integer between 1 and 20."), managing task state transitions, and recording immutable HistoryEntry records ("General Focus Session" default)
- [x] T026 [P] [US3] Implement TaskForm component in src/features/pomodoro/ui/components/TaskForm.tsx with title input (1-100 characters, character count indicator), estimated Pomodoros selector (1-20), inline validation errors, and submit button conforming to TaskFormProps
- [x] T027 [P] [US3] Implement TaskItem component in src/features/pomodoro/ui/components/TaskItem.tsx with active target badge, completed/estimated tally ("X of Y Pomodoros"), accessible complete/delete touch targets (minimum 40x40px), and keyboard focus styling conforming to TaskItemProps
- [x] T028 [P] [US3] Implement EmptyState component in src/features/pomodoro/ui/components/EmptyState.tsx providing friendly illustration, clear message, and call-to-action button conforming to EmptyStateProps
- [x] T029 [US3] Implement TaskList component in src/features/pomodoro/ui/components/TaskList.tsx rendering scrollable task list or EmptyState ("No tasks yet. Create a task to organize your focus sessions.") conforming to TaskListProps
- [x] T030 [P] [US3] Implement TaskHistory component in src/features/pomodoro/ui/components/TaskHistory.tsx grouping completed sessions chronologically by date (Today, Yesterday, Earlier), showing total daily focus minutes, delete entry actions, and clear history with confirmation modal, or EmptyState ("No focus sessions completed yet. Start your first Pomodoro to track progress.") conforming to TaskHistoryProps
- [x] T031 [US3] Integrate TaskService actions and state into usePomodoro hook in src/features/pomodoro/ui/hooks/usePomodoro.ts, connecting active task selection to timer intervals and completed work session recording
- [x] T032 [US3] Connect TaskForm, TaskList, and TaskHistory into PomodoroContainer.tsx in src/features/pomodoro/ui/PomodoroContainer.tsx supporting route switching between dashboard (/) and history (/history)

**Checkpoint**: User Stories 1, 2, and 3 work together. Users can create tasks, associate active work sessions, see completed counters update, and inspect chronological productivity history.

---

## Phase 6: User Story 4 - Timer Settings Customization & Local Persistence (Priority: P4)

**Goal**: Customize interval durations (work: 1-120 min, short break: 1-60 min, long break: 1-60 min, cycle count: 1-12) and auto-start toggles; persist all settings, active tasks, and history in localStorage with defensive schema validation, corrupt data quarantine, and transparent MemoryStorageAdapter fallback with dismissible storage health banner.

**Independent Test**: Change interval settings and reload browser to verify persistence; test out-of-bounds duration validation errors; test "Reset to Defaults" confirmation modal; corrupt localStorage key to verify quarantine to pomodoro_quarantine_* key and fallback to defaults with StorageBanner notification.

### Tests for User Story 4

- [x] T033 [P] [US4] Unit test for LocalStorageAdapter schema validation, corrupt payload quarantine, quota exhaustion handling, and MemoryStorageAdapter fallback in tests/unit/local-storage-adapter.test.ts

### Implementation for User Story 4

- [x] T034 [US4] Implement LocalStorageAdapter implementing IPersistencePort in src/features/pomodoro/infrastructure/local-storage-adapter.ts with namespaced keys (pomodoro_timer_v1_prefs, pomodoro_timer_v1_tasks, pomodoro_timer_v1_history), defensive deserialization quarantine (pomodoro_quarantine_<key>_<timestamp>), DOMException catch routing to MemoryStorageAdapter, and health state event broadcasting
- [x] T035 [P] [US4] Implement SettingsDialog modal component in src/features/pomodoro/ui/components/SettingsDialog.tsx with duration inputs enforcing constraints ("Work duration must be between 1 and 120 minutes.", "Short break must be between 1 and 60 minutes.", "Long break must be between 1 and 60 minutes.", "Long break interval must be between 1 and 12 cycles."), auto-start checkboxes, sound profile select with Preview CTA, volume slider ("Volume must be between 0.0 and 1.0."), and Reset to Defaults with confirmation prompt conforming to SettingsDialogProps
- [x] T036 [P] [US4] Implement StorageBanner component in src/features/pomodoro/ui/components/StorageBanner.tsx displaying a non-blocking, dismissible warning banner when storage health degrades to memory-only mode conforming to StorageBannerProps
- [x] T037 [US4] Wire LocalStorageAdapter into TimerService, TaskService, and usePomodoro in src/features/pomodoro/ui/hooks/usePomodoro.ts for automated state rehydration on launch and reactive persistence on state mutations
- [x] T038 [US4] Integrate SettingsDialog and StorageBanner into src/features/pomodoro/ui/PomodoroContainer.tsx responding to settings route (/settings) or modal trigger button

**Checkpoint**: All four user stories are complete. Preferences, tasks, and history persist reliably with zero crash risk under storage errors.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Impeccable UI Craft Robustness (loading skeletons, error boundaries), Polish (micro-interactions with @media (prefers-reduced-motion: reduce), keyboard accessibility), End-to-End integration tests, and verification scripts.

- [x] T039 [P] Implement loading skeleton placeholders for tasks, history, and timer initial hydration in src/features/pomodoro/ui/components/LoadingSkeleton.tsx
- [x] T040 [P] Implement end-to-end integration test verifying complete Pomodoro flow (start, pause, complete, task linking, history logging, persistence rehydration) in tests/integration/pomodoro-flow.test.tsx
- [x] T041 Add micro-interactions (button hover lift, active scale, focus-visible rings) and CSS animation guards strictly respecting @media (prefers-reduced-motion: reduce) in src/styles/tokens.css
- [x] T042 Perform WCAG 2.1 AA accessibility audit verifying color contrast ratios (>= 4.5:1), keyboard focus indicators, screen reader ARIA labels, and touch target minimums (>= 40x40px)
- [x] T043 Verify deterministic quality gate compliance and architecture boundaries by running .specify/scripts/bash/check-quality-gate.sh
- [x] T044 Verify bundle budget compliance (chunk <= 250 KB, total <= 1000 KB) by running .specify/scripts/bash/check-bundle-budget.sh
- [x] T045 Verify route and component contracts against routes-manifest.json by running .specify/scripts/bash/check-contracts.sh
- [x] T046 Validate end-to-end user scenarios per specs/001-pomodoro-timer/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion (T001–T005) — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T006–T011).
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (T012–T019).
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion (T012–T019). Can run in parallel with US2 if staffed.
- **User Story 4 (Phase 6)**: Depends on User Story 1, 2, and 3 completion (T012–T032).
- **Polish & Quality Gates (Phase 7)**: Depends on all user stories being complete (T012–T038).

### User Story Dependencies

- **User Story 1 (P1)**: Core foundation. Requires domain entities (`entities.ts`, `value-objects.ts`) and ports (`ports.ts`). Delivers MVP.
- **User Story 2 (P2)**: Integrates with `TimerService` completion callback from US1. Can be developed once US1 interfaces exist.
- **User Story 3 (P3)**: Integrates with `TimerService` active task state and `PomodoroContainer.tsx`. Can be developed once US1 interfaces exist.
- **User Story 4 (P4)**: Persists data structures from US1, US2, and US3. Best implemented after models and services are stable.

### Within Each User Story

- Unit/contract tests MUST be written and verified before or alongside implementation.
- Domain models and engine logic before application services.
- Application services before UI presentation components.
- Presentational components before container integration.
- Story complete and independently tested before advancing checkpoint.

### Parallel Opportunities

- **Phase 1 (Setup)**: T002, T003, T004, and T005 can all execute in parallel.
- **Phase 2 (Foundational)**: T006, T007, T008, T009, and T010 can all execute in parallel.
- **Phase 3 (User Story 1)**: Tests T012 and T013 run in parallel; T014, T016, and T017 can run in parallel before container assembly.
- **Phase 4 (User Story 2)**: Test T020 and implementation T021 can execute independently.
- **Phase 5 (User Story 3)**: Test T024 can run in parallel; T026, T027, T028, and T030 can all be created in parallel.
- **Phase 6 (User Story 4)**: Test T033 can run in parallel; T035 and T036 can run in parallel.
- **Phase 7 (Polish)**: T039 and T040 can run in parallel.

---

## Parallel Example: User Story 3

```bash
# Launch independent component implementation tasks in parallel:
Task T026: "Implement TaskForm component in src/features/pomodoro/ui/components/TaskForm.tsx"
Task T027: "Implement TaskItem component in src/features/pomodoro/ui/components/TaskItem.tsx"
Task T028: "Implement EmptyState component in src/features/pomodoro/ui/components/EmptyState.tsx"
Task T030: "Implement TaskHistory component in src/features/pomodoro/ui/components/TaskHistory.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T011) — **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T012–T019)
4. **STOP and VALIDATE**: Verify timer starts, pauses, resumes, resets, skips with confirmation, and transitions between work and break intervals without drift.
5. Demonstrate or release functional core MVP.

### Incremental Delivery

1. Setup + Foundational $\to$ Foundation ready.
2. User Story 1 (MVP) $\to$ Functional countdown and interval cycles.
3. User Story 2 $\to$ Procedural sound synthesis and distinct completion alerts.
4. User Story 3 $\to$ Task creation, active focus linking, and chronological history tracking.
5. User Story 4 $\to$ Custom durations, auto-start options, and defensive local storage.
6. Polish & Gates $\to$ Impeccable animations, accessibility audit, bundle budget, and contract verification.

### Parallel Team Strategy

With multiple developers:

- **Dev Team**: Completes Setup (Phase 1) and Foundational (Phase 2) together.
- Once Foundational is complete:
  - **Developer A**: User Story 1 (Core Timer Engine & Display)
- Once User Story 1 contracts are established:
  - **Developer A**: User Story 2 (Audio Notification Port & WebAudioAdapter)
  - **Developer B**: User Story 3 (Task Service & Task Components)
  - **Developer C**: User Story 4 (LocalStorageAdapter & Settings Dialog)
- Stories integrate cleanly through hexagonal ports and atomic components.

---

## Notes

- All tasks strictly follow the `- [ ] [TaskID] [P?] [Story?] Description with file path` checklist format.
- `[Story]` label maps directly to US1, US2, US3, or US4 for traceability.
- Clean Architecture layer boundaries: `domain/` $\to$ `application/` $\to$ `infrastructure/` / `ui/`.
- No inline multi-component declarations; strictly one component per file (`react/no-multi-comp`).
- Avoid arbitrary Tailwind classes; use design tokens in `tokens.css`.
