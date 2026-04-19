/**
 * screens/candidate/ProfileScreen.tsx
 * Read-only + inline image upload for the authenticated candidate.
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Linking, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  useProfile, useCandidateProfile, useCandidateCVs,
} from '../../hooks/useProfile';
import { profileService } from '../../services/profileService';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import {
  SkeletonCard, CompletionBar, InfoRow, BadgePill, VerifiedBadge,
} from '../../components/shared/ProfileAtoms';
import useTheme from '../../hooks/useThemes';

const ACCENT = '#3B82F6';

const SOCIAL_ICONS: Record<string, { icon: string; color: string }> = {
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2' },
  github: { icon: 'logo-github', color: '#181717' },
  twitter: { icon: 'logo-twitter', color: '#1DA1F2' },
  tiktok: { icon: 'logo-tiktok', color: '#010101' },
  telegram: { icon: 'paper-plane-outline', color: '#26A5E4' },
  youtube: { icon: 'logo-youtube', color: '#FF0000' },
  facebook: { icon: 'logo-facebook', color: '#1877F2' },
  instagram: { icon: 'logo-instagram', color: '#E1306C' },
  discord: { icon: 'logo-discord', color: '#5865F2' },
};

export const CandidateProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { colors, type, spacing, isDark } = useTheme();

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: candidateProfile, isLoading: cLoading, refetch: rC } = useCandidateProfile();
  const { data: cvData, isLoading: cvLoading, refetch: rCV } = useCandidateCVs();

  const isLoading = pLoading || cLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([rP(), rC(), rCV()]);
  }, [rP, rC, rCV]);

  if (isLoading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        contentContainerStyle={{ padding: 16 }}
      >
        <SkeletonCard  />
        <SkeletonCard />
        <SkeletonCard  />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;
  const name = profile?.user?.name ?? 'Your Name';
  const skills: string[] = candidateProfile?.skills ?? [];
  const education = candidateProfile?.education ?? [];
  const experience = candidateProfile?.experience ?? [];
  const certifications = candidateProfile?.certifications ?? [];
  const socialLinks = profile?.socialLinks ?? {};
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const cvs = cvData?.cvs ?? [];
  const activeSocialLinks = Object.entries(socialLinks).filter(([, v]) => !!v);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={ACCENT} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header image area ─────────────────────────────────────────── */}
      <ProfileImageUploader
        currentAvatarUrl={avatarUrl}
        currentCoverUrl={coverUrl}
        accentColor={ACCENT}
        type="both"
        avatarShape="circle"
        verifiedFull={profile?.verificationStatus === 'verified'}
      />

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{name}</Text>
          {profile?.verificationStatus === 'verified' && <VerifiedBadge size={18} />}
        </View>
        {profile?.headline && (
          <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            {profile.headline}
          </Text>
        )}
        {profile?.location && (
          <InfoRow icon="location-outline" text={profile.location} style={{ marginBottom: 4 }} />
        )}

        {/* Badges */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <BadgePill
            label={
              profile?.verificationStatus === 'verified' ? '✓ Verified' :
              profile?.verificationStatus === 'pending' ? 'Pending Verification' : 'Unverified'
            }
            color={
              profile?.verificationStatus === 'verified' ? '#22C55E' :
              profile?.verificationStatus === 'pending' ? '#F59E0B' : colors.bgSurface
            }
            textColor={
              profile?.verificationStatus === 'none' ? colors.textMuted : '#fff'
            }
          />
            <BadgePill
              label={`${candidateProfile?.experience?.length ?? 0} role${(candidateProfile?.experience?.length ?? 0) > 1 ? 's' : ''}`}
              color={colors.bgSurface}
              textColor={colors.textSecondary}
            />
        </View>
      </View>

      <View style={{ padding: 16, gap: 14 }}>
        {/* ── Edit button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: ACCENT }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Edit Profile</Text>
        </TouchableOpacity>

        {/* ── Completion bar ────────────────────────────────────────── */}
        {completion < 100 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <CompletionBar
              percentage={completion}
              label="Profile Completion"
              accentColor={ACCENT}
            />
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>
                Complete your profile →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bio ──────────────────────────────────────────────────── */}
        {profile?.bio && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 6 }}>
              {profile.bio}
            </Text>
          </View>
        )}

        {/* ── Skills ───────────────────────────────────────────────── */}
        {skills.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Skills</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {skills.map((sk, i) => (
                <View key={i} style={[s.chip, { backgroundColor: ACCENT + '18' }]}>
                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Experience ───────────────────────────────────────────── */}
        {experience.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Experience</Text>
            {experience.map((exp, i) => (
              <View key={exp._id ?? i} style={[s.timelineItem, { borderLeftColor: ACCENT + '40' }]}>
                <View style={[s.timelineDot, { backgroundColor: ACCENT }]} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {exp.position}
                </Text>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>{exp.company}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {' — '}
                  {exp.current ? 'Present' : exp.endDate
                    ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : ''}
                </Text>
                {exp.description && (
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                    {exp.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Education ────────────────────────────────────────────── */}
        {education.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Education</Text>
            {education.map((edu, i) => (
              <View key={edu._id ?? i} style={[s.timelineItem, { borderLeftColor: ACCENT + '40' }]}>
                <View style={[s.timelineDot, { backgroundColor: ACCENT }]} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                </Text>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>{edu.institution}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {' — '}
                  {edu.current ? 'Present' : edu.endDate
                    ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Certifications ───────────────────────────────────────── */}
        {certifications.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Certifications</Text>
            {certifications.map((cert, i) => (
              <View
                key={cert._id ?? i}
                style={[s.certRow, { borderColor: colors.borderPrimary }]}
              >
                <View style={[s.certIcon, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name="ribbon-outline" size={16} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    {cert.name}
                  </Text>
                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>{cert.issuer}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    Issued {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {cert.expiryDate
                      ? ` · Expires ${new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                      : ''}
                  </Text>
                  {cert.credentialUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(cert.credentialUrl!)}>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                        View credential →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── CVs ─────────────────────────────────────────────────── */}
        {cvs.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
              CVs ({cvs.length})
            </Text>
            {cvs.map((cv, i) => (
              <View
                key={cv._id ?? i}
                style={[s.cvRow, { borderColor: colors.borderPrimary }]}
              >
                <Ionicons name="document-text-outline" size={20} color={ACCENT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    {cv.originalName}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {cv.isPrimary ? 'Primary · ' : ''}
                    {(cv.size / 1024).toFixed(0)} KB
                  </Text>
                </View>
                {cv.isPrimary && (
                  <BadgePill label="Primary" color={ACCENT} textColor="#fff" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Social links ─────────────────────────────────────────── */}
        {activeSocialLinks.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Social Links</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {activeSocialLinks.map(([platform, url]) => {
                const cfg = SOCIAL_ICONS[platform];
                if (!cfg) return null;
                return (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => Linking.openURL(url as string)}
                    style={[s.socialBtn, { backgroundColor: cfg.color + '15' }]}
                  >
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Contact ──────────────────────────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Contact</Text>
          {profile?.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${profile.phone}`)}>
              <InfoRow icon="call-outline" text={profile.phone} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {profile?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(profile.website!)}>
              <InfoRow icon="globe-outline" text={profile.website} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {profile?.user?.email && (
            <InfoRow icon="mail-outline" text={profile.user.email} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  timelineItem: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    marginTop: 14,
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: -5,
    top: 4,
  },
  certRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  certIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});