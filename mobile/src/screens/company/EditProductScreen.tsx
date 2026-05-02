/**
 * mobile/src/screens/company/EditProductScreen.tsx
 *
 * UPDATED:
 *  - useIsCompanyOwner(product) guard — only the owner of THIS product can edit
 *  - useTheme(), no hardcoded colors
 *  - Adds an explicit "Forbidden" state when product loads but user is not owner
 *  - Save returns user to the detail screen instead of just goBack(), so the
 *    refreshed product data is what they see next
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import { useProduct, useUpdateProduct } from '../../hooks/useProducts';

import { ProductForm } from '../../components/products/ProductForm';
import {
  CreateProductData, ImageAsset, UpdateProductData,
} from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'EditProduct'>;

export const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { colors, isDark } = useTheme();

  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const isOwner = useIsCompanyOwner(product);

  const handleSubmit = (
    data: CreateProductData,
    imageAssets: ImageAsset[],
    existingIds: string[],
  ) => {
    const originalIds    = product?.images.map(img => img.public_id) ?? [];
    const imagesToDelete = originalIds.filter(id => !existingIds.includes(id));

    updateProduct.mutate(
      {
        id: productId,
        data: data as UpdateProductData,
        imageAssets,
        existingImages: existingIds,
        imagesToDelete,
      },
      { onSuccess: () => navigation.goBack() },
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  // ── Error / not-found ──────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[s.centerTitle, { color: colors.textPrimary }]}>
            {isError ? 'Failed to load product' : 'Product not found'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {isError && (
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Forbidden — product exists but user doesn't own it ─────────────────────
  if (!isOwner) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.center}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
          <Text style={[s.centerTitle, { color: colors.textPrimary }]}>
            You can’t edit this product
          </Text>
          <Text style={[s.centerBody, { color: colors.textMuted }]}>
            Only the company that owns this product can edit it.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum = product.price?.amount ?? 0;
  const currency = product.price?.currency ?? 'USD';
  const unit     = product.price?.unit     ?? 'unit';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
          Edit Product
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ProductForm
        mode="edit"
        initialData={{
          name:             product.name,
          description:      product.description,
          shortDescription: product.shortDescription,
          price:            priceNum,
          currency,
          unit,
          category:         product.category,
          subcategory:      product.subcategory,
          tags:             product.tags,
          featured:         product.featured,
          inventory:        product.inventory,
          sku:              product.sku,
          specifications:   product.specifications,
          images:           product.images,
        }}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:       { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  centerTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  centerBody:  { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});