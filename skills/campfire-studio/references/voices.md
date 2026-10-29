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

## Ordered scene dialogue and alignment (v2)

`tools/voice-scene.py` adds a scene-level Text to Dialogue path. It preserves input order and explicitly selects `model_id`. Discover currently available models and voices, audition alternatives, then lock cast IDs. Never silently change a user's chosen voice or model. The included Will/Roger IDs were discovered previously; another account must verify them. Model pricing is not hardcoded and no fixed per-reel cost is promised.

```sh
# Offline request preparation, no key or credits:
python3 tools/voice-scene.py prepare episode.json --model eleven_v4 --out output/voice-request
# Optional aliases JSON: {"vibecoderzz":"vibe coderz"}
# Live discovery requires ELEVENLABS_API_KEY in the caller's environment:
python3 tools/voice-scene.py discover episode.json --model eleven_v4 --out output/cast
# Only after user authorization for chargeable generation:
python3 tools/voice-scene.py generate episode.json --model eleven_v4 --out output/take-01 --spend-credits
# Reuse a saved provider response, no provider call:
python3 tools/voice-scene.py assemble episode.json --model eleven_v4 --response output/take-01/response.json --audio output/take-01/dialogue.mp3 --out output/aligned
```

Optional `--pronunciations aliases.json` applies spoken aliases without changing captions. Single display-token aliases may become several spoken words. Multiword phrase aliases requiring ambiguous token mapping fail explicitly. Captions must match aligned spoken text after the approved aliases; the script rejects mismatches instead of guessing.

The provider currently limits a request to 2000 input characters. Split longer scenes at complete turns, retaining continuity and measured placement. Save every charged response/audio before timing checks. Requests are never automatically retried. Invalid, reset, missing, out-of-range or transcript-mismatched timestamps stop assembly. The known native-timing issue is why validation exists: [provider SDK issue](https://github.com/elevenlabs/elevenlabs-python/issues/707).

If native alignment is unusable, keep the successful take and align that exact audio with its exact spoken transcript:

```sh
python3 tools/voice-scene.py align episode.json --model eleven_v4 --audio output/take-01/dialogue.mp3 --out output/realigned --spend-credits
# If an alignment response is already saved, assemble it instead of calling again:
python3 tools/voice-scene.py assemble episode.json --model eleven_v4 --response output/realigned/forced-response.json --audio output/take-01/dialogue.mp3 --out output/final
```

Official endpoints: [dialogue with timestamps](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps), [forced alignment](https://elevenlabs.io/docs/api-reference/forced-alignment/create). Alignment is a provider call too; do not assume it is free. No automatic voice cloning.

The output `voiced.episode.json` embeds audio and measured word times, preserving emotion/action/camera/prop/screen direction. Whole-scene generation follows natural speech timing; it cannot promise exact prewritten silent gap lengths. Use the existing turn assembler when deliberate pauses or source pickups need exact placement. Independent absolute screenEvents must be reviewed before retiming. Existing caption-card text is retained and stale card timestamps are cleared.

## Live validation and credit discipline (v2.1)

The official @elevenlabs/elevenlabs-js SDK is installed in the CLI layer. `npm run voice:dialogue` loads `.env.local` through Node's env-file option; the browser has no API key or SDK client. Onboard with the official CLI and authorize in the browser. Never paste a key into chat, print it, commit it, or put it in client-side code.

Live testing on 29 October 2026 produced a short two-voice sample and a 100.8-second, sixteen-turn v4 scene. Native character alignment and input voice segments were returned. The long response placed its final punctuation/segment end 80 ms after the audio; the validator now tolerates up to 120 ms for that final non-spoken padding only, without moving spoken-word times. Out-of-range spoken characters, wrong voices, missing inputs and reset timing still fail. Forced alignment of the same saved take was also verified; no speech regeneration was needed. This test proves timing integration, not that every future generation will have identical delivery.

```sh
npm run voice:dialogue -- discover episode.json --out output/cast
npm run voice:dialogue -- generate episode.json --out output/take --model eleven_v4 --spend-credits --max-characters 1600 --pronunciations examples/pronunciations.json
npm run voice:dialogue -- assemble episode.json --out output/take --model eleven_v4 --pronunciations examples/pronunciations.json
```

The generation cap defaults to 500 input characters, including delivery tags. Raising it is deliberate and still requires authorization for the take. SDK retries are disabled. Existing response directories cannot be silently regenerated. `--align-fallback` must be selected explicitly and requires credit authorization; otherwise invalid timing stops with the saved take intact. Never run a paid onboarding sample or fresh audition merely to check that setup works. Use discovery, saved takes and offline fixtures for routine checks. Respect a user's credit reserve and any request to stop billable testing.

`examples/voice-validation.episode.json` is an original engineering test, not a social post or customer case study. Its speech is not bundled in the public repository. The existing Python preparation/assembly path remains available without the SDK.
