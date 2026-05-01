import { PrismaClient, Role, ProductStatus, VideoStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@avori.dev';
  const brandEmail = 'demo@avori.dev';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Avori Admin',
      role: Role.ADMIN,
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: 'demo-brand' },
    update: {},
    create: {
      name: 'Demo Brand',
      slug: 'demo-brand',
      domain: 'localhost',
    },
  });

  await prisma.user.upsert({
    where: { email: brandEmail },
    update: { brandId: brand.id },
    create: {
      email: brandEmail,
      passwordHash,
      name: 'Demo Brand Owner',
      role: Role.BRAND,
      brandId: brand.id,
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'seed-prod-1' },
      update: {},
      create: {
        id: 'seed-prod-1',
        brandId: brand.id,
        name: 'Iced Latte Lip Balm',
        price: 18.0,
        imageUrl: 'https://picsum.photos/seed/iced-latte/400/400',
        productUrl: 'https://example.com/products/iced-latte',
        sku: 'AV-IL-001',
        status: ProductStatus.ACTIVE,
      },
    }),
    prisma.product.upsert({
      where: { id: 'seed-prod-2' },
      update: {},
      create: {
        id: 'seed-prod-2',
        brandId: brand.id,
        name: 'Espresso Body Mist',
        price: 32.0,
        imageUrl: 'https://picsum.photos/seed/espresso/400/400',
        productUrl: 'https://example.com/products/espresso-mist',
        sku: 'AV-EM-002',
        status: ProductStatus.ACTIVE,
      },
    }),
    prisma.product.upsert({
      where: { id: 'seed-prod-3' },
      update: {},
      create: {
        id: 'seed-prod-3',
        brandId: brand.id,
        name: 'Matcha Hand Cream',
        price: 24.0,
        imageUrl: 'https://picsum.photos/seed/matcha/400/400',
        productUrl: 'https://example.com/products/matcha-cream',
        sku: 'AV-MC-003',
        status: ProductStatus.ACTIVE,
      },
    }),
  ]);

  const sampleVideoUrl =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  const video = await prisma.video.upsert({
    where: { id: 'seed-video-1' },
    update: {},
    create: {
      id: 'seed-video-1',
      brandId: brand.id,
      title: 'Spring drop — coffee bar',
      description: 'A dreamy iced-latte morning. Tap the dots to shop.',
      videoUrl: sampleVideoUrl,
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
