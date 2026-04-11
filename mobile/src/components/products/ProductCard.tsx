import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Product } from '../../services/productService';
import {
  formatPrice,
  getPrimaryImage,
  getStockStatus,
  getStockBadgeConfig,
} from '../../utils/productHelpers';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  size = 'md',
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  const [imgError, setImgError] = useState(false);

  const primaryImage = getPrimaryImage(product.images);
  const stockStatus = getStockStatus(product.inventory);
  const stockConfig = getStockBadgeConfig(stockStatus);
  const company = typeof product.companyId === 'object' ? product.companyId : null;
  const isSm = size === 'sm';

  // Price from nested price object or top-level
  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';

  const cardWidth = isSm ? 120 : '100%';
  const imageHeight = isSm ? 72 : 160;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          borderColor: colors.border,
          ...shadows.md,
        },
        style,
      ]}
    >
      {/* Image */}
      <View
        style={[
          styles.imageContainer,
          { height: imageHeight, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg },
        ]}
      >
        {primaryImage && !imgError ? (
          <Image
            source={{ uri: primaryImage.secure_url }}
            style={styles.image}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: colors.skeleton }]}>
            <Ionicons name="image-outline" size={isSm ? 24 : 36} color={colors.textMuted} />
          </View>
        )}

        {/* Featured badge */}
        {product.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: '#FBBF24' }]}>
            <Ionicons name="star" size={9} color="#0A2540" />
            {!isSm && (
              <Text style={styles.featuredText}>Featured</Text>
            )}
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
      </View>

      {/* Content */}
      <View style={[styles.content, { padding: isSm ? 7 : 12 }]}>
        <Text
          style={[styles.name, { color: colors.text, fontSize: isSm ? 11 : 13 }]}
          numberOfLines={isSm ? 1 : 2}
        >
          {product.name}
        </Text>

        <Text
          style={[styles.price, { color: colors.primary, fontSize: isSm ? 10 : 13 }]}
          numberOfLines={1}
        >
          {formatPrice(priceNum, currency)}
        </Text>

        {!isSm && company && (
          <Text style={[styles.company, { color: colors.textMuted }]} numberOfLines={1}>
            {company.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0A2540',
  },
  stockBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    gap: 3,
  },
  name: {
    fontWeight: '600',
    lineHeight: 17,
  },
  price: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  company: {
    fontSize: 10,
    marginTop: 1,
  },
});
