# Product Manager — product strategy and release outcomes

**v1.0 target: 14 September 2026, 23:59 IST.** This release tests demand for guest-created digital wedding invitations and reliable RSVP collection. It does not validate a paid business model simply by displaying prices.

## Decision ownership

| Decision | Named owner | Output |
| --- | --- | --- |
| Target customer and offer positioning | TO ASSIGN — Product Manager | Approved one-page proposition |
| Outcome priorities and roadmap | TO ASSIGN — Product Manager | Ranked evidence-backed backlog |
| Post-trial commercial model | TO ASSIGN — Product Manager with Finance | Approved pricing/entitlement proposal |

The first hypothesis is that hosts can produce and share an attractive invitation without account friction. The countervailing risk is recovery: a lost private key cannot be reset through email. Test whether clear recovery instructions are sufficient before claiming the guest model is effortless.

## Before, during and after launch

**Before:** align Product Owner, Design, Sales and CMO on the actual scope. Candidate media includes copied source assets with unresolved rights; available inventory must be based on clearance and live CMS publication. No audience estimate or competitor traffic figure is verified in this handoff.

The intended free creation period ends **14 October 2026, 23:59 IST**. The server then blocks new creation unless a later commercial release changes that behavior. Existing invitations do not receive automatic charges. Regular displayed prices are Classic ₹1,199 and Royal ₹1,499; payment collection and entitlement remain future work.

**During:** distinguish launch defects from feature requests. Protect the core host → publish → guest → RSVP → host flow and avoid adding accounts or checkout during the deployment window. Record customer-facing limitations and support workarounds accurately.

**After:** review completed publications, guest response activity, support demand and qualitative feedback. Define a paid-release decision before the trial ends: ownership/account model, order lifecycle, gateway onboarding, refunds, tax/invoicing decisions and reconciliation. Set a named owner and date rather than leaving pricing as a promise.

## Measurement model

Funnel: eligible catalog view → edit started → valid publish → recovery saved → invitation shared → RSVP received. Instrumentation is not established merely because this funnel is defined. Avoid collecting guest PII or management keys in analytics. Ask Data Engineering for event definitions and an explicit privacy review before tracking.

References: [status](../STATUS.md), [15 checks](../PREDEPLOY-15.md), [risks](../DECISIONS-AND-RISKS.md), [handoff index](../index.md). Escalate release readiness to Release Manager and offer/budget decisions to CEO.
