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
type IoniconName = ComponentProps<typeof Ionicons>['name']

interface Props {
  onPress: () => void;
  icon?: IoniconName;
  bottom?: number;
  right?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * Circular FAB that slides up on mount and scales on press.
 * Lives above bottom tabs (default `bottom: 88`).
 */
const CreatePostFAB: React.FC<Props> = memo(
  ({
    onPress,
    icon = 'add',
    bottom = 88,
    right = 20,
    style,
    accessibilityLabel = 'Create post',
  }) => {
    const theme = useSocialTheme();
    const { translateY, opacity } = useSlideUp(40, 200);
    const { scale, onPressIn, onPressOut } = usePressScale(0.92);

    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          { bottom, right, opacity, transform: [{ translateY }, { scale }] },
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
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
        >
          <Ionicons name={icon as any} size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

CreatePostFAB.displayName = 'CreatePostFAB';

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default CreatePostFAB;