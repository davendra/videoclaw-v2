---
name: brand-presenter
description: Generic narrated presenter-video workflow for turning a slide deck or structured topic into an intro/slides/outro presentation using a branded host profile.
---

# Brand Presenter

Create a narrated presentation-style video from a PDF or slide deck using a
branded presenter profile for intro and outro scenes.

## When To Use

Use this workflow when:

1. a slide deck or PDF needs to become a narrated video
2. the workflow should include a recurring host character or presenter
3. a legacy presenter-specific skill such as `davendra-presenter` or
   `nex-presenter` was requested and should map to one shared implementation

## Generic Flow

1. extract slides
2. generate narration for each slide
3. generate intro and outro presenter dialogue
4. prepare presenter images or bundled assets
5. animate slides
6. generate presenter video segments
7. synthesize narration / voice-change presenter scenes
8. assemble final video with music and transitions

## Brand Profile Inputs

Each brand/presenter profile should provide:

1. presenter name
2. Go Bananas character id when applicable
3. default intro/outro assets
4. preferred voice id / TTS settings
5. any brand-specific title-card or overlay assets

## Current Bundled Profiles

1. `skills/davendra-presenter/`
2. `skills/nex-presenter/`

Use those directories as brand-profile overlays on top of this generic
workflow.

## Guardrails

1. Prefer repo-local skill paths over old `.claude/...` assumptions.
2. Keep presenter-specific constants in the brand-profile directories instead of
   duplicating the whole workflow.
3. Treat the compatibility presenter skills as aliases, not as the canonical
   place to evolve the workflow.
