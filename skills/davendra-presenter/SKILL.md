---
name: davendra-presenter
description: Compatibility alias for the generic brand-presenter workflow using the Davendra asset/voice profile.
---

# Davendra Presenter

This legacy skill name is kept for compatibility. Use it when an existing
workflow, prompt, or operator still refers to `davendra-presenter`.

## What It Maps To

Use the generic presenter workflow in:

- `skills/brand-presenter/SKILL.md`

Then apply the Davendra-specific brand profile:

1. presenter identity: `Davendra`
2. Go Bananas character id: `109`
3. bundled brand assets under `skills/davendra-presenter/assets/`
4. brand episode helper under `skills/davendra-presenter/scripts/brand_episode.py`

## Why This Exists

The original repo had multiple presenter skills with the same underlying
workflow structure but different brand/character constants. The clean-room repo
keeps the legacy entry point for discoverability while centralizing the generic
workflow in one place.
