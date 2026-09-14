# Cybersecurity — v0.9 handoff to v1.0

**Security owner: TO ASSIGN.** Review actual trust boundaries and contain critical exposure. This document is a review plan, not a penetration-test certificate or compliance claim. Read [architecture](../ARCHITECTURE.md) and [risk register](../DECISIONS-AND-RISKS.md).

## Security model

There are no accounts in v1. Possession of the private management capability grants control. The client stores the secret and can produce a recovery link; Supabase stores its SHA-256 hash. The fragment in a management URL is consumed by the application. Anyone receiving that recovery link can become the effective owner, and a lost key has no implemented identity-based recovery.

The API uses a Supabase service role, which bypasses RLS. RLS and revoked browser grants prevent direct browser table access but do not replace the API's token verification. Public invitation URLs are shareable and are not a confidentiality mechanism. RSVP identities are owner-only data.

## Before release

- Verify cross-invitation token rejection, unauthenticated inbox denial and no hash/key leakage in public JSON, logs, screenshots or analytics.
- Check private Blob reads against invitation publication, expiry and current photo references. Removing or unpublishing an image must revoke guest access.
- Review upload size, accepted formats and file-signature validation; arbitrary URLs must not become executable or trusted content.
- Inspect tracked files/build output for secrets. Do not include recovery links or provider credentials in incident tickets.
- Verify expected rate-limit behavior and that missing trusted production request identity fails safely. Rate limiting is not a full abuse or bot-prevention service.

## Incident response

Stop promotion and escalate confirmed unauthorized access, exposed secrets or guest-data leakage to the Release Manager and operator. Preserve minimal redacted evidence; coordinate credential rotation and affected invitation containment without destroying forensic context. Document user-impact and communications decisions with Risk & Audit.

There is no complete CSP, formal security certification, automated expired-media cleanup or established key-rotation/recovery product to claim. **Completion:** results for relevant [pre-deployment tests](../PREDEPLOY-15.md), disposition of critical findings and named incident coverage. Follow the [runbook](../RELEASE-RUNBOOK.md) for release control.
