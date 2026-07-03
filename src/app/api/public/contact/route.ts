import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  topic: z.string().max(80).optional().or(z.literal('')),
  message: z.string().min(5).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`contact:${ip}`, 5);
    if (!allowed) return fail(new Error('Rate limited — please try again in a minute'));

    const data = schema.parse(await req.json());
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        topic: data.topic || null,
        message: data.message,
      },
    });
    console.log(`[contact] ${data.email} — ${data.topic || 'general'}`);
    return ok({ received: true }, 201);
  } catch (e) {
    return fail(e);
  }
}
