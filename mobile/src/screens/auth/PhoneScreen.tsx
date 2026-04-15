// src/screens/auth/PhoneScreen.tsx
// Shows a "coming soon" placeholder for phone-based auth.

import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons }      from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }       from '../../hooks/useTheme';

interface ComingSoonProps {
  title:       string;
  description: string;
  icon:        React.ComponentProps<typeof Ionicons>['name'];
}

const ComingSoonLayout: React.FC<ComingSoonProps> = ({ title, description, icon }) => {
  const { colors, type, spacing, radius, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Back */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { paddingHorizontal: spacing.screen }]}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back-outline" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        {/* Icon circle */}
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          style={[styles.iconCircle, { borderRadius: 48 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={48} color="#fff" />
        </LinearGradient>

        {/* Badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.warningBg,
              borderRadius:    radius.full,
              paddingHorizontal: 14,
              paddingVertical:   5,
            },
          ]}
        >
          <Text style={[type.label, { color: colors.warning }]}>
            Coming Soon
          </Text>
        </View>

        <Text style={[type.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
          {title}
        </Text>
        <Text
          style={[
            type.body,
            {
              color:           colors.textMuted,
              textAlign:       'center',
              lineHeight:      22,
              paddingHorizontal: spacing['2xl'],
            },
          ]}
        >
          {description}
        </Text>
      </View>

      {/* Use email instead */}
      <Pressable
        onPress={() => navigation.navigate('Login')}
        style={({ pressed }) => [
          styles.altBtn,
          {
            borderColor:     colors.accent,
            borderRadius:    radius.xl,
            marginHorizontal: spacing.screen,
            marginBottom:    spacing['2xl'],
            opacity:         pressed ? 0.8 : 1,
          },
        ]}
        accessibilityLabel="Use email instead"
      >
        <Ionicons name="mail-outline" size={18} color={colors.accent} />
        <Text style={[type.body, { color: colors.accent, fontWeight: '600' }]}>
          Use email instead
        </Text>
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

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  backBtn: { paddingTop: 12, marginBottom: 8 },
  content: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    gap:             16,
    paddingHorizontal: 24,
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
