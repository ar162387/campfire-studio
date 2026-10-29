# Reusable characters and motion

`src/puppet/Characters.tsx` owns `Human`, `Mascot`, `Face`, `Performance`, `Look`, `EMOTIONS`, `ACTIONS` and `defaultLook`. Inspect the current implementation before editing; reuse its rig and face geometry.

Looks expose skin, shirt, hair and mascot colors. Face eyes, brows and mouth are independent geometry. Mouth opening reads `pose.talk` (0–1) from dialogue amplitude, while expressions control shape. Keep natural blinking, subtle head/body motion and the listener's attention; do not place a second animated face over a baked detailed portrait.

Custom expressions are records in `project.expressions`: `{id,name,base,browTilt,eyeScale,smile,mouthWidth}`. Beats refer to `expression:id`. `Performance.ts` and the lab editor already apply these; reuse them for a new mood. Base moods preserve the seven supported keys. `look` controls attention toward laptop/partner, with opposite signs for the two characters; `bodyTurn` rotates the body. Use lab preview to verify direction rather than guessing.

For a new body action, add the key to `ACTIONS`, implement a restrained deterministic pose in the existing rig, and verify returning to idle/listen resets every transform. Motion should be a function of frame, not accumulated random changes, so scrubbing and recording agree. Keep mouth movement independent of a nod, shrug or point.

For a different human or mascot, modify head/hair/clothes/silhouette inside the corresponding component while preserving the same props and controls. Current character positions are defined in these components, not solely in the background. Keep selectable rig identities `human`/`creature` stable even if display names change. Search Studio.tsx for user-facing Host/Claude labels when renaming the cast.

Test close-ups, both profiles, the over-laptop view and a wide shot. Hair needs a back/sides silhouette, hands should not penetrate the laptop, and expressions should remain readable at phone size. Rendering style is low-poly geometry; no image/video model is required.

## Extended direction channels (v2)

`state` and `listenerState` are independent of emotion: `none`, `powered-down`, `blush`, `sweat`, `sick`, `hearts`, `dizzy`, `ghost`. Powered-down mutes eyes/mouth, desaturates and slumps. Effects come from frame time. Ghost geometry is generated from the current pose, so direct seeking and sequential export agree.

`blocking`: `seated`, `standing`, `enter-left`, `enter-right`, `presenter`, `collapsed`, `crouch`, `profile`, `hands`. The last explicit position persists across turns; entrance progress belongs to its initiating beat and is not restarted by later dialogue. Automatic Host/Claude cameras account for standing/crouched/collapsed positions. Custom cameras are authored poses; inspect them after a position change.

`prop`: `none`, `note`, `cup`, `phone`, `mushroom`; `propText` labels a note. The prop persists until the actor explicitly selects `none` or another prop. `propAction`: `none`, `hold-up`, `hand-over`, `bite`, `scan`. These are directed gestures: hand-over offers the prop; author a recipient's next beat with the same prop and release the giver explicitly. There is no physical collision/automatic ownership simulation. Bite reduces a prop after the bite phase; scan adds a beam. Keep limb contact believable in a close-up.

`endingHold` holds the final directed pose and caption with the mouth closed after the final beat. Episode duration must include the desired hold; the editor's control extends the timeline. A state may be stronger than an emotion, so check face readability. `npm run gallery` renders all registered sets and the extended state sample for inspection.
