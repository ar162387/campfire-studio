# Sets, working screens and cameras

The editor's Scene template picker selects eight registered sets: `campfire`, `working-room`, `after-hours`, `keypad`, `gauntlet`, `classroom`, `daylight`, `phone-world`. They reuse the same cast, timeline, speech and renderer. New settings extend `SceneTemplates.tsx`; never build a replacement video app.

- `StudioSets.tsx`: office/after-hours, keypad terrain, verification wall, teaching board, park and phone monolith.
- `CampfireSet.tsx` / `CampfireEnvironment.tsx`: campfire with instanced ground details, stars and sparks.
- `Direction.ts`: persisted screen events and held-pose clock.
- `World.tsx`: composition and framing adjustments for character position.
- `CameraRig.tsx`: six defaults, template-scoped named poses and orbit controls.

## Screen events

Attach a `screen` object to a beat. It updates at the line's start and persists through silent gaps. Independent project `screenEvents:[{id,time,screen}]` are also supported; voice retiming requires reviewing these absolute events, so prefer beat-attached screen actions when generating dialogue.

```json
{"mode":"terminal","title":"BUILD / LOCAL","lines":["Compiling...","One small change"],"typeOn":true,"charsPerSecond":22,"cutAt":21,"banner":"BUILD INTERRUPTED","status":"error","counter":1,"counterLabel":"ATTEMPTS","timestamp":"02:58 AM","cursor":[0.72,0.52]}
```

Modes: `chat`, `code`, `website`, `terminal`, `history`, `messages`, `calendar`, `verification`, `whiteboard`. Website has field/button rows, code/terminal has numbered or command-prefixed text, messages has alternating bubbles, calendar has date cells, verification has a 3×3 grid. `cells` and `selectedCell` customise verification. Screen content is drawn locally to a texture, never executed as HTML/code or sent to an external website. `cutAt` stops type-on at a character; the banner then appears. Counter, timestamp, status and cursor are independently editable in JSON; common controls are available on the selected-line director.

Use a `Screen` camera in the screen-based sets to make a receipt legible. Faces remain the default for dialogue; hold the screen only long enough to read it. Caption backdrops prevent text collisions. Campfire/daylight have no working screen; moving to these sets changes Screen beats to Wide in the picker.

## Extend a setting

Register `{id,name,Set,cameras?}`. Set receives `{frame,screen?,elapsed?}` and supplies background/lights/ground/props; World adds characters. Design around anchors in Characters.tsx. Moving the cast requires moving props, contacts and shot targets together. A scene should have foreground detail, cast/action plane and a distant layer; repeated objects and one luminous object provide continuity.

Camera pose: `{id,name,templateId,position:[x,y,z],target:[x,y,z],fov}`. Keep default shot names available. FOV must be 15–90 and position/target must differ. Named custom poses are scoped to their template. Human: orbit, wheel/pinch zoom, right-drag pan, choose actor/both, name and save. AI: author the same JSON. Beat `cameraMotion:0–0.3` is a deterministic push towards the target over the line.

Unknown template IDs are rejected by the offline exporter; check spelling before import. Test a wide shot, both close-ups, profiles, over-laptop, low angle and custom views, then native export. Memoize static geometry and dispose owned textures/materials. Do not copy another creator's assets or paid kit.
