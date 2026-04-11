import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { ProductImage } from '../../services/productService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProductImageGalleryProps {
  images: ProductImage[];
  style?: ViewStyle;
  height?: number;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  style,
  height = 280,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Sort images: primary first, then by order
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
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: colors.skeleton },
          style,
        ]}
      >
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <>
      <View style={[{ height }, style]}>
        <FlatList
          ref={listRef}
          data={sorted}
          keyExtractor={(item) => item.public_id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setFullscreen(true)}
            >
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
                    backgroundColor: i === activeIndex ? '#FBBF24' : 'rgba(255,255,255,0.5)',
                    width: i === activeIndex ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Image count */}
        {sorted.length > 1 && (
          <View style={styles.countBadge}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <View style={{ width: 3 }} />
          </View>
        )}
      </View>

      {/* Fullscreen modal */}
      <Modal visible={fullscreen} transparent animationType="fade">
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setFullscreen(false)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>

          <FlatList
            data={sorted}
            keyExtractor={(item) => item.public_id}
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
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
});
