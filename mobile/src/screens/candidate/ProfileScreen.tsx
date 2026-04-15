/**
 * screens/candidate/ProfileScreen.tsx
 *
 * Read-only "mobile résumé" view for the Candidate.
 * ─ ProfileHeader (avatar, cover, name, headline, verified badge)
 * ─ FlashList-backed sections: Skills, Experience, Education, Certifications
 * ─ Tappable links for social / website
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import {
  useProfile, useCandidateRoleProfile, useVerificationStatus,
} from '../../hooks/useProfile';
import {
  ProfileHeader, SectionBlock, VerificationPill,
} from '../../components/shared/ProfileAtoms';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

// ─── Timeline Item (experience / education) ───────────────────────────────────

interface TimelineItemProps {
  title:    string;
  subtitle: string;
  meta:     string;
  current?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = React.memo(({ title, subtitle, meta, current }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[t.item, { borderLeftColor: current ? '#10B981' : ACCENT }]}>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{title}</Text>
      <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 12 }}>{subtitle}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{meta}</Text>
      {current && <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 2 }}>● Current</Text>}
    </View>
  );
});

// ─── Certification Item ───────────────────────────────────────────────────────

interface CertItemProps {
  name:     string;
  issuer:   string;
  issued:   string;
  credUrl?: string;
}

const CertItem: React.FC<CertItemProps> = React.memo(({ name, issuer, issued, credUrl }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[c.item, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[c.icon, { backgroundColor: '#6366F1' + '1A' }]}>
        <Ionicons name="ribbon-outline" size={18} color="#6366F1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{name}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{issuer} · {issued}</Text>
        {credUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(credUrl)}>
            <Text style={{ color: '#6366F1', fontSize: 11, marginTop: 2 }}>View credential ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

// ─── Skill Chip ───────────────────────────────────────────────────────────────

const Chip: React.FC<{ text: string }> = React.memo(({ text }) => (
  <View style={chip.wrap}>
    <Text style={chip.text}>{text}</Text>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CandidateProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useCandidateRoleProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl    = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl     = profile?.cover?.secure_url ?? null;
  const vStatus      = verification?.verificationStatus ?? 'none';
  const skills       = roleProfile?.skills ?? [];
  const experience   = roleProfile?.experience ?? [];
  const education    = roleProfile?.education ?? [];
  const certs        = roleProfile?.certifications ?? [];

  const fmtRange = useCallback((start?: string, end?: string, current?: boolean) => {
    const s = start ? new Date(start).getFullYear().toString() : '?';
    const e = current ? 'Present' : end ? new Date(end).getFullYear().toString() : '?';
    return `${s} – ${e}`;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <ProfileHeader
        name={user?.name ?? 'Candidate'}
        headline={profile?.headline}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        accentColor={ACCENT}
        verifiedFull={vStatus === 'full'}
        onEdit={() => navigation.navigate('EditProfile')}
        rightSlot={<VerificationPill status={vStatus as any} />}
      />

      <View style={{ paddingHorizontal: spacing[5], paddingBottom: 48 }}>

        {/* Info chips row */}
        <View style={[s.infoRow, { marginTop: 12 }]}>
          {profile?.location ? (
            <View style={s.infoChip}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[s.infoChipText, { color: colors.textMuted, fontSize: typography.xs }]}>{profile.location}</Text>
            </View>
          ) : null}
          {profile?.website ? (
            <TouchableOpacity style={s.infoChip} onPress={() => Linking.openURL(profile.website!)}>
              <Ionicons name="globe-outline" size={13} color={colors.primary} />
              <Text style={[s.infoChipText, { color: colors.primary, fontSize: typography.xs }]}>Website</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Bio */}
        {profile?.bio ? (
          <SectionBlock title="About">
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>
              {profile.bio}
            </Text>
          </SectionBlock>
        ) : null}

        {/* Skills */}
        {skills.length > 0 ? (
          <SectionBlock title="Skills">
            <View style={s.chipWrap}>
              {skills.map((sk) => <Chip key={sk} text={sk} />)}
            </View>
          </SectionBlock>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <SectionBlock title="Experience">
            <View style={{ height: experience.length * 84 }}>
              <FlashList
                data={experience}
                renderItem={({ item }) => (
                  <TimelineItem
                    title={item.title ?? item.position ?? ''}
                    subtitle={item.company ?? ''}
                    meta={fmtRange(item.startDate, item.endDate, item.current)}
                    current={item.current}
                  />
                )}
                keyExtractor={(_, i) => `exp-${i}`}
                scrollEnabled={false}
              />
            </View>
          </SectionBlock>
        ) : null}

        {/* Education */}
        {education.length > 0 ? (
          <SectionBlock title="Education">
            <View style={{ height: education.length * 80 }}>
              <FlashList
                data={education}
                renderItem={({ item }) => (
                  <TimelineItem
                    title={item.degree ? `${item.degree}${item.field ? ` · ${item.field}` : ''}` : item.institution ?? ''}
                    subtitle={item.institution ?? ''}
                    meta={fmtRange(item.startDate, item.endDate, item.current)}
                    current={item.current}
                  />
                )}
                keyExtractor={(_, i) => `edu-${i}`}
                scrollEnabled={false}
              />
            </View>
          </SectionBlock>
        ) : null}

        {/* Certifications */}
        {certs.length > 0 ? (
          <SectionBlock title="Certifications">
            <View style={{ height: certs.length * 88 }}>
              <FlashList
                data={certs}
                renderItem={({ item }) => (
                  <CertItem
                    name={item.name ?? ''}
                    issuer={item.issuer ?? ''}
                    issued={item.issueDate ? new Date(item.issueDate).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : ''}
                    credUrl={item.credentialUrl}
                  />
                )}
                keyExtractor={(_, i) => `cert-${i}`}
                scrollEnabled={false}
              />
            </View>
          </SectionBlock>
        ) : null}

      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  infoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#94A3B812', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  infoChipText: { fontWeight: '500' },
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const t = StyleSheet.create({
  item: { borderLeftWidth: 2, paddingLeft: 12, marginBottom: 16 },
});

const c = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

const chip = StyleSheet.create({
  wrap: { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { color: ACCENT, fontSize: 12, fontWeight: '600' },
});