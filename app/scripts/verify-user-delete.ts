import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { isAdministrator } from "../src/lib/admin-roles";
import { resolveUserDeletion } from "../src/lib/user-deletion";

const prisma = new PrismaClient();

type CheckResult = { name: string; pass: boolean; detail: string };

function check(name: string, pass: boolean, detail: string): CheckResult {
  return { name, pass, detail };
}

async function main() {
  const results: CheckResult[] = [];

  const roles = await prisma.role.findMany();
  const adminRole = roles.find((r) => r.name === "Administrator");
  const editorRole = roles.find((r) => r.name === "Editor");

  if (!adminRole || !editorRole) {
    console.error("FAIL: Missing Administrator or Editor role in database.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { name: "asc" } });
  const administrators = users.filter((u) => u.role.name === "Administrator");
  const editors = users.filter((u) => u.role.name === "Editor");

  results.push(
    check(
      "At least one administrator exists",
      administrators.length >= 1,
      `Found ${administrators.length} administrator(s)`
    )
  );

  results.push(
    check(
      "Editors cannot access user management (role gate)",
      !isAdministrator("Editor"),
      "isAdministrator('Editor') returns false"
    )
  );

  results.push(
    check(
      "Administrators pass role gate",
      isAdministrator("Administrator"),
      "isAdministrator('Administrator') returns true"
    )
  );

  const primaryAdmin = administrators[0];
  if (primaryAdmin) {
    const selfDelete = await resolveUserDeletion(prisma, {
      actorUserId: primaryAdmin.id,
      actorRole: primaryAdmin.role.name,
      targetUserId: primaryAdmin.id,
    });
    results.push(
      check(
        "Administrator cannot delete own account",
        !selfDelete.ok && selfDelete.reason.includes("own account"),
        selfDelete.ok ? "Unexpectedly allowed self-delete" : selfDelete.reason
      )
    );

    if (administrators.length === 1) {
      const soleAdminDelete = await resolveUserDeletion(prisma, {
        actorUserId: primaryAdmin.id,
        actorRole: primaryAdmin.role.name,
        targetUserId: primaryAdmin.id,
      });
      results.push(
        check(
          "Sole administrator cannot be removed from system",
          !soleAdminDelete.ok,
          soleAdminDelete.ok ? "Unexpectedly allowed deleting sole admin" : soleAdminDelete.reason
        )
      );
    } else if (administrators[1]) {
      const deletePeerAdmin = await resolveUserDeletion(prisma, {
        actorUserId: primaryAdmin.id,
        actorRole: primaryAdmin.role.name,
        targetUserId: administrators[1].id,
      });
      results.push(
        check(
          "Administrator can delete another administrator when multiple exist",
          deletePeerAdmin.ok,
          deletePeerAdmin.ok
            ? `Would allow deleting ${administrators[1].name}`
            : (deletePeerAdmin as { reason: string }).reason
        )
      );
    }
  }

  if (editors[0] && primaryAdmin) {
    const editorTarget = editors[0];
    const editorAsActor = await resolveUserDeletion(prisma, {
      actorUserId: editorTarget.id,
      actorRole: editorTarget.role.name,
      targetUserId: editorTarget.id,
    });
    results.push(
      check(
        "Editor cannot delete users (server action gate)",
        !editorAsActor.ok && editorAsActor.reason.includes("permission"),
        editorAsActor.ok ? "Unexpectedly allowed editor delete" : editorAsActor.reason
      )
    );

    const adminDeletesEditor = await resolveUserDeletion(prisma, {
      actorUserId: primaryAdmin.id,
      actorRole: primaryAdmin.role.name,
      targetUserId: editorTarget.id,
    });
    results.push(
      check(
        "Administrator can delete editor accounts",
        adminDeletesEditor.ok,
        adminDeletesEditor.ok
          ? `Would allow deleting ${editorTarget.name}`
          : (adminDeletesEditor as { reason: string }).reason
      )
    );
  }

  const tempSuffix = `verify-${Date.now()}`;
  const tempAdminEmail = `${tempSuffix}@verify.local`;
  const tempEditorEmail = `editor-${tempSuffix}@verify.local`;

  const tempAdmin = await prisma.user.create({
    data: {
      email: tempAdminEmail,
      name: "Verify Temp Admin",
      roleId: adminRole.id,
      status: "ACTIVE",
      passwordHash: await bcrypt.hash("VerifyTemp123!", 12),
    },
    include: { role: true },
  });

  const tempEditor = await prisma.user.create({
    data: {
      email: tempEditorEmail,
      name: "Verify Temp Editor",
      roleId: editorRole.id,
      status: "ACTIVE",
      passwordHash: await bcrypt.hash("VerifyTemp123!", 12),
    },
    include: { role: true },
  });

  try {
    const deleteSecondAdminWhileTwoExist = await resolveUserDeletion(prisma, {
      actorUserId: primaryAdmin!.id,
      actorRole: primaryAdmin!.role.name,
      targetUserId: tempAdmin.id,
    });
    results.push(
      check(
        "Administrator can delete another administrator when 2+ exist",
        deleteSecondAdminWhileTwoExist.ok,
        deleteSecondAdminWhileTwoExist.ok
          ? "Would allow deleting secondary administrator"
          : (deleteSecondAdminWhileTwoExist as { reason: string }).reason
      )
    );

    const liveDeleteEditor = await resolveUserDeletion(prisma, {
      actorUserId: primaryAdmin!.id,
      actorRole: primaryAdmin!.role.name,
      targetUserId: tempEditor.id,
    });

    if (liveDeleteEditor.ok) {
      await prisma.user.delete({ where: { id: tempEditor.id } });
      const stillExists = await prisma.user.findUnique({ where: { id: tempEditor.id } });
      results.push(
        check(
          "Live delete removes editor user from database",
          !stillExists,
          stillExists ? "Temp editor still exists after delete" : "Temp editor deleted successfully"
        )
      );
    } else {
      results.push(
        check(
          "Live delete removes editor user from database",
          false,
          (liveDeleteEditor as { reason: string }).reason
        )
      );
    }

    await prisma.user.delete({ where: { id: tempAdmin.id } });
    const adminCountAfterTempDelete = await prisma.user.count({
      where: { role: { name: "Administrator" } },
    });
    results.push(
      check(
        "Temporary administrator removed; system still has administrators",
        adminCountAfterTempDelete >= 1,
        `${adminCountAfterTempDelete} administrator(s) remain`
      )
    );
  } finally {
    await prisma.user.deleteMany({
      where: { email: { in: [tempAdminEmail, tempEditorEmail] } },
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log("\nUser delete verification\n" + "=".repeat(40));
  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"}: ${result.name}`);
    console.log(`       ${result.detail}`);
  }
  console.log("=".repeat(40));
  console.log(`${results.length - failed.length}/${results.length} checks passed\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
