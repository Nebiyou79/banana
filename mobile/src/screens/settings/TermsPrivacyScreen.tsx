// src/screens/settings/TermsPrivacyScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

type TabType = 'terms' | 'privacy';

interface Section {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: string[];
}

export const TermsPrivacyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const termsSections: Section[] = [
    {
      title: 'The GetBananaLink Service',
      icon: 'scale-outline',
      content: [
        'We agree to provide you with the GetBananaLink Service. The Service includes all of the GetBananaLink products, features, applications, services, technologies, and software that we provide to advance GetBananaLink\'s mission: To connect professionals with opportunities in a professional and secure environment.',
      ],
    },
    {
      title: 'Your Commitments',
      icon: 'people-outline',
      content: [
        'Who Can Use GetBananaLink: We want our Service to be as open and inclusive as possible, but we also want it to be safe, secure, and in accordance with the law.',
        '• You must be at least 16 years old.',
        '• You must not be prohibited from receiving any aspect of our Service under applicable laws.',
        '• Your account must not have been previously disabled for violation of law or any of our policies.',
        '• You must provide accurate and complete information when creating your account.',
      ],
    },
    {
      title: 'Permissions You Give to Us',
      icon: 'key-outline',
      content: [
        'We do not claim ownership of your content, but you grant us a license to use it.',
        'Specifically, when you share, post, or upload content that is covered by intellectual property rights, you grant us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to host, use, distribute, modify, run, copy, publicly perform or display, translate, and create derivative works of your content.',
      ],
    },
    {
      title: 'Account Security',
      icon: 'shield-outline',
      content: [
        'You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers and symbols) with your account.',
      ],
    },
    {
      title: 'Content Removal and Account Termination',
      icon: 'trash-outline',
      content: [
        'We can remove any content or information you share on the Service if we believe that it violates these Terms of Service. We can refuse to provide or stop providing all or part of the Service to you immediately to protect our community or services, or if you create risk or legal exposure for us, violate these Terms of Service.',
      ],
    },
  ];

  const privacySections: Section[] = [
    {
      title: 'Information We Collect',
      icon: 'ellipse',
      content: [
        'We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:',
        '• Identity Data: first name, last name, username or similar identifier.',
        '• Contact Data: email address and telephone numbers.',
        '• Technical Data: IP address, browser type and version, time zone setting and location.',
        '• Profile Data: username and password, interests, preferences, feedback.',
        '• Usage Data: information about how you use our platform.',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: 'eye-outline',
      content: [
        'We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:',
        '• To register you as a new customer',
        '• To process and deliver your requests',
        '• To manage our relationship with you',
        '• To enable you to participate in surveys',
        '• To administer and protect our business and this platform',
        '• To deliver relevant platform content and advertisements to you',
      ],
    },
    {
      title: 'Data Security',
      icon: 'lock-closed-outline',
      content: [
        'We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.',
      ],
    },
    {
      title: 'Your Legal Rights',
      icon: 'document-text-outline',
      content: [
        'Under certain circumstances, you have rights under data protection laws in relation to your personal data including the right to:',
        '• Request access to your personal data',
        '• Request correction of your personal data',
        '• Request erasure of your personal data',
        '• Object to processing of your personal data',
        '• Request restriction of processing your personal data',
        '• Request transfer of your personal data',
        '• Right to withdraw consent',
      ],
    },
  ];

  const renderSection = (section: Section, index: number) => (
    <View key={index} style={[st.section, { borderBottomColor: colors.border }]}>
      <View style={st.sectionHeader}>
        <View style={[st.sectionIcon, { backgroundColor: `${colors.primary}12` }]}>
          <Ionicons name={section.icon} size={18} color={colors.primary} />
        </View>
        <Text style={[st.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      </View>
      {section.content.map((paragraph, pIndex) => (
        <Text
          key={pIndex}
          style={[st.sectionContent, { color: colors.textMuted }]}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const accent = colors.primary;

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher */}
      <View style={[st.tabBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[st.tab, activeTab === 'terms' && { borderBottomColor: accent }]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[st.tabText, { color: activeTab === 'terms' ? accent : colors.textMuted }]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tab, activeTab === 'privacy' && { borderBottomColor: accent }]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[st.tabText, { color: activeTab === 'privacy' ? accent : colors.textMuted }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={[st.content, { backgroundColor: colors.bgCard }]}>
          {/* Last Updated */}
          <View style={st.lastUpdated}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[st.lastUpdatedText, { color: colors.textMuted }]}>
              Last Updated: {currentDate}
            </Text>
          </View>

          {/* Introduction */}
          <Text style={[st.introText, { color: colors.textMuted }]}>
            {activeTab === 'terms'
              ? 'Welcome to GetBananaLink! These Terms of Service govern your use of our platform and provide information about the GetBananaLink service, outlined below. When you create a GetBananaLink account or use GetBananaLink, you agree to these terms.'
              : 'At GetBananaLink, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our platform and tell you about your privacy rights and how the law protects you.'}
          </Text>

          {/* Sections */}
          {(activeTab === 'terms' ? termsSections : privacySections).map((section, index) =>
            renderSection(section, index)
          )}

          {/* Contact Section */}
          <View style={[st.contactSection, { backgroundColor: `${accent}08`, borderColor: `${accent}20` }]}>
            <View style={[st.contactIconWrap, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="mail-outline" size={24} color={accent} />
            </View>
            <Text style={[st.contactTitle, { color: colors.text }]}>Contact Us</Text>
            <Text style={[st.contactText, { color: colors.textMuted }]}>
              If you have any questions about these terms, please contact us at:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:getbananalink@gmail.com')}>
              <Text style={[st.contactEmail, { color: accent }]}>getbananalink@gmail.com</Text>
            </TouchableOpacity>
            <Text style={[st.contactAddress, { color: colors.textMuted }]}>
              22 Meklit Building, 1st Floor, Addis Ababa, Ethiopia
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  lastUpdatedText: {
    fontSize: 12,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  contactSection: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  contactIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactAddress: {
    fontSize: 13,
    textAlign: 'center',
  },
});