import { z } from 'zod';
import { sanitizeText, isSafeUrl } from './sanitize';

// Sanitizing free-text field: trims, Unicode-normalizes and strips control/
// invisible characters. Use for any human-entered text that gets stored and
// later rendered (names, titles, bodies, captions).
export function cleanText(max: number, min = 0) {
  const base = z.string().max(max).transform(sanitizeText);
  return min > 0 ? base.refine((s) => s.length >= min, `Must be at least ${min} characters`) : base;
}

// Accepts either a full http(s) URL (https://cdn.example.com/x.jpg) or an
// app-relative absolute path returned by /api/brand/upload (/uploads/...).
// isSafeUrl blocks javascript:, data:, vbscript: and protocol-relative URLs
// so a stored value can never execute when rendered into an href/src.
const urlOrAssetPath = z
  .string()
  .min(1)
  .refine(isSafeUrl, 'Must be an http(s) URL or an absolute path starting with /');

// A user-supplied external URL that will be rendered as a link or fetched.
// http(s) only.
const safeHttpUrl = z
  .string()
  .url()
  .refine(isSafeUrl, 'Must be an http or https URL');

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: cleanText(80).optional(),
  brandName: z.string().min(1).max(80),
  domain: z.string().min(1).max(200).optional().or(z.literal('')),
  // GDPR: consent must be an affirmative act, so the API refuses signups
  // that don't carry it. The acceptance timestamp is stored on the user.
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
});

const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

const SHADE_TONES = ['fair', 'light', 'medium', 'tan', 'deep', 'rich'] as const;
const UNDERTONES = ['cool', 'neutral', 'warm', 'olive'] as const;

export const productSchema = z.object({
  name: cleanText(200, 1),
  price: z.number().nonnegative().max(1_000_000),
  // Image can be uploaded (relative /uploads/...) or pasted from a CDN.
  imageUrl: urlOrAssetPath,
  // Product URL is an external destination, must be a full URL.
  productUrl: safeHttpUrl,
  sku: z.string().max(80).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  // AI try-on
  tryOnEnabled: z.boolean().optional(),
  tryOnCategory: z
    .enum(['NONE', 'LIPSTICK', 'LIP_GLOSS', 'BLUSH', 'EYESHADOW', 'EYELINER'])
    .optional(),
  tryOnTint: z
    .string()
    .regex(HEX_COLOR, 'Tint must be a hex color like #C44569')
    .nullable()
    .optional(),
  // Shade-analysis matching
  shadeTones: z.array(z.enum(SHADE_TONES)).max(6).optional(),
  undertones: z.array(z.enum(UNDERTONES)).max(4).optional(),
});

export const productPatchSchema = productSchema.partial();

export const videoSchema = z.object({
  title: cleanText(200, 1),
  description: cleanText(2000).optional().or(z.literal('')),
  videoUrl: urlOrAssetPath,
  thumbnailUrl: urlOrAssetPath.optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationSec: z.number().int().nonnegative().optional(),
  targetProductIds: z.array(z.string()).max(50).optional(),
  sort: z.number().int().min(0).max(10_000).optional(),
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
  // `domain` is intentionally NOT validated here, the server derives it from
  // the request Origin / Referer header. Clients may still send a `domain`
  // field for forward compat; it is ignored.
  domain: z.string().max(200).optional(),
  mode: z.enum(['inline', 'floating', 'feed', 'gallery']).optional(),
});

