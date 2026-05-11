// src/screens/products/ProductDetailsScreen.tsx
// MIGRATED: useTheme() only, AppHeader, spacing/radius tokens, Ionicons only, pull-to-refresh

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Linking, ActivityIndicator,
  StatusBar, Share, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import {
  useProduct, useRelatedProducts,
  useSaveProduct, useUnsaveProduct, useSavedProducts,
} from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { PublicProductCard }   from '../../components/products/PublicProductCard';
import { OwnerAvatar }         from '../../components/products/OwnerAvatar';
import { AppHeader }           from '../../components/ui/AppHeader';
import {
  formatPrice, getStockStatus, getStockBadgeConfig,
} from '../../utils/productHelpers';
import { productService, ProductCompany } from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets  = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);
  const [localSaved, setLocalSaved]     = useState(false);

  const {
    data: product, isLoading, isError, refetch, isRefetching,
  } = useProduct(productId);
  const { data: related = [] }  = useRelatedProducts(productId);
  const saveProduct              = useSaveProduct();
  const unsaveProduct            = useUnsaveProduct();
  const { data: savedData }      = useSavedProducts({ limit: 100 });

  useEffect(() => {
    if (!savedData) return;
    const ids = new Set<string>();
    savedData.pages.forEach(p => p.products.forEach(prod => ids.add(prod._id)));
    setLocalSaved(ids.has(productId));
  }, [savedData, productId]);

  const isOwner = useIsCompanyOwner(product);

  const handleToggleSave = useCallback(() => {
    if (!user) return;
    const wasSaved = localSaved;
    setLocalSaved(!wasSaved);
    const rollback = () => setLocalSaved(wasSaved);
    if (wasSaved) unsaveProduct.mutate(productId, { onError: rollback });
    else          saveProduct.mutate(productId,   { onError: rollback });
  }, [localSaved, productId, user, saveProduct, unsaveProduct]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} on Banana\nhttps://getbananalink.com/products/${productId}`,
      });
    } catch { /* user cancelled */ }
  }, [product, productId]);

  const handleContact = useCallback(() => {
    const company =
      product?.companyId && typeof product.companyId === 'object'
        ? (product.companyId as ProductCompany)
        : null;
    const phone   = company?.phone;
    const website = company?.website;
    if (phone)        Linking.openURL(`tel:${phone}`).catch(() => {});
    else if (website) Linking.openURL(website.startsWith('http') ? website : `https://${website}`).catch(() => {});
  }, [product]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
        <AppHeader title="Product" showBack onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
        <AppHeader title="Product" showBack onBack={() => navigation.goBack()} />
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={56} color={c.textMuted} />
          <Text style={[type.bodySm, { color: c.text, fontWeight: '600', textAlign: 'center', marginTop: spacing.md }]}>
            {isError ? 'Failed to load product' : 'Product not found'}
          </Text>
          <TouchableOpacity onPress={() => isError ? refetch() : navigation.goBack()} hitSlop={8}>
            <Text style={[type.bodySm, { color: c.primary, fontWeight: '600', marginTop: spacing.sm }]}>
              {isError ? 'Retry' : 'Go back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum    = product.price?.amount ?? 0;
  const currency    = product.price?.currency ?? 'USD';
  const stockStat   = getStockStatus(product.inventory);
  const stockCfg    = getStockBadgeConfig(stockStat);
  const ownerName   = productService.getOwnerName(product);
  const ownerAvatar = productService.getOwnerAvatarUrl(product);

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <AppHeader
        title={product.name}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {user && !isOwner && (
              <TouchableOpacity onPress={handleToggleSave} hitSlop={8}>
                <Ionicons
                  name={localSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={localSaved ? c.primary : c.text}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={22} color={c.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />}
      >
        <ProductImageGallery images={product.images} />

        <View style={{ padding: spacing.lg, gap: spacing.md }}>

          {/* Stock + Featured badges */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <View style={[S.badge, { backgroundColor: stockCfg.background }]}>
              <View style={[S.dot, { backgroundColor: stockCfg.color }]} />
              <Text style={[type.caption, { color: stockCfg.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }]}>
                {stockCfg.label}
              </Text>
            </View>
            {product.featured && (
              <View style={[S.badge, { backgroundColor: c.warningBg }]}>
                <Ionicons name="star" size={10} color={c.warning} />
                <Text style={[type.caption, { color: c.warning, fontWeight: '700' }]}>Featured</Text>
              </View>
            )}
          </View>

          {/* Name + price */}
          <Text style={[type.h2, { color: c.text, fontWeight: '700' }]}>{product.name}</Text>
          <Text style={[S.price, { color: c.primary }]}>
            {formatPrice(priceNum, currency)}
            {product.price?.unit && product.price.unit !== 'unit' && (
              <Text style={[type.body, { color: c.textMuted }]}> / {product.price.unit}</Text>
            )}
          </Text>

          {/* Category */}
          {product.category && (
            <View style={[S.catChip, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.full }]}>
              <Text style={[type.caption, { color: c.textMuted }]}>
                {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
              </Text>
            </View>
          )}

          {/* Owner card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[S.ownerCard, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md }]}
            onPress={handleContact}
          >
            <OwnerAvatar
              name={ownerName}
              avatarUrl={ownerAvatar}
              verified={product.ownerSnapshot?.verified}
              size={40}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]} numberOfLines={1}>
                  {ownerName}
                </Text>
                {product.ownerSnapshot?.verified && (
                  <Ionicons name="checkmark-circle" size={14} color={c.primary} />
                )}
              </View>
              {product.ownerSnapshot?.industry && (
                <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
                  {product.ownerSnapshot.industry}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </TouchableOpacity>

          {/* Owner manage hint */}
          {isOwner && (
            <TouchableOpacity
              style={[S.manageHint, { backgroundColor: c.primaryBg, borderColor: withAlpha(c.primary, 0.3), borderRadius: radius.md }]}
              onPress={() =>
                (navigation as unknown as { navigate: (n: string, p: { productId: string }) => void })
                  .navigate('CompanyProductDetails', { productId })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={16} color={c.primary} />
              <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>Manage this product</Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          {product.description && (
            <View>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.sm }]}>Description</Text>
              <Text
                style={[type.body, { color: c.textSecondary, lineHeight: 22 }]}
                numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
              >
                {product.description}
              </Text>
              {product.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded(v => !v)} hitSlop={8}>
                  <Text style={[type.bodySm, { color: c.primary, fontWeight: '600', marginTop: spacing.xs }]}>
                    {descExpanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Specifications */}
          {!!product.specifications?.length && (
            <View>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.sm }]}>Specifications</Text>
              <View style={[S.specTable, { borderColor: c.border, borderRadius: radius.md }]}>
                {product.specifications.map((spec, i) => (
                  <View
                    key={`spec-${spec.key}-${i}`}
                    style={[
                      S.specRow,
                      {
                        backgroundColor:  i % 2 === 0 ? c.surface : c.bg,
                        borderTopColor:   c.border,
                        borderTopWidth:   i === 0 ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[type.bodySm, { color: c.textMuted, flex: 1 }]}>{spec.key}</Text>
                    <Text style={[type.bodySm, { color: c.text, fontWeight: '600', flex: 1, textAlign: 'right' }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {!!product.tags?.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {product.tags.map((tag, i) => (
                <View
                  key={`tag-${tag}-${i}`}
                  style={[S.tag, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.full }]}
                >
                  <Text style={[type.caption, { color: c.textMuted }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Related */}
          {related.length > 0 && (
            <View>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.sm }]}>Related Products</Text>
              <FlatList
                horizontal
                nestedScrollEnabled
                data={related}
                keyExtractor={item => `related-${item._id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
                renderItem={({ item }) => (
                  <PublicProductCard
                    product={item}
                    onPress={() => navigation.push('ProductDetails', { productId: item._id })}
                    size="sm"
                    style={{ width: 160 }}
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTAs */}
      <View style={[
        S.bottomBar,
        {
          backgroundColor: c.bg,
          borderTopColor:  c.border,
          paddingBottom:   insets.bottom + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop:      spacing.md,
        },
      ]}>
        <TouchableOpacity
          onPress={handleToggleSave}
          activeOpacity={0.85}
          style={[S.saveBtn, {
            backgroundColor: localSaved ? c.primaryBg : c.surface,
            borderColor:     localSaved ? c.primary   : c.border,
            borderRadius:    radius.md,
          }]}
        >
          <Ionicons
            name={localSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={localSaved ? c.primary : c.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContact}
          activeOpacity={0.9}
          style={[S.contactBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
        >
          <Ionicons name="chatbubble-outline" size={18} color={c.bg} />
          <Text style={[type.body, { color: c.bg, fontWeight: '700' }]}>Contact Company</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  price:      { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  catChip:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  ownerCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1 },
  manageHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1 },
  specTable:  { borderWidth: 1, overflow: 'hidden' },
  specRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  tag:        { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  saveBtn:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
});

export default ProductDetailsScreen;