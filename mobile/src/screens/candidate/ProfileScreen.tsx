/**
 * screens/candidate/ProfileScreen.tsx
 *
 * Candidate read-only / own-profile view.
 * Inline avatar+cover upload via ProfileImageUploader.
 * Sections: Skills, Experience, Education, Certifications, Social Links.
 * Profile completion bar.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import {
  useProfile,
  useCandidateRoleProfile,
  useVerificationStatus,
} from '../../hooks/useProfile';
import { SectionBlock, VerificationPill, SkeletonCard } from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

// ─── Social icon map ──────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  linkedin:  'logo-linkedin',
  github:    'logo-github',
  twitter:   'logo-twitter',
  tiktok:    'musical-notes-outline',
  telegram:  'paper-plane-outline',
  instagram: 'logo-instagram',
  facebook:  'logo-facebook',
  website:   'globe-outline',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkillChip: React.FC<{ skill: string }> = React.memo(({ skill }) => (
  <View style={chip.wrap}>
    <Text style={chip.text}>{skill}</Text>
  </View>
));

interface TimelineItemProps {
  title: string; subtitle: string; meta: string; desc?: string; current?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = React.memo(
  ({ title, subtitle, meta, desc, current }) => {
    const { theme } = useThemeStore();
    return (
      <View style={[tl.item, { borderLeftColor: current ? '#10B981' : ACCENT }]}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{title}</Text>
        <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 12, marginTop: 1 }}>{subtitle}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>{meta}</Text>
        {desc ? <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>{desc}</Text> : null}
        {current ? <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 3 }}>● Current</Text> : null}
      </View>
    );
  },
);

interface CertCardProps {
  name: string; issuer: string; issued: string; expiry?: string; credUrl?: string;
}

const CertCard: React.FC<CertCardProps> = React.memo(({ name, issuer, issued, expiry, credUrl }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[cc.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[cc.icon, { backgroundColor: '#6366F11A' }]}>
        <Ionicons name="ribbon-outline" size={18} color="#6366F1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{name}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{issuer} · {issued}{expiry ? ` → ${expiry}` : ''}</Text>
        {credUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(credUrl)}>
            <Text style={{ color: '#6366F1', fontSize: 11, marginTop: 2 }}>View credential ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

function fmtRange(start?: string, end?: string, current?: boolean): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en', { month: 'short', year: 'numeric' });
  const s = start ? fmt(start) : '?';
  const e = current ? 'Present' : end ? fmt(end) : '?';
  return `${s} – ${e}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export const CandidateProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }     = useAuthStore();
  const navigation   = useNavigation<Nav>();
  const { data: profile, isLoading } = useProfile();
  const { data: rp }                 = useCandidateRoleProfile();
  const { data: verification }       = useVerificationStatus();

  // Safe coercion: backend returns dynamic shape; these fields are well-known
  const prof = profile as Record<string, unknown> | undefined;
  const avatarUrl = (prof?.avatar as Record<string, string> | undefined)?.secure_url
    ?? prof?.user as string | undefined
    ?? null;
  const coverUrl  = (prof?.cover  as Record<string, string> | undefined)?.secure_url ?? null;
  const vStatus   = (verification?.verificationStatus ?? 'none') as 'none' | 'partial' | 'full';

  const skills     = (rp as Record<string, unknown> | undefined)?.skills as string[] ?? [];
  const experience = (rp as Record<string, unknown> | undefined)?.experience as Array<Record<string, unknown>> ?? [];
  const education  = (rp as Record<string, unknown> | undefined)?.education  as Array<Record<string, unknown>> ?? [];
  const certs      = (rp as Record<string, unknown> | undefined)?.certifications as Array<Record<string, unknown>> ?? [];
  const social     = (prof?.socialLinks as Record<string, string> | undefined) ?? {};
  const completion = (prof?.profileCompletion as Record<string, number> | undefined)?.percentage ?? 0;
  const socialEntries = Object.entries(social).filter(([, v]) => Boolean(v));

  const renderExp  = useCallback(({ item }: { item: Record<string, unknown> }) => (
    <TimelineItem
      title={item.title as string ?? item.position as string ?? ''}
      subtitle={item.company as string ?? ''}
      meta={fmtRange(item.startDate as string, item.endDate as string, item.current as boolean)}
      desc={item.description as string}
      current={item.current as boolean}
    />
  ), []);

  const renderEdu  = useCallback(({ item }: { item: Record<string, unknown> }) => (
    <TimelineItem
      title={`${item.degree ?? ''}${item.field ? ` · ${item.field}` : ''}`}
      subtitle={item.institution as string ?? ''}
      meta={fmtRange(item.startDate as string, item.endDate as string, item.current as boolean)}
      current={item.current as boolean}
    />
  ), []);

  const renderCert = useCallback(({ item }: { item: Record<string, unknown> }) => (
    <CertCard
      name={item.name as string ?? ''}
      issuer={item.issuer as string ?? ''}
      issued={item.issueDate ? new Date(item.issueDate as string).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : ''}
      expiry={item.expiryDate ? new Date(item.expiryDate as string).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : undefined}
      credUrl={item.credentialUrl as string | undefined}
    />
  ), []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: spacing[5], gap: 16 }}>
        <SkeletonCard height={140} radius={12} />
        <SkeletonCard height={24} radius={6} style={{ width: '60%' }} />
        <SkeletonCard height={16} radius={6} style={{ width: '40%' }} />
        <SkeletonCard height={88} radius={12} />
        <SkeletonCard height={88} radius={12} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Cover + Avatar */}
      <ProfileImageUploader
        currentAvatarUrl={avatarUrl}
        currentCoverUrl={coverUrl}
        accentColor={ACCENT}
        type="both"
        avatarShape="circle"
        verifiedFull={vStatus === 'full'}
        showDeleteButtons
      />

      {/* Name / headline */}
      <View style={{ paddingHorizontal: spacing[5], marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.4 }}>
              {user?.name}
            </Text>
            {profile?.headline ? (
              <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: 2 }}>{profile.headline}</Text>
            ) : null}
          </View>
          <VerificationPill status={vStatus} />
        </View>

        {/* Info chips */}
        <View style={s.infoRow}>
          {profile?.location ? (
            <View style={s.chip}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[s.chipTxt, { color: colors.textMuted }]}>{profile.location}</Text>
            </View>
          ) : null}
          {profile?.website ? (
            <TouchableOpacity style={s.chip} onPress={() => Linking.openURL(profile.website!)}>
              <Ionicons name="globe-outline" size={12} color={ACCENT} />
              <Text style={[s.chipTxt, { color: ACCENT }]}>Website</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Completion bar */}
        {completion > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={s.sectionLabel}>Profile strength</Text>
              <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>{completion}%</Text>
            </View>
            <View style={[s.barBg, { backgroundColor: colors.border }]}>
              <View style={[s.barFill, { width: `${completion}%` as `${number}%`, backgroundColor: ACCENT }]} />
            </View>
          </View>
        )}

        {/* Edit button */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: ACCENT }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Bio */}
      {profile?.bio ? (
        <SectionBlock title="About" style={{ marginHorizontal: spacing[5] }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>{profile.bio}</Text>
        </SectionBlock>
      ) : null}

      {/* Skills */}
      {skills.length > 0 ? (
        <SectionBlock title={`Skills (${skills.length})`} style={{ marginHorizontal: spacing[5] }}>
          <View style={s.chipWrap}>{skills.map((sk) => <SkillChip key={sk} skill={sk} />)}</View>
        </SectionBlock>
      ) : null}

      {/* Experience */}
      {experience.length > 0 ? (
        <SectionBlock title="Experience" style={{ marginHorizontal: spacing[5] }}>
          <View style={{ height: experience.length * 104 }}>
            <FlashList data={experience} renderItem={renderExp} keyExtractor={(_, i) => `exp-${i}`} scrollEnabled={false} />
          </View>
        </SectionBlock>
      ) : null}

      {/* Education */}
      {education.length > 0 ? (
        <SectionBlock title="Education" style={{ marginHorizontal: spacing[5] }}>
          <View style={{ height: education.length * 92 }}>
            <FlashList data={education} renderItem={renderEdu} keyExtractor={(_, i) => `edu-${i}`} scrollEnabled={false} />
          </View>
        </SectionBlock>
      ) : null}

      {/* Certifications */}
      {certs.length > 0 ? (
        <SectionBlock title="Certifications" style={{ marginHorizontal: spacing[5] }}>
          <View style={{ height: certs.length * 80 }}>
            <FlashList data={certs} renderItem={renderCert}  keyExtractor={(_, i) => `cert-${i}`} scrollEnabled={false} />
          </View>
        </SectionBlock>
      ) : null}

      {/* Social */}
      {socialEntries.length > 0 ? (
        <SectionBlock title="Social Profiles" style={{ marginHorizontal: spacing[5] }}>
          <View style={s.socialRow}>
            {socialEntries.map(([platform, url]) => (
              <TouchableOpacity
                key={platform}
                style={[s.socialBtn, { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}30` }]}
                onPress={() => Linking.openURL(url.startsWith('http') ? url : `https://${url}`)}
                activeOpacity={0.75}
              >
                <Ionicons name={SOCIAL_ICONS[platform] ?? 'link-outline'} size={16} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionBlock>
      ) : null}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  infoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#94A3B812', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt:      { fontSize: 12, fontWeight: '500' },
  sectionLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  barBg:        { height: 6, borderRadius: 99, overflow: 'hidden' },
  barFill:      { height: 6, borderRadius: 99 },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, marginTop: 12 },
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
});

const chip = StyleSheet.create({
  wrap: { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}40`, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { color: ACCENT, fontSize: 12, fontWeight: '600' },
});

const tl = StyleSheet.create({
  item: { borderLeftWidth: 2.5, paddingLeft: 12, marginBottom: 18 },
});

const cc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});