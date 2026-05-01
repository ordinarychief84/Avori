import { z } from 'zod';

// Accepts either a full URL (https://cdn.example.com/x.jpg) or an
// app-relative absolute path returned by /api/brand/upload (/uploads/...).
// Used for asset fields where the user can paste a CDN URL OR upload
// through the dashboard's uploader.
const urlOrAssetPath = z
  .string()
  .min(1)
  .refine(
    (s) => /^https?:\/\//.test(s) || s.startsWith('/'),
    'Must be a full URL or an absolute path starting with /'
  );

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
  brandName: z.string().min(1).max(80),
  domain: z.string().min(1).max(200).optional().or(z.literal('')),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().nonnegative().max(1_000_000),
  // Image can be uploaded (relative /uploads/...) or pasted from a CDN.
  imageUrl: urlOrAssetPath,
  // Product URL is an external destination — must be a full URL.
  productUrl: z.string().url(),
  sku: z.string().max(80).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const productPatchSchema = productSchema.partial();

export const videoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  videoUrl: urlOrAssetPath,
  thumbnailUrl: urlOrAssetPath.optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationSec: z.number().int().nonnegative().optional(),
});

export const videoPatchSchema = videoSchema.partial();

export const tagSchema = z.object({
  productId: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
});

export const tagPatchSchema = tagSchema.partial();

export const eventSchema = z.object({
  brandId: z.string().min(1),
  videoId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  type: z.enum(['IMPRESSION', 'VIEW', 'TAG_CLICK', 'CTA_CLICK']),
  // `domain` is intentionally NOT validated here — the server derives it from
  // the request Origin / Referer header. Clients may still send a `domain`
  // field for forward compat; it is ignored.
  domain: z.string().max(200).optional(),
  mode: z.enum(['inline', 'floating', 'feed']).optional(),
});

export const brandPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  domain: z.string().min(1).max(200).optional().or(z.literal('')),
});
