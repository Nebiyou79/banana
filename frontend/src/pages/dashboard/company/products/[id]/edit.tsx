// frontend/src/pages/dashboard/company/products/[id]/edit.tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useProduct } from '@/hooks/useProducts';
import { ProductForm } from '@/components/Products/ProductForm';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function EditProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const companyId = user?.company ?? user?._id;
  const { data: product, isLoading } = useProduct(router.query.id as string);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-[#F1BB03] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head><title>Edit Product — Dashboard</title></Head>
      <ProductForm
        mode="edit"
        product={product}
        companyId={companyId}
        onSuccess={() => router.push('/dashboard/company/products')}
        onCancel={() => router.back()}
      />
    </DashboardLayout>
  );
}