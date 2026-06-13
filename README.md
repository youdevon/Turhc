# Infrastructure Website and CMS

Modern public website and CMS for a special-purpose state enterprise / government-owned infrastructure delivery company.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** + **Prisma**
- **NextAuth** (credentials-based admin auth)
- **Tailwind CSS 4** + Framer Motion
- **Docker** + docker-compose

## Features

### Public Website
- Sticky navigation with scroll-compact blur header
- CMS-managed hero carousel (images/video)
- Homepage sections: Who We Are, Mandate, Projects, Tenders, Stats, News, Contractors, Governance, Contact
- Projects module with listing, detail, progress, milestones, documents
- Tenders module with filters, documents, addenda, clarifications
- News & public notices
- Governance pages (board, leadership, annual reports, policies, FOI)
- Contractor portal information pages
- Contact enquiry form

### CMS Admin (`/admin`)
- Dashboard, Pages, Hero Slides, Projects, Tenders, News, Documents
- Media Library, Board, Leadership, Site Settings, Users, Audit Logs, Enquiries
- Draft/publish workflow, toast notifications, breadcrumbs
- Audit logging for all key actions

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with secure passwords, secrets, and your server URL (APP_URL / NEXTAUTH_URL)

# First deployment only — seed admin user and demo content:
# RUN_SEED=true in .env, then:
docker compose up -d --build

# After first successful start, set RUN_SEED=false in .env and recreate the app:
# docker compose up -d app
```

App: http://localhost:3010  
Admin: http://localhost:3010/admin/login

Default admin (when seed runs):
- Email: `admin@infrastructure.local`
- Password: `ChangeMe123!`

The app container waits for Postgres to be healthy, runs migrations on startup (including baselining legacy databases), and restarts automatically unless stopped manually.

## Local Development

```bash
cd app
npm install
cp ../.env.example ../.env
# Update DATABASE_URL for local Postgres

npx prisma migrate dev
npm run db:seed
npm run dev
```

## Project Structure

```
app/                    # Next.js application
  prisma/               # Schema, migrations, seed
  src/
    app/
      (public)/         # Public website routes
      admin/              # CMS admin routes
      api/                # API routes (auth, uploads, enquiries)
    components/           # UI components
    lib/                  # Database, auth, CMS actions, utilities
docker-compose.yml
.env.example
uploads/                # Uploaded media (mounted volume)
```

## Environment Variables

See `.env.example` for all required variables.

## Database

```bash
cd app
npm run db:migrate      # Deploy migrations (production)
npm run db:migrate:dev  # Create/apply migrations (development)
npm run db:seed         # Seed admin user and demo content
npm run db:studio       # Prisma Studio GUI
```

## License

Proprietary — government infrastructure delivery organisation.
