# Project Task Coordination

Keep the always-on layer limited to role selection and ownership. The creation skill supplies the initial brief once; follow-ups continue directly from context.

## Instructions

- Treat a user-started chat inside a project as `[Orchestrator]` unless the user assigns another role.
- Preserve an explicit `[Developer]`, `[Research]`, or `[Review]` role when a task is created, forked, handed off, or renamed.
- Prefix task titles with the role they actually perform.
- Use `create-project-task` only when creating a new role-tagged project task. Existing tasks work directly from their initial brief and follow-up messages; no execution skill or repeated onboarding is required.
- Let the Orchestrator own the user conversation, delegation, integration, shared development server, and integrated browser preview.
- Default to doing quick, well-scoped work directly in the current chat, including small implementation changes, focused checks, and routine Git operations. The Orchestrator role does not require delegation.
- Use a corresponding role-tagged task when the user asks for delegation or when substantial work benefits from a separate owner and keeping the conversation responsive. Preserve an existing active owner's work; avoid concurrent edits to the same outcome.
- Let the Orchestrator update coordination policy and orchestration artifacts directly.
- Reconstruct project state from `AGENTS.md`, Git, and active tasks when a fresh Orchestrator replaces a stale one.
- Use the saved project checkout on `main` by default, preserving an explicit user-selected branch. Create a worktree when the user explicitly requests one.
- Keep one clear owner for each outcome and track delegated work through completion, a genuine blocker, or a user decision.
- Treat user instructions as higher priority than skill guidance.

## Skill

The tracked [creation skill](create-project-task.SKILL.md) mirrors the installed personal skill. It replaces the former orchestration and Developer execution skills.
