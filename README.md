# Vite + React + Tailwind GitHub Pages Starter

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

This repository includes `.github/workflows/deploy.yml` that builds on pushes to `main` and deploys `dist/` to GitHub Pages.

### Required repository settings

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).

The Vite `base` path is auto-set during GitHub Actions runs using the repository name so assets resolve correctly on project pages.
