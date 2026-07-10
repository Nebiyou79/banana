// src/components/notifications/InAppNotificationToast.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../store/useNotificationStore';
import { navigateFromNotification } from '../../utils/notificationNavigation';
import { markNotificationRead } from '../../services/notificationService'; // Changed: import direct service function

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_MARGIN = 16;

export const InAppNotificationToast: React.FC = () => {
  const { latestNotification, setLatestNotification } = useNotificationStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!latestNotification) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [latestNotification]);

  if (!latestNotification) return null;

  const handlePress = async () => {
    // Call service directly instead of using hook
    try {
      await markNotificationRead(latestNotification._id);
    } catch (error) {
      console.warn('Failed to mark notification read:', error);
    }
    navigateFromNotification(latestNotification.data);
    setLatestNotification(null);
  };

  const handleDismiss = () => setLatestNotification(null);

  const topOffset = insets.top + (Platform.OS === 'android' ? 8 : 4);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          top: topOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        <View style={styles.textWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {latestNotification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {latestNotification.body}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#6B7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: TOAST_MARGIN,
    right: TOAST_MARGIN,
    zIndex: 9999,
    elevation: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 14,
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
});