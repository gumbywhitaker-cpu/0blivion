import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { answerBusinessQuestion } from "@/lib/ask-kiwi";
import { incrementUsage } from "@/lib/usage";

const schema = z.object({
  question: z.string().trim().min(1).max(500),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("records:view");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
    }

    const result = await answerBusinessQuestion(business.id, parsed.data.question);

    const newTurn = [
      { role: "user", content: parsed.data.question, createdAt: new Date().toISOString() },
      { role: "assistant", content: result.answer, createdAt: new Date().toISOString() },
    ];

    let conversation;
    if (parsed.data.conversationId) {
      const existing = await prisma.aIConversation.findFirst({
        where: { id: parsed.data.conversationId, businessId: business.id },
      });
      if (existing) {
        const messages = [...JSON.parse(existing.messages), ...newTurn];
        conversation = await prisma.aIConversation.update({
          where: { id: existing.id },
          data: { messages: JSON.stringify(messages) },
        });
      }
    }
    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          businessId: business.id,
          userId: membership.userId,
          title: parsed.data.question.slice(0, 80),
          contextType: "general",
          messages: JSON.stringify(newTurn),
        },
      });
    }

    await incrementUsage(business.id, { aiMessages: 1 });

    return NextResponse.json({
      answer: result.answer,
      period: result.period,
      conversationId: conversation.id,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
