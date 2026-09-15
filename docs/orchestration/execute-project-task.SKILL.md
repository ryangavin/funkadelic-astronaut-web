---
name: execute-project-task
description: Complete a concrete project outcome assigned to a role-tagged Developer task, validate it, and report evidence to the owning Orchestrator. Use for delegated implementation, tests, or fixes.
---

# Execute a Project Task

Complete the delegated outcome in the assigned repository and return evidence the Orchestrator can verify.

## Establish the contract

1. Read the delegated prompt and applicable `AGENTS.md` instructions.
2. Confirm the repository, branch or worktree, working-tree state, scope, and acceptance criteria.
3. Inspect the relevant code and tests while preserving unrelated user changes.
4. Send the Orchestrator the smallest question that resolves any material ambiguity.

## Implement and validate

- Make the smallest coherent change that satisfies every acceptance criterion.
- Follow project patterns and preserve accessibility, responsive behavior, compatibility, data, and user-authored content relevant to the change.
- Use the Orchestrator-owned server for runtime checks when available.
- Run focused checks plus project-required gates.
- For visual work, inspect representative desktop and mobile layouts.
- Review the final diff and working-tree state.

Leave concise commentary when work enters a meaningful phase or encounters a blocker. Fold new feedback into the same outcome and record which earlier direction it supersedes.

## Report

When finished, blocked, or awaiting a decision, send the Orchestrator:

- the useful outcome and whether work continues;
- changed files or artifacts;
- acceptance criteria covered;
- checks and visual QA performed;
- remaining risks or decisions;
- branch or worktree state.

Perform commits, pushes, merges, deployments, or shared-server lifecycle changes only when the delegated prompt assigns that action.
