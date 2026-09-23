# SKILL ARENA Cyberpunk UI Overhaul

## Goal
Restyle the existing app into the supplied high-end cyberpunk esports interface while preserving authentication, assessment, battles, learning, progress, history, AI Coach, Token Shop, and all existing state.

## Changes
- Replace the global palette with void-black surfaces and cyan, emerald, amber, crimson, and violet semantic accents; add a subtle dot-grid backdrop, sharper chamfered panels, restrained neon glows, and reduced-motion support.
- Standardize typography around JetBrains Mono, uppercase tracked headings, compact telemetry labels, terminal-style inputs, status chips, cards, and command buttons.
- Rebuild the authenticated shell with a top telemetry ticker, responsive navigation, prominent ELO/CC/NRG/core status, and a mobile-safe navigation drawer.
- Restyle shared cards and every current page through global primitives so dashboards, learning content, battle rooms, tournaments, history, charts, and shop items share one coherent visual language.
- Upgrade AI Coach chat and analysis views with an editor-like frame, line-number gutter, syntax-like text treatment, diagnostics styling, and command controls without changing its AI behavior.
- Restyle sign-in, sign-up, password reset, resend verification, assessment, loading, and error states to match the same SKILL ARENA identity.
- Update page metadata to describe SKILL ARENA accurately.

## Technical details
- Keep the current React routes, context, Cloud calls, and event handlers unchanged.
- Concentrate reusable styling in semantic CSS tokens and shared shell/components; make focused JSX changes only where structure is required.
- Use existing Lucide icons and Framer Motion, with subtle active-state animation and `prefers-reduced-motion` fallbacks.
- Verify signed-out and authenticated screens at desktop and mobile sizes, plus key tab/button interactions.
