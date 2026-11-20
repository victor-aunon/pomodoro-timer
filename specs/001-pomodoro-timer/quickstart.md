# Phase 1 Quickstart Validation Guide: Pomodoro Timer

**Feature**: `001-pomodoro-timer` (Pomodoro Timer with Sound Notifications and Task History)  
**Date**: 2026-11-19  
**Status**: Ready for Implementation

---

## 1. Overview & Purpose

This quickstart guide outlines deterministic end-to-end validation scenarios that verify the complete lifecycle of the Pomodoro Timer application. It acts as the acceptance benchmark for developers, automated tests, and quality gates.

---

## 2. Prerequisites & Setup

### Environment

- Node.js $\ge 20.0.0$
- Vite+ (`vp`) runtime installed locally or via package dependencies
- Modern Evergreen Browser (Chrome, Firefox, Safari, Edge)

### Execution Setup

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic quality gate (lint, formatting, type check, tests)
npm run check-quality

# 3. Launch local development server
npm run dev
# The application opens at http://localhost:5173
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Work Interval Completion & Short Break Auto-Transition

**Goal**: Verify countdown execution, accurate wall-clock time calculation, audio alert emission, and automatic mode progression.

1. **Setup**:
   - Open application in browser (`http://localhost:5173`).
   - Verify initial display: `25:00` in **Work** mode, status is **Idle**.
2. **Action**:
   - Click the **Start** button.
3. **Expected Results**:
   - Button text toggles to **Pause**.
   - Remaining time counts down second-by-second (`24:59`, `24:58`...).
   - Tab title reflects dynamic time (`24:59 - Work | Pomodoro`).
   - When countdown reaches `00:00`:
     - Digital Bell chime plays at configured volume.
     - Completed Pomodoro tally increments from `0` to `1`.
     - Mode automatically switches to **Short Break** displaying `05:00`.
     - A new record appears in **Task History** titled `"General Focus Session"` (duration: 25 min).

---

### Scenario 2: Active Task Association & Productivity History

**Goal**: Verify task creation, validation boundaries, active task focus, and contextual history logging.

1. **Setup**:
   - Navigate to the **Tasks** panel.
2. **Action**:
   - Attempt to submit an empty task $\to$ Verify inline validation: `"Task title must be between 1 and 100 characters."`
   - Input task title: `"Design Auth Microservice"` and estimate `3` Pomodoros. Click **Add Task**.
   - Click **Select as Focus Target** on the newly created task.
   - Click **Start** on the timer.
3. **Expected Results**:
   - Timer header prominently displays `"Active Focus: Design Auth Microservice"`.
   - On work session completion ($00:00$):
     - The task's completed counter shows `1/3 Pomodoros`.
     - Task History logs a new entry: `"Design Auth Microservice - 25m"`.

---

### Scenario 3: Long Break Milestone (4-Cycle Sequence)

**Goal**: Verify cycle milestone logic after 4 completed focus intervals.

1. **Setup**:
   - In **Settings**, set Work duration to 1 min and Short Break to 1 min for rapid testing.
2. **Action**:
   - Complete 3 full work intervals.
   - Start and complete the 4th work interval.
3. **Expected Results**:
   - Upon the 4th work completion, completed tally reaches `4`.
   - Timer transitions to **Long Break** (`15:00`) instead of Short Break.

---

### Scenario 4: Background Tab & Device Sleep Drift Resilience

**Goal**: Verify that timer synchronizes against absolute system timestamps (`Date.now()`) without drifting.

1. **Action**:
   - Start a 25-minute work interval.
   - Switch to another browser tab or minimize window for 60 seconds.
   - Return to the timer tab.
2. **Expected Results**:
   - Remaining time is exactly `24:00` ($\pm 1$ second), proving wall-clock delta synchronization without cumulative interval throttling drift.

---

### Scenario 5: Defensive Local Persistence & Quota Fallback

**Goal**: Verify state retention across page reloads and graceful in-memory degradation under storage errors.

1. **Persistence Test**:
   - Add task `"Test Persistence"`, complete a work session, and reload the browser page.
   - Verify that the task and historical log are faithfully restored from storage.
2. **Quota Fallback Test**:
   - Simulate storage error (e.g., test in private mode or mock `QuotaExceededError`).
   - Application switches to `MemoryStorageAdapter` seamlessly without throwing uncaught exceptions.
   - A non-intrusive warning banner notifies the user that data will persist for the active session only.

---

## 4. Automated Verification Commands

Run these automated verification checks before declaring tasks complete:

```bash
# 1. Run all unit and integration tests (domain rules, services, adapters)
npm test

# 2. Run deterministic quality gate (Airbnb styling, complexity <= 10, clean architecture)
bash .specify/scripts/bash/check-quality-gate.sh

# 3. Verify bundle budget (chunk <= 250 KB, total <= 1000 KB)
bash .specify/scripts/bash/check-bundle-budget.sh

# 4. Verify route and component contracts
bash .specify/scripts/bash/check-contracts.sh
```

---

## 5. Artifact Cross-References

- **Data Models & State Transitions**: `specs/001-pomodoro-timer/data-model.md`
- **Technical Research & Rationale**: `specs/001-pomodoro-timer/research.md`
- **Service & Port Interfaces**: `specs/001-pomodoro-timer/contracts/`
- **Feature Specification**: `specs/001-pomodoro-timer/spec.md`
