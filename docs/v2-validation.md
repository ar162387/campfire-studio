# V2 implementation and verification

The shipped creative defaults follow the supplied Muse AV study. This release extends the existing engine; it does not replace it with a new animation system.

| Area | Implemented | Verification |
| --- | --- | --- |
| Sets | Eight selectable environments; original cast anchors | Native rendered set gallery; every built-in shot inspected |
| Direction | Seven additional body states, persistent blocking/props, gestures, camera pushes | Deterministic model tests and silent motion sample |
| Screens | Nine modes, type-on, interruption banner, counters, cursor, timestamps, grid | Native screenshots; event persistence/backward seek tests |
| Captions | Speaker-colour clause cards; optional karaoke; shared canvas/font | Timing/text validation and timeline retiming tests |
| Ending | Final directed pose/caption holds, mouth closes | Frame-clock tests and full pilot export |
| Writing | Nine prompts, story roles/checker, original pilot, continuity ledger | 24-line pilot passes structural checks; ledger rejects missing plants |
| Research | Source/provenance records, view outliers only with medians | Likes/aggregate counts cannot become reel outlier ratios |
| Experiments | Caption variants and rate calculations | Null handling, no automatic winner declaration |
| Voices | Ordered explicit-model request, saved takes, exact transcript/timestamp checks, forced alignment path | Offline request/fixtures; short sample and 100.8-second v4 dialogue validated through the official SDK |
| Packaging | In-world cover, subtitles, post-caption draft, episode, review report | Local pilot pack; existing video must match its episode hash |
| Export | Native 1080×1920, 30 fps, H.264, silent/audio mix, resumable frames | Existing audio/mix/resume tests plus actual silent pilot and software-render checks |

The original pilot still ships silent with estimated timing. V2.1 additionally validated a live 100.8-second, sixteen-turn v4 scene and rendered an eighteen-second excerpt with measured captions, dialogue-driven mouth movement and one audio track. Native timestamps and speaker segments were returned; the final non-spoken punctuation had 80 ms of padding beyond the audio. A bounded 120 ms trailing-padding tolerance handles that case without changing spoken times. Forced alignment of the saved take also passed. No new voice generation is needed to test scene changes. Credentials and generated audio remain local and ignored by Git.

Body gestures are procedural, not physics simulation. Hand-over needs an explicit recipient/release beat. Automatic close-ups follow body placement; saved custom cameras require inspection after pose/layout changes. Informational movement and good dialogue matter more than adding motion to every beat.

The default script timer does not determine final speech duration. Align the finished take, review intentional pauses and independent absolute screen events, then export. Final publication remains manual.
