# Vite + React + TypeScript + Tailwind GitHub Pages Starter

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm test
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Actions

- `.github/workflows/ci.yml` runs type checking, unit tests, and build on pushes to `main` and pull requests.
- `.github/workflows/deploy.yml` runs type checking, unit tests, build, and deploys `dist/` to GitHub Pages.

## GitHub Pages deployment

### Required repository settings

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).

The Vite `base` path is auto-set during GitHub Actions runs using the repository name so assets resolve correctly on project pages.
