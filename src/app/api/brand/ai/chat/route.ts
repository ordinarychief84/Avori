import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { aiChatSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { assistantReply } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = aiChatSchema.parse(await req.json());

    let conversationId = data.conversationId;
    if (conversationId) {
      const existing = await prisma.aiConversation.findFirst({
        where: { id: conversationId, brandId },
      });
      if (!existing) throw new HttpError(404, 'Conversation not found');
    } else {
      const conversation = await prisma.aiConversation.create({
        data: { brandId, userId, title: data.message.slice(0, 60) },
      });
      conversationId = conversation.id;
    }

    await prisma.aiMessage.create({
      data: { conversationId, role: 'user', content: data.message },
    });

    const reply = await assistantReply(brandId, conversationId);
    const message = await prisma.aiMessage.create({
      data: { conversationId, role: 'assistant', content: reply },
    });
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return ok({ conversationId, message });
  } catch (e) {
    return fail(e);
  }
}
