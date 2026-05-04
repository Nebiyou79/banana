// LoadingSpinner.tsx
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, Animated } from 'react-native';
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
  const { colors, radius } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const content = (
    <Animated.View style={[styles.container, fullScreen && styles.fullScreen, { opacity: fadeAnim }]}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </Animated.View>
  );

  if (overlay) {
    return (
      <Modal transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.overlayCard, { backgroundColor: colors.bgCard, borderRadius: radius.lg }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, backgroundColor: 'transparent' },
  message: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayCard: { padding: 32, alignItems: 'center', minWidth: 140 },
});