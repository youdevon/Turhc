#!/usr/bin/env node
/**
 * Copy static assets into the Next.js standalone output folder.
 * Required when using output: "standalone" in next.config.
 *
 * Uploads are intentionally omitted here. Docker mounts ./uploads at /app/uploads
 * (see UPLOAD_DIR in .env). Local standalone runs should set UPLOAD_DIR explicitly.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.error("Standalone build not found. Run `npm run build` first.");
  process.exit(1);
}

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

copyRecursive(path.join(root, "public"), path.join(standaloneDir, "public"));
copyRecursive(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));

console.log("Standalone assets prepared.");
