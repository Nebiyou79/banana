// src/screens/settings/SettingsScreen.tsx
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  StyleSheet, Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const accountSection: MenuItem[] = [
    { icon: 'person-circle-outline', label: 'Personal Information', color: colors.primary, onPress: () => navigation.navigate('EditProfile') },
    { icon: 'notifications-outline', label: 'Notifications', color: colors.primary, rightElement: <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.textDisabled, true: colors.primary }} thumbColor="#fff" />, onPress: () => {} },
  ];

  const privacySection: MenuItem[] = [
    { icon: 'lock-closed-outline', label: 'Privacy and Security', color: colors.primary, onPress: () => navigation.navigate('PrivacySecurity') },
  ];

  const supportSection: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help and FAQ', color: colors.textMuted, onPress: () => navigation.navigate('HelpFAQ') },
    { icon: 'mail-outline', label: 'Contact Us', color: colors.textMuted, onPress: () => Linking.openURL('mailto:support@example.com') },
    { icon: 'document-text-outline', label: 'Terms and Privacy', color: colors.textMuted, onPress: () => navigation.navigate('WebView', { url: 'https://example.com/terms', title: 'Terms & Privacy' }) },
  ];

  const MenuItemRow: React.FC<{ item: MenuItem }> = ({ item }) => (
    <TouchableOpacity
      style={[st.menuRow, { borderBottomColor: colors.border }]}
      onPress={item.onPress}
      activeOpacity={0.7}
      disabled={!item.onPress}
    >
      <View style={[st.menuIcon, { backgroundColor: `${item.color}12` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={[st.menuLabel, { color: colors.text }]}>{item.label}</Text>
      {item.rightElement ? (
        item.rightElement
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const SectionCard: React.FC<{ title: string; items: MenuItem[] }> = ({ title, items }) => (
    <View style={[st.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[st.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      {items.map((item, index) => (
        <MenuItemRow key={item.label} item={item} />
      ))}
    </View>
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[st.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary */}
        <TouchableOpacity
          style={[st.profileCard, { backgroundColor: colors.bgCard }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={[st.avatarPlaceholder, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[st.userEmail, { color: colors.textMuted }]}>{user?.email || 'user@example.com'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Account Section */}
        <SectionCard title="Account" items={accountSection} />

        {/* Privacy Section */}
        <SectionCard title="Privacy & Security" items={privacySection} />

        {/* Support Section */}
        <SectionCard title="Support" items={supportSection} />

        {/* App Info */}
        <View style={[st.appInfo, { borderTopColor: colors.border }]}>
          <Text style={[st.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={st.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[st.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl ?? 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  appVersion: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});