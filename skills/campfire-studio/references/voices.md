# Voices, word timing and sound

Use a connected speech tool when available, following its live schema and model guidance. Otherwise use the chosen provider's official SDK with the user's configured credentials. This repo includes no API key and makes no automatic paid request. Discover available voices before choosing IDs; default character voice IDs in Voices.ts are historical hints, not guaranteed account access.

Keep two distinct consistent voices. Bracketed cues such as [confused], [amused], [dryly] direct audio, not captions. Choose an actually available model supporting these tags. Generate complete speaker takes or whole consecutive turns, not a new take for every camera cut. Save successful generation IDs and download completed assets once; do not regenerate speech merely to fix a cut or caption.

## Repeatable pipeline

1. Author the episode JSON with untagged caption text, beat speakers and delivery cues.
2. Export directions:
   `python3 tools/voice-directions.py examples/starter.episode.json --out output/voices`
   Optional `--pronunciations aliases.json` maps a written token to spoken words, e.g. `{"Vibecoderzz":"Vibe Coderz"}`. The same mapping must be passed to assembly.
3. Generate each speaker's entire text in its own voice. Preserve paragraph separation between that speaker's separate turns. Download `human.mp3` / `creature.mp3` and retain the provider generation IDs in your private production notes.
4. Obtain measured word timestamps using the provider's alignment/transcription tools or local Whisper with word timestamps. The manifest uses seconds and this shape:
   `{"human":{"audio":"human.mp3","words":[{"text":"Hello","start":0.1,"end":0.5}]},"creature":{...}}`.
   Audio paths resolve relative to the manifest. Convert Whisper's `segments[].words[]` (`word` key also accepted) or provider output to this simple shape. Review transcript differences against the actual take. Do not invent timestamps to silence a validation error.
5. Assemble: `python3 tools/assemble-episode.py episode.json voices/manifest.json --out output/final --gap 0.25` (plus the same pronunciation map if used). Requires FFmpeg on PATH. Standard Python only; no NumPy dependency. This validates tokens and source intervals, keeps consecutive same-speaker captions inside uninterrupted turns, normalises loudness, and writes `dialogue.mp3`, `episode.json` with embedded audio, and an edit list. Requested project length is a minimum; speech may extend it. It does not speed up voices to force 54 seconds.
6. Import `output/final/episode.json` through the studio. Confirm first/last words, every speaker change, pronunciation, subtitle highlights and mouth motion. Export a recording with the desired sound mix.

Numbers/contractions may be transcribed differently. Correct transcription text only when verified in the audio; use pronunciation aliases when the spoken form deliberately differs. Assembly fails loudly rather than silently shifting every subsequent word.

## Atmosphere and actions

`SoundLayers.ts` describes ambience/music/action layers. `SoundMixer.ts` continuously mixes them with speech, fades and optional ducking. Only dialogue reaches the mouth analyser. Fire/night/music assets ship; keyboard taps are deterministic local synthesis. Upload a background audio layer in the UI, choose its kind, adjust volume and enable/remove it. An action layer is gated by an action key such as `type`; it must not fire for unrelated actions. Export JSON carries uploaded audio in its `media` object.

For new generated sound, ask the chosen sound-effect tool for a subtle loop suited to the scene (no voices, no music unless wanted). Keep speech intelligible and audition the mix. No external music/speech generation is possible solely because the local browser was opened. Browser recording supports the existing mixer; it is not an automatic provider integration.
