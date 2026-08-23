// One-off script — NOT run as part of seeding, NOT reachable from any HTTP route.
// Creates the single platform ADMIN organization + its OWNER user, with a
// cryptographically random password printed once to stdout. ADMIN is deliberately
// unreachable via signup (see SELF_SERVE_ORG_TYPES in lib/types.ts) — this script
// is the only way an ADMIN account gets created.
//
// Usage: npx tsx scripts/create-admin.ts <email>

import { randomBytes } from "node:crypto";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

function generateStrongPassword(): string {
  // 24 bytes -> 32-char base64url string: ~192 bits of entropy, well beyond
  // what's brute-forceable, and no ambiguous-character issues for the user to
  // mistype (base64url avoids +/= entirely).
  return randomBytes(24).toString("base64url");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email>");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`A user with email ${email} already exists (org type: ${(await prisma.organization.findUnique({ where: { id: existingUser.organizationId } }))?.type}). Refusing to create a duplicate.`);
    process.exit(1);
  }

  const existingAdminOrg = await prisma.organization.findFirst({ where: { type: "ADMIN" } });
  if (existingAdminOrg) {
    console.error(
      `An ADMIN organization already exists ("${existingAdminOrg.name}", id ${existingAdminOrg.id}). ` +
        `Add a second admin user to it directly if you need one, rather than creating a second ADMIN org.`,
    );
    process.exit(1);
  }

  const password = generateStrongPassword();
  const passwordHash = await hashPassword(password);

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: "KiwiFlow Platform Admin", type: "ADMIN" },
    });
    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        name: "Platform Admin",
        email,
        passwordHash,
        role: "OWNER",
      },
    });
    return { user, organization };
  });

  console.log("\nADMIN account created. This is shown once — store it in a password manager now:\n");
  console.log(`  Organization: ${organization.name} (${organization.id})`);
  console.log(`  Email:        ${user.email}`);
  console.log(`  Password:     ${password}`);
  console.log("\nThis account has cross-organization read access at /admin. There is no MFA on");
  console.log("this build yet — treat this credential as high-value and don't share it.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
