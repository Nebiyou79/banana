// src/screens/settings/HelpFAQScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StatusBar, StyleSheet, Linking, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

// FAQ Data
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'account' | 'security' | 'billing' | 'jobs' | 'messaging';
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'account',
    question: 'How do I create a company profile?',
    answer: 'Go to Profile → Edit Profile → Fill in your company details (name, industry, size, description) → Save changes. You can also upload a logo and cover image.',
  },
  {
    id: '2',
    category: 'account',
    question: 'Can I have multiple roles?',
    answer: 'Yes! You can switch between being a freelancer, company, or candidate from your profile settings.',
  },
  {
    id: '3',
    category: 'security',
    question: 'How do I reset my password?',
    answer: 'Tap "Forgot Password" on the login screen → Enter your email → Follow the link sent to your inbox to create a new password.',
  },
  {
    id: '4',
    category: 'security',
    question: 'Is my data secure?',
    answer: 'We use industry-standard encryption (AES-256) for data at rest and TLS for data in transit. We never share your personal information without consent.',
  },
  {
    id: '5',
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for enterprise plans.',
  },
  {
    id: '6',
    category: 'billing',
    question: 'Can I downgrade my plan?',
    answer: 'Yes, you can change your subscription plan anytime from Settings → Subscription. Changes apply to the next billing cycle.',
  },
  {
    id: '7',
    category: 'jobs',
    question: 'How do I post a job?',
    answer: 'Tap the + button → "Post Job" → Fill in job details (title, description, requirements) → Set budget → Publish.',
  },
  {
    id: '8',
    category: 'jobs',
    question: 'How are candidates matched?',
    answer: 'Our AI matches candidates based on skills, experience, location, and job requirements. You\'ll see the best matches on your job dashboard.',
  },
  {
    id: '9',
    category: 'messaging',
    question: 'Can I send attachments?',
    answer: 'Yes! You can send images, PDFs, and documents up to 25MB in chat.',
  },
  {
    id: '10',
    category: 'messaging',
    question: 'How do I report a user?',
    answer: 'Go to their profile → Tap three dots (⋯) → "Report User" → Select a reason → Submit. Our team will review within 24 hours.',
  },
];

// Category Icons
const CATEGORY_ICONS: Record<FAQItem['category'], string> = {
  account: 'person-outline',
  security: 'shield-outline',
  billing: 'card-outline',
  jobs: 'briefcase-outline',
  messaging: 'chatbubble-outline',
};

// ── FAQ Accordion Item ────────────────────────────────────────────────────────
const FAQAccordion: React.FC<{ item: FAQItem; colors: any }> = ({ item, colors }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[faStyles.container, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={faStyles.questionRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[faStyles.qIcon, { backgroundColor: `${colors.primary}12` }]}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[faStyles.question, { color: colors.text }]}>{item.question}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={faStyles.answerContainer}>
          <View style={[faStyles.answerLine, { backgroundColor: colors.primary }]} />
          <Text style={[faStyles.answer, { color: colors.textMuted }]}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

const faStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  qIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  answerContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
    paddingLeft: 46,
  },
  answerLine: {
    width: 2,
    borderRadius: 1,
  },
  answer: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export const HelpFAQScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredFAQs = FAQ_DATA.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: Array<{ id: FAQItem['category'] | 'all'; label: string; icon: string }> = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
    { id: 'security', label: 'Security', icon: 'shield-outline' },
    { id: 'billing', label: 'Billing', icon: 'card-outline' },
    { id: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    { id: 'messaging', label: 'Chat', icon: 'chatbubble-outline' },
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@example.com?subject=Support%20Request');
  };

  const handleOpenTerms = () => {
    navigation.navigate('WebView', { url: 'https://example.com/terms', title: 'Terms of Service' });
  };

  const handleOpenPrivacy = () => {
    navigation.navigate('WebView', { url: 'https://example.com/privacy', title: 'Privacy Policy' });
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
        <Text style={[st.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[st.searchContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[st.searchInput, { color: colors.text }]}
            placeholder="Search for answers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                st.categoryChip,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
                selectedCategory === cat.id && { backgroundColor: `${accent}15`, borderColor: accent },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={16} color={selectedCategory === cat.id ? accent : colors.textMuted} />
              <Text style={[st.categoryText, { color: selectedCategory === cat.id ? accent : colors.textMuted }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={st.faqSection}>
          <View style={st.sectionHeader}>
            <Text style={[st.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
            <Text style={[st.sectionCount, { color: colors.textMuted }]}>{filteredFAQs.length} articles</Text>
          </View>

          {filteredFAQs.length === 0 ? (
            <View style={[st.emptyContainer, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[st.emptyTitle, { color: colors.text }]}>No results found</Text>
              <Text style={[st.emptyText, { color: colors.textMuted }]}>Try a different search term or browse by category</Text>
            </View>
          ) : (
            filteredFAQs.map(faq => (
              <FAQAccordion key={faq.id} item={faq} colors={colors} />
            ))
          )}
        </View>

        {/* Contact Support Card */}
        <View style={[st.contactCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[st.contactIconWrap, { backgroundColor: `${accent}12` }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={accent} />
          </View>
          <Text style={[st.contactTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[st.contactText, { color: colors.textMuted }]}>Our support team is here to help you</Text>
          <TouchableOpacity
            style={[st.contactBtn, { backgroundColor: accent }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={st.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Links */}
        <View style={st.legalContainer}>
          <TouchableOpacity onPress={handleOpenTerms} style={st.legalLink}>
            <Text style={[st.legalText, { color: colors.textMuted }]}>Terms of Service</Text>
          </TouchableOpacity>
          <View style={[st.legalDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={handleOpenPrivacy} style={st.legalLink}>
            <Text style={[st.legalText, { color: colors.textMuted }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  faqSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.base ?? 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  contactCard: {
    margin: 16,
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  legalLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 13,
  },
  legalDivider: {
    width: 1,
    height: 14,
  },
});