// src/social/components/feed/CreatePostFAB.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { usePressScale, useSlideUp } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  onPress: () => void;
  icon?: IoniconName;
  bottom?: number;
  right?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const CreatePostFAB: React.FC<Props> = memo(({
  onPress,
  icon = 'add',
  bottom = 88,
  right = 20,
  style,
  accessibilityLabel = 'Create post',
}) => {
  const theme = useSocialTheme();
  const { colors, dark } = theme;
  const { translateY, opacity } = useSlideUp(40, 200);
  const { scale, onPressIn, onPressOut } = usePressScale(0.92);

  // Dark mode: vibrant shadow with glow
  // Light mode: subtle shadow
  const shadowConfig = dark ? {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { 
          bottom, 
          right, 
          opacity, 
          transform: [{ translateY }, { scale }] 
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            ...shadowConfig,
          },
        ]}
      >
        <Ionicons name={icon as any} size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

CreatePostFAB.displayName = 'CreatePostFAB';

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 100 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreatePostFAB;