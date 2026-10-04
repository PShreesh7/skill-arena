# Interactive 3D Skill Arena

## What will change
- Turn the entrance into a full-screen, living 3D arena with a dimensional circuit floor, floating geometric skill core, and layered lighting. Pointer movement changes the perspective; the existing sign-in form stays usable.
- Give the signed-in mission hub its own 3D composition, distinct from the entrance.
- Add a shared, route-aware 3D visual band to Learning, Battle, Progress, History, AI Coach, and Token Shop, with different geometric motifs for each area.
- Add restrained depth and lift to existing cards and controls without changing their actions, content, or saved state.
- Keep the current Circuit Rush colors and fonts. Provide the existing arena image when 3D rendering is unavailable, pause motion when the page is hidden, and respect reduced-motion preferences.

## Technical approach
- Use React Three Fiber 8 and Drei 9, compatible with the existing React 18 app.
- Share one lightweight, lazy-loaded procedural scene system using global semantic color tokens, local lighting, textured surfaces, and bounded pointer parallax.
- Keep all forms, navigation, editors, chat, and battle logic in the existing React interface; 3D is presentation only.
- Verify entrance and authenticated inner pages at desktop and mobile sizes, including rendering, motion, account links, navigation, and console errors.