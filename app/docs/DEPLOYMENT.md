# Production deployment

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
