import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_TT_HOLIDAYS, LEAVE_TYPES_SEED, ROLES_SEED } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding iMgMT database...");

  for (const role of ROLES_SEED) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const leaveType of LEAVE_TYPES_SEED) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {
        defaultEntitlement: leaveType.defaultEntitlement,
        requiresCertificateAfterDays: leaveType.requiresCertificateAfterDays,
        drawsFromBalance: leaveType.drawsFromBalance,
        color: leaveType.color,
        notes: leaveType.notes,
        active: true,
      },
      create: leaveType,
    });
  }

  for (const holiday of ALL_TT_HOLIDAYS) {
    await prisma.holiday.upsert({
      where: { date: new Date(`${holiday.date}T00:00:00.000Z`) },
      update: {
        name: holiday.name,
        year: holiday.year,
        isMovable: holiday.isMovable ?? false,
      },
      create: {
        date: new Date(`${holiday.date}T00:00:00.000Z`),
        name: holiday.name,
        year: holiday.year,
        isMovable: holiday.isMovable ?? false,
      },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Administrator" } });

  const adminEmail = process.env.IMGMT_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@imgmt.local";
  const adminPassword = process.env.IMGMT_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: "System",
      lastName: "Administrator",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      employeeNumber: "ADM-001",
      dateOfEmployment: new Date("2020-01-01T00:00:00.000Z"),
      employmentType: "PERMANENT",
      jobTitle: "Administrator",
      status: "ACTIVE",
      roleId: adminRole.id,
    },
  });

  const settings = [
    { key: "orgName", value: "Organisation Name", label: "Organisation Name" },
    { key: "orgLogoUrl", value: "", label: "Logo URL" },
    { key: "timezone", value: "America/Port_of_Spain", label: "Timezone" },
    { key: "smtpHost", value: "", label: "SMTP Host" },
    { key: "smtpPort", value: "587", label: "SMTP Port" },
    { key: "smtpEncryption", value: "starttls", label: "SMTP Encryption" },
    { key: "smtpUser", value: "", label: "SMTP User" },
    { key: "smtpPassword", value: "", label: "SMTP Password" },
    { key: "smtpFromEmail", value: "", label: "From Email" },
    { key: "smtpFromName", value: "iMgMT Notifications", label: "From Name" },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, label: setting.label },
      create: setting,
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
