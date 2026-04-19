import React, { memo } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { usePressScale } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  isFollowing: boolean;
  onPress: () => void;
  loading?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

/**
 * Follow / Following toggle. Filled when not following, outlined once followed.
 * Scales down slightly on press for tactile feedback.
 */
const FollowButton: React.FC<Props> = memo(
  ({ isFollowing, onPress, loading, size = 'md', disabled }) => {
    const theme = useSocialTheme();
    const { scale, onPressIn, onPressOut } = usePressScale(0.94);
    const sm = size === 'sm';

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={loading || disabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: isFollowing, disabled: loading }}
          accessibilityLabel={isFollowing ? 'Following' : 'Follow'}
          style={[
            styles.btn,
            {
              backgroundColor: isFollowing ? 'transparent' : theme.primary,
              borderColor: theme.primary,
              paddingHorizontal: sm ? 12 : 18,
              paddingVertical: sm ? 6 : 9,
              minWidth: sm ? 76 : 92,
              minHeight: 44,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? theme.primary : '#fff'}
            />
          ) : (
            <Text
              style={[
                styles.text,
                {
                  color: isFollowing ? theme.primary : '#fff',
                  fontSize: sm ? 12 : 13,
                },
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

FollowButton.displayName = 'FollowButton';

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '700' },
});

export default FollowButton;