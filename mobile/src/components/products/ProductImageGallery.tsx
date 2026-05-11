// src/components/products/ProductImageGallery.tsx
// CRITICAL FIX: was using useThemeStore() directly — migrated to useTheme() only.

import React, { useRef, useState } from 'react';
import {
  View, FlatList, Image, Dimensions, StyleSheet,
  ViewStyle, TouchableOpacity, Modal, Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ProductImage } from '../../services/productService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProductImageGalleryProps {
  images: ProductImage[];
  style?: ViewStyle;
  height?: number;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images, style, height = 280,
}) => {
  // FIXED: was useThemeStore() — now useTheme() only
  const { colors: c, radius } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const onScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  if (!sorted.length) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: c.skeleton }, style]}>
        <Ionicons name="camera-outline" size={48} color={c.textMuted} />
      </View>
    );
  }

  return (
    <>
      <View style={[{ height }, style]}>
        <FlatList
          ref={listRef}
          data={sorted}
          keyExtractor={item => item.public_id ?? String(item.order ?? 0)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.95} onPress={() => setFullscreen(true)}>
              <Image
                source={{ uri: item.secure_url }}
                style={{ width: SCREEN_WIDTH, height }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />

        {/* Pagination dots */}
        {sorted.length > 1 && (
          <View style={styles.dotsRow}>
            {sorted.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === activeIndex ? c.primary : 'rgba(255,255,255,0.5)',
                    width: i === activeIndex ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Image count badge */}
        {sorted.length > 1 && (
          <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full }]}>
            <Ionicons name="images-outline" size={11} color={c.textInverse} />
            <Text style={{ fontSize: 10, color: c.textInverse, fontWeight: '700', marginLeft: 3 }}>
              {activeIndex + 1}/{sorted.length}
            </Text>
          </View>
        )}
      </View>

      {/* Fullscreen modal */}
      <Modal visible={fullscreen} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setFullscreen(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={36} color={c.textInverse} />
          </TouchableOpacity>

          <FlatList
            data={sorted}
            keyExtractor={item => item.public_id ?? String(item.order ?? 0)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={activeIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.secure_url }}
                style={{ width: SCREEN_WIDTH, height: '100%' }}
                resizeMode="contain"
              />
            )}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  dotsRow: {
    position: 'absolute', bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row', gap: 5, alignItems: 'center',
  },
  dot:        { height: 6, borderRadius: 3 },
  countBadge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  modal:    { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
});

export default ProductImageGallery;