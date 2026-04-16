/**
 * mobile/src/components/products/ProductCard.tsx  (UPDATED)
 *
 * Two variants driven by a `variant` prop:
 *   - "public"  → read-only, scrollable thumbnail strip, used in marketplace
 *   - "owner"   → company action menu (Edit / Status / Delete), used in CompanyProductList
 *
 * Public variant: shows scrollable mini image rail when product has > 1 image.
 * Owner variant:  retains existing CompanyProductCard behaviour, now integrated here.
 *
 * Sizes: 'sm' | 'md' (md is default, sm is for horizontal featured lists)
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  FlatList,
  ActionSheetIOS,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Product } from '../../services/productService';
import {
  formatPrice,
  getPrimaryImage,
  getStockStatus,
  getStockBadgeConfig,
  getProductStatusConfig,
} from '../../utils/productHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductCardVariant = 'public' | 'owner';

interface PublicProductCardProps {
  variant?: 'public';
  product: Product;
  onPress: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface OwnerProductCardProps {
  variant: 'owner';
  product: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMarkOutOfStock?: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

type ProductCardProps = PublicProductCardProps | OwnerProductCardProps;

// ─── Public ProductCard ───────────────────────────────────────────────────────

const PublicCard: React.FC<PublicProductCardProps> = ({
  product,
  onPress,
  size = 'md',
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  const [imgError, setImgError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const isSm = size === 'sm';
  const imageHeight = isSm ? 80 : 160;

  // Sort images: primary first
  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const hasMultiple = sortedImages.length > 1;

  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';
  const stockStatus = getStockStatus(product.inventory);
  const stockConfig = getStockBadgeConfig(stockStatus);
  const company = typeof product.companyId === 'object' ? product.companyId : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          backgroundColor: colors.card ?? colors.surface,
          borderRadius: borderRadius.lg,
          borderColor: colors.border,
          ...shadows.md,
        },
        style,
      ]}
    >
      {/* ── Image area ── */}
      <View
        style={[
          styles.imageContainer,
          {
            height: imageHeight,
            borderTopLeftRadius: borderRadius.lg,
            borderTopRightRadius: borderRadius.lg,
            backgroundColor: colors.skeleton,
          },
        ]}
      >
        {hasMultiple && !isSm ? (
          /* Scrollable image strip */
          <>
            <FlatList
              data={sortedImages}
              keyExtractor={(img) => img.public_id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x /
                    (e.nativeEvent.layoutMeasurement.width || 1),
                );
                setActiveIdx(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.secure_url }}
                  style={{ width: Dimensions.get('window').width / 2 - 20, height: imageHeight }}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              )}
            />
            {/* Dots */}
            <View style={styles.dotsRow}>
              {sortedImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === activeIdx ? '#FBBF24' : 'rgba(255,255,255,0.55)',
                      width: i === activeIdx ? 14 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </>
        ) : sortedImages[0] && !imgError ? (
          <Image
            source={{ uri: sortedImages[0].secure_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={isSm ? 22 : 36} color={colors.textMuted} />
          </View>
        )}

        {/* Featured badge */}
        {product.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={9} color="#0A2540" />
            {!isSm && <Text style={styles.featuredText}>Featured</Text>}
          </View>
        )}

        {/* Stock badge */}
        <View style={[styles.stockBadge, { backgroundColor: stockConfig.background }]}>
          <View style={[styles.stockDot, { backgroundColor: stockConfig.color }]} />
          {!isSm && (
            <Text style={[styles.stockText, { color: stockConfig.color }]}>
              {stockConfig.label}
            </Text>
          )}
        </View>

        {/* Multi-image indicator for sm size */}
        {isSm && hasMultiple && (
          <View style={[styles.multiIndicator, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Ionicons name="images-outline" size={10} color="#fff" />
            <Text style={styles.multiCount}>{sortedImages.length}</Text>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <View style={[styles.content, { padding: isSm ? 7 : 12 }]}>
        {!isSm && company?.name && (
          <Text
            style={[styles.companyName, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {company.name}
          </Text>
        )}

        <Text
          style={[
            styles.name,
            { color: colors.text, fontSize: isSm ? 11 : 13 },
          ]}
          numberOfLines={isSm ? 1 : 2}
        >
          {product.name}
        </Text>

        <Text
          style={[
            styles.price,
            { color: colors.primary, fontSize: isSm ? 12 : 14 },
          ]}
        >
          {formatPrice(priceNum, currency)}
        </Text>

        {!isSm && product.shortDescription && (
          <Text
            style={[styles.shortDesc, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {product.shortDescription}
          </Text>
        )}

        {!isSm && (product.tags?.length ?? 0) > 0 && (
          <View style={styles.tagsRow}>
            {product.tags!.slice(0, 2).map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.textMuted }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Owner ProductCard ────────────────────────────────────────────────────────

const OwnerCard: React.FC<OwnerProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  onMarkOutOfStock,
  size = 'md',
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  const [imgError, setImgError] = useState(false);

  const isSm = size === 'sm';
  const imageHeight = isSm ? 80 : 150;

  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const primaryImage = sortedImages[0];
  const statusConfig = getProductStatusConfig(product.status);
  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';

  const showActionSheet = useCallback(() => {
    const isActive = product.status === 'active';
    const isOOS = product.status === 'out_of_stock';

    const options = [
      'Edit Product',
      isActive ? 'Set as Draft' : 'Set as Active',
      isOOS ? 'Set as Active' : 'Mark Out of Stock',
      'Delete Product',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4, title: product.name },
        (idx) => {
          if (idx === 0) onEdit();
          else if (idx === 1) onToggleStatus();
          else if (idx === 2) isOOS ? onToggleStatus() : onMarkOutOfStock?.();
          else if (idx === 3) onDelete();
        },
      );
    } else {
      Alert.alert(product.name, 'Choose action', [
        { text: 'Edit Product',   onPress: onEdit },
        { text: isActive ? 'Set as Draft' : 'Set as Active', onPress: onToggleStatus },
        { text: isOOS ? 'Set as Active' : 'Mark Out of Stock', onPress: isOOS ? onToggleStatus : onMarkOutOfStock },
        { text: 'Delete Product', style: 'destructive', onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [product, onEdit, onDelete, onToggleStatus, onMarkOutOfStock]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          backgroundColor: colors.card ?? colors.surface,
          borderRadius: borderRadius.lg,
          borderColor: colors.border,
          ...shadows.md,
        },
        style,
      ]}
    >
      {/* ── Image ── */}
      <View
        style={[
          styles.imageContainer,
          {
            height: imageHeight,
            borderTopLeftRadius: borderRadius.lg,
            borderTopRightRadius: borderRadius.lg,
            backgroundColor: colors.skeleton,
          },
        ]}
      >
        {primaryImage && !imgError ? (
          <Image
            source={{ uri: primaryImage.secure_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={isSm ? 22 : 36} color={colors.textMuted} />
          </View>
        )}

        {/* Status badge */}
        <View
          style={[
            styles.ownerStatusBadge,
            { backgroundColor: statusConfig.background },
          ]}
        >
          <Text style={[styles.ownerStatusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Image count badge */}
        {sortedImages.length > 1 && (
          <View style={[styles.multiIndicator, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Ionicons name="images-outline" size={10} color="#fff" />
            <Text style={styles.multiCount}>{sortedImages.length}</Text>
          </View>
        )}

        {/* More menu */}
        <TouchableOpacity
          onPress={showActionSheet}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.moreBtn,
            { backgroundColor: 'rgba(0,0,0,0.45)' },
          ]}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <View style={[styles.content, { padding: isSm ? 7 : 12 }]}>
        <Text
          style={[
            styles.name,
            { color: colors.text, fontSize: isSm ? 11 : 13 },
          ]}
          numberOfLines={isSm ? 1 : 2}
        >
          {product.name}
        </Text>

        <Text
          style={[styles.price, { color: colors.primary, fontSize: isSm ? 12 : 14 }]}
        >
          {formatPrice(priceNum, currency)}
        </Text>

        {!isSm && (
          <View style={styles.ownerMeta}>
            <Text style={[styles.ownerMetaText, { color: colors.textMuted }]}>
              {product.views ?? 0} views
            </Text>
            <Text style={[styles.ownerMetaText, { color: colors.textMuted }]}>
              {product.category}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Unified export ───────────────────────────────────────────────────────────

export const ProductCard: React.FC<ProductCardProps> = memo((props) => {
  if (props.variant === 'owner') {
    return <OwnerCard {...(props as OwnerProductCardProps)} />;
  }
  return <PublicCard {...(props as PublicProductCardProps)} />;
});

ProductCard.displayName = 'ProductCard';

// Convenience named exports for backwards compatibility
export const PublicProductCard = (props: Omit<PublicProductCardProps, 'variant'>) => (
  <ProductCard variant="public" {...props} />
);
export const OwnerProductCard = (props: Omit<OwnerProductCardProps, 'variant'>) => (
  <ProductCard variant="owner" {...props} />
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const ProductCardSkeleton: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius } = theme;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          {
            height: size === 'sm' ? 80 : 160,
            borderTopLeftRadius: borderRadius.lg,
            borderTopRightRadius: borderRadius.lg,
            backgroundColor: colors.skeleton,
          },
        ]}
      />
      <View style={{ padding: 12, gap: 6 }}>
        <View style={[styles.skelLine, { width: '80%', backgroundColor: colors.skeleton }]} />
        <View style={[styles.skelLine, { width: '50%', backgroundColor: colors.skeleton }]} />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: { height: 6, borderRadius: 3 },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featuredText: { fontSize: 9, fontWeight: '700', color: '#0A2540' },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stockDot: { width: 5, height: 5, borderRadius: 2.5 },
  stockText: { fontSize: 9, fontWeight: '700' },
  multiIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  multiCount: { fontSize: 10, color: '#fff', fontWeight: '700' },
  ownerStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ownerStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  moreBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: 3 },
  companyName: { fontSize: 10, fontWeight: '500', marginBottom: 1 },
  name: { fontWeight: '700', lineHeight: 18 },
  price: { fontWeight: '700' },
  shortDesc: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: { fontSize: 10 },
  ownerMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  ownerMetaText: { fontSize: 11 },
  skelLine: { height: 12, borderRadius: 6 },
});