export const brandPatchSchema = z.object({
  name: cleanText(80).optional(),
  domain: z.string().min(1).max(200).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Customers & orders
// ---------------------------------------------------------------------------

export const customerSchema = z.object({
  email: z.string().email().max(200),
  firstName: z.string().max(80).optional().or(z.literal('')),
  lastName: z.string().max(80).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  acceptsMarketing: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  birthday: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const customerPatchSchema = customerSchema.partial();

export const orderItemInput = z.object({
  productId: z.string().optional(),
  sku: z.string().max(80).optional(),
  name: cleanText(200, 1),
  quantity: z.number().int().positive().max(1000),
  price: z.number().nonnegative().max(1_000_000),
});

export const orderCreateSchema = z.object({
  email: z.string().email().max(200),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  orderNumber: z.string().max(60).optional(),
  externalId: z.string().max(100).optional(),
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED']).optional(),
  currency: z.string().length(3).optional(),
  items: z.array(orderItemInput).min(1).max(100),
  subtotal: z.number().nonnegative().optional(),
  discountTotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  discountCodes: z.array(z.string().max(60)).max(10).optional(),
  placedAt: z.string().datetime().optional(),
  referralCode: z.string().max(60).optional(),
  upsellOfferId: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED']),
});

// ---------------------------------------------------------------------------
// Reviews & Q&A
// ---------------------------------------------------------------------------

export const reviewSubmitSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: cleanText(150).optional().or(z.literal('')),
  body: cleanText(5000, 1),
  authorName: cleanText(80, 1),
  authorEmail: z.string().email().max(200).optional().or(z.literal('')),
  mediaUrls: z.array(urlOrAssetPath).max(6).optional(),
  orderId: z.string().optional(),
});

export const reviewModerateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SPAM']).optional(),
  reply: cleanText(2000).nullable().optional(),
});

export const questionSubmitSchema = z.object({
  productId: z.string().min(1),
  body: cleanText(2000, 1),
  authorName: cleanText(80).optional().or(z.literal('')),
  authorEmail: z.string().email().max(200).optional().or(z.literal('')),
});

export const questionAnswerSchema = z.object({
  answer: cleanText(4000).nullable().optional(),
  status: z.enum(['PENDING', 'PUBLISHED', 'HIDDEN']).optional(),
});

// ---------------------------------------------------------------------------
// Loyalty, rewards, credit & gift cards
// ---------------------------------------------------------------------------

export const loyaltyProgramSchema = z.object({
  enabled: z.boolean().optional(),
  pointsName: z.string().min(1).max(40).optional(),
  earnRate: z.number().nonnegative().max(1000).optional(),
  redeemRate: z.number().int().positive().max(100_000).optional(),
  signupBonus: z.number().int().nonnegative().max(1_000_000).optional(),
  reviewBonus: z.number().int().nonnegative().max(1_000_000).optional(),
  birthdayBonus: z.number().int().nonnegative().max(1_000_000).optional(),
  cashbackPct: z.number().min(0).max(100).optional(),
});

export const loyaltyTierSchema = z.object({
  name: z.string().min(1).max(60),
  minPoints: z.number().int().nonnegative(),
  multiplier: z.number().positive().max(10),
  perks: z.string().max(500).optional().or(z.literal('')),
});

export const rewardSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['DISCOUNT_PERCENT', 'DISCOUNT_FIXED', 'STORE_CREDIT', 'FREE_PRODUCT', 'FREE_SHIPPING']),
  pointsCost: z.number().int().positive().max(10_000_000),
  value: z.number().nonnegative().max(1_000_000).optional(),
  productId: z.string().optional().or(z.literal('')),
  active: z.boolean().optional(),
});

export const pointsAdjustSchema = z.object({
  points: z.number().int().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  reason: z.string().min(1).max(200),
});

export const creditAdjustSchema = z.object({
  amount: z.number().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  reason: z.string().min(1).max(200),
});

export const giftCardCreateSchema = z.object({
  initialValue: z.number().positive().max(1_000_000),
  recipientEmail: z.string().email().max(200).optional().or(z.literal('')),
  note: z.string().max(500).optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
});

