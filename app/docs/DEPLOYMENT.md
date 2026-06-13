# Production deployment

## Docker (recommended)

From the project root:

```bash
cp .env.example .env
# Set APP_URL, NEXTAUTH_URL, secrets, and DB passwords for your host (e.g. http://10.1.1.15:3010)

# First install only:
# RUN_SEED=true
docker compose up -d --build

# After the first successful start:
# RUN_SEED=false
docker compose up -d app
```

Services:

| Service | Port | Container |
|---------|------|-----------|
| CMS / public site | 3010 | `infrastructure-website-app` |
| iMgMT | 3011 | `infrastructure-website-imgmt` |
| CMS Postgres | 5437 | `infrastructure-website-db` |

Check status:

```bash
docker compose ps
curl -I http://127.0.0.1:3010/
```

Rebuild after code changes:

```bash
docker compose up -d --build app
```

### Startup behaviour

On each start the app container:

1. Waits for Postgres (`pg_isready` healthcheck)
2. Runs `prisma migrate deploy` (auto-baselines if the DB has tables but no migration history)
3. Optionally seeds when `RUN_SEED=true` (seed failures on an already-populated DB do not block startup)
4. Starts the Next.js standalone server on port 3000 (mapped to `APP_PORT`, default 3010)

Uploads are mounted from `./uploads` — the Docker image does not bake them in.

## Build

```bash
cd app
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run build
```

## Run (direct)

```bash
HOSTNAME=0.0.0.0 PORT=3010 npm start
```

This runs the standalone production server (`node .next/standalone/server.js`). Do not use `next start` when `output: "standalone"` is enabled in `next.config.ts`.

The app listens on **http://0.0.0.0:3010**.

## Run with PM2 (recommended)

```bash
cd app
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # optional — enable restart on boot
```

After code changes, rebuild before restarting PM2:

```bash
npm run build
pm2 restart infrastructure-website
```

Users with an open admin tab may need a hard refresh (Ctrl+Shift+R) so the browser loads JS with matching Server Action IDs.

Do **not** use `next start` or `pm2 start npm -- start` — with `output: "standalone"`, only `node .next/standalone/server.js` (via `npm start` or `ecosystem.config.js`) is supported.

## Development

Use `npm run dev` only for local development. Production should use `npm run build` + `npm start` or PM2.

## Environment

Ensure `.env` includes at least:

- `DATABASE_URL`
- `NEXTAUTH_URL` (e.g. `http://10.1.1.15:3010`)
- `NEXTAUTH_SECRET`

After CMS publishes or settings change, caches revalidate automatically via Next.js tags.
