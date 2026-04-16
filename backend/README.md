# Westend Diamond Training Academy CBT Backend

This folder is a review-ready backend scaffold for the current CBT frontend.

It is intentionally not connected to the React app yet. The goal is to give your backend developer a clean starting point with:

- proposed stack and project structure
- database schema
- API route map
- request validation
- implementation notes and open decisions

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

- `prisma/schema.prisma` with the core CBT data model
- Express app bootstrap
- route registration under `/api`
- Zod validation schemas for the expected request payloads
- endpoint stubs for admin auth, subjects, questions, uploads, UINs, candidate sessions, results, and analytics
- review docs for API contract and unresolved product decisions

Not included yet:

- real database queries
- authentication middleware
- file upload storage integration
- session scoring logic
- timer enforcement logic
- frontend API wiring

Most domain routes currently return `501 Not Implemented` on purpose. That keeps the folder safe for architecture review while still showing the exact API surface and data model.

## Review Order

1. Read `docs/DECISIONS_TO_CONFIRM.md`
2. Review `prisma/schema.prisma`
3. Review `docs/API_CONTRACT.md`
4. Review the route stubs in `src/modules`

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

## Suggested Next Step For The Backend Developer

Implement in this order:

1. admin auth
2. subjects
3. questions and uploads
4. UIN generation/listing
5. candidate session lifecycle
6. results and analytics

## Environment

Copy `.env.example` to `.env` when implementation begins.

