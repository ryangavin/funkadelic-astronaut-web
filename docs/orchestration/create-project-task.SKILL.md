---
name: create-project-task
description: Prepare and create a new role-tagged project task with a self-contained initial brief. Use for new Developer, Research, or Review tasks, not ordinary follow-ups, task execution, or ongoing planning.
---

# Create Project Task

Package the user's intent once so a new task can work independently.

Use an existing owner when one is already known; send the change directly instead of creating a duplicate. When the user is still describing a batch of changes, wait until the brief is ready.

For a new task, select the matching saved project and role: Developer for implementation, Research for investigation, Review for review. Prefix the title with that role. Use the saved checkout by default, preserving the user's current branch choice; use a worktree when requested. Resolve only missing project or ownership information needed to dispatch safely.

## Initial brief

Adapt this template into a concise, natural message. Include only relevant fields, but transfer enough context for someone who has not seen the conversation:

> Complete [concrete outcome] in [project and checkout/branch].
>
> Context: [relevant facts, user decisions, references, constraints, and rejected approaches that matter].
>
> Done means [observable result]. [Include shared preview location and authorized final actions when relevant.]
>
> Work directly from this brief and the task's accumulated context. Treat follow-ups as changes to the same assignment; revisit setup only when context is missing, stale, or conflicting. Choose checks appropriate to the change: verify the requested Git state for a branch operation, rendered appearance for visual work, and affected behavior for functional changes. Use the existing shared server when provided.
>
> When you finish, become blocked, or need a user decision, send a concise report to [originating task] using send_message_to_thread. Include the useful outcome, relevant verification or limitation, and whether work continues. For longer work, leave concise commentary in your own task at meaningful progress.

The completed brief is the working instruction; no separate execution skill is required. This skill ends at creation. Ordinary follow-ups contain the requested change and new context, without repeating the template or onboarding. Completion tracking remains the originating task's responsibility.