export const giftCardRedeemSchema = z.object({
  code: z.string().min(4).max(40),
  amount: z.number().positive().max(1_000_000),
  orderId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export const referralProgramSchema = z.object({
  enabled: z.boolean().optional(),
  referrerPoints: z.number().int().nonnegative().max(1_000_000).optional(),
  referrerCredit: z.number().nonnegative().max(100_000).optional(),
  refereeDiscountPct: z.number().int().min(0).max(100).optional(),
});

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export const quizOptionSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(200),
  imageUrl: urlOrAssetPath.optional().or(z.literal('')),
  productIds: z.array(z.string()).max(20).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  // Recommendation weight: how strongly this option votes for its products.
  weight: z.number().min(0).max(10).optional(),
  // Conditional logic: jump to this question next; null/absent falls through
  // to the next question by sort order.
  nextQuestionId: z.string().nullable().optional(),
});

export const quizSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only')
    .optional(),
  description: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  leadCapture: z.boolean().optional(),
});

export const quizQuestionSchema = z.object({
  prompt: z.string().min(1).max(300),
  helpText: z.string().max(300).optional().or(z.literal('')),
  type: z.enum(['SINGLE_CHOICE', 'MULTI_CHOICE', 'TEXT']).optional(),
  sort: z.number().int().nonnegative().optional(),
  options: z.array(quizOptionSchema).max(12).optional(),
});

export const quizSubmitSchema = z.object({
  email: z.string().email().max(200).optional().or(z.literal('')),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
});

// ---------------------------------------------------------------------------
// Surveys
// ---------------------------------------------------------------------------

