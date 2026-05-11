// src/screens/auth/_AuthShell.tsx
// Shared shell for ALL auth screens — dark navy bg, safe area, keyboard avoid, scroll

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface AuthShellProps {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  scrollable?: boolean;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  showBack = true,
  onBack,
  scrollable = true,
}) => {
  const { colors: c, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleBack = onBack ?? (() => navigation.goBack());

  const content = (
    <View style={[styles.inner, { paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1 },
  inner:   { flex: 1, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});

export default AuthShell;