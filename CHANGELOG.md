# Changelog

All notable changes to this project will be documented in this file.

## 0.2.0 - 2025-09-24
- Performance: `/packages` and `/packages/[id]` query Prisma directly (no self-fetch), add ISR and loading skeletons.
- Stability: try/catch around DB calls; global error UI at `app/error.tsx`.
- UX: Prefetch on cards; fallback mock data when DB unavailable.
- Config: Tailwind, TypeScript paths alias (`@/*`), outputFileTracingRoot in `next.config.ts`.
- API: `GET /api/v1/packages`, `/api/v1/packages/[id]`, `/api/v1/hospitals` scaffolds.
- DB: Prisma schema with indices; Docker Compose for Postgres; seed script (ESM) and DB scripts.

## 0.1.0 - Initial
- Initial scaffold: Next.js 14, Prisma schema, basic pages and components.
## 0.2.1 - 2025-09-24
- API hardening: add try/catch and graceful fallbacks to `/api/v1/packages`, `/api/v1/packages/[id]`, `/api/v1/hospitals` to avoid 500s when DB is unavailable.

## 0.2.2 - 2025-09-24
- DB: Add unique constraint on `Hospital.name` and apply migration in non-interactive env.
- Seed: Switch to ESM `prisma/seed.mjs`; fix seed flow and regenerate Prisma Client.

## 0.2.3 - 2025-09-24
- Next.js 15: Fix sync dynamic APIs by awaiting `params` in `/packages/[id]/page.tsx`.
- Config: Move `experimental.outputFileTracingRoot` → top-level `outputFileTracingRoot` in `next.config.ts` to silence warning.

## 0.2.4 - 2025-09-24
- Seed: Add multiple hospitals (CMH, Sriphat, Chiangmai Ram) and diverse packages (basic/premium/executive/pre-op/cardiac/senior) with various statuses (APPROVED/DRAFT/ARCHIVED), includes, and price histories.
