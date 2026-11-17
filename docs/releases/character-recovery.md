# Paid character job recovery

A paid Temple Wedding customer remained on “Creating your characters” after the
provider completed generation. Status lookups returned HTTP 503 repeatedly, and
the provider removed the unsaved output after its retention window.

The fix requests synchronous file output for up to 60 seconds and persists
returned files immediately, including when the provider still labels the result
processing. Background polling and signed callbacks remain available for longer
generations. Raw and prepared images use private persistent Blob keys.

Once raw output is saved, preparation no longer contacts the provider. Failed
preparation preserves that raw file, and retry resumes it without generating a
replacement or consuming a redo. Known predictions are also reused on retry;
unconfirmed submissions continue to require support before regeneration.

Leases and unchanged status polls no longer reset the last-progress timestamp.
Ten minutes without progress produces a recoverable failure instead of endless
polling. Character generation now shows non-blocking status text, and a polling
network failure exposes the retry action.

Validation covers provider outages, stalled jobs, sync file persistence,
provider-independent raw recovery, retained files after preparation failure,
ambiguous submission safety, existing payment/ownership/redo SQL invariants, and
the production build. Customer recovery and live deployment are verified
separately; test success is not evidence that a customer's images are ready.
