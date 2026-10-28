---
name: campfire-studio
description: Create and edit procedural 3D dialogue reels using the Campfire Studio engine, including reusable characters, scene templates, camera direction, captions, voices and sound layers. Use when making these animated shorts or extending this studio.
---

# Campfire Studio

Use the existing React/Three.js studio. Do not replace it with a new renderer, slideshow or video-generation workflow when the user asks for an episode, a character or another setting.

## Find the engine

Run `python3 scripts/ensure-studio.py` relative to this skill. In the repository it locates the checkout; after installation elsewhere it clones `https://github.com/ar162387/campfire-studio` into `~/.local/share/campfire-studio`. `CAMPFIRE_STUDIO_HOME` selects another checkout. `--install` runs the locked dependency install and build. Requirements: Node 22+, npm, Python 3 and Git. FFmpeg is needed only for voice assembly.

Read the checkout's `AGENTS.md`. Run `npm ci`, `npm run build`, then `npm start`. Use the actual printed localhost URL; `PORT` selects a free port. The supplied episode is silent on purpose until matching dialogue is imported.

## Route the work

- **Episode or timing:** read [episodes.md](references/episodes.md). Copy an existing exported project or `examples/starter.episode.json`, direct its beats and import the JSON. Preserve the user's current project with Export JSON first.
- **Character, expression or action:** read [characters.md](references/characters.md). Keep the rig's independently controlled eyes, eyebrows, mouth, head and limbs. Add reusable controls to the existing performance model.
- **Background or camera:** read [scenes.md](references/scenes.md). Register a set in `SceneTemplates.tsx`. Design around the existing character anchors; change both rigs and camera targets deliberately if repositioning them.
- **Speech, pronunciation, ambience or music:** read [voices.md](references/voices.md). Use an available connected speech provider or its official SDK. Never claim credentials, voice IDs or paid generation are available just because this skill is installed.

## Production invariants

Captions contain spoken dialogue only; square-bracket tags are performance directions. Use measured word timings where available and label estimates honestly. Keep each consecutive speaker turn uninterrupted, even when captions/cameras change. Never reuse overlapping source audio intervals. Only dialogue drives the mouth analyser.

A timing edit moves animation/captions; it does not stretch speech. Regenerate only changed dialogue when needed, preserving successful takes and generation IDs. Voice generation may cost credits; installation itself does not generate media.

Background dressing belongs to a template. Character looks, expressions, template-scoped camera poses, sound mix and local imported media travel in exported episode JSON. Export before clearing browser storage or changing an existing production.

Build/typecheck after code changes, test relevant behavior, then preview the actual episode and record a short sample before a full export. Keep Chrome/Edge active during recording. Output targets 1080×1920 at 30 fps; MP4/WebM availability and recording smoothness depend on the browser/device. Do not promise offline rendering or new-template UI controls that have not been implemented.
