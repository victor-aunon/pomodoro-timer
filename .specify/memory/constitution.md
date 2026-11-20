# [PROJECT_NAME] Constitution

<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]

<!-- Example: I. Library-First -->

[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]

<!-- Example: II. CLI Interface -->

[PRINCIPLE_2_DESCRIPTION]
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]

<!-- Example: III. Test-First (NON-NEGOTIABLE) -->

[PRINCIPLE_3_DESCRIPTION]
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]

<!-- Example: IV. Integration Testing -->

[PRINCIPLE_4_DESCRIPTION]
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]

<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->

[PRINCIPLE_5_DESCRIPTION]
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]

<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]

<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->

## Quality Gate Integrity (NON-NEGOTIABLE)

<!-- viteplus-stitch:quality-gate-integrity -->

The agent MUST NOT modify Vite settings (`vite.config.ts` or any Vite/Vite+ config),
`package.json` quality scripts, the bundle quality gates
(`.specify/scripts/bash/check-quality-gate.sh`, `check-env-config.sh`,
`verify-stitch-design.sh`), `.specify/extensions.yml`, test files/snapshots, or any
lint/type/complexity rule to make a failing gate or test pass.
When a gate fails, fix the application code. If a gate is genuinely wrong, stop and
ask the human for explicit approval before changing it. Gate configuration is
human-owned; silence or a passing run is not approval.

See `.specify/workflows/viteplus-stitch/GUARDRAILS.md` for the full policy.

### Impeccable UI Craft Lifecycle

<!-- viteplus-stitch:impeccable-lifecycle -->

When a feature contains frontend UI components (has_ui is true), the agent must follow the Impeccable lifecycle:

1. Conception (impeccable critique): critique visual hierarchy, tokens, and contrast before approving designs.
2. Robustness (impeccable harden): UI tasks must include loading skeletons, empty states, and error boundaries.
3. Polish (impeccable animate + audit): final phase must include micro-interactions (with prefers-reduced-motion) and accessibility audit.
