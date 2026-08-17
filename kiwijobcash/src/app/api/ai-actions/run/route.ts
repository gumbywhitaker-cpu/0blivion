import { NextResponse } from "next/server";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { runAgents } from "@/lib/agents/run";

export async function POST() {
  try {
    const { business } = await requireApiBusiness("records:view");
    const result = await runAgents(business.id);
    return NextResponse.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
