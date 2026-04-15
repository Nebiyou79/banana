/**
 * ProfileScreen.tsx
 * Full read-only freelancer profile — matches web profile page:
 * cover photo, avatar + verification badge, headline, rate, availability,
 * social links, skills, experience, education, services, certifications, portfolio.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useFreelancerServices, useFreelancerCertifications, useFreelancerPortfolio } from '../../hooks/useFreelancer';
import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUpload';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const ACCENT = '#10B981';

const SectionBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[ps.section, { borderTopColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: theme.typography.base, marginBottom: 12 }}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const InfoRow: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color?: string }> = ({
  icon, label, value, color,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={ps.infoRow}>
      <Ionicons name={icon} size={15} color={theme.colors.textMuted} style={{ width: 22 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>{label}</Text>
        <Text style={{ color: color ?? theme.colors.text, fontWeight: '600', fontSize: theme.typography.sm }}>
          {value}
        </Text>
      </View>
    </View>
  );
};

export const FreelancerProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, isLoading } = useProfile();
  const { data: verification }       = useVerificationStatus();
  const { data: services = [] }      = useFreelancerServices();
  const { data: certs = [] }         = useFreelancerCertifications();
  const { data: portfolioData }      = useFreelancerPortfolio({ limit: 6 });

  const avatarUrl  = profile?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? '';
  const coverUrl   = profile?.cover?.secure_url ?? '';
  const initials   = (user?.name ?? 'F').split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  const isVerified = verification?.verificationStatus === 'full';

  const fp = (profile as any)?.freelancerProfile ?? {};
  const portfolioItems = portfolioData?.items ?? [];

  // Social links
  const rawSocial: Record<string, string> = fp?.socialLinks ?? (profile as any)?.socialLinks ?? {};
  const socialEntries = Object.entries(rawSocial).filter(([, v]) => Boolean(v));

  const SOCIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    linkedin: 'logo-linkedin',
    github: 'logo-github',
    twitter: 'logo-twitter',
    instagram: 'logo-instagram',
    youtube: 'logo-youtube',
    facebook: 'logo-facebook',
    tiktok: 'musical-notes-outline',
    telegram: 'paper-plane-outline',
    discord: 'logo-discord',
    website: 'globe-outline',
  };

  const AVAIL_LABELS: Record<string, { label: string; color: string }> = {
    available:     { label: 'Available',     color: ACCENT },
    'not-available': { label: 'Not Available', color: '#EF4444' },
    'part-time':   { label: 'Part-Time',     color: '#F59E0B' },
  };

  const EXP_LABELS: Record<string, string> = {
    entry: 'Entry Level', intermediate: 'Intermediate', expert: 'Expert',
  };

  const PROF_LABELS: Record<string, string> = {
    basic: 'Basic', conversational: 'Conversational', fluent: 'Fluent', native: 'Native',
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cover ─────────────────────────────────────────────────── */}
      <View style={ps.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: ACCENT + '30' }]} />
        )}
        {/* Edit cover overlay */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={ps.coverEditBtn}
        >
          <Ionicons name="camera-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Avatar row ────────────────────────────────────────────── */}
      <View style={[ps.avatarRow, { paddingHorizontal: spacing[4] }]}>
        <View style={[ps.avatarOuter, { borderColor: colors.background }]}>
          {avatarUrl ? (
            <Image source={{ uri: optimizeCloudinaryUrl(avatarUrl, 200, 200) }} style={ps.avatarInner} />
          ) : (
            <View style={[ps.avatarInner, { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography.xl }}>{initials}</Text>
            </View>
          )}
          {isVerified && (
            <View style={ps.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[ps.editBtn, { backgroundColor: ACCENT }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.xs, marginLeft: 4 }}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Identity ──────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: 4 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'] }}>
          {user?.name}
        </Text>
        {fp?.headline && (
          <Text style={{ color: colors.textMuted, fontSize: typography.base, marginTop: 2 }}>
            {fp.headline}
          </Text>
        )}

        {/* Quick chips */}
        <View style={ps.chipsRow}>
          {fp?.availability && (
            <View style={[ps.chip, { backgroundColor: (AVAIL_LABELS[fp.availability]?.color ?? ACCENT) + '18' }]}>
              <View style={[ps.chipDot, { backgroundColor: AVAIL_LABELS[fp.availability]?.color ?? ACCENT }]} />
              <Text style={{ color: AVAIL_LABELS[fp.availability]?.color ?? ACCENT, fontSize: 10, fontWeight: '700' }}>
                {AVAIL_LABELS[fp.availability]?.label}
              </Text>
            </View>
          )}
          {fp?.hourlyRate > 0 && (
            <View style={[ps.chip, { backgroundColor: ACCENT + '18' }]}>
              <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>${fp.hourlyRate}/hr</Text>
            </View>
          )}
          {fp?.experienceLevel && (
            <View style={[ps.chip, { backgroundColor: '#6366F118' }]}>
              <Text style={{ color: '#6366F1', fontSize: 10, fontWeight: '700' }}>
                {EXP_LABELS[fp.experienceLevel] ?? fp.experienceLevel}
              </Text>
            </View>
          )}
          {fp?.englishProficiency && (
            <View style={[ps.chip, { backgroundColor: '#F59E0B18' }]}>
              <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '700' }}>
                EN: {PROF_LABELS[fp.englishProficiency] ?? fp.englishProficiency}
              </Text>
            </View>
          )}
        </View>

        {/* Contact info row */}
        <View style={[ps.contactRow, { borderColor: colors.border }]}>
          {(profile as any)?.location && (
            <InfoRow icon="location-outline" label="Location" value={(profile as any).location} />
          )}
          {(profile as any)?.email && (
            <InfoRow icon="mail-outline" label="Email" value={(profile as any).email} />
          )}
          {(profile as any)?.phone && (
            <InfoRow icon="call-outline" label="Phone" value={(profile as any).phone} />
          )}
          {(profile as any)?.website && (
            <InfoRow icon="globe-outline" label="Website" value={(profile as any).website} color={ACCENT} />
          )}
          {fp?.timezone && (
            <InfoRow icon="time-outline" label="Timezone" value={fp.timezone} />
          )}
          {(profile as any)?.age && (
            <InfoRow icon="person-outline" label="Age" value={`${(profile as any).age} years`} />
          )}
          {(profile as any)?.gender && (profile as any).gender !== 'prefer-not-to-say' && (
            <InfoRow
              icon="transgender-outline"
              label="Gender"
              value={((profile as any).gender as string).charAt(0).toUpperCase() + ((profile as any).gender as string).slice(1)}
            />
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing[4], paddingBottom: 48 }}>
        {/* ── Bio ───────────────────────────────────────────────────── */}
        {(profile as any)?.bio && (
          <SectionBlock title="About">
            <Text style={{ color: colors.textSecondary, lineHeight: 22, fontSize: typography.sm }}>
              {(profile as any).bio}
            </Text>
          </SectionBlock>
        )}

        {/* ── Specializations ───────────────────────────────────────── */}
        {(fp?.specialization?.length ?? 0) > 0 && (
          <SectionBlock title="Specializations">
            <View style={ps.tagWrap}>
              {fp.specialization.map((spec: string) => (
                <View key={spec} style={[ps.tag, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
                  <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight: '600' }}>{spec}</Text>
                </View>
              ))}
            </View>
          </SectionBlock>
        )}

        {/* ── Skills ────────────────────────────────────────────────── */}
        {((profile as any)?.skills?.length ?? 0) > 0 && (
          <SectionBlock title={`Skills (${(profile as any).skills.length})`}>
            <View style={ps.tagWrap}>
              {(profile as any).skills.slice(0, 20).map((sk: { name?: string } | string) => {
                const name = typeof sk === 'string' ? sk : sk?.name ?? '';
                return (
                  <View key={name} style={[ps.tag, { backgroundColor: '#6366F118', borderColor: '#6366F130' }]}>
                    <Text style={{ color: '#6366F1', fontSize: typography.xs, fontWeight: '600' }}>{name}</Text>
                  </View>
                );
              })}
            </View>
          </SectionBlock>
        )}

        {/* ── Services ──────────────────────────────────────────────── */}
        {services.length > 0 && (
          <SectionBlock title={`Services (${services.length})`}>
            {services.map(svc => (
              <View key={svc._id} style={[ps.serviceRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>{svc.title}</Text>
                  {svc.description && (
                    <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 2 }} numberOfLines={1}>
                      {svc.description}
                    </Text>
                  )}
                </View>
                {svc.price != null && (
                  <Text style={{ color: ACCENT, fontWeight: '800', fontSize: typography.sm }}>
                    ${svc.price}{svc.priceType === 'hourly' ? '/hr' : ''}
                  </Text>
                )}
              </View>
            ))}
          </SectionBlock>
        )}

        {/* ── Experience ────────────────────────────────────────────── */}
        {((profile as any)?.experience?.length ?? 0) > 0 && (
          <SectionBlock title="Experience">
            {(profile as any).experience.map((exp: {
              _id?: string; company: string; position: string;
              startDate: string; endDate?: string; current?: boolean; description?: string;
            }) => (
              <View key={exp._id ?? exp.company} style={ps.timelineItem}>
                <View style={[ps.timelineDot, { backgroundColor: ACCENT }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>{exp.position}</Text>
                  <Text style={{ color: ACCENT, fontWeight: '600', fontSize: typography.xs }}>{exp.company}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </Text>
                  {exp.description && (
                    <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }} numberOfLines={2}>
                      {exp.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </SectionBlock>
        )}

        {/* ── Education ─────────────────────────────────────────────── */}
        {((profile as any)?.education?.length ?? 0) > 0 && (
          <SectionBlock title="Education">
            {(profile as any).education.map((edu: {
              _id?: string; institution: string; degree: string; field: string;
              startDate: string; endDate?: string; current?: boolean;
            }) => (
              <View key={edu._id ?? edu.institution} style={ps.timelineItem}>
                <View style={[ps.timelineDot, { backgroundColor: '#6366F1' }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>
                    {edu.degree} · {edu.field}
                  </Text>
                  <Text style={{ color: '#6366F1', fontWeight: '600', fontSize: typography.xs }}>{edu.institution}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </Text>
                </View>
              </View>
            ))}
          </SectionBlock>
        )}

        {/* ── Certifications ────────────────────────────────────────── */}
        {certs.length > 0 && (
          <SectionBlock title={`Certifications (${certs.length})`}>
            {certs.map(c => (
              <View key={c._id} style={[ps.certRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[ps.certIcon, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name="ribbon-outline" size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>{c.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{c.issuer}</Text>
                  {c.issueDate && (
                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                      Issued {new Date(c.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
                {c.credentialUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(c.credentialUrl!)}>
                    <Ionicons name="open-outline" size={16} color={ACCENT} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </SectionBlock>
        )}

        {/* ── Portfolio Preview ─────────────────────────────────────── */}
        {portfolioItems.length > 0 && (
          <SectionBlock title="Portfolio">
            <View style={ps.portfolioGrid}>
              {portfolioItems.slice(0, 6).map(item => {
                const cover = item.mediaUrls?.[0] ?? item.mediaUrl ?? '';
                return (
                  <TouchableOpacity
                    key={item._id}
                    onPress={() => navigation.navigate('PortfolioDetails', { itemId: item._id })}
                    style={[ps.portfolioThumb, { borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    {cover ? (
                      <Image
                        source={{ uri: optimizeCloudinaryUrl(cover, 200, 160) }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="image-outline" size={20} color={ACCENT} />
                      </View>
                    )}
                    <View style={ps.portfolioOverlay}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {(portfolioData?.pagination?.total ?? 0) > 6 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('PortfolioList')}
                style={[ps.seeAllBtn, { borderColor: ACCENT }]}
              >
                <Text style={{ color: ACCENT, fontWeight: '700', fontSize: typography.sm }}>
                  See all {portfolioData?.pagination?.total} projects →
                </Text>
              </TouchableOpacity>
            )}
          </SectionBlock>
        )}

        {/* ── Social Links ──────────────────────────────────────────── */}
        {socialEntries.length > 0 && (
          <SectionBlock title="Social Profiles">
            <View style={ps.socialRow}>
              {socialEntries.map(([platform, url]) => (
                <TouchableOpacity
                  key={platform}
                  onPress={() => url && Linking.openURL(url.startsWith('http') ? url : `https://${url}`)}
                  style={[ps.socialBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}
                >
                  <Ionicons
                    name={SOCIAL_ICONS[platform] ?? 'link-outline'}
                    size={16}
                    color={ACCENT}
                  />
                  <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '600', marginLeft: 4 }}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionBlock>
        )}
      </View>
    </ScrollView>
  );
};

const ps = StyleSheet.create({
  coverWrap:     { height: 150, position: 'relative', overflow: 'hidden' },
  coverEditBtn:  { position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 7, borderRadius: 20 },
  avatarRow:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 12 },
  avatarOuter:   { width: 88, height: 88, borderRadius: 44, borderWidth: 4, overflow: 'hidden', position: 'relative' },
  avatarInner:   { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  editBtn:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99 },
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 12 },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  chipDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  contactRow:    { borderTopWidth: 1, paddingTop: 12, marginTop: 4, gap: 8 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section:       { borderTopWidth: 1, paddingTop: 16, marginTop: 16 },
  tagWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  serviceRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  timelineItem:  { flexDirection: 'row', marginBottom: 16, position: 'relative' },
  timelineDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  certRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  certIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portfolioThumb:{ width: '31%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  portfolioOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4 },
  seeAllBtn:     { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8, alignItems: 'center' },
  socialRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialBtn:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
});