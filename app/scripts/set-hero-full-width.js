/* One-off: switch the landing page hero layout to full_width (published + draft). */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const page = await prisma.page.findFirst({
    where: { isLandingPage: true },
    select: { id: true, settingsJson: true, draftData: true },
  });
  if (!page) {
    console.log("No landing page found");
    return;
  }

  const settings = page.settingsJson ? JSON.parse(page.settingsJson) : {};
  settings.layout = "full_width";

  let draftData = page.draftData;
  if (draftData) {
    try {
      const draft = JSON.parse(draftData);
      if (draft?.hero) {
        draft.hero.layout = "full_width";
        draftData = JSON.stringify(draft);
      }
    } catch {
      // leave draft untouched if unparseable
    }
  }

  await prisma.page.update({
    where: { id: page.id },
    data: { settingsJson: JSON.stringify(settings), draftData },
  });

  console.log("Hero layout set to full_width:", JSON.stringify(settings));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
