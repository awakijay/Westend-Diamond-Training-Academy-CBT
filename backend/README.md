# Westend Diamond Training Academy CBT Backend

This folder now contains a working backend for the CBT platform.

It is still not wired into the React app yet, but the backend itself now includes:

- admin authentication with JWT
- subject, question, upload, UIN, result, and analytics endpoints
- server-owned candidate session lifecycle
- server-side timer enforcement, scoring, and result creation
- request validation and file-backed persistence

## Proposed Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Zod
- JWT or secure session-based admin auth

## Current Status

Included:

- `prisma/schema.prisma` with the target relational data model
- Express app bootstrap and route registration under `/api`
- JWT admin authentication
- subject, question, upload, UIN, candidate session, result, and analytics routes
- learner-safe session serialization without answer keys
- server-side section timing, auto section-break state, completion, and scoring
- JSON file-backed persistence in `DATA_DIR` for local/runtime storage

Still pending outside this folder:

- React frontend API wiring
- deployment-time database migration from the file store to Prisma/PostgreSQL if you want managed relational persistence in production

## Review Order

1. Read `docs/DECISIONS_TO_CONFIRM.md`
2. Review `prisma/schema.prisma`
3. Review `docs/API_CONTRACT.md`
4. Review the implemented route modules in `src/modules`

## Project Layout

```text
backend/
  docs/
  prisma/
  src/
    common/
    config/
    lib/
    modules/
    routes/
```

## Key Notes

- The frontend currently uses course names as section identifiers; this backend scaffold normalizes that to `subjectId` plus a `subjectNameSnapshot` where historical records need stability.
- A `TestSessionSection` table is included even though it was not explicitly listed in the original handoff. It makes section timers and immutable session snapshots much easier to enforce correctly.
- UIN handling is modeled with both `status` and `isUsed` so the backend can support states like `LOCKED` or `VOID` without losing the simpler used/unused view the current UI expects.

## Suggested Next Step

Wire the React app to the backend using the endpoint map in `docs/FRONTEND_ENDPOINTS.md`.

## Environment

Copy `.env.example` to `.env` before running the backend.

Default seed admin credentials:

- username: `admin`
- password: `WEDEL145!@#`

powershell.exe -ExecutionPolicy Bypass -File .\start-dev.ps1
