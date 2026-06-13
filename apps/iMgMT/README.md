# iMgMT — Leave & Employee Management System

Internal office application for leave requests, org structure, employee records, contracts, documents, assets, and delegation-aware approvals.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- NextAuth (credentials)
- Tailwind CSS 4
- Vitest (leave day calculator tests)

## Quick Start (Docker)

From the repository root:

```bash
cp .env.example .env
# Set IMGMT_DATABASE_URL / imgmt-db credentials if needed

docker compose up -d --build imgmt-db imgmt
```

App: http://localhost:3011

Default admin (after seed):

- Email: `admin@imgmt.local`
- Password: `ChangeMe123!`

Set `IMGMT_RUN_SEED=false` after first deployment.

## Local Development

```bash
cd apps/iMgMT
npm install

# From repo root .env or apps/iMgMT/.env:
# DATABASE_URL=postgresql://imgmt_user:password@localhost:5438/imgmt

npm run db:migrate:dev   # first time: creates/applies migrations
npm run db:seed
npm run dev
```

Open http://localhost:3011

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3011 |
| `npm run build` | Production build (standalone) |
| `npm run test` | Run unit tests |
| `npm run db:migrate` | Deploy migrations (production) |
| `npm run db:migrate:dev` | Create/apply migrations (development) |
| `npm run db:seed` | Seed roles, leave types, holidays, admin user |
| `npm run db:studio` | Prisma Studio |

## Environment Variables

See repository root `.env.example` for `IMGMT_*` variables. Key settings:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (iMgMT database) |
| `NEXTAUTH_URL` | App URL for auth callbacks |
| `NEXTAUTH_SECRET` | Session signing secret |
| `FILE_STORAGE_ROOT` | Local file storage root (`/var/app-data/files` in Docker) |
| `IMGMT_ADMIN_EMAIL` / `IMGMT_ADMIN_PASSWORD` | Seed admin credentials |
| `IMGMT_RUN_SEED` | Run seed on container startup |

## Project Structure

```
apps/iMgMT/
  prisma/
    schema.prisma       # Full domain schema
    seed.ts             # Roles, leave types, T&T holidays 2026–2027
    migrations/         # SQL migrations + audit append-only trigger
  src/
    app/                # Next.js routes
    lib/
      auth.ts           # NextAuth credentials provider
      rbac.ts           # Role permissions & route guards
      audit.ts          # Manual audit writes (auth events)
      audit-extension.ts # Automatic Prisma write auditing
      leave/calculator.ts
    middleware.ts       # Auth + RBAC
  Dockerfile            # Multi-stage standalone build
```

## Implemented (this phase)

- Full Prisma schema for all core entities
- Initial migration + append-only `AuditLog` Postgres trigger
- Seed: RBAC roles, leave types, T&T public holidays 2026–2027, admin user, app settings
- NextAuth credentials login
- RBAC helpers and middleware route guards
- Prisma extension for automatic entity audit logging
- Leave day calculator with unit tests (Fri+Mon=4, edge weekends, holidays)
- Dark cinematic UI shell (home + login)
- Docker: standalone image, dedicated `imgmt-db`, file storage volume

## Build order — remaining

3. Users, departments, reporting lines + org chart
4. Leave engine: balances, request lifecycle, approval resolution (delegation/escalation)
5. Notifications queue + SMTP templates
6. Documents/qualifications + contracts + certificate flow
7. Assets + exit clearance
8. Dashboards, calendar, admin panels, audit viewer
9. Deployment scripts (PM2, Nginx, backup cron)

## License

Proprietary — internal use.
