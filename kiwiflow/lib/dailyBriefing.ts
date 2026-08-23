import "server-only";
import { prisma } from "@/lib/db";

/**
 * AI Daily Briefing — a read-only summary of one org's day, generated from
 * the same job/notification/invoice rows the org's own dashboard already
 * shows. Deliberately never writes to Job/Invoice/Notification; it only
 * reads them and restates the facts as prose with suggested priorities.
 *
 * Adapter-point pattern, same as lib/notify.ts and lib/aiGrading.ts: fails
 * closed with a clear reason when ANTHROPIC_API_KEY isn't configured,
 * rather than throwing and breaking the dashboard around it.
 */

const MODEL_ID = process.env.ANTHROPIC_MODEL_ID || "claude-sonnet-5";

const SYSTEM_PROMPT = `You write a short daily operations briefing for a New Zealand kiwifruit orchard or
contracting business, from a JSON summary of their jobs, notifications, and invoices for today. You are
NOT given any information beyond what's in the JSON — never invent job names, counts, dates, or people
that aren't in the data. If a section of the data is empty, say so briefly rather than padding it out.
Write in plain English, three short sections with a one-line heading each: "Today", "Needs attention",
and "Suggested next step". Keep the whole thing under 120 words. No markdown formatting, no bullet
characters — plain sentences and line breaks only.`;

export type BriefingFacts = {
  orgName: string;
  orgType: string;
  today: string; // ISO date
  jobsToday: { jobType: string; status: string; orchardOrCrew: string }[];
  overdueJobs: { jobType: string; status: string; scheduledDate: string }[];
  urgentJobs: { jobType: string; status: string; scheduledDate: string }[];
  unreadNotifications: number;
  overdueInvoices?: { invoiceNumber: string; total: number }[];
};

export type BriefingResult = { ok: true; content: string } | { ok: false; reason: string };

async function callClaude(facts: BriefingFacts): Promise<BriefingResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[daily-briefing] ANTHROPIC_API_KEY not configured — AI briefing unavailable");
    return { ok: false, reason: "The daily briefing isn't configured on this deployment yet." };
  }

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(facts) }],
      }),
    });
  } catch {
    return { ok: false, reason: "Couldn't reach the AI briefing service — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `AI briefing service returned an error (${response.status}).` };
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) return { ok: false, reason: "AI briefing returned no readable response." };
  return { ok: true, content: text.trim() };
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function gatherFacts(organizationId: string, orgType: string, orgName: string): Promise<BriefingFacts> {
  const dayStart = startOfTodayUtc();
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const orgFilter = orgType === "CONTRACTOR" ? { contractorOrgId: organizationId } : { growerOrgId: organizationId };

  const [jobsToday, overdueJobs, urgentJobs, unreadNotifications, overdueInvoices] = await Promise.all([
    prisma.job.findMany({
      where: { ...orgFilter, scheduledDate: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELLED"] } },
      select: { jobType: true, status: true, orchard: { select: { name: true } }, crew: { select: { name: true } } },
      take: 25,
    }),
    prisma.job.findMany({
      where: { ...orgFilter, scheduledDate: { lt: dayStart }, status: { in: ["NEW", "SCHEDULED", "CONFIRMED"] } },
      select: { jobType: true, status: true, scheduledDate: true },
      take: 25,
    }),
    prisma.job.findMany({
      where: { ...orgFilter, priority: "URGENT", status: { notIn: ["COMPLETE", "INVOICED", "CANCELLED"] } },
      select: { jobType: true, status: true, scheduledDate: true },
      take: 10,
    }),
    prisma.notification.count({ where: { organizationId, read: false } }),
    orgType === "GROWER"
      ? prisma.invoice.findMany({
          where: { fromOrgId: organizationId, status: "OVERDUE" },
          select: { invoiceNumber: true, total: true },
          take: 10,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    orgName,
    orgType,
    today: dayStart.toISOString().slice(0, 10),
    jobsToday: jobsToday.map((j) => ({
      jobType: j.jobType,
      status: j.status,
      orchardOrCrew: j.orchard?.name ?? j.crew?.name ?? "unspecified",
    })),
    overdueJobs: overdueJobs.map((j) => ({
      jobType: j.jobType,
      status: j.status,
      scheduledDate: j.scheduledDate.toISOString().slice(0, 10),
    })),
    urgentJobs: urgentJobs.map((j) => ({
      jobType: j.jobType,
      status: j.status,
      scheduledDate: j.scheduledDate.toISOString().slice(0, 10),
    })),
    unreadNotifications,
    overdueInvoices,
  };
}

/**
 * Returns today's briefing for the org, generating and caching it on first
 * call of the day (one row per org per UTC day — see the unique constraint
 * on DailyBriefing). Pass `force: true` to regenerate even if one exists.
 */
export async function getOrGenerateBriefing(
  organizationId: string,
  orgType: string,
  orgName: string,
  force = false,
): Promise<{ content: string; generatedAt: Date; modelId: string } | { error: string }> {
  const briefingDate = startOfTodayUtc();

  if (!force) {
    const existing = await prisma.dailyBriefing.findUnique({
      where: { organizationId_briefingDate: { organizationId, briefingDate } },
    });
    if (existing) return { content: existing.content, generatedAt: existing.createdAt, modelId: existing.modelId };
  }

  const facts = await gatherFacts(organizationId, orgType, orgName);
  const result = await callClaude(facts);
  if (!result.ok) return { error: result.reason };

  const row = await prisma.dailyBriefing.upsert({
    where: { organizationId_briefingDate: { organizationId, briefingDate } },
    create: { organizationId, briefingDate, content: result.content, modelId: MODEL_ID },
    update: { content: result.content, modelId: MODEL_ID },
  });
  return { content: row.content, generatedAt: row.createdAt, modelId: row.modelId };
}
