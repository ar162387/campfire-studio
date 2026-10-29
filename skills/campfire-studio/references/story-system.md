# Research-informed episode production

The creative specification comes from the user's Muse study of six creators and twenty reels. The user confirms seven agents watched and listened to the reels, then examined captions and metadata. The distilled study is the brief; the original AV reports were not delivered with this repository. `research/evidence.json` records provenance. Do not dismiss it as a metadata-only study or claim to have personally watched its source reels.

Two first-party sources describe million-view aggregate results: [AgentPoly](https://www.agentpolystudios.com/) and [AgentMorphy](https://www.appmorphy.com/blog/how-i-make-ai-reels). These are creator reports, not an independently audited promise of reach. Study like counts are not view counts. Rank account outliers only with actual reel views and comparable recent median views.

## Story direction

Write original stories using the mechanics, not competitors' lines or assets. Start with a specific, truthful problem or label the premise fictional. Never invent a client result. The Host drives the mistake; Claude is competent, dry, kind and has a small want of its own. Weekly baseline is teasing and devotion. Rivalry and off-screen message stories are occasional variations, not a compulsory romance plot.

Default episode grammar: roughly 50–60 seconds, 20–29 short lines, first caption/speech on frame zero, close opening face, first twist within ten seconds, escalating receipts, one sincere beat around 60–75%, a planted object returning near the end, a quotable final line of 2–4 words. A final held pose gets 1–1.5 seconds. This is editorial guidance, not a guarantee. Longer teaching scenes may deliberately depart from it.

Five useful opening shapes: catastrophe confession; flat claim inverted; rival-tool confession; a question leading to a specific number; challenge/bet. Genuine numbers need a source. Fictional numbers belong to an explicitly fictional premise.

Use `role` on beats: `hook`, `twist`, `escalation`, `sincere`, `payoff`, `button`, `silence`. Empty dialogue is a silent beat; never put `[beat]` into caption text. Use `delivery` for spoken direction cues. Most cameras follow the speaker; use listener reactions for reveals, and put the button on a face. A restrained `cameraMotion` of 0.05–0.12 gives a sincere line a slow push.

```sh
npm run episode:check -- examples/one-tiny-change.episode.json
```

Warnings are suggestions, not a veto on an intentional choice. The checker does not judge comedic quality or claim an episode will go viral.

## Captions and continuity

`captionStyle.mode` defaults to `chunks`: short clause cards with Host white and Claude gold. Karaoke remains selectable for an honest A/B. Optional `captionChunks` must concatenate to the exact spoken text; their times are absolute episode seconds. Without explicit cards the compositor splits on clauses and the word limit. Real word timing comes from aligned speech; otherwise timing is an estimate. Canvas painting, font, position and colour are shared by live preview, browser recording and offline export. Caption backdrops help when a working screen occupies the same band.

Series data supports `name`, `episode`, `motif`, `anchor`, `coverLine`, `postCaption`, `funnel`, `continuityPlant`, `continuityPayoff`. A continuity ledger stores looks and cast IDs alongside plants/payoffs:

```sh
node tools/content-system.mjs ledger episode.json output/series-ledger.json
node tools/content-system.mjs rank research/reels.json output/ranked.json
node tools/content-system.mjs compare output/experiment-results.json
```

`rank` input is an array of `{metric:'views', value, recentMedianViews, source, observedAt}` records. Missing medians or non-view metrics produce a null ratio. `compare` input records can include `variant`, `reach`, `plays`, `saves`, `shares`, `completedPlays`, `averageWatchSeconds`, `duration`. Compare rates and retention on comparable observation windows. The tool never invents a winner from unavailable data.

In story mode keep the sales ask outside the video. A post-caption question is normal. A tutorial may intentionally use a keyword funnel. Do not append a keyword pitch and a cliffhanger together by default. No auto-posting or unsolicited DMs.

## Local publishing pack

```sh
npm run pack -- episode.json --out output/review-pack --render
# Silent feasibility preview:
npm run pack -- examples/one-tiny-change.episode.json --out output/silent-pack --render --silent
# Reuse an existing full-length export:
npm run pack -- episode.json --out output/review-pack --video output/final.mp4
```

This writes an in-world 1080×1920 cover, portable episode, VTT captions, post-caption draft and review report. `--frame N` chooses the cover frame; `--cover-style face` selects a plain in-world face cover instead of the badge/sticky-note layout. Existing videos need the matching render sidecar with an episode hash; a revised script cannot silently reuse an old video. `--variant karaoke` or `chunks` selects an experiment render. The cover is a separate file; it is not an intro title card. Packaging does not publish. The generated caption/cover remain drafts until reviewed with the final speech.

Read [prompt-vault.md](prompt-vault.md) for the nine production prompts. `examples/one-tiny-change.episode.json` is an original, fictional 24-line pilot; its timing is estimated and it ships silent. `direction-lab.episode.json` is a capability sample, not a content recommendation.
