import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.brandId !== brandId) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          sku: product.sku,
          status: product.status,
        }}
      />
    </div>
  );
}
