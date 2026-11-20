# Pomodoro Focus Timer 🍅

A distraction-free, WCAG AA compliant Pomodoro productivity application engineered with Clean Hexagonal Architecture, procedural Web Audio synthesis, and dynamic focus transitions.

> **Autonomous Engineering Notice**: This entire project was conceived, architected, specified, and implemented **100% autonomously** using the **[speckit-viteplus-stitch-bundle](https://github.com/victor-aunon/speckit-viteplus-stitch-bundle)** workflow — demonstrating end-to-end Spec-Driven Development (SDD) from requirements and design tokens to strict layer-isolated code and automated verification.

---

## 🌟 Key Highlights

- **100% Autonomous Delivery**: Generated using the [speckit-viteplus-stitch-bundle](https://github.com/victor-aunon/speckit-viteplus-stitch-bundle) pipeline, executing autonomous planning, interface contracting, design-token mapping, and test-driven implementation.
- **Clean Hexagonal Architecture**: Strict separation of concerns with domain entities, application ports, infrastructure adapters, and decoupled presentation layers.
- **0 KB Asset Sound Engine**: Procedural Web Audio API sound synthesis (custom bell, soft chime, and marimba alert profiles) with zero external media files.
- **Delight & Flow Psychology**: Tailored micro-interactions and transition banners honoring the dual rhythm of deep focus:
  - *Pomodoro Completed*: Restorative celebration wave and well-earned breather prompts.
  - *Break Finished*: Focus ignition pulse encouraging immediate re-entry into flow.
- **Adaptive Vector Favicon**: Handcrafted SVG favicon dynamically adjusting contrast and saturation across system light and dark themes via `prefers-color-scheme`.
- **Bulletproof Resilience**: In-memory storage fallback with health warnings when `localStorage` is restricted or disabled.
- **WCAG 2.1 AA Compliant**: High-contrast ratios (≥ 4.5:1), keyboard navigation (`[Space]` to toggle, `[R]` to reset), accessible ARIA live regions, and `prefers-reduced-motion` safety.

---

## 🏛️ Architectural Blueprint

The codebase enforces unidirectional dependency boundaries:

```
src/
├── core/                        # Shared cross-cutting primitives
│   └── utils/                   # ID generation & time formatting
├── config/                      # Environment & global config
├── features/pomodoro/
│   ├── domain/                  # Pure business rules & countdown engine
│   │   ├── entities.ts          # Core domain models
│   │   ├── timer-engine.ts      # Pure countdown math & state transitions
│   │   └── value-objects.ts     # Immutable validation primitives
│   ├── application/             # Application services & Port interfaces
│   │   ├── ports.ts             # Inversion-of-control contracts
│   │   ├── timer-service.ts     # Countdown orchestration & clock reconciliation
│   │   └── task-service.ts      # Task lifecycle & history logging
│   ├── infrastructure/          # Adapters implementing application ports
│   │   ├── local-storage-adapter.ts
│   │   ├── memory-storage-adapter.ts
│   │   └── web-audio-adapter.ts # Web Audio API procedural synthesis
│   └── ui/                      # Presentation layer (Container & Presentational)
│       ├── PomodoroContainer.tsx
│       ├── components/          # Atomic UI components
│       └── hooks/usePomodoro.ts # Reactive orchestration hook
└── styles/
    └── tokens.css               # Google Stitch canonical design tokens
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development Server

Start the Vite+ local development server:

```bash
pnpm dev
```

### Automated Testing

Run the test suite powered by Vitest (50+ unit and integration tests):

```bash
pnpm test
```

### Code Quality & Layer Verification

Run strict type checking, architectural boundary linting, and quality gates:

```bash
pnpm check
pnpm check-quality
```

---

## 🤖 Workflow & Tooling

This project was built with:
- **Workflow**: [speckit-viteplus-stitch-bundle](https://github.com/victor-aunon/speckit-viteplus-stitch-bundle)
- **Bundler & Runtime**: [Vite+](https://github.com/vitejs/vite) (`vite-plus`)
- **Frontend**: React 19 & TypeScript (Strict Mode)
- **Design Foundation**: Canonical Google Stitch design tokens (WCAG AA compliant)
- **Testing**: Vitest
