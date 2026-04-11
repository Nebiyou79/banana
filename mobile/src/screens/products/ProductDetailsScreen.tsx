import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Linking,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useProduct, useRelatedProducts } from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductCard } from '../../components/products/ProductCard';
import { formatPrice, getStockStatus, getStockBadgeConfig } from '../../utils/productHelpers';
import { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;

  const [descExpanded, setDescExpanded] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { data: relatedProducts } = useRelatedProducts(productId);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} size="large" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>Product not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const company = typeof product.companyId === 'object' ? product.companyId : null;
  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';
  const stockStatus = getStockStatus(product.inventory);
  const stockConfig = getStockBadgeConfig(stockStatus);
  const hasSpecs = product.specifications && product.specifications.length > 0;
  const hasTags = product.tags && product.tags.length > 0;

  const handleContactCompany = () => {
    // Open email for now; replace with in-app messaging later
    if (company?.name) {
      Linking.openURL(`mailto:?subject=Inquiry about ${product.name}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Back button overlay */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { backgroundColor: colors.card, ...shadows.md }]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <ProductImageGallery images={product.images} height={300} />

        <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5] }}>
          {/* Name */}
          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>

          {/* Price + stock */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(priceNum, currency)}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: stockConfig.background }]}>
              <View style={[styles.stockDot, { backgroundColor: stockConfig.color }]} />
              <Text style={[styles.stockText, { color: stockConfig.color }]}>
                {stockConfig.label}
              </Text>
            </View>
          </View>

          {/* Featured badge */}
          {product.featured && (
            <View style={[styles.featuredRow, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>Featured Product</Text>
            </View>
          )}

          {/* Company */}
          {company && (
            <View style={[styles.companyRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
              <View style={[styles.companyAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>
                  {company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.companyName, { color: colors.text }]}>{company.name}</Text>
                  {company.verified && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  )}
                </View>
                {company.industry && (
                  <Text style={[styles.companyIndustry, { color: colors.textMuted }]}>
                    {company.industry}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Tags */}
          {hasTags && (
            <View style={styles.tagsRow}>
              {product.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text
              style={[styles.bodyText, { color: colors.textSecondary }]}
              numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
            >
              {product.description}
            </Text>
            {product.description && product.description.length > 200 && (
              <TouchableOpacity onPress={() => setDescExpanded((v) => !v)}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13, marginTop: 6 }}>
                  {descExpanded ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Specifications */}
          {hasSpecs && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Specifications</Text>
              <View style={[styles.specTable, { borderColor: colors.border, borderRadius: borderRadius.md }]}>
                {product.specifications!.map((spec, i) => (
                  <View
                    key={i}
                    style={[
                      styles.specRow,
                      {
                        backgroundColor: i % 2 === 0 ? colors.surface : colors.background,
                        borderTopColor: colors.border,
                        borderTopWidth: i === 0 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.specKey, { color: colors.textSecondary }]}>{spec.key}</Text>
                    <Text style={[styles.specVal, { color: colors.text }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Inventory */}
          <View style={[styles.section, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              {product.inventory.trackQuantity
                ? `${product.inventory.quantity} units in stock`
                : 'Availability: Contact seller'}
            </Text>
          </View>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Products</Text>
              <FlatList
                horizontal
                data={relatedProducts}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => navigation.replace('ProductDetails', { productId: item._id })}
                    size="sm"
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            ...shadows.lg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleContactCompany}
          style={[styles.contactBtn, { borderColor: colors.primary }]}
        >
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
            Contact Company
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stockDot: { width: 7, height: 7, borderRadius: 999 },
  stockText: { fontSize: 12, fontWeight: '700' },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 14,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    marginVertical: 14,
  },
  companyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: { fontSize: 14, fontWeight: '700' },
  companyIndustry: { fontSize: 11, marginTop: 1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, letterSpacing: -0.3 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  specTable: { overflow: 'hidden', borderWidth: 1 },
  specRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  specKey: { flex: 1, fontSize: 13, fontWeight: '600' },
  specVal: { flex: 1, fontSize: 13, textAlign: 'right' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 14,
    height: 52,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 17, fontWeight: '700' },
});
