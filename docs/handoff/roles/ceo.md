# CEO — v0.9 handoff / v1.0 decision

Target: **14 September 2026, 23:59 IST**. This is a conditional free guest launch, not a paid launch. The candidate is online at findmyinvite.vercel.app; custom-domain readiness, the releasable catalog, operating contacts and commercial hosting suitability remain release decisions. Consult the current [status](../STATUS.md); the earlier 21:00 schedule is superseded.

**Catalog freeze:** the 20:12 IST infrastructure snapshot still had an older production runtime scheduled for 21:00. Project settings were changed to 23:59 for future deployments only. Do not publish CMS templates until production itself is verified on the revised schedule; environments share the same database.

## Decisions and accountability

| Decision | Named accountable person | Required record |
| --- | --- | --- |
| Final go/no-go and accepted residual risks | TO ASSIGN — CEO/business owner | Signed decision in the release issue |
| Commercial permission for every public design/media item | TO ASSIGN — rights owner | Permission evidence or removal decision |
| Operating budget, business identity and support ownership | TO ASSIGN — business owner | Approved limits and real contact details |

The product lets a host edit a wedding invitation, publish a shareable page, and receive durable RSVPs without creating an account. It must not be announced as supporting payments, account recovery or unlimited service. Current regular list prices are Classic ₹1,199 and Royal ₹1,499; eligible creation is free for 30 days. There is no automatic charge at the end.

## Before, during and after launch

**Before:** obtain the Release Manager's completed [15 checks](../PREDEPLOY-15.md), rights evidence, support readiness and a cost owner. All 13 seeded templates were unpublished at handoff; an empty catalog is not a customer-ready launch. Unpublished catalog rows do not remove borrowed media already reachable in the public prototype. Decide whether to release only cleared designs or postpone.

**During:** authorize the exact candidate and scope in writing. The deadline does not override a failed privacy, recovery, data durability or domain gate. Allow a smaller controlled audience rather than unsupported claims about full availability.

**After:** review the first operating report at launch +1 hour and next morning: successful creation and RSVP outcomes, incidents, customer questions and measured cost. Decide when to broaden exposure.

## Business evidence and escalation

Track completed invitation publications, observed guest responses, support demand and cost per invitation when measurement exists. No verified user counts, revenue or conversion baseline is available. Do not treat demo traffic as demand.

Escalation: Release Manager → CEO for scope/date decisions; Security lead → CEO immediately for potential private-key or guest-data exposure. Data incidents and unsafe releases require containment before publicity.

Read [runbook](../RELEASE-RUNBOOK.md), [decisions and risks](../DECISIONS-AND-RISKS.md), and [Cursor takeover](../../../README_CURSOR.md).
