# Reusable characters and motion

`src/puppet/Characters.tsx` owns `Human`, `Mascot`, `Face`, `Performance`, `Look`, `EMOTIONS`, `ACTIONS` and `defaultLook`. Inspect the current implementation before editing; reuse its rig and face geometry.

Looks expose skin, shirt, hair and mascot colors. Face eyes, brows and mouth are independent geometry. Mouth opening reads `pose.talk` (0–1) from dialogue amplitude, while expressions control shape. Keep natural blinking, subtle head/body motion and the listener's attention; do not place a second animated face over a baked detailed portrait.

Custom expressions are records in `project.expressions`: `{id,name,base,browTilt,eyeScale,smile,mouthWidth}`. Beats refer to `expression:id`. `Performance.ts` and the lab editor already apply these; reuse them for a new mood. Base moods preserve the seven supported keys. `look` controls attention toward laptop/partner, with opposite signs for the two characters; `bodyTurn` rotates the body. Use lab preview to verify direction rather than guessing.

For a new body action, add the key to `ACTIONS`, implement a restrained deterministic pose in the existing rig, and verify returning to idle/listen resets every transform. Motion should be a function of frame, not accumulated random changes, so scrubbing and recording agree. Keep mouth movement independent of a nod, shrug or point.

For a different human or mascot, modify head/hair/clothes/silhouette inside the corresponding component while preserving the same props and controls. Current character positions are defined in these components, not solely in the background. Keep selectable rig identities `human`/`creature` stable even if display names change. Search Studio.tsx for user-facing Host/Claude labels when renaming the cast.

Test close-ups, both profiles, the over-laptop view and a wide shot. Hair needs a back/sides silhouette, hands should not penetrate the laptop, and expressions should remain readable at phone size. Rendering style is low-poly geometry; no image/video model is required.
