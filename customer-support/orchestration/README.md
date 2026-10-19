# Sales and service orchestration

The first implementation is active: admitted WhatsApp messages use a durable,
revision-checked sales/service workflow. See [WORKFLOWS.md](../docs/WORKFLOWS.md).
Prices come from video_templates. Customer claims and operator-verified facts
are separate. No payment provider, production engine or automatic team notification
is implemented. Extend from fixture-based tests instead of adding model promises.
