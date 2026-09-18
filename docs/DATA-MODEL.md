# My Firsts V1 data model

## Text state

The `my-firsts-app-data` localStorage entry stores one versioned `AppData` object:

```ts
interface AppData {
  version: 1
  firsts: First[]
  numberCounters: Record<number, number>
  celebratedMilestones: Record<number, number[]>
}
```

Each `First` contains an immutable ID, a year-scoped permanent number, its event date, user content, optional image references, and creation/update timestamps. `year` is derived from `date`; it is never edited independently.

`numberCounters[year]` records the greatest number ever allocated for that year. It never decreases when records are deleted or moved. The visible year set is the union of the current calendar year, record years, counter keys, and milestone keys.

## Images

IndexedDB database `my-firsts-images` stores image blobs separately from text state. One uploaded source can produce:

- A detail image with a longest edge of at most 1800 px
- A thumbnail with a longest edge of at most 480 px

WebP is preferred. If WebP encoding is unavailable, transparent images fall back to PNG and opaque images to JPEG. A failed image operation must not corrupt the text record.

## Mutation rules

- New records allocate `numberCounters[year] + 1`.
- Deletion removes associated blobs but does not lower the counter.
- A same-year edit preserves `id`, `number`, and `createdAt`.
- A cross-year edit preserves `id` and `createdAt` but allocates a new destination-year number.
- Milestones are persisted per year and are only marked during a real create operation.

## Backup and restore

A backup contains the versioned text state plus Base64-encoded image and thumbnail blobs. Export fails if any record references a missing blob; a standard backup is therefore always restorable.

Restore is replacement, not merge. The entire file is parsed and validated before writes begin. Images are staged first, text state is switched once, and staged blobs are rolled back if that switch fails. Invalid imports leave existing data unchanged.
