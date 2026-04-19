/**
 * mobile/src/screens/company/EditProductScreen.tsx  (UPDATED)
 * Uses useTheme()
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useProduct, useUpdateProduct } from '../../hooks/useProducts';
import { ProductForm } from '../../components/products/ProductForm';
import { CreateProductData, ImageAsset, UpdateProductData } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'EditProduct'>;

export const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { colors }    = useTheme();

  const { data: product, isLoading } = useProduct(productId);
  const updateProduct                = useUpdateProduct();

  const handleSubmit = (data: CreateProductData, imageAssets: ImageAsset[], existingIds: string[]) => {
    const originalIds   = product?.images.map(img => img.public_id) ?? [];
    const imagesToDelete = originalIds.filter(id => !existingIds.includes(id));

    updateProduct.mutate(
      { id: productId, data: data as UpdateProductData, imageAssets, existingImages: existingIds, imagesToDelete },
      { onSuccess: () => navigation.goBack() }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>Product not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum = product.price?.amount ?? (product.price as unknown as number);
  const currency = product.price?.currency ?? 'USD';
  const unit     = product.price?.unit     ?? 'unit';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>Edit Product</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title:  { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
