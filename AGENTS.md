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
- Every clickable button must include a descriptive `title` attribute for native tooltips (and matching `aria-label` when icon-only). Wrap disabled buttons in a parent with `title` so tooltips still appear.
- Prefer the smallest correct fix that matches the actual problem. Avoid over-engineering or sweeping rewrites unless complexity is explicitly requested or technically necessary.
- For fast audio response, playback should always be on mouse down, not click.
- Prioritize strict music-theory accuracy in labels and explanations; avoid simplified wording that could be technically wrong.
