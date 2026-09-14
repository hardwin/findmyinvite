# Interns — v0.9 handoff to v1.0

**Supervisor: TO ASSIGN.** Help with repeatable review tasks while keeping release and guest data under named supervision. Start with the [handoff index](../index.md) and [status](../STATUS.md); ask your supervisor to assign one bounded task.

## Suitable first tasks

- Check approved public pages for broken links, misspellings, source-brand wording and layout issues at the required desktop/mobile sizes.
- Compare visible copy with the approved free-offer schedule and regular prices. Report discrepancies; do not invent policies, testimonials or support contacts.
- Reproduce a documented issue using synthetic event details and attach a redacted screenshot with browser, viewport and URL path.
- Check that documentation links resolve and that a fresh reader can find the release checklist, owner and escalation path.

Use [PREDEPLOY-15](../PREDEPLOY-15.md) with supervision for functional tests. Follow the expected result exactly and distinguish passed, failed, blocked and not run. A screenshot of the homepage does not prove publishing or RSVP persistence.

## Boundaries

Never place a recovery link, guest email, API secret or environment file in a ticket or group chat. Do not access production tables, alter DNS, publish CMS rows, rotate credentials or click a production deploy action as an exploratory task. Development and preview currently share production resources; even a test record needs a coordinated name and cleanup owner.

Do not promise that the service is live, free forever, fully identical to the reference or equipped with payments/accounts. Read the actual current status before answering a stakeholder question.

## Report format

Record the page or file, exact steps, expected versus observed result, evidence and impact. Give the report to your supervisor, who assigns severity and an implementation owner. Do not chase broad visual rewrites during launch.

**Completion:** the assigned review is reproducible and its evidence contains no private data. The [Cursor README](../../../README_CURSOR.md) explains remote handover; the [Release Manager](release-manager.md) owns launch authorization, not the person who discovers or fixes an issue.
