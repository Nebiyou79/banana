/**
 * src/screens/company/ProfileScreen.tsx
 *
 * Displays all Company model fields + Profile avatar/cover
 * Data sources:
 *   - useCompanyProfile() → companyService.getMyCompany() → Company model
 *   - useProfile() → profileService.getProfile() → Profile model (avatar, cover)
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Linking, Image, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useProfile, useCompanyProfile } from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard, CompletionBar, BadgePill } from '../../components/shared/ProfileAtoms';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatSize = (s?: string) => ({ '1-10': '1–10', '11-50': '11–50', '51-200': '51–200', '201-500': '201–500', '501-1000': '501–1000', '1000+': '1000+' } as any)[s ?? ''] ?? s ?? '';
const formatType = (t?: string) => ({ startup: 'Startup', sme: 'SME', enterprise: 'Enterprise', agency: 'Agency', other: 'Other' } as any)[t ?? ''] ?? t ?? '';

// ── Section Card ──────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode; colors: any; accent: string }> = ({ title, icon, children, colors, accent }) => (
  <View style={[sc.card, { backgroundColor: colors.bgCard }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {icon && <View style={[sc.iconWrap, { backgroundColor: `${accent}12` }]}><Ionicons name={icon} size={14} color={accent} /></View>}
      <Text style={[sc.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
    </View>
    {children}
  </View>
);
const sc = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
});

// ── Empty State ───────────────────────────────────────────────────────────────
const Empty: React.FC<{ msg: string; colors: any }> = ({ msg, colors }) => (
  <Text style={{ fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 4, color: colors.textMuted }}>{msg}</Text>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export const CompanyProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: company, isLoading: cLoading, refetch: rC } = useCompanyProfile();
  const isLoading = pLoading || cLoading;

  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([rP(), rC()]); setRefreshing(false); }, [rP, rC]);

  if (isLoading) {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></ScrollView>
      </SafeAreaView>
    );
  }

  const accent = colors.primary;
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const isVerified = profile?.verificationStatus === 'verified' || company?.verified;
  const sl = (company as any)?.socialLinks ?? {};
  const settings = (company as any)?.settings ?? {};
  const stats = (company as any)?.socialStats ?? {};

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <Text style={[st.headerTitle, { color: colors.text }]} numberOfLines={1}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={[st.editChip, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={13} color={accent} />
          <Text style={[st.editChipText, { color: accent }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={[st.coverWrap, { backgroundColor: colors.bgCard }]}>
          {coverUrl ? <Image source={{ uri: coverUrl }} style={st.coverImg} resizeMode="cover" /> : <View style={[st.coverPlaceholder, { backgroundColor: `${accent}10` }]}><Ionicons name="business-outline" size={40} color={`${accent}30`} /></View>}
        </View>

        {/* Identity Card */}
        <View style={[st.identity, { backgroundColor: colors.bgCard }]}>
          <View style={{ alignItems: 'center', marginTop: -50, paddingBottom: 8 }}>
            <ProfileImageUploader currentAvatarUrl={avatarUrl} currentCoverUrl={coverUrl} accentColor={accent} type="avatar" avatarShape="square" verifiedFull={isVerified} />
          </View>
          <View style={{ paddingHorizontal: 16, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[st.name, { color: colors.text }]} numberOfLines={2}>{company?.name ?? 'Your Company'}</Text>
              {isVerified && <View style={[st.verifiedBadge, { backgroundColor: colors.success }]}><Ionicons name="checkmark-circle" size={14} color="#fff" /><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Verified</Text></View>}
            </View>
            {company?.headline ? <Text style={[st.headline, { color: accent }]}>{company.headline}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              {company?.industry && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="briefcase-outline" size={12} color={colors.textMuted} /><Text style={{ fontSize: 12, color: colors.textMuted }}>{company.industry}</Text></View>}
              {company?.address && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="location-outline" size={12} color={colors.textMuted} /><Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>{company.address}</Text></View>}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {company?.companySize && <BadgePill label={`${formatSize(company.companySize)} employees`} color={`${accent}15`} textColor={accent} />}
              {company?.companyType && <BadgePill label={formatType(company.companyType)} color={`${accent}15`} textColor={accent} />}
              {company?.foundedYear && <BadgePill label={`Est. ${company.foundedYear}`} color={`${colors.warning}15`} textColor={colors.warning} />}
              {company?.tin && <BadgePill label={`TIN: ${company.tin}`} color={colors.bgCard} textColor={colors.textMuted} />}
            </View>
          </View>
          {/* Stats */}
          <View style={[st.statsRow, { borderTopColor: colors.border }]}>
            {[['Jobs', stats?.postCount ?? 0, 'briefcase-outline'], ['Products', stats?.followerCount ?? 0, 'cube-outline'], ['Followers', stats?.followerCount ?? 0, 'people-outline']].map(([label, val, icon], i, arr) => (
              <React.Fragment key={label as string}>
                <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Ionicons name={icon as any} size={16} color={accent} />
                  <Text style={[st.statVal, { color: colors.text }]}>{val as number}</Text>
                  <Text style={[st.statLabel, { color: colors.textMuted }]}>{label as string}</Text>
                </View>
                {i < arr.length - 1 && <View style={{ width: 1, height: 36, backgroundColor: colors.border, alignSelf: 'center' }} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Completion */}
        {completion < 100 && (
          <View style={[st.completionCard, { backgroundColor: colors.bgCard, marginHorizontal: 16, marginTop: 12 }]}>
            <CompletionBar percentage={completion} label="Profile Completion" accentColor={accent} />
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={[st.completeBtn, { backgroundColor: accent }]}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Complete profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ padding: 16, paddingTop: 12 }}>
          {/* About */}
          {company?.description ? <SectionCard title="About" icon="information-circle-outline" colors={colors} accent={accent}><Text style={[st.body, { color: colors.textMuted }]}>{company.description}</Text></SectionCard> : null}
          {/* Mission */}
          {company?.mission ? <SectionCard title="Mission" icon="flag-outline" colors={colors} accent={accent}><Text style={[st.quote, { color: colors.textMuted }]}>"{company.mission}"</Text></SectionCard> : null}
          {/* Culture */}
          {company?.culture ? <SectionCard title="Culture" icon="heart-outline" colors={colors} accent={accent}><Text style={[st.body, { color: colors.textMuted }]}>{company.culture}</Text></SectionCard> : null}

          {/* Contact */}
          <SectionCard title="Contact" icon="call-outline" colors={colors} accent={accent}>
            {company?.email ? <TouchableOpacity onPress={() => Linking.openURL(`mailto:${company.email}`)} style={st.contactRow}><View style={[st.contactIcon, { backgroundColor: `${accent}15` }]}><Ionicons name="mail-outline" size={16} color={accent} /></View><Text style={[st.contactText, { color: accent }]} numberOfLines={1}>{company.email}</Text><Ionicons name="open-outline" size={14} color={colors.textMuted} /></TouchableOpacity> : null}
            {company?.phone ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${company.phone}`)} style={st.contactRow}><View style={[st.contactIcon, { backgroundColor: `${colors.success}15` }]}><Ionicons name="call-outline" size={16} color={colors.success} /></View><Text style={[st.contactText, { color: colors.text }]}>{company.phone}</Text></TouchableOpacity> : null}
            {company?.website ? <TouchableOpacity onPress={() => Linking.openURL(company.website!)} style={st.contactRow}><View style={[st.contactIcon, { backgroundColor: `${colors.warning}15` }]}><Ionicons name="globe-outline" size={16} color={colors.warning} /></View><Text style={[st.contactText, { color: accent }]} numberOfLines={1}>{company.website}</Text><Ionicons name="open-outline" size={14} color={colors.textMuted} /></TouchableOpacity> : null}
            {company?.address ? <View style={st.contactRow}><View style={[st.contactIcon, { backgroundColor: `${colors.danger}15` }]}><Ionicons name="location-outline" size={16} color={colors.danger} /></View><Text style={[st.contactText, { color: colors.text }]} numberOfLines={2}>{company.address}</Text></View> : null}
            {!company?.email && !company?.phone && !company?.website && !company?.address && <Empty msg="No contact info yet — tap Edit to add some." colors={colors} />}
          </SectionCard>

          {/* Social Links */}
          {(sl.linkedin || sl.twitter || sl.facebook || sl.instagram) ? (
            <SectionCard title="Social Links" icon="share-social-outline" colors={colors} accent={accent}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {sl.linkedin && <TouchableOpacity onPress={() => Linking.openURL(sl.linkedin)} style={{ alignItems: 'center', gap: 6 }}><View style={[st.socialIcon, { backgroundColor: '#0077B5' }]}><Ionicons name="logo-linkedin" size={18} color="#fff" /></View><Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted }}>LinkedIn</Text></TouchableOpacity>}
                {sl.twitter && <TouchableOpacity onPress={() => Linking.openURL(sl.twitter)} style={{ alignItems: 'center', gap: 6 }}><View style={[st.socialIcon, { backgroundColor: '#000' }]}><Ionicons name="logo-twitter" size={18} color="#fff" /></View><Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted }}>Twitter</Text></TouchableOpacity>}
                {sl.facebook && <TouchableOpacity onPress={() => Linking.openURL(sl.facebook)} style={{ alignItems: 'center', gap: 6 }}><View style={[st.socialIcon, { backgroundColor: '#1877F2' }]}><Ionicons name="logo-facebook" size={18} color="#fff" /></View><Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted }}>Facebook</Text></TouchableOpacity>}
                {sl.instagram && <TouchableOpacity onPress={() => Linking.openURL(sl.instagram)} style={{ alignItems: 'center', gap: 6 }}><View style={[st.socialIcon, { backgroundColor: '#E4405F' }]}><Ionicons name="logo-instagram" size={18} color="#fff" /></View><Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted }}>Instagram</Text></TouchableOpacity>}
              </View>
            </SectionCard>
          ) : null}

          {/* Values */}
          {(company as any)?.values?.length > 0 && (
            <SectionCard title="Values" icon="star-outline" colors={colors} accent={accent}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(company as any).values.map((v: string, i: number) => <View key={i} style={[st.tag, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}><Text style={[st.tagText, { color: colors.success }]}>{v}</Text></View>)}
              </View>
            </SectionCard>
          )}

          {/* Specialties */}
          {(company as any)?.specialties?.length > 0 && (
            <SectionCard title="Specialties" icon="ribbon-outline" colors={colors} accent={accent}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(company as any).specialties.map((sp: string, i: number) => <View key={i} style={[st.tag, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}><Text style={[st.tagText, { color: accent }]}>{sp}</Text></View>)}
              </View>
            </SectionCard>
          )}

          {/* Tags */}
          {(company as any)?.tags?.length > 0 && (
            <SectionCard title="Tags" icon="pricetag-outline" colors={colors} accent={accent}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(company as any).tags.map((t: string, i: number) => <View key={i} style={[st.tag, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30` }]}><Text style={[st.tagText, { color: colors.warning }]}>{t}</Text></View>)}
              </View>
            </SectionCard>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56 },
  headerTitle: { fontSize: FONT_SIZE.md ?? 16, fontWeight: '700', letterSpacing: -0.2 },
  editChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  editChipText: { fontSize: 13, fontWeight: '700' },
  coverWrap: { marginHorizontal: 16, marginTop: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', height: 160 },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  identity: { marginHorizontal: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden', paddingBottom: 0 },
  name: { fontSize: FONT_SIZE.xl ?? 20, fontWeight: '800', letterSpacing: -0.4, flex: 1, lineHeight: 26 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  headline: { fontSize: FONT_SIZE.base ?? 14, fontWeight: '600', marginTop: 2 },
  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 14, paddingHorizontal: 16, marginTop: 12 },
  statVal: { fontSize: FONT_SIZE.md ?? 16, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  completionCard: { borderRadius: 14, padding: 16, gap: 12 },
  completeBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  body: { fontSize: 14, lineHeight: 22 },
  quote: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  contactIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, fontSize: 14, fontWeight: '500' },
  socialIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tagText: { fontSize: 13, fontWeight: '600' },
});