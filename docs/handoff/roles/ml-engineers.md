# ML Engineers — v0.9 handoff to v1.0

**Future ML owner: TO ASSIGN.** There is no machine-learning model, inference endpoint, vector database or training pipeline in this release. Support launch data quality and future feasibility without creating a new production dependency.

## Launch responsibilities

Review [architecture](../ARCHITECTURE.md) and the [data-engineering handoff](data-engineers.md). Distinguish measured product behavior from assumptions: no verified audience model, conversion baseline, traffic forecast or recommendation performance is available. Do not label template sorting or CMS metadata as AI personalization.

Help Product define potential future questions such as which design categories users prefer, where editing fails, and whether recommendations improve successful publication. For each question, state the minimum data needed, the permission basis requiring operator review, and a non-ML baseline. Guest RSVP text, names, emails and private photos are not automatically authorized training data.

## Before and during release

- Add no model SDKs, remote inference calls or tracking scripts to the launch candidate.
- Validate that proposed analytical outputs exclude capability keys and unnecessary personal information.
- Give Data Engineering an event-definition proposal rather than a new pipeline: selection, editing completion, publication attempt and confirmed success must be distinguished.
- Keep test examples synthetic. Preview and production share data resources, so experimentation can affect live records.

If asked to diagnose a launch problem, use deterministic application traces and aggregate counts. Do not infer model problems in a system with no model.

## After release

Produce a short feasibility brief only after the product has a usable baseline: candidate use case, dataset availability, privacy review, offline evaluation, cost ceiling and success metric. Require a holdout or controlled comparison before claiming improvement. Media rights must also cover any proposed model use; permission to display an asset would not by itself establish training permission.

**Completion:** no unsupported AI claims or hidden data collection in v1, plus a clearly deferred roadmap item with owner and evidence requirements. Refer to [decisions and risks](../DECISIONS-AND-RISKS.md) and [handoff index](../index.md).
