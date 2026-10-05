# Skill Arena implementation rules

- Keep existing React routes, Lovable Cloud-backed behavior, and state intact while changing presentation; this preserves active player workflows.
- Define neon palette and editor syntax colors in global semantic CSS tokens; this keeps component visuals consistent and themeable.
- Compose AI Coach chat from installed AI Elements primitives and keep its existing streaming transport; this preserves chat behavior while standardizing the visible interface.
- Keep the public arena-entry screen and signed-in mission hub visually distinct while sharing semantic tokens and arena imagery; this preserves clear progression without changing routes.
- Mount lazy-loaded, presentation-only React Three Fiber scenes through ArenaVisual with route-specific motifs and a static fallback; this adds shared 3D depth without coupling player state to rendering.