# Reusable editor

## Timeline

Scrubbing pauses at the chosen time and enters Film Studio. Changing editor modes does not rewind the episode. Click a clip to seek and select its script card; playback highlights the active clip and brings its script card into view without changing playback time.

Drag a clip's centre to move it. Drag the left/right handles to shorten or lengthen it. Increase Timeline zoom to reach narrow clips. Arrow keys nudge a focused clip by one frame; Shift+Arrow moves it by half a second.

“Ripple later clips” moves subsequent scene/caption clips when the selected clip moves or changes length. Disable it to keep adjacent clips fixed and constrain edits to the available gap. The continuous voice track stays fixed; timeline edits do not stretch or regenerate speech. Re-align or regenerate dialogue deliberately after substantial timing changes.

## Performance

In Film Studio, the performance controls edit the selected clip immediately. In Character Lab they are rehearsals until Apply to selected script line is used. Look and body direction are stored per clip.

Create / edit emotion opens a live expression editor. Name it, choose a base emotion and tune brow tilt, eye opening, mouth curve and mouth width. Saved expressions travel with episode JSON. `Performance.ts` exports a targeted/batch `patchPerformance()` helper for AI/code edits.

## Custom cameras

Choose Custom camera, then drag the preview to orbit, scroll/pinch to zoom and right-drag to pan. Frame Host/Claude/Both provides convenient starting positions. Lens and numeric camera/target coordinates allow precise adjustments. Save a name to add the angle to the current scene template's preset strip and every script line's camera menu.

Reopen a saved camera to edit or remove it. Removing it replaces affected clip references with Wide. The template ID, position, look-at target and lens are part of the exported episode, so cameras can also be authored by AI as JSON. Existing templates retain their six defaults.

## Sound layers

Use Sound in the header or the left-hand sound section. Layers can be renamed, muted, removed, adjusted, and added from local audio files. Classify a layer as ambience, music, or an action sound. Action sounds have a trigger such as type; they remain silent outside that action. The included light keyboard taps are synthesized locally.

Uploaded sound and dialogue files persist in browser IndexedDB. Export JSON includes the associated media; import restores it. Browser storage is local to this origin, so use Export JSON for a portable backup. Only the dialogue feeds mouth movement; music, ambience and action cues feed the audible/recorded mix.

## Agent use

Install the portable skill using `tools/install-skill.py`, or direct another agent to `skills/campfire-studio/SKILL.md`. The starter at `examples/starter.episode.json` contains original sample dialogue and no speech audio. Follow the voice guide to generate matching dialogue and import a completed project.

## Scene and phrase controls (v2)

Use Set & caption style to choose among eight scenes, change chunk/karaoke mode, speaker colours, backdrop and phrase length. Switching a campfire to another set removes the supplied fire/night layers; uploaded layers are preserved. Restore template sound layers keeps the mix appropriate to that setting. New dialogue and independent scene/audio revisions still need review.

Select a clip, then open Direct selected line. Body state, listener reaction, persistent body position, prop gesture, camera push and working-screen event can be edited here. The screen persists until another line updates it. Series & locked cast stores continuity fields and the voice IDs selected after audition. The final hold control extends the episode and freezes the last directed pose/caption while the mouth closes.

For agents, `npm run episode:check` reviews story structure; `npm run pack` produces a local cover, subtitles, caption and review report. These tools do not publish to Instagram. See the story-system reference for commands and the nine prompts.
