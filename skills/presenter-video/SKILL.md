---
name: presenter-video
description: Create presenter-led narrated videos from PDFs, slide decks, briefings, or scorecards using one of the built-in personas: Davendra, Nex, or Bunty. Use when the user wants a host-led walkthrough rather than a generic cinematic/ad workflow.
---

# Presenter Video

Canonical presenter-led video skill for VideoClaw.

This skill consolidates the older presenter-specific flows for Davendra, Nex, and Bunty.

## When to Use

- The input is a PDF, slide deck, scorecard, or structured visual brief
- The user wants a presenter-hosted intro/outro plus narrated slide/video sections
- The user explicitly asks for Davendra, Nex, or Bunty
- The output should feel like a hosted explainer, briefing, or recap

## Persona Selection

Pick the persona that best matches the request:

- **Davendra**
  - business, founder, professional explainers
  - warm, trusted presenter tone
- **Nex**
  - tech briefings, software, AI, product commentary
  - sharper modern “tech host” framing
- **Bunty**
  - cricket scorecards, sports recap, character-led commentary
  - high-personality, intentionally theatrical output

If the user does not choose:

- PDF / business / professional topic -> `davendra`
- tech / AI / software / startup topic -> `nex`
- cricket / scorecard / match report -> `bunty`

## Preferred Workflow

1. Confirm the source material:
   - PDF / deck / scorecard path
   - topic / subject
   - any persona override
2. Choose the presenter persona.
3. Draft presenter intro/outro plus slide narration.
4. Reuse the existing persona-specific assets/scripts already in the repo.
5. Hand post-production to `video-post` if thumbnails, variants, or archive are needed.

## Existing Persona Resources

Use these folders for implementation resources:

- `personas/davendra/`
- `personas/nex/`

The persona-specific folders remain the place for assets and special scripts. This skill is the canonical front door; Bunty uses the shared `scripts/video/stitch_bunty.py` pipeline.

## Related Skills

- `video-framework`
- `video-post`
- `movie-director`
- `creative-brief`
