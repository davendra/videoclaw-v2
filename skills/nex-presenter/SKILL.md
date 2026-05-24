---
name: nex-presenter
description: Compatibility alias for the generic brand-presenter workflow using the Nex asset/voice profile.
---

# Nex Presenter

This legacy skill name is kept for compatibility. Use it when an existing
workflow, prompt, or operator still refers to `nex-presenter`.

## What It Maps To

Use the generic presenter workflow in:

- `skills/brand-presenter/SKILL.md`

Then apply the Nex-specific brand profile:

1. presenter identity: `Nex`
2. Go Bananas character id: `98`
3. bundled brand assets under `skills/nex-presenter/assets/`
4. brand episode helper under `skills/nex-presenter/scripts/brand_episode.py`

## Why This Exists

The original repo had multiple presenter skills with the same underlying
workflow structure but different brand/character constants. The clean-room repo
keeps the legacy entry point for discoverability while centralizing the generic
workflow in one place.
