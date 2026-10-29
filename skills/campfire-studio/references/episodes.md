# Episodes and editing

The engine is the checkout located by `scripts/ensure-studio.py`. Paths below are relative to it.

`src/puppet/types.ts` defines the project. `examples/starter.episode.json` is an importable minimal example. `src/puppet/Studio.tsx` is the browser editor; `Timeline.tsx`, `Captions.ts` and `Performance.ts` implement reusable controls.

A project has `version:1`, `title`, `duration` in seconds, `templateId`, `look` colors, `beats`, optional `cameraPresets`, `expressions`, `layers`, `mix`, `voices` and imported dialogue media.

Each beat has a unique numeric `id`, `start`, `end`, `speaker` (`human` or `creature`), untagged `text`, `emotion`, `action`, `camera`, optional `delivery`, `look`, `bodyTurn`, `expression` and `words:[{text,start,end}]`. Word times are absolute episode seconds. Use non-overlapping beats, finite numbers and start < end <= duration. Camera must be a built-in name or an existing saved pose ID.

Base emotions: neutral, happy, sad, angry, surprised, thinking, smug. Actions: idle, talk, nod, shake, shrug, wave, point, type, listen, celebrate, facepalm, lean, bounce. Built-in cameras: Wide, Host, Claude, Over laptop, Two-shot, Low angle.

Start new dialogue with `audioStatus:"pending"` and no `voiceTrack` or `dialogueAssetId`. This prevents the previous episode's audio from masquerading as new speech. `tools/assemble-episode.py` produces a portable project with embedded matching dialogue. Imported audio persists in IndexedDB; Export JSON embeds it under `media` rather than putting binary data in localStorage.

Timeline: centre drag moves a clip; edge handles trim it; ripple moves later scene/caption beats. Zoom makes short clips easier to reach. Clicking a clip selects the associated script card; scrubbing pauses and seeks. Script selection itself should not restart transport. During silent gaps, the previous camera holds. Keep audio sources running across visual cuts.

Film Studio edits the selected beat. Character Lab rehearses a setup and needs Apply to selected line. `patchPerformance(project, ids, patch)` supports batch direction without rewriting a rig. Preview at cuts and gaps, scrub backwards and test recording with audio. Record uses the same caption painting and scene renderer as preview.

Back up the active project before importing another. Public starter data is an example, not a reason to overwrite a user's live work. The browser keeps its own saved project independently of source changes.


V2 extends beats with `state`, `listenerState`, `blocking`, `prop`, `propAction`, `propText`, `screen`, `cameraMotion`, `captionChunks` and `role`. Projects support `captionStyle`, `endingHold`, `screenEvents` and `series`. Read characters.md and scenes.md for exact enums, and story-system.md for narrative/continuity guidance. New projects open the original fictional pilot; older browser saves are not replaced. The minimal starter remains available for smoke tests.

Caption chunks must exactly reproduce spoken text. Moving a clip retimes its measured words and explicit caption-card times; trimming clears stale timings. Regenerating/assembling speech clears explicit card times and derives them again from measured words. Deliberate pauses belong to the timing plan; scene-level natural speech is not an exact-duration synthesizer.
