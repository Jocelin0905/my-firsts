# My Firsts V1 QA checklist

## Automated gates

- [x] ESLint passes
- [x] TypeScript project build passes
- [x] 50 unit and integration tests pass
- [x] Production bundle builds
- [x] Playwright scenarios cover Chromium and WebKit projects
- [ ] Playwright browser binaries run in CI or another network-enabled environment

## Product flows

- [x] First-run onboarding is shown once
- [x] Add, view, edit, and delete a First
- [x] Reject a blank title and future date
- [x] Preserve numbering after delete
- [x] Allocate a new number after a cross-year edit
- [x] Filter by category and switch dynamic years
- [x] Show current-year and historical-year copy correctly
- [x] Show annual totals, category/month counts, and timeline
- [x] Persist records, counters, milestones, and images across reloads
- [x] Compress images and load thumbnails on the wall
- [x] Remove and replace an existing image
- [x] Export a complete backup and reject missing-image export
- [x] Validate a restore before replacing current data
- [x] Preserve current data after a failed restore
- [x] Recover from malformed localStorage without a white screen

## Responsive and routing

- [x] Manual Chromium review at mobile and desktop widths
- [x] No horizontal overflow in the reviewed screens
- [x] Long titles wrap without breaking cards
- [x] Direct-route fallback is configured in `vercel.json`
- [ ] Confirm all routes after production deployment
- [ ] Supplement with real macOS/iPhone Safari when that environment is available

Playwright WebKit is useful cross-engine coverage but is not treated as proof of real Safari behavior.

## Publication gates

- [ ] Generate and commit `package-lock.json` with working npm access
- [ ] Push `main` to GitHub
- [ ] Connect the Vercel project and verify automatic deployment
- [ ] Run production route-refresh checks
- [ ] Add final Live Demo and GitHub URLs to the README
