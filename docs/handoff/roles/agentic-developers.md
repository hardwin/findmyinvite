# Agentic Developers — v0.9 handoff to v1.0

**Agent-workflow owner: TO ASSIGN.** Make Cursor takeover reproducible and supervised. AI-assisted engineering is part of the delivery process; it is not an implemented customer product feature.

## Remote execution model

The user will operate from a phone after losing access to this laptop and ChatGPT. A local IDE session is not evidence of a running cloud agent. Verify the chosen Cursor remote/cloud workflow can access the private GitHub repository, execute commands and persist commits while the laptop is offline. If it cannot, GitHub's browser-based Actions workflow remains the documented deploy path; coding and provider administration still require appropriate remote access.

Start from [README_CURSOR](../../../README_CURSOR.md). Build a task context from the [status ledger](../STATUS.md), [architecture](../ARCHITECTURE.md), [runbook](../RELEASE-RUNBOOK.md) and current commit. Provider secrets must remain in provider configuration or authorized secret stores, never in prompts or repository files.

## Before release

- Give each agent a bounded file scope, expected behavior and stop condition. Coordinate shared-files edits through review.
- Keep deployment authority separate from implementation work: one human-approved operator changes the production gate and issues the release.
- Require evidence labels for mock tests, preview tests and actual production checks.
- Prohibit arbitrary production SQL, catalog publication or broad dependency updates as incidental agent actions.
- Record persistent decisions in Git; a conversation memory is not a durable operational dependency.

## During and after release

Do not run competing branch pushes during deployment: existing CI concurrency can cancel a run. If an agent fails or loses context, resume from the committed task state and provider evidence rather than rerunning every mutation. Retry creation using the intended idempotent contract; never assume all external operations are idempotent.

**Completion:** the phone operator can identify the exact candidate, invoke the approved workflow, read results and reach a human escalation owner without the laptop. Record any unresolved remote-access dependency as a launch blocker. Use [15 tests](../PREDEPLOY-15.md) for release acceptance, not self-reported agent confidence.
