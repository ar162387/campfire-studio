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
| Voices | Ordered explicit-model request, saved takes, exact transcript/timestamp checks, forced alignment path | Offline request/fixtures; live long-form provider test remains unverified without a caller key |
| Packaging | In-world cover, subtitles, post-caption draft, episode, review report | Local pilot pack; existing video must match its episode hash |
| Export | Native 1080×1920, 30 fps, H.264, silent/audio mix, resumable frames | Existing audio/mix/resume tests plus actual silent pilot and software-render checks |

The silent pilot uses estimated speech timing; the state sample uses synthetic mouth preview. Neither is a newly generated voice performance. Native timestamp validation catches a reset after 60 seconds in fixtures, but fixtures are not a live 90-second listening test. The current connected single-voice plugin does not expose the dialogue/alignment endpoints; the optional CLI requires ELEVENLABS_API_KEY and authorized provider credits.

Body gestures are procedural, not physics simulation. Hand-over needs an explicit recipient/release beat. Automatic close-ups follow body placement; saved custom cameras require inspection after pose/layout changes. Informational movement and good dialogue matter more than adding motion to every beat.

The default script timer does not determine final speech duration. Align the finished take, review intentional pauses and independent absolute screen events, then export. Final publication remains manual.
