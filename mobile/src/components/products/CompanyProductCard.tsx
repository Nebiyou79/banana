import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Product } from '../../services/productService';
import {
  formatPrice,
  getPrimaryImage,
  getProductStatusConfig,
} from '../../utils/productHelpers';

interface CompanyProductCardProps {
  product: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMarkOutOfStock?: () => void;
}

export const CompanyProductCard: React.FC<CompanyProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  onMarkOutOfStock,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  const [imgError, setImgError] = useState(false);

  const primaryImage = getPrimaryImage(product.images);
  const statusConfig = getProductStatusConfig(product.status);
  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';

  const showActionSheet = () => {
    const isActive = product.status === 'active';
    const isOutOfStock = product.status === 'out_of_stock';

    const options = [
      'Edit',
      isActive ? 'Mark as Draft' : 'Mark as Active',
      isOutOfStock ? 'Mark as Active' : 'Mark as Out of Stock',
      'Delete',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 3,
          cancelButtonIndex: 4,
          title: product.name,
        },
        (idx) => handleAction(idx)
      );
    } else {
      Alert.alert(product.name, 'Choose an action', [
        { text: 'Edit', onPress: onEdit },
        { text: isActive ? 'Mark as Draft' : 'Mark as Active', onPress: onToggleStatus },
        {
          text: isOutOfStock ? 'Mark as Active' : 'Mark as Out of Stock',
          onPress: isOutOfStock ? onToggleStatus : onMarkOutOfStock,
        },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleAction = (index: number) => {
    switch (index) {
      case 0: return onEdit();
      case 1: return onToggleStatus();
      case 2: return product.status === 'out_of_stock' ? onToggleStatus() : onMarkOutOfStock?.();
      case 3: return onDelete();
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          ...shadows.sm,
        },
      ]}
    >
      {/* Product image */}
      <View style={[styles.imageWrap, { borderRadius: borderRadius.md, backgroundColor: colors.skeleton }]}>
        {primaryImage && !imgError ? (
          <Image
            source={{ uri: primaryImage.secure_url }}
            style={styles.image}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={26} color={colors.textMuted} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>

        <Text style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
          {product.category}
          {product.subcategory ? ` › ${product.subcategory}` : ''}
        </Text>

        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(priceNum, currency)}
        </Text>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.background }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Menu button */}
      <TouchableOpacity
        onPress={showActionSheet}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.menuBtn, { backgroundColor: colors.borderLight }]}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  imageWrap: {
    width: 60,
    height: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  category: {
    fontSize: 11,
    marginTop: 1,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
