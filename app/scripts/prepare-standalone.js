#!/usr/bin/env node
/**
 * Copy static assets into the Next.js standalone output folder.
 * Required when using output: "standalone" in next.config.
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

const uploadsSrc = path.join(root, "uploads");
const uploadsDest = path.join(standaloneDir, "uploads");
if (fs.existsSync(uploadsSrc)) {
  if (fs.existsSync(uploadsDest)) {
    fs.rmSync(uploadsDest, { recursive: true, force: true });
  }
  fs.symlinkSync(uploadsSrc, uploadsDest, "dir");
}

console.log("Standalone assets prepared.");
