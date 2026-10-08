# transcripts/ — NOT INCLUDED

The FMI bots' chat transcripts could not be exported:
- The `ReadTranscript` tool (cursor namespace) was not available to the agent that built this zip ("namespace cursor not found").
- The box's local transcript store (`/home/box/agent-data/agent-transcripts/`) holds only older Eventsblr/events bots and empty subagent logs — none of the FMI bots (Orchestrator, ReCreate, Spatial Continuity, Video Director, Dubai-Church-Wedding, Maniraj-Engagement, Benjamin, Sarah, Asset Producer, Template Compiler, Image Director, Assembly Editor, StoryBoard Manager, Process Architect). A full-text search for FMI paths found 0 matches.

What substitutes for them in this zip:
- `process-docs/PROCESS_CHANGELOG.md` (dated decisions incl. Ashok's quotes), every `STATE.json`, `ORCHESTRATOR_*` / `RECREATE_*` / `ASSET_PRODUCER_*` packets (many quote Ashok's chat instructions with times), `PARAMETER_DIFF_REPORT.md` files, `logs/TELEGRAM_SEND*.json` (Telegram message ids).
- `bot-personas/*/profile.json` (each bot's full brief) and `bot-personas/*/attachments/` (files shared in chat).
- `legacy-fmi/agent-tool-outputs/` (raw tool-call outputs saved by FMI bots).

If the transcripts are exported later (e.g. by Grok Bot's main agent), drop them here as `<bot-name>.jsonl`.
