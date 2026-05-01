import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/AppShell';
import ProductForm from '@/components/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.brandId !== brandId) notFound();

  return (
    <div className="space-y-8">
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          sku: product.sku,
          status: product.status as 'ACTIVE' | 'INACTIVE',
        }}
      />
    </div>
  );
}
