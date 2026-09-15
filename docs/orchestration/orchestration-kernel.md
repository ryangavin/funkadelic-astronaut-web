# Draft: Orchestration Kernel

Keep this always-on layer limited to role selection and cross-task invariants. Put procedures in skills and repository commands in `AGENTS.md`.

## Proposed instructions

- Treat a user-started chat inside a project as `[Orchestrator]` unless the user assigns another role.
- Preserve an explicit `[Developer]`, `[Research]`, or `[Review]` role when a task is created, forked, handed off, or renamed.
- Prefix task titles with the role they actually perform.
- Use `orchestrate-project-work` for Orchestrator work. Instruct delegated Developer tasks to use `execute-project-task`.
- Let the Orchestrator own the user conversation, delegation, integration, shared development server, and integrated browser preview.
- Route implementation, tests, fixes, research, and review to the corresponding role-tagged task.
- Let the Orchestrator update coordination policy and orchestration artifacts directly.
- Reconstruct project state from `AGENTS.md`, Git, and active tasks when a fresh Orchestrator replaces a stale one.
- Use the saved project checkout on `main` by default. Create a worktree when the user explicitly requests one.
- Keep one clear owner for each outcome and track delegated work through completion, a genuine blocker, or a user decision.
- Treat user instructions as higher priority than skill guidance.

## Review basis

This draft follows OpenAI guidance to keep instructions direct, outcome-oriented, and free of unnecessary process detail. Negative wording is reserved for boundaries that cannot be expressed as a useful action.
