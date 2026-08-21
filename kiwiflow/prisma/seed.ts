import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

/**
 * Always run, in every environment: the global Conductor rule that makes
 * "job complete -> invoice drafted -> grower notified" actually happen
 * (docs/BLUEPRINT.md Section 6). Without this row the Conductor has nothing to do.
 */
async function upsertGlobalRule(name: string, eventType: string, actions: { action: string }[]) {
  const existing = await prisma.workflowRule.findFirst({
    where: { organizationId: null, eventType, name },
  });
  if (existing) return;

  await prisma.workflowRule.create({
    data: { organizationId: null, name, eventType, enabled: true, actions: JSON.stringify(actions) },
  });
  console.log(`Seeded global WorkflowRule: ${eventType} -> ${actions.map((a) => a.action).join(", ")}`);
}

async function seedWorkflowRules() {
  await upsertGlobalRule("Auto-invoice on job completion", "JOB_COMPLETED", [
    { action: "createInvoiceDraft" },
  ]);
  await upsertGlobalRule("Alert on coolstore temperature excursion", "COOLSTORE_TEMP_ALERT", [
    { action: "notifyCoolstoreAlert" },
  ]);
}

/** Demo dataset for local evaluation only — skipped if any organization already exists. */
async function seedDemoData() {
  const orgCount = await prisma.organization.count();
  if (orgCount > 0) {
    console.log("Organizations already exist — skipping demo data seed.");
    return;
  }

  const password = "kiwiflow123";
  const passwordHash = await hashPassword(password);

  const grower = await prisma.organization.create({
    data: { name: "Whakatāne Orchards Ltd", type: "GROWER", region: "Bay of Plenty" },
  });
  const growerOwner = await prisma.user.create({
    data: {
      organizationId: grower.id,
      name: "Hana Ngata",
      email: "hana@whakatane-orchards.example",
      passwordHash,
      role: "OWNER",
    },
  });

  const contractor = await prisma.organization.create({
    data: { name: "Southern Harvest Crews", type: "CONTRACTOR", region: "Bay of Plenty" },
  });
  const contractorOwner = await prisma.user.create({
    data: {
      organizationId: contractor.id,
      name: "Wiremu Tane",
      email: "wiremu@southernharvest.example",
      passwordHash,
      role: "OWNER",
    },
  });

  await prisma.contractorLink.create({
    data: { growerOrgId: grower.id, contractorOrgId: contractor.id, status: "ACTIVE" },
  });

  const crew = await prisma.crew.create({
    data: { organizationId: contractor.id, name: "Team North" },
  });
  await prisma.crewMember.createMany({
    data: [
      { crewId: crew.id, name: "Tama Rangi", phone: "021 555 0101" },
      { crewId: crew.id, name: "Aroha Marsh", phone: "021 555 0102" },
    ],
  });

  const orchardA = await prisma.orchard.create({
    data: {
      organizationId: grower.id,
      name: "Block 12 — Gold3",
      region: "Bay of Plenty",
      address: "412 Thornton Rd, Whakatāne",
      hectares: 4.2,
    },
  });
  const orchardB = await prisma.orchard.create({
    data: {
      organizationId: grower.id,
      name: "Block 7 — Hayward",
      region: "Bay of Plenty",
      address: "88 Awakeri Rd, Whakatāne",
      hectares: 6.8,
    },
  });

  const today = new Date();
  const inDays = (n: number) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

  // A job already completed and invoiced, to show the full loop working end to end.
  const doneJob = await prisma.job.create({
    data: {
      growerOrgId: grower.id,
      contractorOrgId: contractor.id,
      orchardId: orchardA.id,
      crewId: crew.id,
      jobType: "HARVEST",
      status: "COMPLETE",
      priority: "NORMAL",
      scheduledDate: inDays(-3),
      startTime: "07:00",
      estimatedDurationMins: 240,
      rate: 3.5,
      unit: "bin",
      quantity: 180,
      createdById: growerOwner.id,
      statusHistory: {
        create: [
          { toStatus: "SCHEDULED", changedById: growerOwner.id, changedAt: inDays(-5) },
          { fromStatus: "SCHEDULED", toStatus: "CONFIRMED", changedById: contractorOwner.id, changedAt: inDays(-4) },
          { fromStatus: "CONFIRMED", toStatus: "IN_PROGRESS", changedById: contractorOwner.id, changedAt: inDays(-3) },
          { fromStatus: "IN_PROGRESS", toStatus: "COMPLETE", changedById: contractorOwner.id, changedAt: inDays(-3) },
        ],
      },
    },
  });

  const { emitEvent } = await import("../lib/conductor/emit");
  await emitEvent(grower.id, { type: "JOB_COMPLETED", payload: { jobId: doneJob.id } });

  await prisma.harvestMaturityTest.create({
    data: {
      orchardId: orchardA.id,
      jobId: doneJob.id,
      variety: "HAYWARD",
      testDate: inDays(-6),
      sampleSize: 30,
      dryMatterPercent: 16.4,
      brix: 6.8,
      minDryMatterRequired: 15.5,
      minBrixRequired: 6.2,
      passed: true,
      labOrTester: "AsureQuality",
      recordedById: growerOwner.id,
    },
  });

  const sprayJob = await prisma.job.create({
    data: {
      growerOrgId: grower.id,
      contractorOrgId: contractor.id,
      orchardId: orchardB.id,
      jobType: "SPRAY",
      status: "SCHEDULED",
      priority: "HIGH",
      scheduledDate: inDays(1),
      startTime: "06:30",
      estimatedDurationMins: 180,
      rate: 45,
      unit: "hour",
      instructions: "Copper spray, whole block. Weather window is tight — go early.",
      createdById: growerOwner.id,
      statusHistory: { create: [{ toStatus: "SCHEDULED", changedById: growerOwner.id }] },
    },
  });

  await prisma.sprayDiaryEntry.create({
    data: {
      orchardId: orchardB.id,
      jobId: sprayJob.id,
      productName: "Nordox 75WG",
      activeIngredient: "Copper oxide",
      rateApplied: 2.5,
      rateUnit: "kg/ha",
      areaTreatedHa: 6.8,
      targetPestOrDisease: "Psa",
      weatherConditions: "Overcast, light wind, no rain forecast 24h",
      applicationDate: inDays(-2),
      withholdingPeriodDays: 0,
      harvestSafeDate: inDays(-2),
      applicatorId: contractorOwner.id,
    },
  });

  await prisma.coolstoreTemperatureLog.create({
    data: {
      organizationId: grower.id,
      facilityName: "Coolstore 1",
      temperatureC: 0.2,
      humidityPercent: 92,
      minRangeC: -1,
      maxRangeC: 1,
      withinRange: true,
      recordedById: growerOwner.id,
    },
  });

  await prisma.job.create({
    data: {
      growerOrgId: grower.id,
      orchardId: orchardB.id,
      jobType: "PRUNING",
      status: "NEW",
      priority: "NORMAL",
      scheduledDate: inDays(5),
      createdById: growerOwner.id,
      statusHistory: { create: [{ toStatus: "NEW", changedById: growerOwner.id }] },
    },
  });

  console.log("\nDemo data seeded. Log in with:");
  console.log(`  Grower:     ${growerOwner.email} / ${password}`);
  console.log(`  Contractor: ${contractorOwner.email} / ${password}`);
}

async function main() {
  await seedWorkflowRules();
  await seedDemoData();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
