import React, { memo } from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import { getInitials } from '../../utils/format';

interface Props {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
}

/**
 * Avatar with graceful fallback to the first initial of the name tinted with
 * the current role's primary colour.
 */
const Avatar: React.FC<Props> = memo(
  ({ uri, name, size = 44, borderColor, borderWidth = 0, style }) => {
    const theme = useSocialTheme();
    const radius = size / 2;

    const base: ImageStyle = {
      width: size,
      height: size,
      borderRadius: radius,
      borderWidth,
      borderColor: borderColor ?? theme.border,
      overflow: 'hidden',
    };

    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={[base]}
          resizeMode="cover"
          accessibilityLabel={name ? `${name}'s avatar` : 'avatar'}
        />
      );
    }

    return (
      <View
        style={[
          base,
          styles.fallback,
          { backgroundColor: theme.primaryLighter },
          style,
        ]}
      >
        <Text
          style={[
            styles.initial,
            { color: theme.primary, fontSize: size * 0.38 },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700' },
});

export default Avatar;