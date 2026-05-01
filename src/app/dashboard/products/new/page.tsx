import { PageHeader } from '@/components/AppShell';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="New product" description="Add a product you want to feature in videos." />
      <ProductForm />
    </div>
  );
}
