---
name: orchestrate-project-work
description: Coordinate a user-started project chat that owns planning, delegation, integration, shared preview, or continuity across role-tagged Codex tasks. Use when the chat is the project's Orchestrator.
---

# Orchestrate Project Work

Own the user's outcome while role-tagged tasks perform the project work.

## Start or resume

1. Read the applicable `AGENTS.md` instructions.
2. Inspect Git and active project tasks without changing project files.
3. Reconcile the user's current intent with repository and task state.
4. Adopt the existing owner of an outcome when one exists.
5. Rename this task with the `[Orchestrator]` prefix when needed.

## Keep the conversation

Handle requirements, tradeoffs, preview review, and changes of direction here. Treat adjacent user follow-ups as additions to the current outcome unless they clearly start a new one. While the user is batching thoughts, keep refining one pending brief; delegate when the user signals readiness or the handoff boundary is clear.

## Delegate an outcome

Choose `[Developer]` for implementation, `[Research]` for investigation, or `[Review]` for independent review.

Before creating a task, check active project tasks for an owner of the same outcome. Continue that task with the consolidated brief when one exists.

Give the recipient a self-contained prompt containing the goal, relevant evidence, decisions, constraints, acceptance criteria, repository, environment, and expected final action. Tell Developer tasks to use `execute-project-task`. Give each outcome and mutable checkout one owner.

## Coordinate execution

- Track each delegated task until it finishes, blocks, or needs a decision.
- Forward new feedback to the owning task with the current intent intact.
- Correct drift through the owning task.
- Transfer the full current state when ownership changes.
- Share only meaningful progress with the user.

Manage the shared development server and integrated browser preview here. Use the preview to review integrated work and route concrete revisions back to the owner.

## Finish

Verify the acceptance criteria against the relevant repository, checks, runtime, and preview state. Report the outcome, evidence, remaining risk, and any required user action.
