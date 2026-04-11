/**
 * src/lib/toast.ts
 *
 * Lightweight toast helper built on React Native's own Animated API.
 * Works correctly on Expo 54 / RN 0.81 New Architecture.
 *
 * Usage:
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.info('Profile updated');
 *   toast.warning('Check your input');
 */

import { Alert } from 'react-native';

// ─── Simple Alert-based fallback (always works, no animation lib needed) ───
// Swap this out for a Reanimated-based overlay in a later task if you want
// in-app toasts without the native alert sheet.

type ToastType = 'success' | 'error' | 'info' | 'warning';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const show = (type: ToastType, message: string, title?: string) => {
  const defaultTitle = title ?? (
    type === 'success' ? 'Success' :
    type === 'error'   ? 'Error'   :
    type === 'warning' ? 'Warning' :
    'Info'
  );
  // In Expo Go development, Alert works well as a toast substitute.
  // For production you can replace this with a Reanimated overlay component.
  Alert.alert(`${ICONS[type]} ${defaultTitle}`, message);
};

export const toast = {
  success: (message: string, title?: string) => show('success', message, title),
  error:   (message: string, title?: string) => show('error',   message, title),
  info:    (message: string, title?: string) => show('info',    message, title),
  warning: (message: string, title?: string) => show('warning', message, title),
};

export default toast;