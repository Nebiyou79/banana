import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';

interface ComingSoonScreenProps {
  title: string;
  description: string;
  icon: string;
}

const ComingSoonLayout: React.FC<ComingSoonScreenProps> = ({ title, description, icon }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Gradient icon circle */}
        <LinearGradient
          colors={['#FBBF24', '#F97316']}
          style={[styles.iconCircle, { borderRadius: 48 }]}
        >
          <Ionicons name={icon as any} size={52} color="#fff" />
        </LinearGradient>

        {/* Coming soon badge */}
        <View style={[styles.badge, { backgroundColor: colors.banana, borderRadius: borderRadius.full }]}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontSize: typography['2xl'] }]}>
          {title}
        </Text>
        <Text style={[styles.desc, { color: colors.textMuted, fontSize: typography.base }]}>
          {description}
        </Text>
      </View>

      {/* Use email instead */}
      <TouchableOpacity
        style={[styles.altBtn, { borderColor: colors.border, borderRadius: borderRadius.xl }]}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="mail-outline" size={18} color={colors.primary} />
        <Text style={[styles.altText, { color: colors.primary, fontSize: typography.base }]}>
          Use email instead
        </Text>
      </TouchableOpacity>
    </View>
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
  container: { flex: 1, padding: 24 },
  backBtn:   { marginBottom: 12 },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  iconCircle: {
    width: 96, height: 96,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  badge: { paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#1C1917' },
  title: { fontWeight: '800', textAlign: 'center' },
  desc: {
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: 24, color: '#64748B',
  },
  altBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, paddingVertical: 14,
    marginBottom: 32,
  },
  altText: { fontWeight: '600' },
});