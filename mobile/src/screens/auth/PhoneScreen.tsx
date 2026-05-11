// src/screens/auth/PhoneScreen.tsx
// MIGRATED: useTheme() only, AuthShell, AppHeader, spacing/radius tokens, Ionicons only

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { AppHeader } from '../../components/ui/AppHeader';

interface ComingSoonProps {
  title:       string;
  description: string;
  icon:        keyof typeof Ionicons.glyphMap;
}

const ComingSoonLayout: React.FC<ComingSoonProps> = ({ title, description, icon }) => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <AppHeader title="Coming Soon" showBack onBack={() => navigation.goBack()} />

      <View style={[S.content, { paddingHorizontal: spacing.xl }]}>
        {/* Icon circle */}
        <View style={[S.iconCircle, { backgroundColor: c.primary, borderRadius: radius.full, ...shadows.lg }]}>
          <Ionicons name={icon} size={48} color={c.bg} />
        </View>

        {/* Badge */}
        <View style={[S.badge, { backgroundColor: c.warningBg, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
          <Text style={[type.caption, { color: c.warning, fontWeight: '700' }]}>Coming Soon</Text>
        </View>

        <Text style={[type.h2, { color: c.text, textAlign: 'center', fontWeight: '800' }]}>
          {title}
        </Text>
        <Text style={[type.body, { color: c.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl }]}>
          {description}
        </Text>
      </View>

      {/* Use email instead */}
      <Pressable
        onPress={() => navigation.navigate('Login')}
        style={({ pressed }) => [
          S.altBtn,
          {
            borderColor:      c.primary,
            borderRadius:     radius.lg,
            marginHorizontal: spacing.lg,
            marginBottom:     insets.bottom + spacing.xl,
            opacity:          pressed ? 0.8 : 1,
          },
        ]}
        accessibilityLabel="Use email instead"
        accessibilityRole="button"
      >
        <Ionicons name="mail-outline" size={18} color={c.primary} />
        <Text style={[type.body, { color: c.primary, fontWeight: '600' }]}>Use email instead</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export const PhoneRegisterScreen: React.FC = () => (
  <ComingSoonLayout
    title="Phone Registration"
    description="Sign up with your phone number. This feature is coming soon — use email to get started today."
    icon="phone-portrait-outline"
  />
);

export const PhoneOtpScreen: React.FC = () => (
  <ComingSoonLayout
    title="Phone Verification"
    description="Verify your phone number via SMS OTP. This feature will be available soon."
    icon="chatbubble-outline"
  />
);

const S = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    gap:             16,
  },
  iconCircle: {
    width:          96,
    height:         96,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  badge: {},
  altBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    borderWidth:    1.5,
    paddingVertical: 15,
  },
});

export default PhoneRegisterScreen;