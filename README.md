# My Firsts｜今年第一次

A personal collection of the meaningful firsts that made a year different.

My Firsts is a warm, mobile-first web app for collecting the moments that felt like a “first” in a given year. It is intentionally smaller than a journal: add a title, a date, an optional memory, and one photo, then return later to see how those moments shaped the year.

- **Live Demo:** [my-firsts-mu.vercel.app](https://my-firsts-mu.vercel.app/)
- **GitHub:** [Jocelin0905/my-firsts](https://github.com/Jocelin0905/my-firsts)

## Core features

- Create, view, edit, and delete Firsts with permanent per-year `FIRST #001` numbering
- Browse a collectible card wall by year and category
- Keep photos locally with compressed detail images and lightweight thumbnails
- Review yearly totals, categories, months, and a chronological timeline
- Export and restore complete JSON backups, including photos and numbering state
- Recover safely from malformed browser data without losing readable records
- Use every route directly on Vercel through the included SPA rewrite

## Product decisions / build notes

- Text and product state live in `localStorage`; image blobs live in IndexedDB.
- Number counters never decrease, so deleting a record never reuses its number.
- Moving a First to another year allocates a new number in the destination year.
- A standard backup is all-or-nothing: if a referenced photo is missing, export stops and identifies the affected record.
- Dates are stored as local calendar dates and future events are rejected.
- The app has no account, backend, cloud sync, social layer, or analytics dashboard.

## What I learned

- How to model CRUD data so display order, event dates, and permanent collection numbers remain independent.
- How to split browser persistence between `localStorage` metadata and IndexedDB image blobs.
- How to compress images, preserve transparency during format fallback, and serve thumbnails on a media-heavy wall.
- How to design an all-or-nothing backup restore flow that validates everything before replacing local data.
- How to test a client-side application across unit, integration, responsive, routing, Chromium, and WebKit layers.

## Tech stack

React 19, TypeScript, Vite, React Router, CSS, IndexedDB, localStorage, Vitest, Testing Library, Playwright, ESLint, and Vercel.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Local-data notice

All records stay in the current browser. Clearing browser data, using private browsing, changing browsers, or changing devices can make records unavailable. Use **Settings → Export backup** to keep a portable copy.

## Documentation

- [Data model](docs/DATA-MODEL.md)
- [QA checklist](docs/QA-CHECKLIST.md)

## Status

V1 is live. The production deployment tracks the `main` branch on Vercel and includes SPA rewrites for direct route access and refreshes.
