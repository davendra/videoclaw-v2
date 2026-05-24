---
name: bunty
description: |
  "Match Day Analysis with Bunty" — cricket scorecard/PDF to narrated video with Bunty,
  a cartoon Indian commentator in an orange blazer.

  This skill should be used when:
  - User provides a cricket scorecard, match report, or cricket PDF
  - User mentions "Bunty", "match day analysis", "cricket video"
  - User says "do the Bunty thing", "make a Bunty video", "scorecard video"
  - User provides any cricket-related PDF and expects the full pipeline

  Output: A narrated video with Bunty lip-synced intro/outro + TTS commentary over slides.
---

# Bunty — Match Day Analysis

*Cricket scorecard PDF to narrated video with Bunty the commentator.*

## Positioning

Use `skills/brand-presenter/SKILL.md` as the generic presenter workflow when
the task is “make a narrated presentation-style video with a host” but the host
or domain is still open.

Use `bunty` when:

1. the domain is explicitly cricket or scorecard analysis
2. the user asks for Bunty specifically
3. the workflow should apply Bunty's saved character, voice, and tone rather
   than a generic presenter profile

## Who Is Bunty

- **Character**: Cartoon Indian cricket commentator
- **Look**: Orange blazer, expressive face, animated gestures, loves samosas
- **Personality**: Bombastic, hilarious, over-the-top. Uses cricket metaphors, Indian expressions, dramatic comparisons. Mixes English with Hindi-flavored phrases. Capitalizes key words for EMPHASIS. Roasts losing teams mercilessly while celebrating standout performers.
- **Catchphrases**: "Oh my friends!", "bless their cotton socks", "[player] was treating the bowling like it personally insulted his mother's cooking!", references to samosas, Netflix documentaries, and the Geneva Convention
- **Sign-off**: Always ends with "keep batting" and a cheeky grin

## Character Config

| Setting | Value |
|---------|-------|
| **Go Bananas character_id** | `97` |
| **Model** | ALWAYS `gemini-pro-image` (flash ignores character refs) |
| **Aspect ratio** | `16:9` + "WIDE HORIZONTAL" in prompt |

**Why character_id=97**: Bunty is a SAVED character reference in Go Bananas. Using the saved reference ensures consistent face/style across all videos. Never regenerate the character from scratch — always use `character_id=97`.

```python
mcp__go-bananas__generate_image(
    prompt="WIDE HORIZONTAL. Cartoon Indian commentator in orange blazer, [POSE/ACTION]. [ENVIRONMENT]. Bright, colorful, Pixar-style 3D animated look.",
    character_id=97,
    aspect_ratio="16:9",
    model_id="gemini-pro-image"
)
```

## Voice Settings

| Setting | Value |
|---------|-------|
| **ElevenLabs Voice ID** | `nwj0s2LU9bDWRKND5yzA` |
| **Model** | `eleven_flash_v2_5` |
| **Stability** | 0.5 |
| **Similarity Boost** | 0.75 |
| **Voice Change Seed** | 42 (deterministic) |

## Video Structure

The recommended pattern is **chained 2+2** with fade-through-black transitions:

```
┌──────────────────────────────────────────────────────┐
│  INTRO 1 (~8s) — Bunty lip-synced, Veo audio        │
│  "Welcome to Match Day Analysis!"                    │
│                                                      │
│  INTRO 2 (~8s) — Chained from Intro 1's last frame  │
│  "Let me tell you about this match!"                 │
│        ╔══════════════════════════════╗               │
│        ║  0.75s FADE THROUGH BLACK   ║               │
│        ╚══════════════════════════════╝               │
│  SLIDE 1 — Static image + Bunty TTS                  │
│  SLIDE 2 — Static image + Bunty TTS                  │
│  ...                                                 │
│  SLIDE N — Static image + Bunty TTS                  │
│        ╔══════════════════════════════╗               │
│        ║  0.75s FADE THROUGH BLACK   ║               │
│        ╚══════════════════════════════╝               │
│  OUTRO 1 (~8s) — Bunty lip-synced, Veo audio        │
│  "What a match this was!"                            │
│                                                      │
│  OUTRO 2 (~8s) — Chained from Outro 1's last frame  │
│  "Keep batting, my friends!"                         │
└──────────────────────────────────────────────────────┘
```

