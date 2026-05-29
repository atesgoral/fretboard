# AGENTS Instructions

- No fucking emojis in this app.
- Never use inline SVG; use `lucide-react` icons consistently.
- Proactively split React components into child components.
- Optimize for single responsibility.
- Prefer dumb presentation children.
- Prefer rendering performance.
- If you encounter an issue, do not waive it as "found it like this"; fix it.
- Enabled clickable elements must show `cursor: pointer`. Disabled buttons must use the default cursor. Never use `cursor: not-allowed` or the disabled/not-allowed cursor.
- Disabled buttons must be completely inert: no hover styles. Use `enabled:hover:` (or equivalent) so hover effects apply only when the control is enabled.
- Every enabled clickable button must include a descriptive `title` attribute for native tooltips (and matching `aria-label` when icon-only). Decorative icons inside the button need `pointer-events-none` so hover stays on the button.
- Disabled controls must be fully inert: use the HTML `disabled` attribute, no `title` tooltip, no hover styles (`enabled:hover:`). Do not use `aria-disabled` workarounds to show tooltips on unavailable actions; add a separate explanation pattern later when there is a real documentation need.
- Prefer the smallest correct fix that matches the actual problem. Avoid over-engineering or sweeping rewrites unless complexity is explicitly requested or technically necessary.
- For fast audio response, playback should always be on mouse down, not click.
- Prioritize strict music-theory accuracy in labels and explanations; avoid simplified wording that could be technically wrong.

## Cursor Cloud specific instructions

This is a client-side-only React/Vite SPA (no backend, no database, no Docker).

- **Node version**: 24 (matches CI). Installed via nvm; the `/exec-daemon/node` binary on cloud VMs is v22, so the update script prepends nvm's Node 24 to PATH.
- **Package manager**: npm (lockfile: `package-lock.json`).
- **Dev server**: `npm run dev` starts Vite on port 5173.
- **Tests**: `npm run test` (Vitest, jsdom environment).
- **Lint/checks**: `npm run typecheck`, `npm run format:check`, `npm run check:no-inline-svg`.
- **Build**: `npm run build` outputs to `dist/`.
- **Git hooks**: `simple-git-hooks` runs `lint-staged` (Prettier) on pre-commit. Hooks are installed automatically by the `prepare` script during `npm install`.
- **Audio**: The `smplr` library fetches soundfont assets from a CDN at runtime; audio playback requires network access but the rest of the app functions without it.
