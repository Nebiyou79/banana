import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useProduct, useUpdateProduct } from '../../hooks/useProducts';
import { ProductForm } from '../../components/products/ProductForm';
import { CreateProductData, ImageAsset } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'EditProduct'>;

export const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();

  const handleSubmit = (
    data: CreateProductData,
    imageAssets: ImageAsset[],
    existingImageIds: string[]
  ) => {
    // Calculate which images to delete: original ids minus current kept ids
    const originalIds = product?.images.map((img) => img.public_id) ?? [];
    const imagesToDelete = originalIds.filter((id) => !existingImageIds.includes(id));

    updateProduct.mutate(
      {
        id: productId,
        data,
        imageAssets,
        existingImages: existingImageIds,
        imagesToDelete,
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Product not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          Edit Product
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ProductForm
        mode="edit"
        initialData={{
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: priceNum,
          currency,
          category: product.category,
          subcategory: product.subcategory,
          tags: product.tags,
          featured: product.featured,
          inventory: product.inventory,
          sku: product.sku,
          specifications: product.specifications,
          images: product.images,
        }}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
