# Campfire Studio agent entrypoint

Read `skills/campfire-studio/SKILL.md`, then the reference matching the request. This is the implementation to extend, not just a visual inspiration. Do not scaffold a replacement app for a new character, setting, voice or episode.

- Browser UI: `src/puppet/Studio.tsx`; renderer: `World.tsx`.
- Cast: `Characters.tsx`; data: `types.ts`, `Performance.ts`.
- Sets: `SceneTemplates.tsx`, `CampfireSet.tsx`, `CampfireEnvironment.tsx`.
- Camera: `CameraRig.tsx`; captions: `Captions.ts`; transport: `Timeline.tsx`.
- Audio: `SoundMixer.ts`, `SoundLayers.ts`, `Assets.ts`; offline assembly: `tools/assemble-episode.py`.
- Offline export: `tools/render.mjs`, `render-core.mjs`, `render-audio.mjs`, `src/puppet/Offline.tsx`; read the rendering guide before headless/server exports.
- Sample: `examples/starter.episode.json`; no bundled dialogue or copied reel.

Use `npm ci && npm run typecheck && npm test && npm run build`. Run `npm start` (localhost only; `PORT` selects a free port). Build output is generated; edit `studio/studio.css`, not `dist/`.

Preserve an active user's episode and uploaded media with Export JSON before replacing content. Camera cuts must not restart voices; silent gaps hold the previous shot. Bracketed audio direction never appears in captions. Do not commit credentials, signed download URLs, user exports or generated private content. Paid speech uses the user's own provider account; ask only when the request lacks authorization for a chargeable generation.

A scene-template ID must be registered in source. The UI provides custom cameras, not a scene-template picker. New stage layouts must update rig anchors/prop contacts/shot targets together when moving characters. Validate actual browser output after relevant tests; no full-video render is required for a documentation-only change.

Agent exports: `npm run doctor -- episode.json`, short `npm run render -- episode.json --preview`, then final export. Native frame clock is fixed at 30 fps. Avoid per-frame agent tool calls and real-time recording on slow headless machines. Offline jobs have no dependency on a browser visible to the user.
