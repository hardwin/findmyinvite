# Testers — v0.9 handoff to v1.0

**QA owner: TO ASSIGN.** Own reproducible results for the [15 mandatory pre-deployment cases](../PREDEPLOY-15.md). The required outcome is a working guest product, not merely a passing build.

## Test model

Separate three evidence classes: automated tests with mocked provider responses, historical checks against actual cloud services, and checks on the final release candidate. Record the commit, deployment URL, environment, timestamp, browser and result with every execution. An old pass does not certify a changed offer window or catalog.

The previous cloud test administratively seeded a draft; public creation was blocked by the old offer schedule. Fresh public creation during an active offer remains an explicit acceptance item. All seeded templates were unpublished at that check. Never change production's clock or publish unapproved media simply to make a test pass.

## Before release

- Use synthetic names, emails and images. Development and preview share live resources, so use unique slugs and clean up records and files.
- Cover 390 × 844 mobile and 1440 × 900 desktop. Check overflow, image crops, readable controls, opening/skip, scratch, slideshow, calendar time and available music.
- Test host and guest in separate browser contexts. A guest must not see the management key, private inbox or unpublished photos.
- Exercise edited details after reload and recovery on a clean browser, not only within the original browser's local storage.
- Capture actual API status and error behavior for invalid ownership, collision, unsupported uploads and unavailable configuration.

## During and after release

Run the short smoke journey on the actual custom domain after deployment. Do not infer correct TLS, redirect or API routing from the Vercel preview URL. Report a failed core journey or access-control check immediately to the Release Manager; attach redacted evidence, never capability URLs or guest emails.

**Completion:** all 15 cases have an honest status, evidence and owner. Blocked and not-run are distinct from passed. Follow [STATUS](../STATUS.md) for current gaps and [RELEASE-RUNBOOK](../RELEASE-RUNBOOK.md) for rollback authority.

## Immediate schedule hazard

The 14:42 UTC handoff snapshot found the existing production deployment still using the old 21:00 IST start. Project environment values were updated for future deployments only. Because the catalog is shared across environments, publishing a template for a preview test could also unlock creation on that old production deployment at 21:00. Keep the shared catalog unpublished until at/after 23:59 and verification of the new production runtime. Use isolated staging for earlier creation tests. Older deployment URLs may remain reachable after an alias switch. See the latest [status ledger](../STATUS.md) before acting.
