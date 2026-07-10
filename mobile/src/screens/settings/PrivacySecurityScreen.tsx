// src/screens/settings/PrivacySecurityScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  RefreshControl, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

// ── Section Card ──────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode; colors: any; accent: string }> = ({ title, icon, children, colors, accent }) => (
  <View style={[sc.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {icon && <View style={[sc.iconWrap, { backgroundColor: `${accent}12` }]}><Ionicons name={icon} size={16} color={accent} /></View>}
      <Text style={[sc.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
    </View>
    {children}
  </View>
);

// ── Setting Row ───────────────────────────────────────────────────────────────
const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  colors: any;
}> = ({ icon, label, description, rightElement, onPress, danger, colors }) => (
  <TouchableOpacity
    style={[sc.settingRow, { borderBottomColor: colors.border }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={[sc.settingIcon, { backgroundColor: danger ? `${colors.danger}12` : `${colors.primary}12` }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[sc.settingLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
      {description && <Text style={[sc.settingDesc, { color: colors.textMuted }]}>{description}</Text>}
    </View>
    {rightElement && <View>{rightElement}</View>}
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export const PrivacySecurityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    biometricLogin: false,
    twoFactorAuth: false,
    showOnlineStatus: true,
    readReceipts: true,
    dataSaving: false,
    allowMarketingEmails: false,
    shareAnalytics: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleBiometricSetup = () => {
    Alert.alert(
      'Biometric Login',
      'Enable fingerprint or face recognition to quickly and securely access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: () => setSettings(prev => ({ ...prev, biometricLogin: true })) },
      ]
    );
  };

  const handle2FASetup = () => {
    navigation.navigate('TwoFactorSetup');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleSessions = () => {
    navigation.navigate('ActiveSessions');
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a copy of your data (profile, messages, activity) and email it to you within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Export', onPress: () => Alert.alert('Export Requested', 'You\'ll receive an email shortly.') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data, including profile, messages, and history will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Account Deletion', 'Contact support to complete account deletion.'),
        },
      ]
    );
  };

  const accent = colors.primary;

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        <SectionCard title="Security" icon="shield-checkmark-outline" colors={colors} accent={accent}>
          <SettingRow
            icon="finger-print-outline"
            label="Biometric Login"
            description="Use fingerprint or face recognition"
            rightElement={<Switch value={settings.biometricLogin} onValueChange={set => set ? handleBiometricSetup() : setSettings(prev => ({ ...prev, biometricLogin: false }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
          <SettingRow
            icon="key-outline"
            label="Two-Factor Authentication"
            description={settings.twoFactorAuth ? "2FA is enabled" : "Add an extra layer of security"}
            rightElement={
              settings.twoFactorAuth ? (
                <View style={[sc.enabledBadge, { backgroundColor: `${colors.success}15` }]}>
                  <Text style={[sc.enabledText, { color: colors.success }]}>Enabled</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handle2FASetup} style={[sc.setupBtn, { backgroundColor: `${accent}12` }]}>
                  <Text style={[sc.setupBtnText, { color: accent }]}>Set up</Text>
                </TouchableOpacity>
              )
            }
            colors={colors}
          />
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={handleChangePassword}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            colors={colors}
          />
          <SettingRow
            icon="dice-outline"
            label="Active Sessions"
            description="Manage devices where you're logged in"
            onPress={handleSessions}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            colors={colors}
          />
        </SectionCard>

        {/* Privacy Section */}
        <SectionCard title="Privacy" icon="eye-off-outline" colors={colors} accent={accent}>
          <SettingRow
            icon="person-outline"
            label="Profile Visibility"
            description="Who can see your profile information"
            rightElement={
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[sc.valueText, { color: colors.textSecondary }]}>Everyone</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            }
            colors={colors}
          />
          <SettingRow
            icon="chatbubbles-outline"
            label="Read Receipts"
            description="Show when you've read messages"
            rightElement={<Switch value={settings.readReceipts} onValueChange={val => setSettings(prev => ({ ...prev, readReceipts: val }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
          <SettingRow
            icon="radio-button-on-outline"
            label="Online Status"
            description="Show when you're active"
            rightElement={<Switch value={settings.showOnlineStatus} onValueChange={val => setSettings(prev => ({ ...prev, showOnlineStatus: val }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
          <SettingRow
            icon="download-outline"
            label="Blocked Users"
            description="Manage your blocked list"
            onPress={() => navigation.navigate('BlockedUsers')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            colors={colors}
          />
        </SectionCard>

        {/* Data & Storage */}
        <SectionCard title="Data & Storage" icon="cloud-outline" colors={colors} accent={accent}>
          <SettingRow
            icon="cellular-outline"
            label="Data Saving Mode"
            description="Reduce image and video quality"
            rightElement={<Switch value={settings.dataSaving} onValueChange={val => setSettings(prev => ({ ...prev, dataSaving: val }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
          <SettingRow
            icon="archive-outline"
            label="Storage Usage"
            description="Manage cached media and files"
            onPress={() => navigation.navigate('StorageManagement')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            colors={colors}
          />
          <SettingRow
            icon="document-text-outline"
            label="Export My Data"
            description="Download a copy of your information"
            onPress={handleDataExport}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            colors={colors}
          />
        </SectionCard>

        {/* Communication Preferences */}
        <SectionCard title="Preferences" icon="notifications-outline" colors={colors} accent={accent}>
          <SettingRow
            icon="mail-outline"
            label="Marketing Emails"
            description="Receive product updates and offers"
            rightElement={<Switch value={settings.allowMarketingEmails} onValueChange={val => setSettings(prev => ({ ...prev, allowMarketingEmails: val }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
          <SettingRow
            icon="stats-chart-outline"
            label="Anonymous Analytics"
            description="Help improve the app by sharing usage data"
            rightElement={<Switch value={settings.shareAnalytics} onValueChange={val => setSettings(prev => ({ ...prev, shareAnalytics: val }))} trackColor={{ false: colors.textDisabled, true: accent }} thumbColor="#fff" />}
            colors={colors}
          />
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title="Account" icon="warning-outline" colors={colors} accent={colors.danger}>
          <SettingRow
            icon="trash-outline"
            label="Delete Account"
            description="Permanently remove your account and all data"
            onPress={handleDeleteAccount}
            danger
            colors={colors}
          />
        </SectionCard>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  enabledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  enabledText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  setupBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg ?? 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});