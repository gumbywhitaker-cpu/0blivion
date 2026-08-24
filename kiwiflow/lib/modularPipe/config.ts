import "server-only";
import { prisma } from "@/lib/db";

export type ModularPipeConfigValues = {
  activePack: string;
  enabledDocTypes: string[];
  maxShiftHours: number;
  ocrConfidenceThreshold: number;
  hoursRoundingToleranceMinutes: number;
  strictCrossDocChecks: boolean;
};

/** Lazily creates a default-valued config row on first read — God Mode (spec Section
 * 4.2) edits it afterwards, it never needs a signup-time step. */
export async function getOrCreateModularPipeConfig(organizationId: string): Promise<ModularPipeConfigValues> {
  const row = await prisma.modularPipeConfig.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId },
  });

  let enabledDocTypes: string[];
  try {
    enabledDocTypes = JSON.parse(row.enabledDocTypes);
  } catch {
    enabledDocTypes = ["quality_log", "bin_origin", "rse_timesheet"];
  }

  return {
    activePack: row.activePack,
    enabledDocTypes,
    maxShiftHours: row.maxShiftHours,
    ocrConfidenceThreshold: row.ocrConfidenceThreshold,
    hoursRoundingToleranceMinutes: row.hoursRoundingToleranceMinutes,
    strictCrossDocChecks: row.strictCrossDocChecks,
  };
}

export async function updateModularPipeConfig(
  organizationId: string,
  patch: Partial<Omit<ModularPipeConfigValues, "enabledDocTypes">> & { enabledDocTypes?: string[] },
): Promise<ModularPipeConfigValues> {
  await getOrCreateModularPipeConfig(organizationId); // ensure row exists
  const row = await prisma.modularPipeConfig.update({
    where: { organizationId },
    data: {
      ...(patch.activePack !== undefined ? { activePack: patch.activePack } : {}),
      ...(patch.enabledDocTypes !== undefined ? { enabledDocTypes: JSON.stringify(patch.enabledDocTypes) } : {}),
      ...(patch.maxShiftHours !== undefined ? { maxShiftHours: patch.maxShiftHours } : {}),
      ...(patch.ocrConfidenceThreshold !== undefined ? { ocrConfidenceThreshold: patch.ocrConfidenceThreshold } : {}),
      ...(patch.hoursRoundingToleranceMinutes !== undefined
        ? { hoursRoundingToleranceMinutes: patch.hoursRoundingToleranceMinutes }
        : {}),
      ...(patch.strictCrossDocChecks !== undefined ? { strictCrossDocChecks: patch.strictCrossDocChecks } : {}),
    },
  });

  return getOrCreateModularPipeConfig(row.organizationId);
}
