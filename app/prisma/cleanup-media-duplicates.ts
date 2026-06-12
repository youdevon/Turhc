import { cleanupAllDuplicateMedia } from "../src/lib/media-duplicates";

async function main() {
  console.log("Rebuilding metadata and removing duplicate media…");
  const result = await cleanupAllDuplicateMedia();

  console.log(`\nDone.`);
  console.log(`  Groups processed: ${result.groupsProcessed}`);
  console.log(`  Duplicates removed: ${result.removed}`);
  console.log(`  Reference updates: ${result.referencesUpdated}`);

  for (const detail of result.details) {
    console.log(`\n  ${detail.group}`);
    console.log(`    Kept: ${detail.keptId}`);
    console.log(`    Removed: ${detail.removedIds.length}`);
    if (detail.reassigned.length) {
      console.log(`    Reassigned: ${detail.reassigned.join(", ")}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  });
