import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { videoPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { storage } from '@/lib/storage';

async function ownVideo(brandId: string, id: string) {
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video || video.brandId !== brandId) throw new HttpError(404, 'Not found');
  return video;
}

function uploadKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^\/uploads\/(.+)$/.exec(url);
  return m ? m[1] : null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownVideo(brandId, params.id);
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { product: true }, orderBy: { startTime: 'asc' } },
      },
    });
    return ok({ video });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownVideo(brandId, params.id);
    const data = videoPatchSchema.parse(await req.json());
    const video = await prisma.video.update({
      where: { id: params.id },
      data: {
        ...data,
        description: data.description === '' ? null : data.description,
        thumbnailUrl: data.thumbnailUrl === '' ? null : data.thumbnailUrl,
      },
    });
    return ok({ video });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const video = await ownVideo(brandId, params.id);
    await prisma.video.delete({ where: { id: params.id } });
    // Best-effort blob cleanup for the video file and its thumbnail.
    for (const url of [video.videoUrl, video.thumbnailUrl]) {
      const key = uploadKey(url);
      if (key) {
        try {
          await storage().delete(key);
        } catch {}
      }
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
