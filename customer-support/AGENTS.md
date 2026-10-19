# Work on FMI customer support

- Scope: this module, its support migration, tests, and linked documentation.
  Keep the website/Assembly model and existing invitation tables unchanged.
- Read README.md, docs/ARCHITECTURE.md, and docs/OPERATIONS.md first.
- Source of truth is this repo. Do not fix only `~/.hermes`; change this module,
  test, run the installer, and restart the intended gateway profile.
- Use the existing FMI Supabase deployment when explicitly working on the live
  system; use a separate local/test database for routine development. Preview
  website environments share production data. Never run destructive broad SQL.
- Keep every customer table RLS-enabled and inaccessible to `anon` and
  `authenticated`. Backend RPC is security invoker and service-role-only.
- Never infer identity from message text or display name. Never grant account or
  invitation access based only on a WhatsApp number.
- The user explicitly authorized customer/assistant text history and per-customer
  continuity on 2026-10-18. Keep it in the private support tables. Attachments,
  reasoning, tool logs, embeddings, and marketing consent remain outside scope.
- Secrets, WhatsApp session files, local databases, and real customer fixtures
  stay out of Git, prompts, logs, and test output. Use synthetic identities.
- No personal/global Hermes memories or general terminal/filesystem tools for
  customer conversations. Future tools must be scoped and independently authorized.
- Preserve the exact fallback sentence and simple-English behavior. New Hermes
  versions can add new system messages; review locale/filter coverage on upgrade.
- Tests: `python -m unittest discover -s customer-support/tests -v`.
  For repository integration run `npm run test:server` and `npm run build` too.
- Do not claim RAG, a human handoff, a dashboard, or scheduled follow-up exists
  until it is implemented and verified. Keep the roadmap honest.
