# Access and laptop-independent takeover

**Current status: not proven.** Documentation and a GitHub push do not authenticate Cursor. The founder should complete this before leaving the laptop, then repeat a short smoke check on the phone using mobile data. All release operations can be cloud-hosted if the relevant accounts and permissions are available.

## Required access proof

| Service | Prove from phone/cloud | Minimum role / fallback |
| --- | --- | --- |
| Cursor | Open [cursor.com/agents](https://cursor.com/agents), connect/select private `hardwin/findmyinvite`, start an agent that reads this file and reports the commit | Repository read/write and a usable cloud environment; fallback is GitHub UI for deployment only |
| GitHub | Read repo, view Actions jobs, dispatch workflow, edit Actions repository variables, merge reviewed changes | Permissions for each action; repo read alone is insufficient |
| Vercel | Open team/project, deployments/logs/env names/domain status, perform authorized rollback | Project operational access; billing owner separately for plan changes |
| Supabase | Find `findmyinvite` through Vercel integration or Supabase dashboard; inspect tables and approved catalog rows | Authorized project operator; never grant all engineers service-role secrets |
| Hostinger | Open `findmyinvite.com` DNS management and view required records | Domain/DNS administrator; verify 2FA works away from laptop |
| Support / incident contact | Send and receive a test message through the chosen support channel using authorized accounts | Named support and fallback operator, agreed availability |

Cursor Cloud Agents run in remote environments and do not need the local machine online. Use that mode, not a desktop agent left running. Read [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent) and [environment setup](https://cursor.com/docs/cloud-agent/setup). Verify the founder's actual account access; this document does not assert an existing subscription or successful onboarding.

## What to do now on the laptop, if needed

1. Complete any repository connection, SSO, device approval, hardware-key or 2FA steps that cannot be completed from the phone. Verify backup codes are available through the owner's approved secure storage; never commit them.
2. Connect Cursor's cloud environment to the repository and use Node 22. Have it run `npm ci`, read `README_CURSOR.md`, and report `git rev-parse HEAD`. Test a harmless branch change/PR if repository write access is uncertain; do not deploy merely to prove write access.
3. Confirm mobile GitHub Actions dispatch and variable administration. Existing GitHub secrets allow CI deployment without copying Vercel credentials to Cursor. This is the simplest release path.
4. If Cursor must administer Vercel/DB directly, provision only the necessary scoped secrets through Cursor's secure environment settings, with owner authorization. Do not paste the desktop `.env.local`, whole OAuth cache or service-role key into prompts. The release can use human provider dashboards instead.
5. Resolve the chat-shared deployment token: create replacement through Vercel, update GitHub's `VERCEL_TOKEN`, verify preview delivery, then revoke old token. Store ownership/expiry metadata, never values, in the release record. Loss of the laptop is not a reason to copy plaintext tokens into Git.
6. Prove backup/restore access and a second operator. Provide the phone user with provider bookmarks, real support contact and escalation channel through approved secure tools. Do not assume Codex will remain available.

## Secret inventory — names only

| Location | Required names | Notes |
| --- | --- | --- |
| GitHub Actions secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Already stored; values cannot be read back. Replacement is possible with authorized account access |
| Vercel server env | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOB_READ_WRITE_TOKEN`, `RATE_LIMIT_SECRET` | Existing provisioned values; server only. No `VITE_` secret prefix |
| Vercel offer env | `PROMOTION_START_AT`, `PROMOTION_END_AT` | Nonsecret; updated for future deployments to 23:59 bounds |
| GitHub variable | `ENABLE_PRODUCTION_DEPLOY` | Currently false; separate from app availability |

Other marketplace-created database values may exist. Do not copy them all into Cursor; prefer minimal purpose-specific access. GitHub repository permissions granted by Cursor's app need not include editing secrets/variables. A cloud agent should report insufficient permissions and use the documented human mobile UI path rather than request a broad unscoped token.

## Deliberately not transferred

The outer Windows `work/` directory, `node_modules`, `.env.local`, `.vercel`, CLI OAuth sessions, local credential helper, source comparison screenshots, local browser storage and localhost processes are not in GitHub. Original assets needed by the app are in `public/assets`; sanitized operational evidence is in `docs/handoff/evidence`. No essential release step should require an excluded file.

Legacy local drafts are browser data. If the founder needs one tonight, export/save its content or publish it through the validated guest flow and retain its private recovery file securely. The `.vercel.app` and custom domain have separate localStorage; use the private key on the desired origin rather than expecting automatic migration.

## Phone-only failure paths

If Cursor cannot access its cloud environment, use GitHub Actions UI for the already approved commit; coding changes must wait for a functioning cloud editor/agent. If GitHub variable administration, DNS, Supabase catalog or rollback access is absent, contact the assigned backup operator and keep launch on hold. Do not schedule a deployment against an unverified machine or assume the mobile browser can wake a sleeping laptop.

Record each access proof, timestamp, account role (not credentials), fallback and operator in [RELEASE-RECORD.md](RELEASE-RECORD.md). Account connection and permission approvals remain human tasks until actually completed.
