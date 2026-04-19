// frontend/src/pages/products/[id].tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ProductDetail } from '@/components/Products/ProductDetail';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PublicProductDetailPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Head><title>Product — Banana</title></Head>
      <ProductDetail
        productId={router.query.id as string}
        currentUser={user}
        onBack={() => router.back()}
      />
    </DashboardLayout>
  );
}