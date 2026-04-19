// frontend/src/pages/dashboard/company/products/[id]/index.tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ProductDetail } from '@/components/Products/ProductDetail';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CompanyProductDetailPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Head><title>Product Details — Dashboard</title></Head>
      <ProductDetail
        productId={router.query.id as string}
        currentUser={user}
        onBack={() => router.push('/dashboard/company/products')}
      />
    </DashboardLayout>
  );
}