# Product Owner — v1.0 scope and acceptance

The release target is **14 September 2026, 23:59 IST**. Own the accepted customer behavior for this version and reject scope that would make the launch unverifiable.

**Catalog hold:** do not release template rows while the old production deployment retains its 21:00 offer window. Future deployment settings have been revised to 23:59; the runtime itself must be verified first because preview and production share CMS data.

## Accountabilities

| Product decision | Named owner | Required artifact |
| --- | --- | --- |
| v1.0 acceptance and scope exceptions | TO ASSIGN — Product Owner | Accepted behavior and release exceptions |
| Catalog eligibility and content | TO ASSIGN — catalog owner | Approved IDs and rights evidence |
| Defect priority | TO ASSIGN — Product Owner with QA | Ordered blocker list |

## Accepted experience

A guest host selects a released design, edits invitation details, publishes a durable page at /chosen-slug, saves a private management/recovery key, and receives RSVPs in the host view. A separate guest browser can open the public page. The recovery key is equivalent to management access; losing it has no email or account recovery path.

Free creation is scheduled for 30 days from the revised launch. Regular list prices remain Classic ₹1,199 and Royal ₹1,499. Payment collection, authentication, variations UI, cross-device draft synchronization and paid entitlement are outside this version. A downloaded recovery key enables management on another device; that is different from automatic account synchronization.

## Before, during and after launch

**Before:** map each of the [15 predeployment tests](../PREDEPLOY-15.md) to acceptance evidence. Confirm source-branding limitations, approved catalog entries, real contact details, invitation lifetime, IST event timing and the four-photo constraint are accurately communicated. Existing local drafts remain local until explicitly published; no silent migration is promised.

**During:** review critical defects with QA and the Release Manager. Broken publication, lost saved content, unauthorized management, invisible RSVPs and unusable mobile controls block launch. Cosmetic gaps may be accepted only with an owner and recorded follow-up.

**After:** turn support findings into a prioritized backlog. First candidates include better recovery, response pagination beyond the latest 1,000, isolated staging and retention operations. Preserve existing saved formats when changing editor behavior.

## Evidence and escalation

Use actual cloud and browser evidence, not a successful build alone. The historical live check used an administratively seeded draft and does not establish fresh active-offer creation. Track verified completion of the host/guest journey, defect severity and escaped defects; unavailable measurement is marked unknown.

Read [status](../STATUS.md), [runbook](../RELEASE-RUNBOOK.md), [risks](../DECISIONS-AND-RISKS.md) and [Cursor takeover](../../../README_CURSOR.md). Escalate scope changes to Product Manager and launch blockers to Release Manager.
