# Architecture

`vclaw-video-core` is the clean-room foundation for the next VideoClaw runtime.

## Current layers

1. `src/cli/`
   - user-facing command entrypoints
2. `src/video/provider-platform/`
   - provider route descriptors
3. `src/video/provider-status.ts`
   - environment, dependency, and route health reporting
4. `src/video/pipeline-manifests/`
   - built-in stage definitions for `storyboard` and `director`
5. `schemas/video/`
   - canonical machine-readable contracts
6. `src/video/*`
   - portfolio management, reporting, templates, readiness, character consistency, execution planning, adapter-backed execution runtime, and Obsidian export
   - `prompt-quality.ts` — six Seedance-handbook anti-pattern checks (adjective soup, multiple actions, multiple camera moves, style-word overload, literary emotion language, overlong prompts) wired into `director-preflight`, warnings by default and promotable to blocking errors via `DIRECTOR_STRICT_PROMPT_QUALITY=1`
   - `dialogue-fit.ts` — short-clip dialogue duration checks wired into `director-preflight`, warnings by default and promotable to blocking errors via `DIRECTOR_STRICT_DIALOGUE_FIT=1`
   - `generation-telemetry.ts` — route/task/config/cost/timing/output telemetry recorded into project event ledgers and used by cost estimates when completed Seedance USD samples exist

## Principles

1. No silent fallback across materially different provider paths
2. Every stage should eventually have a canonical artifact
3. CLI output should be machine-readable by default
4. Architecture remains small until the contracts are stable

## Near-term roadmap

1. Add more review/publish automation around generated outputs
2. Keep tightening the transport contracts without widening orchestration complexity
3. Expand higher-level operator ergonomics on top of the current runtime
4. Keep docs/help output aligned with the actual product surface
5. Add selective provider-specific polish only where real runs justify it

## Current implemented flow

1. `video init`
   - creates canonical project workspace
2. `video brief`
   - writes `brief.json`
   - marks `brief` checkpoint complete
3. `video storyboard`
   - writes `storyboard.json`
   - marks `storyboard` checkpoint complete
4. `video assets`
   - writes `asset-manifest.json`
   - marks `assets` checkpoint complete
5. `video review`, `video review-ui`, or `video review-autopilot`
   - writes `review-report.json`
   - marks `review` checkpoint to completed, retry-required, or failed
   - allows publish handoff only when the saved report has `verdict: "pass"` and `metrics.publishReady: true`
6. `video publish`
   - writes `publish-report.json`
   - marks `publish` checkpoint complete or failed
7. `video status`
   - resolves next stage from manifest + checkpoints
8. `video doctor-project`
   - validates checkpoint/artifact consistency
9. `video doctor-portfolio`
   - validates the whole portfolio
10. `video metrics|workload|next-actions|dependencies`
   - portfolio management views
11. `video report|report-snapshot|report-history|report-diff|trends|export-csv`
   - reporting and snapshot history
12. `video export-obsidian|sync-obsidian|scaffold-obsidian-vault`
   - Obsidian operations layer
13. `video playbook-list|playbook-show`
   - bundled prompt/playbook registry
14. `video prompt-lib-list|prompt-lib-show`
   - imported prompt/reference library
15. `video template-save|template-list|template-show|clone-plan|clone-init|storyboard-from-clone`
   - reusable template / clone bridge
16. `video clone-execute`
   - template -> storyboard -> execution-seed -> runtime in one flow
17. `video readiness`
   - artifact, character-consistency, image-input, scene-selection, and director identity-sheet readiness before runtime execution
18. `video plan|produce|execute-status`
   - route selection, payload generation, dry-run validation, built-in or external adapter execution, polling, output ingestion, native Seedance direct transport, native Veo direct transport, and prompt-guided execution context
19. `video character-add|character-list|character-show|character-consistency`
   - character profile subsystem and continuity enforcement
20. `video reference-sheet-add|list|show|bind|validate`
21. `video candidates-list|candidates-show|select-candidate|reject-candidate|reroll-scene|chain-from|unchain|candidates-migrate-from-assets`
    - per-scene candidate registry + operator selection state + chain-from-prev
    - partial rerun via `produce --scene <n>`
    - role-tagged reference sheets with closed-vocabulary validation and per-scene binding
22. `video cost-estimate`
    - static default estimate with optional historical Seedance USD telemetry override

Compatibility aliases:

1. `video execution-plan` -> `video plan`
2. `video execute` -> `video produce`
