import { PrismaClient, Role, ProductStatus, VideoStatus, OrderStatus, type Product } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Deterministic PRNG so re-seeded environments look the same.
let seedState = 42;
function rand(): number {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000 - Math.floor(rand() * 43_200_000));

async function main() {
  const adminEmail = 'admin@avori.dev';
  const brandEmail = 'demo@avori.dev';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: 'Avori Admin', role: Role.ADMIN },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: 'demo-brand' },
    update: {},
    create: { name: 'Demo Brand', slug: 'demo-brand', domain: 'localhost' },
  });

  await prisma.user.upsert({
    where: { email: brandEmail },
    update: { brandId: brand.id },
    create: {
      email: brandEmail,
      passwordHash,
      name: 'Demo Brand Owner',
      role: Role.BRAND,
      brandRole: 'OWNER',
      brandId: brand.id,
    },
  });

  // ---- Catalog -------------------------------------------------------------
  const catalog = [
    { id: 'seed-prod-1', name: 'Iced Latte Lip Balm', price: 18, sku: 'AV-IL-001', tryOn: { category: 'LIPSTICK', tint: '#C44569' }, shadeTones: ['fair', 'light', 'medium'], undertones: ['cool', 'neutral'] },
    { id: 'seed-prod-2', name: 'Espresso Body Mist', price: 32, sku: 'AV-EM-002', shadeTones: [], undertones: [] },
    { id: 'seed-prod-3', name: 'Matcha Hand Cream', price: 24, sku: 'AV-MC-003', shadeTones: [], undertones: [] },
    { id: 'seed-prod-4', name: 'Terracotta Blush', price: 28, sku: 'AV-TB-004', tryOn: { category: 'BLUSH', tint: '#D2691E' }, shadeTones: ['medium', 'tan', 'deep'], undertones: ['warm', 'olive'] },
    { id: 'seed-prod-5', name: 'Velvet Noir Eyeliner', price: 21, sku: 'AV-VN-005', tryOn: { category: 'EYELINER', tint: '#1A1A2E' }, shadeTones: ['fair', 'light', 'medium', 'tan', 'deep', 'rich'], undertones: ['cool', 'neutral', 'warm', 'olive'] },
    { id: 'seed-prod-6', name: 'Golden Hour Gloss', price: 19, sku: 'AV-GH-006', tryOn: { category: 'LIP_GLOSS', tint: '#E8A87C' }, shadeTones: ['tan', 'deep', 'rich'], undertones: ['warm'] },
  ] as const;

  const products: Product[] = [];
  for (const p of catalog) {
    products.push(
      await prisma.product.upsert({
        where: { id: p.id },
        update: { shadeTones: [...p.shadeTones], undertones: [...p.undertones] },
        create: {
          id: p.id,
          brandId: brand.id,
          name: p.name,
          price: p.price,
          imageUrl: `https://picsum.photos/seed/${p.id}/400/400`,
          productUrl: `https://example.com/products/${p.id}`,
          sku: p.sku,
          status: ProductStatus.ACTIVE,
          tryOnEnabled: 'tryOn' in p && !!p.tryOn,
          tryOnCategory: ('tryOn' in p && p.tryOn ? p.tryOn.category : 'NONE') as never,
          tryOnTint: 'tryOn' in p && p.tryOn ? p.tryOn.tint : null,
          shadeTones: [...p.shadeTones],
          undertones: [...p.undertones],
        },
      })
    );
  }

  const video = await prisma.video.upsert({
    where: { id: 'seed-video-1' },
    update: {},
    create: {
      id: 'seed-video-1',
      brandId: brand.id,
      title: 'Spring drop — coffee bar',
      description: 'A dreamy iced-latte morning. Tap the dots to shop.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://picsum.photos/seed/avori-vid/720/1280',
      status: VideoStatus.ACTIVE,
      durationSec: 15,
    },
  });
  await prisma.videoProductTag.deleteMany({ where: { videoId: video.id } });
  await prisma.videoProductTag.createMany({
    data: [
      { videoId: video.id, productId: products[0].id, x: 35, y: 45, startTime: 1, endTime: 8 },
      { videoId: video.id, productId: products[1].id, x: 65, y: 30, startTime: 4, endTime: 12 },
      { videoId: video.id, productId: products[2].id, x: 50, y: 70, startTime: 7, endTime: 14 },
    ],
  });

  // ---- Platform data (skipped when already seeded) --------------------------
  const alreadySeeded = (await prisma.customer.count({ where: { brandId: brand.id } })) > 0;
  if (alreadySeeded) {
    console.log('\nPlatform data already seeded — skipping demo generation.');
  } else {
    // Loyalty & referral programs
    const program = await prisma.loyaltyProgram.create({
      data: {
        brandId: brand.id,
        enabled: true,
        pointsName: 'Beans',
        earnRate: 2,
        redeemRate: 100,
        signupBonus: 100,
        reviewBonus: 50,
        birthdayBonus: 200,
        tiers: {
          create: [
            { name: 'Member', minPoints: 0, multiplier: 1 },
            { name: 'Silver', minPoints: 500, multiplier: 1.25, perks: 'Early access to drops' },
            { name: 'Gold', minPoints: 1500, multiplier: 1.5, perks: 'Free shipping + birthday gift' },
          ],
        },
      },
      include: { tiers: true },
    });
    await prisma.referralProgram.create({
      data: { brandId: brand.id, enabled: true, referrerPoints: 250, referrerCredit: 0, refereeDiscountPct: 10 },
    });
    await prisma.reward.createMany({
      data: [
        { brandId: brand.id, name: '$5 off', type: 'DISCOUNT_FIXED', pointsCost: 500, value: 5 },
        { brandId: brand.id, name: '10% off', type: 'DISCOUNT_PERCENT', pointsCost: 800, value: 10 },
        { brandId: brand.id, name: '$15 store credit', type: 'STORE_CREDIT', pointsCost: 1500, value: 15 },
        { brandId: brand.id, name: 'Free shipping', type: 'FREE_SHIPPING', pointsCost: 300, value: 0 },
      ],
    });

    // Customers
    const firstNames = ['Maya', 'Ava', 'Zoe', 'Lena', 'Noor', 'Ivy', 'Ruby', 'Elle', 'Sana', 'June', 'Cleo', 'Nia', 'Faye', 'Rosa', 'Skye', 'Tess', 'Wren', 'Yara', 'Isla', 'Demi'];
    const lastNames = ['Kim', 'Lopez', 'Osei', 'Nguyen', 'Haddad', 'Silva', 'Novak', 'Diallo', 'Rossi', 'Tanaka'];
    const customers = [];
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i];
      const lastName = pick([...lastNames]);
      customers.push(
        await prisma.customer.create({
          data: {
            brandId: brand.id,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            firstName,
            lastName,
            acceptsMarketing: rand() > 0.3,
            tags: rand() > 0.8 ? ['vip'] : [],
            birthday: rand() > 0.5 ? new Date(1990 + Math.floor(rand() * 15), Math.floor(rand() * 12), 1 + Math.floor(rand() * 28)) : null,
            source: pick(['shopify', 'manual', 'quiz', 'api']),
            createdAt: daysAgo(30 + Math.floor(rand() * 60)),
          },
        })
      );
    }

    // Orders across 90 days
    let orderNo = 1000;
    const orders = [];
    for (let i = 0; i < 60; i++) {
      const customer = pick(customers);
      const itemCount = 1 + Math.floor(rand() * 3);
      const items = Array.from({ length: itemCount }, () => {
        const product = pick(products);
        return { product, quantity: 1 + Math.floor(rand() * 2) };
      });
      const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
      const discounted = rand() > 0.75;
      const discountTotal = discounted ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const total = subtotal - discountTotal;
      const placedAt = daysAgo(Math.floor(rand() * 90));
      orders.push(
        await prisma.order.create({
          data: {
            brandId: brand.id,
            customerId: customer.id,
            orderNumber: `#${orderNo++}`,
            status: rand() > 0.06 ? OrderStatus.PAID : OrderStatus.REFUNDED,
            subtotal,
            discountTotal,
            total,
            discountCodes: discounted ? ['WELCOME10'] : [],
            source: pick(['shopify', 'api', 'manual']),
            placedAt,
            createdAt: placedAt,
            items: {
              create: items.map((i) => ({
                productId: i.product.id,
                name: i.product.name,
                sku: i.product.sku,
                quantity: i.quantity,
                price: i.product.price,
              })),
            },
          },
        })
      );
    }

    // Denormalized customer stats + loyalty members
    for (const c of customers) {
      const agg = await prisma.order.aggregate({
        where: { customerId: c.id, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _count: true,
        _sum: { total: true },
        _max: { placedAt: true },
      });
      await prisma.customer.update({
        where: { id: c.id },
        data: {
          ordersCount: agg._count,
          totalSpent: agg._sum.total ?? 0,
          lastOrderAt: agg._max.placedAt,
        },
      });
      if (agg._count > 0) {
        const earned = 100 + Math.floor(Number(agg._sum.total ?? 0) * 2);
        const redeemed = rand() > 0.7 ? 500 : 0;
        const lifetime = earned;
        const tier = [...program.tiers].reverse().find((t) => lifetime >= t.minPoints);
        const member = await prisma.loyaltyMember.create({
          data: {
            brandId: brand.id,
            customerId: c.id,
            points: earned - redeemed,
            lifetimePoints: lifetime,
            tierId: tier?.id ?? null,
          },
        });
        await prisma.pointsTransaction.createMany({
          data: [
            { brandId: brand.id, memberId: member.id, type: 'SIGNUP', points: 100, reason: 'Welcome bonus', createdAt: daysAgo(80) },
            { brandId: brand.id, memberId: member.id, type: 'EARN', points: earned - 100, reason: 'Orders', createdAt: daysAgo(20) },
            ...(redeemed > 0
              ? [{ brandId: brand.id, memberId: member.id, type: 'REDEEM' as const, points: -redeemed, reason: 'Redeemed: $5 off', createdAt: daysAgo(10) }]
              : []),
          ],
        });
      }
    }

    // Referrals
    const referrer = customers[0];
    const referral = await prisma.referral.create({
      data: { brandId: brand.id, customerId: referrer.id, code: 'MAYA-4XKP', clicks: 38, signups: 9, conversions: 5, revenue: 342.5 },
    });
    await prisma.referralEvent.createMany({
      data: [
        { brandId: brand.id, referralId: referral.id, type: 'CLICK', ip: '10.1.1.1', createdAt: daysAgo(12) },
        { brandId: brand.id, referralId: referral.id, type: 'CONVERSION', refereeEmail: 'friend1@example.com', createdAt: daysAgo(9) },
        { brandId: brand.id, referralId: referral.id, type: 'REWARD', refereeEmail: 'friend1@example.com', createdAt: daysAgo(9) },
        { brandId: brand.id, referralId: referral.id, type: 'CONVERSION', refereeEmail: referrer.email, flagged: true, flagReason: 'SELF_REFERRAL', createdAt: daysAgo(5) },
      ],
    });

    // Reviews & Q&A
    const reviewBodies = [
      ['Obsessed with this', 'The texture is perfect and it lasts all day. Already ordered a second one.', 5],
      ['Really nice', 'Lovely finish, arrived quickly. Packaging feels premium.', 5],
      ['Good but pricey', 'Great quality although a little expensive for the size.', 4],
      ['Works well', 'Does what it says. Would recommend to friends.', 4],
      ['Just okay', 'Expected a richer color payoff. Might repurchase on sale.', 3],
      ['Not for me', 'The shade did not suit my undertone unfortunately.', 2],
      ['Holy grail', 'I have repurchased three times. Nothing else compares.', 5],
      ['Great gift', 'Bought for my sister and she loves it.', 5],
      ['Decent', 'Nice product, shipping took a while.', 4],
      ['Amazing shade range', 'Finally a brand that matches deeper skin tones properly.', 5],
      ['Melted in transit', 'Product itself is nice but arrived slightly melted.', 3],
      ['Perfect everyday', 'Subtle, buildable, exactly what I wanted.', 5],
    ] as const;
    for (let i = 0; i < reviewBodies.length; i++) {
      const [title, body, rating] = reviewBodies[i];
      const customer = pick(customers);
      const product = pick(products);
      const status = i < 3 ? 'PENDING' : i === 11 ? 'REJECTED' : 'APPROVED';
      await prisma.review.create({
        data: {
          brandId: brand.id,
          productId: product.id,
          customerId: customer.id,
          authorName: `${customer.firstName} ${customer.lastName?.[0] ?? ''}.`,
          authorEmail: customer.email,
          rating,
          title,
          body,
          status,
          verified: rand() > 0.35,
          helpfulCount: Math.floor(rand() * 20),
          reply: i === 4 ? 'Thanks for the honest feedback — a richer formula is coming this fall!' : null,
          repliedAt: i === 4 ? daysAgo(2) : null,
          createdAt: daysAgo(Math.floor(rand() * 45)),
        },
      });
    }
    for (const p of products) {
      const agg = await prisma.review.aggregate({
        where: { productId: p.id, status: 'APPROVED' },
        _count: true,
        _avg: { rating: true },
      });
      await prisma.product.update({
        where: { id: p.id },
        data: {
          reviewsCount: agg._count,
          ratingAvg: agg._avg.rating !== null ? Math.round(agg._avg.rating * 100) / 100 : null,
        },
      });
    }
    await prisma.productQuestion.createMany({
      data: [
        { brandId: brand.id, productId: products[0].id, authorName: 'Priya', body: 'Is this vegan and cruelty-free?', status: 'PUBLISHED', answer: 'Yes — the entire line is vegan and Leaping Bunny certified.', answeredAt: daysAgo(6) },
        { brandId: brand.id, productId: products[3].id, authorName: 'Dana', body: 'Would this work for olive undertones?', status: 'PENDING' },
        { brandId: brand.id, productId: products[5].id, authorName: 'Kai', body: 'Is the gloss sticky?', status: 'PENDING' },
      ],
    });

    // Quiz with conditional logic
    const quiz = await prisma.quiz.create({
      data: {
        brandId: brand.id,
        title: 'Find your perfect shade',
        slug: 'find-your-shade',
        description: 'Three quick questions to match you with your ideal products.',
        status: 'ACTIVE',
        leadCapture: true,
        views: 210,
        starts: 160,
        completions: 124,
      },
    });
    const q1 = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        sort: 0,
        prompt: 'How would you describe your skin tone?',
        options: [
          { id: 'fair', label: 'Fair to light', productIds: [products[0].id], tags: ['fair'] },
          { id: 'medium', label: 'Medium to tan', productIds: [products[3].id], tags: ['medium'] },
          { id: 'deep', label: 'Deep to rich', productIds: [products[5].id], tags: ['deep'] },
        ],
      },
    });
    const q3 = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        sort: 2,
        prompt: 'What finish do you love?',
        options: [
          { id: 'matte', label: 'Soft matte', productIds: [products[3].id, products[4].id] },
          { id: 'glossy', label: 'Glossy & dewy', productIds: [products[5].id, products[0].id] },
        ],
      },
    });
    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        sort: 1,
        prompt: 'What are you shopping for today?',
        options: [
          { id: 'lips', label: 'Lips', productIds: [products[0].id, products[5].id], nextQuestionId: q3.id },
          { id: 'face', label: 'Face', productIds: [products[3].id], nextQuestionId: q3.id },
          { id: 'eyes', label: 'Eyes', productIds: [products[4].id], nextQuestionId: null },
        ],
      },
    });
    for (let i = 0; i < 8; i++) {
      const customer = pick(customers);
      await prisma.quizResponse.create({
        data: {
          brandId: brand.id,
          quizId: quiz.id,
          customerId: customer.id,
          email: customer.email,
          answers: { [q1.id]: pick(['fair', 'medium', 'deep']) },
          recommendedProductIds: [pick(products).id, pick(products).id],
          completedAt: daysAgo(Math.floor(rand() * 20)),
          createdAt: daysAgo(Math.floor(rand() * 20)),
        },
      });
    }

    // Surveys
    const survey = await prisma.survey.create({
      data: {
        brandId: brand.id,
        title: 'Post-purchase NPS',
        type: 'NPS',
        status: 'ACTIVE',
        question: 'How likely are you to recommend us to a friend?',
        followUp: 'What is the main reason for your score?',
        responsesCount: 14,
      },
    });
    const npsAnswers = [
      [10, 'The shade matcher nailed it first try.'],
      [9, 'Fast shipping and beautiful packaging.'],
      [10, 'Love the loyalty points program.'],
      [8, 'Great products, wish shipping were cheaper.'],
      [9, 'The try-on feature is so fun.'],
      [7, 'Good but delivery took 6 days.'],
      [10, 'Best gloss I have ever used.'],
      [6, 'Product is fine, sizing felt small.'],
      [9, 'Customer service replied within an hour.'],
      [10, 'Quiz recommendations were spot on.'],
      [8, 'Solid quality overall.'],
      [5, 'My order arrived with a damaged box.'],
      [9, 'The referral discount worked perfectly.'],
      [10, 'Everything about the experience felt premium.'],
    ] as const;
    for (const [score, answer] of npsAnswers) {
      const customer = pick(customers);
      await prisma.surveyResponse.create({
        data: {
          brandId: brand.id,
          surveyId: survey.id,
          customerId: customer.id,
          email: customer.email,
          score,
          answer,
          createdAt: daysAgo(Math.floor(rand() * 25)),
        },
      });
    }

    // Bundles, discounts, gifts, upsells
    await prisma.bundle.create({
      data: {
        brandId: brand.id,
        name: 'Coffee Shop Glow Set',
        type: 'FBT',
        status: 'ACTIVE',
        discountType: 'PERCENT',
        discountValue: 15,
        impressions: 320,
        conversions: 24,
        items: {
          create: [
            { productId: products[0].id },
            { productId: products[1].id },
            { productId: products[2].id },
          ],
        },
      },
    });
    await prisma.discountCampaign.createMany({
      data: [
        { brandId: brand.id, name: 'Welcome offer', code: 'WELCOME10', type: 'PERCENT', value: 10, status: 'ACTIVE', usageCount: 14 },
        { brandId: brand.id, name: 'Free shipping threshold', code: null, type: 'FIXED', value: 5, minSubtotal: 60, status: 'ACTIVE', usageCount: 31 },
      ],
    });
    await prisma.giftCampaign.create({
      data: {
        brandId: brand.id,
        name: 'Free hand cream over $75',
        status: 'ACTIVE',
        trigger: 'CART_VALUE',
        thresholdAmount: 75,
        giftProductIds: [products[2].id],
        unlockedCount: 18,
      },
    });
    await prisma.upsellOffer.createMany({
      data: [
        {
          brandId: brand.id,
          name: 'Gloss add-on at cart',
          placement: 'CART',
          status: 'ACTIVE',
          triggerProductIds: [],
          offerProductIds: [products[5].id],
          headline: 'Complete the look',
          discountPct: 10,
          impressions: 540,
          clicks: 96,
          conversions: 31,
          revenue: 527,
        },
        {
          brandId: brand.id,
          name: 'Liner with eyeshadow looks',
          placement: 'PRODUCT_PAGE',
          status: 'ACTIVE',
          triggerProductIds: [products[4].id],
          offerProductIds: [products[4].id],
          headline: 'Pairs perfectly',
          impressions: 210,
          clicks: 34,
          conversions: 9,
          revenue: 189,
        },
      ],
    });

    // Social posts
    await prisma.socialPost.createMany({
      data: [0, 1, 2, 3].map((i) => ({
        brandId: brand.id,
        source: 'MANUAL' as const,
        mediaUrl: `https://picsum.photos/seed/avori-social-${i}/600/600`,
        caption: ['Morning routine with the spring drop ☕', 'Golden hour, golden gloss ✨', 'Shade-matched by AI, loved by you', 'Behind the scenes at the studio'][i],
        permalink: 'https://instagram.com/p/demo',
        productIds: [pick(products).id],
        visible: true,
        sort: i,
        postedAt: daysAgo(i * 4),
      })),
    });

    // Shade profiles
    for (const [skinTone, undertone, season] of [
      ['light', 'cool', 'summer'],
      ['tan', 'warm', 'autumn'],
      ['deep', 'neutral', 'winter'],
    ] as const) {
      const customer = pick(customers);
      await prisma.shadeProfile.create({
        data: {
          brandId: brand.id,
          customerId: customer.id,
          email: customer.email,
          skinTone,
          undertone,
          lipTone: 'rosy pink',
          hairColor: 'dark brown',
          eyeColor: 'brown',
          season,
          recommendedProductIds: [pick(products).id, pick(products).id],
          source: 'api',
          createdAt: daysAgo(Math.floor(rand() * 15)),
        },
      });
    }

    // Widget analytics events over 30 days
    const eventTypes = ['IMPRESSION', 'IMPRESSION', 'IMPRESSION', 'VIEW', 'VIEW', 'TAG_CLICK', 'CTA_CLICK'] as const;
    const eventsData = Array.from({ length: 400 }, () => {
      const type = pick([...eventTypes]);
      return {
        brandId: brand.id,
        videoId: video.id,
        productId: type === 'TAG_CLICK' || type === 'CTA_CLICK' ? pick(products).id : null,
        type,
        domain: 'localhost',
        createdAt: daysAgo(Math.floor(rand() * 30)),
      };
    });
    await prisma.analyticsEvent.createMany({ data: eventsData });

    // Demo API key (fixed so the docs/tests can reference it)
    const demoKey = 'avk_demo_1234567890abcdef';
    await prisma.apiKey.create({
      data: {
        brandId: brand.id,
        name: 'Demo key (local only)',
        prefix: demoKey.slice(0, 12),
        hashedKey: crypto.createHash('sha256').update(demoKey).digest('hex'),
      },
    });

    console.log(`\nSeeded platform demo data: 20 customers, 60 orders, reviews, loyalty, referrals, quiz, survey, bundles, upsells, social, shade profiles.`);
    console.log(`  demo API key  ${demoKey}`);
  }

  console.log('\nSeeded:');
  console.log(`  admin    ${adminEmail} / ${password}`);
  console.log(`  brand    ${brandEmail} / ${password}`);
  console.log(`  brandId  ${brand.id}`);
  console.log(`  embed    <div class="shop-video-widget" data-brand-id="${brand.id}" data-mode="floating"></div>\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