export const surveySchema = z.object({
  title: z.string().min(1).max(150),
  type: z.enum(['NPS', 'CSAT', 'POST_PURCHASE', 'EXIT', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  question: z.string().min(1).max(300),
  followUp: z.string().max(300).optional().or(z.literal('')),
});

export const surveySubmitSchema = z.object({
  score: z.number().int().min(0).max(10).optional(),
  answer: z.string().max(4000).optional().or(z.literal('')),
  email: z.string().email().max(200).optional().or(z.literal('')),
  orderId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bundles, discounts, gifts, upsells
// ---------------------------------------------------------------------------

export const bundleSchema = z.object({
  name: z.string().min(1).max(150),
  type: z.enum(['FBT', 'BXGY', 'MIX_MATCH', 'VOLUME']),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  discountType: z.enum(['PERCENT', 'FIXED']).optional(),
  discountValue: z.number().nonnegative().max(1_000_000).optional(),
  config: z
    .object({
      buyQty: z.number().int().positive().max(100).optional(),
      getQty: z.number().int().positive().max(100).optional(),
      minItems: z.number().int().positive().max(100).optional(),
      tiers: z
        .array(z.object({ qty: z.number().int().positive(), pct: z.number().min(0).max(100) }))
        .max(10)
        .optional(),
    })
    .optional(),
  // Accepts either bare product ids (from the dashboard multiselect) or
  // full item objects (from the API), normalized to objects.
  items: z
    .array(
      z.union([
        z.string().min(1),
        z.object({
          productId: z.string().min(1),
          role: z.enum(['ANY', 'TRIGGER', 'REWARD']).optional(),
          quantity: z.number().int().positive().max(100).optional(),
        }),
      ])
    )
    .max(30)
    .transform((items) =>
      items.map((i) => (typeof i === 'string' ? { productId: i } : i))
    )
    .optional(),
});

export const discountSchema = z.object({
  name: z.string().min(1).max(150),
  code: z
    .string()
    .max(60)
    .regex(/^[A-Za-z0-9_-]*$/, 'Letters, numbers, dash and underscore only')
    .optional()
    .or(z.literal('')),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  value: z.number().positive().max(1_000_000),
  minSubtotal: z.number().nonnegative().max(10_000_000).nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().positive().max(10_000_000).nullable().optional(),
  perCustomerLimit: z.number().int().positive().max(1000).nullable().optional(),
});

export const giftCampaignSchema = z.object({
  name: z.string().min(1).max(150),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  trigger: z.enum(['CART_VALUE', 'PRODUCT_IN_CART']).optional(),
  thresholdAmount: z.number().nonnegative().max(10_000_000).nullable().optional(),
  triggerProductId: z.string().nullable().optional(),
  giftProductIds: z.array(z.string()).max(10).optional(),
  chooseGift: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export const upsellSchema = z.object({
  name: z.string().min(1).max(150),
  placement: z.enum(['PRODUCT_PAGE', 'CART', 'CHECKOUT', 'POST_PURCHASE']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  triggerProductIds: z.array(z.string()).max(50).optional(),
  offerProductIds: z.array(z.string()).max(20).optional(),
  headline: z.string().max(150).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  discountPct: z.number().int().min(0).max(100).nullable().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Social feed
// ---------------------------------------------------------------------------

export const socialPostSchema = z.object({
  mediaUrl: urlOrAssetPath,
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  thumbnailUrl: urlOrAssetPath.optional().or(z.literal('')),
  caption: cleanText(2200).optional().or(z.literal('')),
  permalink: safeHttpUrl.optional().or(z.literal('')),
  productIds: z.array(z.string()).max(10).optional(),
  visible: z.boolean().optional(),
  sort: z.number().int().nonnegative().optional(),
});

export const socialPostPatchSchema = socialPostSchema.partial();

// ---------------------------------------------------------------------------
// UGC gallery
// ---------------------------------------------------------------------------

export const ugcItemSchema = z.object({
  mediaUrl: urlOrAssetPath,
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  thumbnailUrl: urlOrAssetPath.optional().or(z.literal('')),
  caption: cleanText(500).optional().or(z.literal('')),
  creditName: cleanText(80).optional().or(z.literal('')),
  productIds: z.array(z.string()).max(10).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']).optional(),
  sort: z.number().int().nonnegative().optional(),
});
export const ugcItemPatchSchema = ugcItemSchema.partial();

// ---------------------------------------------------------------------------
// Shade analysis
// ---------------------------------------------------------------------------

export const shadeAnalyzeSchema = z.object({
  // Raw base64 image data (no data: prefix) + its media type.
  imageBase64: z.string().min(100).max(15_000_000),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  email: z.string().email().max(200).optional().or(z.literal('')),
  // Octane-style intake: zero-party context that travels with the profile.
  intake: z
    .object({
      skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal']).optional(),
      finish: z.enum(['matte', 'natural', 'dewy']).optional(),
      coverage: z.enum(['sheer', 'medium', 'full']).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Platform: API keys, webhooks, team, settings
// ---------------------------------------------------------------------------

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(80),
});

// Outbound webhooks must point at public https endpoints. Loopback, private
// ranges and cloud metadata addresses are refused so a merchant (or a stolen
// session) cannot aim signed deliveries at internal services (SSRF).
const PRIVATE_HOST =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.|\[?::1|metadata\.google|.*\.internal)$|^\[?f[cd]/i;

export const webhookEndpointSchema = z.object({
  url: z
    .string()
    .url()
    .max(500)
    .refine((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'https:' && !PRIVATE_HOST.test(parsed.hostname);
      } catch {
        return false;
      }
    }, 'Webhook URLs must be public https endpoints'),
  topics: z.array(z.string().min(1).max(60)).max(20).optional(),
  active: z.boolean().optional(),
});

export const teamInviteSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(80).optional().or(z.literal('')),
  password: z.string().min(8).max(128),
  brandRole: z.enum(['MANAGER', 'STAFF']).optional(),
});

export const brandSettingsSchema = z.object({
  reviewRequestsEnabled: z.boolean().optional(),
  reviewRequestDelayDays: z.number().int().min(1).max(60).optional(),
  reviewAutoPublishMinRating: z.number().int().min(1).max(6).optional(),
  currency: z.string().length(3).optional(),
  // Set true when the onboarding wizard completes (hides setup prompts).
  onboarded: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const aiChatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000),
});
