# FindMyInvite handoff library · v0.9 → v1.0

**Planned launch: 14 September 2026, 11:59 PM IST. Current status: pre-deployment candidate; release gates remain open.** This library is the authoritative handoff for a team continuing without the original laptop or ChatGPT. Markdown and Mermaid render in GitHub and remain usable from a phone. Historical root launch/iteration documents are background, not current approval evidence.

## Read in this order

1. [Cursor entry point](../../README_CURSOR.md) — vision, implementation history, takeover prompt and constraints.
2. [Current status and evidence](STATUS.md) — what is live, what was verified, what remains blocked.
3. [Access and laptop-independent takeover](ACCESS-AND-TAKEOVER.md) — prove cloud/mobile permissions before leaving.
4. [Decisions and risks](DECISIONS-AND-RISKS.md) — product scope, business gates and operational exposure.
5. [Architecture and data model](ARCHITECTURE.md) — trust boundaries, API, schema and limitations.
6. [Release runbook](RELEASE-RUNBOOK.md) — prelaunch, mobile Actions release, containment, rollback and post-ops.
7. [15 pre-deployment test cases](PREDEPLOY-15.md) — executable cases with expected outcomes and evidence rules.
8. [Release record](RELEASE-RECORD.md) — fill owners, exact commit, approvals, test results and actual deployment evidence.

## One document for each role

| Role | Document | Primary responsibility |
| --- | --- | --- |
| CEO | [CEO](roles/ceo.md) | Business scope, rights, launch decision |
| Architect | [Architect](roles/architect.md) | System boundaries, compatibility and tradeoffs |
| Release Manager | [Release Manager](roles/release-manager.md) | Single release command, evidence and rollback coordination |
| CTO | [CTO](roles/cto.md) | Engineering readiness and operational risk |
| CMO | [CMO](roles/cmo.md) | Evidence-based launch positioning and campaign gates |
| Team Leaders | [Team Leaders](roles/team-leaders.md) | Work allocation, interfaces and escalation |
| Software Developers | [Software Developers](roles/software-developers.md) | Focused code fixes and build discipline |
| Testers | [Testers](roles/testers.md) | Release-case execution and defect evidence |
| DevOps | [DevOps](roles/devops.md) | Cloud delivery, DNS, environments and recovery |
| Cybersecurity | [Cybersecurity](roles/cybersecurity.md) | Access boundaries, secret handling and incident containment |
| Data Engineers | [Data Engineers](roles/data-engineers.md) | Schema, privacy, integrity, backups and retention |
| ML Engineers | [ML Engineers](roles/ml-engineers.md) | Data readiness and explicit deferral of unimplemented ML |
| AI Agents | [AI Agents](roles/ai-agents.md) | Grounded execution, evidence and bounded authority |
| Agentic Developers | [Agentic Developers](roles/agentic-developers.md) | Reliable tool workflows and agent handoffs |
| Product Owners | [Product Owners](roles/product-owner.md) | Acceptance and release-scope decisions |
| Product Managers | [Product Managers](roles/product-manager.md) | User value, feedback and next-release priorities |
| Program Managers | [Program Managers](roles/program-manager.md) | Cross-workstream dependency coordination |
| Project Managers | [Project Managers](roles/project-manager.md) | Execution tracker, owners and timebox |
| Designers | [Designers](roles/designers.md) | Released-design fidelity, mobile usability and provenance |
| Interns | [Interns](roles/interns.md) | Supervised, reversible checks and documentation |
| Core Engineers | [Core Engineers](roles/core-engineers.md) | Critical invariants and systemic failure handling |
| Sales | [Sales](roles/sales.md) | Accurate product/demo promises and feedback |
| Marketing | [Marketing](roles/marketing.md) | Approved channels/content and measured acquisition |
| Human Resources | [Human Resources](roles/human-resources.md) | Coverage, onboarding and responsible handover |
| Finance | [Finance](roles/finance.md) | Free-period economics, budget and future commerce |
| Risk & Audit | [Risk & Audit](roles/risk-audit.md) | Gate evidence, risk disposition and traceability |

No specific employees are assumed to hold these roles. Assign actual names and backups in the release record; multiple roles may be held by one person. Documents are prepared for distribution through the repository; no external messages have been sent.

## Evidence ledger

| Artifact | Meaning |
| --- | --- |
| [handoff-state.json](evidence/handoff-state.json) | Timestamped live configuration, domain, deployment and catalog snapshot; includes old-runtime/new-project schedule mismatch |
| [live-cloud-checks.json](evidence/live-cloud-checks.json) | Historical real-provider checks using a seeded temporary draft, not fresh public creation |
| [live-browser-checks.json](evidence/live-browser-checks.json) | Historical homepage viewport checks only |
| [Handoff validation](evidence/HANDOFF-VALIDATION.md) | Documentation links/role count, code schedule checks, tests/build and handoff delivery evidence |

Later release evidence belongs with the exact candidate and timestamp. Keep secrets, private recovery links, personal RSVP data, confidential contracts and raw production backups outside Git in approved restricted storage. Link only safe evidence references.

## Source-of-truth rule

Actual code plus timestamped runtime evidence establish behavior. The release record establishes decisions and approvals. This library explains both; it does not override a new user instruction or a later verified release record. The current free launch does not implement a payment gateway, account authentication, automatic billing, ML models or a separate CMS product. Read the risk register before adding those to customer-facing claims.
