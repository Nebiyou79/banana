// src/components/ui/LoadingSpinner.tsx
// Usage: <LoadingSpinner /> | <LoadingSpinner message="Saving…" overlay />

import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  fullScreen = false,
  overlay = false,
}) => {
  const { colors: c, radius, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  if (overlay) {
    return (
      <Modal transparent animationType="fade">
        <View style={[styles.overlayBg, { backgroundColor: c.overlay }]}>
          <View style={[styles.overlayCard, { backgroundColor: c.bgCard, borderRadius: radius.lg }]}>
            <ActivityIndicator size="large" color={c.primary} />
            {message && (
              <Text style={[type.bodySm, { color: c.textSecondary, marginTop: 12 }]}>
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { opacity: fadeAnim },
      ]}
    >
      <ActivityIndicator size={size} color={c.primary} />
      {message && (
        <Text style={[type.bodySm, { color: c.textSecondary, marginTop: 12 }]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
  overlayBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    padding: 32,
    alignItems: 'center',
    minWidth: 140,
  },
});

export default LoadingSpinner;