# Sets and camera templates

The shipped template is `campfire`. New settings extend this engine; they are not prebuilt scenes awaiting selection.

- `SceneTemplates.tsx`: registry of `{id,name,Set,cameras?}`.
- `CampfireSet.tsx`: set geometry, lights, fire and trees.
- `CampfireEnvironment.tsx`: instanced pebbles, grass, bushes, stars and ridges.
- `World.tsx`: composes the selected set with the existing cast and camera rig.
- `CameraRig.tsx`: six defaults, saved poses and OrbitControls.

To add an office, café or another setting:

1. Create a set component accepting `{frame:number}`, using the current low-poly material/lighting style. Register it in `SCENE_TEMPLATES` with a stable ID. The set includes background, lights, ground and props; World adds cast and cameras.
2. Design the set around the existing seated human and elevated mascot anchors (inspect Characters.tsx). Character repositioning requires updating the rig anchors, props and shot targets together. Avoid hidden geometry blocking faces or clipping the laptop.
3. Optionally supply `cameras` to override default shot names for the template. A pose is `{id,name,templateId,position:[x,y,z],target:[x,y,z],fov}`. Template ID must match. FOV is 15–90; position and target must differ. Built-in shot names can be overridden; keep Wide/Host/Claude/etc available for existing beats.
4. Set `project.templateId` to the registered ID in the exported episode. Studio currently does not have a template-picker UI; agents select through JSON. Do not imply it does. Custom camera controls reuse the current template ID.
5. Test all six shots, custom orbit/zoom/pan, captions, recording and the character contacts with seats/props.

Example registry entry:

```tsx
import {OfficeSet} from './OfficeSet';
// Add beside campfire in SCENE_TEMPLATES:
office: {id:'office', name:'Office at dusk', Set:OfficeSet,
 cameras:[{id:'Wide',name:'Wide',templateId:'office',position:[3,3.2,10.5],target:[0,1.1,0],fov:37}]}
```

Unknown template IDs currently fall back to campfire; validate spelling before presenting a new setting. Large repeated props should use instancing/memoized deterministic layouts. Fire flicker, drifting sparks and gentle environmental movement come from frame time. Keep foreground details away from faces/caption space; avoid large per-frame scene rebuilds.

Human users can save named poses via Custom camera: orbit, wheel/pinch to zoom, right-drag to pan, frame actor/both, name and Save. AI can author the same `cameraPresets` data. Saved camera lookup is scoped to the project's template.
