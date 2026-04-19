// frontend/src/pages/dashboard/company/products/create.tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ProductForm } from '@/components/Products/ProductForm';
import { Product } from '@/services/productService';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CreateProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const companyId = user?.company ?? user?._id;

  return (
    <DashboardLayout>
      <Head><title>Create Product — Dashboard</title></Head>
      <ProductForm
        mode="create"
        companyId={companyId}
        onSuccess={(p: Product) => router.push(`/dashboard/company/products/${p._id}`)}
        onCancel={() => router.push('/dashboard/company/products')}
      />
    </DashboardLayout>
  );
}