**Simple 1+1 alternative**: Use single intro and single outro for quicker turnaround.

## Scene Numbering Formula

Scene numbers are **dynamic** based on slide count. With `N` slides (scenes 1 to N):

| Role | Formula | 16 slides | 17 slides |
|------|---------|-----------|-----------|
| **Intro 1** (independent, needs Go Bananas image) | N+1 | 17 | 18 |
| **Intro 2** (chained from Intro 1's last frame) | N+3 | 19 | 20 |
| **Outro 1** (independent, needs Go Bananas image) | N+4 | 20 | 21 |
| **Outro 2** (chained from Outro 1's last frame) | N+5 | 21 | 22 |

N+2 is intentionally skipped to leave a gap for the chained intro scene.

**Generation order:**
1. First pair (parallel): N+1 + N+4 → need Go Bananas images
2. Extract last frames from N+1 and N+4
3. Chained pair (parallel): N+3 + N+5 → use extracted last frames

**Stitch order:**
- `--intro-scenes N+1,N+3 --outro-scenes N+4,N+5`

**Simple 1+1** (no chaining): Just N+1 (intro) and N+2 (outro).

**IMPORTANT**: Throughout this doc, examples use 16-slide numbering (17/19/20/21). Always recalculate for actual slide count using the formula above.

## Still Frame Requirement

Veo generates natural animation where Bunty moves throughout the clip. When lip-synced clips meet static slides, there's a visible "freeze" artifact at the boundary.

**ALL lip-sync prompts MUST include still-frame instructions:**

| Scene Type | Required Prompt Text |
|------------|---------------------|
| Intro clips | `"Character begins completely still, pauses for a beat before speaking."` |
| Outro clips | `"Character finishes speaking, returns to a still pose, and holds completely still for the final moment."` |

This ensures clean transitions: intro starts still (smooth from previous content), outro ends still (smooth to next content), and fades work without frozen-mid-gesture artifacts.

## Chained 2+2 Pattern

```
┌─────────────────────────────────────────────────────┐
│  CHAINED LIP-SYNC PATTERN (2+2)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Step 1: Generate scene 17 + 20 (independent)      │
│    → From Go Bananas Bunty images (character_id=97) │
│                                                     │
│  Step 2: Extract last frames for chaining           │
│    ffmpeg -sseof -0.1 -i scene_17.mp4 → scene_19   │
│    ffmpeg -sseof -0.1 -i scene_20.mp4 → scene_21   │
│    Copy as _landscape.jpg (already 1280x720)        │
│                                                     │
│  Step 3: Generate scene 19 + 21 (chained)           │
│    → From extracted last frames                     │
│    → Scene 19 literally starts where 17 ended       │
│    → Scene 21 literally starts where 20 ended       │
│                                                     │
│  Result: Seamless 2-clip intro + 2-clip outro       │
│  Total lip-sync: ~32s (4 × ~8s clips)              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Fade Transitions

Default **0.75s fade-through-black** at section boundaries:

| Boundary | Effect |
|----------|--------|
| Last intro clip | Video + audio **fade OUT** at end |
| First slide | Video + audio **fade IN** at start |
| Last slide | Video + audio **fade OUT** at end |
| First outro clip | Video + audio **fade IN** at start |

Disable with `--fade 0` on `stitch_bunty.py` for hard cuts.

## Camera Movement Guide

Different camera movements for each chained video keep it visually interesting:

| Video | Camera | Why |
|-------|--------|-----|
| Intro 1 (scene 17) | `slow push in` | Builds intimacy, draws viewer in |
| Intro 2 (scene 19) | `tracking right` | Energy, movement, different angle |
| Outro 1 (scene 20) | `slow zoom out` | Reveals full scene, wind-down feel |
| Outro 2 (scene 21) | `static` | Stability for the sign-off moment |

## Dialogue Word Count Guide

| Pacing | Words per 8s | Use Case |
|--------|-------------|----------|
| Sign-off (last outro) | 15-20 | Final sign-off clip — dramatic pacing, pauses between phrases |
| Slow / dramatic | 20-25 | Emotional moments, reflective lines |
| Normal | 25-30 | Standard commentary |
| Fast / energetic | 30-35 | Hype moments, celebrations |

**IMPORTANT**: The LAST outro clip (Bunty's sign-off) needs the fewest words. Veo clips are exactly 8s — sign-offs need dramatic pauses and slow delivery, so ~15-20 words max. Exceeding this causes dialogue to get cut off.

## Pipeline — 11 Steps

When the user provides a cricket scorecard/PDF, execute this full pipeline:

### Step 1: Create Project

```bash
mkdir -p projects/{slug}/{reference,slides,images,videos,audio/tts,final/segments,assets}
cp scorecard.pdf projects/{slug}/reference/match_report.pdf
```

### Step 2: Extract Slides

```bash
# Extract slide images with the current slide/document tooling, then store the
# exported frames under projects/{slug}/slides/ and keep the runtime target in
# projects/{slug}/analysis/slides.json for the Bunty pass.
```

Adjust `--total-duration` based on slide count: aim for **~9-10 seconds per slide**.

### Step 3: Write Bunty's Commentary

Write `editable_transcript.json` manually. Bunty doesn't just read stats, he PERFORMS them.

**Writing rules for Bunty's voice:**

1. **Open with drama**: "Match Day Analysis!" + the teams + a teaser of the result
2. **Scene per slide**: Each slide gets one scene of commentary
3. **CAPITALIZE key stats**: "SEVENTY runs!", "FOUR wickets for EIGHTEEN!"
4. **Roast the losers**: Compare to absurd things ("My grandmother's WhatsApp group scores more than that!")
5. **Celebrate the heroes**: Give standout players dramatic nicknames
6. **Cricket metaphors**: "batting suicide", "duck pond", "waiter service bowling"
7. **Indian flavor**: rotis, samosas, Bollywood references, "bhai", "yaar"
8. **Build to crescendo**: Each scene more dramatic, final scene is the peak
9. **Last scene = scoreboard**: Final stats + one devastating closing line

Save to: `projects/{slug}/audio/tts/editable_transcript.json`

```json
{
  "_instructions": "Edit the 'text' field for any scene you want to change.",
  "scenes": {
    "1": "Match Day Analysis! [Team A] versus [Team B]...",
    "2": "A decisive victory by [X] runs!..."
  }
}
```

### Step 4: Generate TTS (skip lip-sync scenes)

```bash
# Build the editable transcript JSON, then use the current create/execute flow
# for the production pass. Keep lip-sync scenes out of the narration pass.
vclaw video create "Bunty match recap intro/outro pass" \
  --project "{slug}" \
  --platform youtube \
  --aspect-ratio 16:9 \
  --quality fast \
  --audio on
```

For simple 1+1 pattern, use `--skip-scenes "19,20"`.

### Step 5: Generate Bunty Character Images

Generate intro and outro images with Go Bananas using `character_id=97`:

```python
# Intro image (golden hour, excited)
mcp__go-bananas__generate_image(
    prompt="WIDE HORIZONTAL. Cartoon Indian commentator in orange blazer at cricket ground, golden hour, gesturing dramatically to camera, excited expression. Bright, colorful, Pixar-style 3D animated look.",
    character_id=97,
    aspect_ratio="16:9",
    model_id="gemini-pro-image"
)

# Outro image (twilight, waving with samosas)
mcp__go-bananas__generate_image(
    prompt="WIDE HORIZONTAL. Cartoon Indian commentator in orange blazer at cricket ground, twilight, holding plate of samosas, waving goodbye with big cheeky grin and wink, confetti falling. Bright, colorful, Pixar-style 3D animated look.",
    character_id=97,
    aspect_ratio="16:9",
    model_id="gemini-pro-image"
)
```

Download and save to `projects/{slug}/images/`:
- Intro: `run001_scene_17_frame.jpg` (or `run001_scene_19_frame.jpg` for simple 1+1)
- Outro: `run001_scene_20_frame.jpg`

Auto-resize handles 1584x672 → 1280x720.

### Step 6: Generate Lip-Sync Videos (first pair)

Write dialogue and scene prompts to temp JSON files (avoid shell escaping issues):

```bash
# Write scenes JSON
cat > /tmp/scenes.json << 'EOF'
{"17":"The cartoon Indian commentator in the orange blazer speaks directly to camera. Character begins completely still, pauses for a beat before speaking. He gestures dramatically, excited energy. Slow push in camera. Cricket ground behind him at golden hour.","20":"The cartoon Indian commentator in the orange blazer speaks directly to camera holding samosas. Character finishes speaking, returns to a still pose, and holds completely still for the final moment. Slow zoom out camera. Cricket ground at twilight."}
EOF

# Write dialogue JSON
cat > /tmp/dialogue.json << 'EOF'
{"17":"[INTRO_DIALOGUE ~25-35 words]","20":"[OUTRO_DIALOGUE ~25-35 words]"}
EOF

vclaw video create "Bunty intro/outro lip-sync pass" \
  --project "{slug}" \
  --platform youtube \
  --aspect-ratio 16:9 \
  --quality fast \
  --audio on \
  --execute
```

### Step 7: Chain Generation (extract last frames → generate chained scenes)

**Skip this step for simple 1+1 pattern.**

```bash
# Extract last frames from first pair
ffmpeg -y -sseof -0.1 -i "projects/{slug}/videos/run002_scene_17.mp4" \
  -frames:v 1 -q:v 2 "projects/{slug}/images/run002_scene_19_frame.jpg"

ffmpeg -y -sseof -0.1 -i "projects/{slug}/videos/run002_scene_20.mp4" \
  -frames:v 1 -q:v 2 "projects/{slug}/images/run002_scene_21_frame.jpg"

# Copy as landscape versions (already 1280x720 from Veo output)
cp "projects/{slug}/images/run002_scene_19_frame.jpg" \
   "projects/{slug}/images/run002_scene_19_frame_landscape.jpg"
cp "projects/{slug}/images/run002_scene_21_frame.jpg" \
   "projects/{slug}/images/run002_scene_21_frame_landscape.jpg"

# Write chained scenes/dialogue JSON and generate
cat > /tmp/scenes2.json << 'EOF'
{"19":"The cartoon Indian commentator in the orange blazer continues speaking to camera. He gestures with enthusiasm, different angle. Tracking right camera. Cricket ground at golden hour.","21":"The cartoon Indian commentator in the orange blazer finishes speaking. Character finishes speaking, returns to a still pose, and holds completely still for the final moment. Static camera. Cricket ground at twilight."}
EOF

cat > /tmp/dialogue2.json << 'EOF'
{"19":"[CHAINED_INTRO_DIALOGUE ~25-35 words]","21":"[CHAINED_OUTRO_DIALOGUE ~25-35 words]"}
EOF

vclaw video iterate "Bunty chained intro/outro follow-up pass" \
  --project "{slug}" \
  --platform youtube \
  --aspect-ratio 16:9 \
  --quality fast \
  --audio on
```

### Step 8: Voice Change ALL Lip-Sync Scenes (MANDATORY)

Veo generates a DIFFERENT voice for each clip. The voice changer normalizes all clips to Bunty's consistent voice.

```bash
# If the first pass drifts, rerun via the current iterate flow instead of the
# removed Bunty-specific voice-change helper scripts.
vclaw video status --project "{slug}"
vclaw video next-actions
```

For simple 1+1: `--scenes "19,20"`.

This produces `*_vc.mp4` files. The stitch script auto-prefers these over plain `.mp4`.

### Step 9: Stitch Final Video

```bash
vclaw video remix-narrated --project "{slug}"
vclaw video verify-final --project "{slug}"
```

For simple 1+1:
```bash
vclaw video remix-narrated --project "{slug}"
```

### Step 10: Review and Iterate

- Watch the final video end-to-end
- Check lip-sync quality on intro/outro
- Check TTS timing on slides
- Re-generate any scenes that don't work (use `--continue` flag)
- Re-stitch with adjusted `--fade` if transitions feel wrong

### Step 11: Deliver

Output: `projects/{slug}/final/match_day_analysis_BUNTY.mp4`

## Shell JSON Escaping Gotcha

**NEVER pass dialogue with quotes/punctuation directly in CLI args:**

```bash
# BAD - breaks with shell escaping
--dialogue '{"19":"Oh my GOD! This is INCREDIBLE!"}'

# GOOD - write to file, pass via command substitution
cat > /tmp/dialogue.json << 'EOF'
{"19":"Oh my GOD! This is INCREDIBLE!"}
EOF
--dialogue "$(cat /tmp/dialogue.json)"
```

## Narration Style Guide

### Slide-by-Slide Pattern

| Slide Content | Bunty's Approach |
|---|---|
| Title / Match Info | Dramatic intro, set the scene, tease the result |
| Final Score | Exaggerated reaction, absurd comparison for the loser |
| Toss / Team Selection | Comment on strategy, foreshadow disaster |
| Top Scorers | Celebrate with food/movie metaphors ("FEASTING!") |
| Partnerships | Build the narrative of dominance |
| Bowling Figures | If good: hero worship. If bad: "throwing confetti" |
| Batting Collapse | PEAK ROAST. Ducks = "duck pond", low scores = grandmother's WhatsApp |
| Best Performer / MVP | Full Hollywood treatment, "give this kid a Netflix documentary!" |
| Key Takeaways | Blueprint for winners, lesson for losers |
| Final Scoreboard | Devastating one-liner closer |

### Example Lines

**Celebrating a batsman:**
> "Ram Patel — thirty-nine runs off twenty-nine balls with SIX fours! This man was treating the bowling like it personally insulted his mother's cooking!"

**Roasting a collapse:**
> "THE TOP ORDER COLLAPSE! Thirty for SEVEN! Shah — duck! Curtis — duck! Moonesinghe — duck! It was like a DUCK POND out there!"

**MVP tribute:**
> "Morgan Fisher! Four wickets for eighteen! The man did everything except sell samosas in the pavilion!"

**Closing line:**
> "This wasn't a cricket match, this was a VIOLATION! The Geneva Convention should be checking on their players!"

## Quick Reference

| Item | Value |
|---|---|
| Character | Bunty — cartoon Indian commentator, orange blazer |
| Go Bananas character_id | `97` |
| Voice ID | `nwj0s2LU9bDWRKND5yzA` |
| Voice Change Seed | `42` |
| TTS Model | `eleven_flash_v2_5` |
| Resolution | 1280x720, 24fps |
| Intro/Outro | Lip-synced via Veo, ~8s each (×2 if chained) |
| Slides | Static image + TTS, ~9-25s each (driven by TTS length) |
| Stitch script | `stitch_bunty.py` (centralized, supports simple + chained + fades) |
| Fade duration | 0.75s (default), 0 for hard cuts |
| Output name | `match_day_analysis_BUNTY.mp4` |

## Reference Projects

| Project | Pattern | Slides | Features |
|---------|---------|--------|----------|
| `2026-02-08_stony-vs-overstone-u19` | Simple 1+1 | 15 | Basic lip-sync |
| `wicc-vs-citycc-rutland` | Simple 1+1 | 12 | Basic lip-sync |
| `overstone-vs-thrapston` | Chained 2+2 | 12 | Chaining |
| `wicc-vs-werrington` | Chained 2+2 | 16 | Chaining + fades + voice change |
| `wicc-vs-nscc-saints` | Chained 2+2 | 17 | Chaining + fades + voice change + sign-off fix (MOST COMPLETE) |

Use `wicc-vs-nscc-saints` as the gold-standard reference for file structure, transcript style, and stitch pattern.
