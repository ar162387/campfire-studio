# Reliable exports on local and remote machines

Use the offline exporter for agent-driven video production, especially in headless/remote environments. The interactive Record button remains useful for a human on a responsive desktop. It is a real-time capture and may drop frames if playback cannot keep up.

## Setup once

```sh
npm ci
npm run build
npm run doctor -- examples/starter.episode.json
```

Node 22+, FFmpeg and ffprobe are required. npm installs a pinned Puppeteer browser and an open Inter caption font. The repository configuration skips the redundant headless-shell download. No video model, provider credits, microphone or visible desktop is used to export.

If browser download was skipped, run `npx puppeteer browsers install chrome`, or pass `--browser /path/to/chrome` (also `PUPPETEER_EXECUTABLE_PATH`). Installed browser overrides may change the rendering environment and consequently the resume fingerprint. On Linux, Chrome also needs its normal system libraries and a working sandbox; use a non-root worker. Do not disable system security globally to make a renderer launch.

## Measure before promising an ETA

Doctor actually loads the registered scene, font and native-size WebGL canvas, then renders several different episode frames locally. Its report includes the renderer string, CPU count, measured seconds/frame, estimated frame storage and free disk space. It estimates frame time separately from encoding; a short sample is an estimate, not a guaranteed finish time.

For a trusted local scene on a CPU-only worker, explicitly request the software fallback:

```sh
npm run doctor -- episode.json --software
```

This selects Chrome SwiftShader (including its explicit software-WebGL opt-in). It preserves geometry, native resolution and frame rate; it can be slower. Use the same flag for the final render. Hardware acceleration is useful when it is genuinely available; an extra command-line flag cannot create a GPU.

## Preview, then render

```sh
npm run render -- episode.json --preview --output output/preview.mp4
npm run render -- episode.json --quality final --output output/final.mp4
```

Preview is a three-second excerpt at the same 1080×1920 / 30 fps quality. Select another range with `--start 12 --seconds 3`. Do not reduce capture to 10 fps, upscale a smaller render, or duplicate frames and describe that as native 30 fps.

Silent feasibility test, covering both characters, all seven moods, thirteen actions and six camera views:

```sh
npm run render -- examples/performance-test.episode.json \
  --silent --talk-preview --output output/performance.mp4
```

`--silent` guarantees there is no audio stream. `--talk-preview` is an explicitly synthetic mouth-motion rehearsal, not speech lip sync. With real dialogue, the exporter derives mouth amplitude from the actual audio. Add `--no-captions` only when requested. Estimated caption timings are identified in the export report; measured word timings remain preferred.

## Audio

A portable studio Export JSON or `tools/assemble-episode.py` output contains its dialogue and uploaded sound layers under `media`. Alternatively pass `--dialogue path/to/matching.mp3`. No browser playback is needed. The exporter analyses dialogue first, renders the pictures, mixes speech/ambience/music/action cues against the episode clock, and encodes the MP4. It does not regenerate speech.

Legacy projects referring only to a local, unembedded dialogue asset must be exported with media, or supplied the matching audio path. The exporter fails rather than silently substituting an old recording. Deliberately silent renders can ignore unavailable audio. Missing ambience assets fail an audible export so a deficient mix is not presented as complete.

## Resume and completion

Lossless PNGs are atomically saved under `output/.campfire-jobs/<fingerprint>/`. Rerun the same command to reuse valid completed frames after interruption. The fingerprint includes the episode, media, frame range, captions, browser/renderer and exporter source. Changed settings get a separate job. An explicit `--job DIR` refuses a mismatched fingerprint instead of mixing incompatible frames. A lock prevents two writers; stale locks from exited processes are recovered.

A partial MP4 becomes the final output only after verification: exact frame count, 1080×1920, 30 fps, duration and expected audio-track presence. A sidecar `<video>.mp4.json` records those checks, render/reuse counts and caption/mouth timing sources. Keep the frame cache until the export is accepted; deleting a completed job folder later only removes the ability to resume that job.

The render process uses one local browser session and one local frame loop. Do not put an agent/tool round trip around each frame, wait for a continuously running editor to become idle, or use a screen recorder as the headless export engine.

## Localhost and remote agents

The render command starts and stops its own private loopback server. It never asks the user to open that address. Muse can run the whole job on its own machine and send the MP4 as a file.

For interactive editing, use your platform's authenticated preview/port forwarding or run the studio on the user's own machine. A localhost address from a remote machine will not work in a separate user browser. Publishing the studio or exposing its port to the internet is not required for exporting videos.
