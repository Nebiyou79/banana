/**
 * src/screens/company/ProfileScreen.tsx  — REDESIGNED
 *
 * A professional, modern company profile screen.
 * Design direction: Refined enterprise dashboard — clean cards,
 * strong typographic hierarchy, purposeful use of accent colour,
 * and generous but controlled white space.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useProfile, useCompanyProfile } from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const COVER_H = 200;
const AVATAR_SIZE = 80;
const AVATAR_OFFSET = AVATAR_SIZE / 2 + 8;

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatSize = (s?: string) =>
  ({ '1-10': '1–10', '11-50': '11–50', '51-200': '51–200', '201-500': '201–500', '501-1000': '501–1000', '1000+': '1000+' } as any)[s ?? ''] ?? s ?? '';
const formatType = (t?: string) =>
  ({ startup: 'Startup', sme: 'SME', enterprise: 'Enterprise', agency: 'Agency', other: 'Other' } as any)[t ?? ''] ?? t ?? '';

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color, marginVertical: 12 }} />
);

// ── InfoRow ───────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  accent: string;
  colors: any;
  isLink?: boolean;
}> = ({ icon, label, value, onPress, accent, colors, isLink }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.65 : 1}
    style={ir.row}
  >
    <View style={[ir.iconBox, { backgroundColor: `${accent}14` }]}>
      <Ionicons name={icon} size={16} color={accent} />
    </View>
    <View style={ir.content}>
      <Text style={[ir.label, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[ir.value, { color: isLink ? accent : colors.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
  </TouchableOpacity>
);

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  value: { fontSize: 14, fontWeight: '500', lineHeight: 19 },
});

// ── Section ───────────────────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent: string;
  colors: any;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
}> = ({ title, icon, accent, colors, children, action }) => (
  <View style={[sec.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={sec.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <View style={[sec.iconWrap, { backgroundColor: `${accent}14` }]}>
            <Ionicons name={icon} size={13} color={accent} />
          </View>
        )}
        <Text style={[sec.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

const sec = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
});

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  accent: string;
  colors: any;
  onPress?: () => void;
}> = ({ icon, value, label, accent, colors, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={[sp.pill, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    activeOpacity={0.7}
  >
    <View style={[sp.iconRing, { backgroundColor: `${accent}12` }]}>
      <Ionicons name={icon} size={18} color={accent} />
    </View>
    <Text style={[sp.val, { color: colors.text }]}>{value}</Text>
    <Text style={[sp.label, { color: colors.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);

const sp = StyleSheet.create({
  pill: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  iconRing: { width: 36, height: 36, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  val: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600' },
});

// ── Tag chip ──────────────────────────────────────────────────────────────────
const TagChip: React.FC<{ label: string; bg: string; fg: string }> = ({ label, bg, fg }) => (
  <View style={[tag.chip, { backgroundColor: bg }]}>
    <Text style={[tag.text, { color: fg }]}>{label}</Text>
  </View>
);

const tag = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  text: { fontSize: 12, fontWeight: '600' },
});

// ── Completion bar ────────────────────────────────────────────────────────────
const CompletionSection: React.FC<{
  pct: number; accent: string; colors: any; onPress: () => void;
}> = ({ pct, accent, colors, onPress }) => {
  const remaining = 100 - pct;
  const barColor = pct < 40 ? colors.danger : pct < 75 ? colors.warning : colors.success;
  return (
    <View style={[comp.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={comp.top}>
        <View>
          <Text style={[comp.title, { color: colors.text }]}>Profile Completion</Text>
          <Text style={[comp.sub, { color: colors.textMuted }]}>
            {remaining > 0 ? `${remaining}% remaining` : 'All done!'}
          </Text>
        </View>
        <Text style={[comp.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={[comp.track, { backgroundColor: `${barColor}20` }]}>
        <View style={[comp.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      {pct < 100 && (
        <TouchableOpacity onPress={onPress} style={[comp.btn, { borderColor: accent }]}>
          <Ionicons name="pencil-outline" size={14} color={accent} />
          <Text style={[comp.btnText, { color: accent }]}>Complete your profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const comp = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  pct: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  btnText: { fontSize: 13, fontWeight: '700' },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export const CompanyProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: company, isLoading: cLoading, refetch: rC } = useCompanyProfile();
  const isLoading = pLoading || cLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rP(), rC()]);
    setRefreshing(false);
  }, [rP, rC]);

  if (isLoading) {
    return (
      <View style={[S.root, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  const accent = colors.primary;
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const isVerified = profile?.verificationStatus === 'verified' || company?.verified;
  const sl = (company as any)?.socialLinks ?? {};
  const stats = (company as any)?.socialStats ?? {};

  // Derived social links array
  const socialLinks = [
    sl.linkedin && { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' as const, url: sl.linkedin, color: '#0A66C2' },
    sl.twitter && { key: 'twitter', label: 'X / Twitter', icon: 'logo-twitter' as const, url: sl.twitter, color: '#000000' },
    sl.facebook && { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' as const, url: sl.facebook, color: '#1877F2' },
    sl.instagram && { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' as const, url: sl.instagram, color: '#E4405F' },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap; url: string; color: string }>;

  const hasContact = !!(company?.email || company?.phone || company?.website || company?.address);

  return (
    <View style={[S.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: Cover + Avatar ────────────────────────────────────── */}
        <View style={S.heroWrap}>
          {/* Cover */}
          <View style={[S.cover, { backgroundColor: `${accent}18` }]}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={S.coverImg} resizeMode="cover" />
            ) : (
              <View style={S.coverGradientWrap}>
                <LinearGradient
                  colors={isDark
                    ? [`${accent}30`, `${accent}08`]
                    : [`${accent}20`, `${accent}05`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={S.coverDecor}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Ionicons key={i} name="ellipse" size={4} color={`${accent}30`} />
                  ))}
                </View>
                <Ionicons name="business-outline" size={48} color={`${accent}25`} />
              </View>
            )}

            {/* Edit button — top-right overlay on cover */}
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile')}
              style={[S.editOverlay, { backgroundColor: accent }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.82}
            >
              <Ionicons name="pencil" size={13} color="#fff" />
              <Text style={S.editBtnText}>Edit</Text>
            </TouchableOpacity>

            {/* Gradient overlay at bottom */}
            <LinearGradient
              colors={['transparent', colors.bgCard + 'FF']}
              style={S.coverFade}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />
          </View>

          {/* Identity card — white card beneath cover */}
          <View style={[S.identityCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {/* Avatar sits at top edge of card, overlapping cover */}
            <View style={S.avatarRow}>
              <View style={[S.avatarRing, { borderColor: colors.bgCard, backgroundColor: colors.bgCard }]}>
                <ProfileImageUploader
                  currentAvatarUrl={avatarUrl}
                  currentCoverUrl={coverUrl}
                  accentColor={accent}
                  type="avatar"
                  avatarShape="square"
                  verifiedFull={isVerified}
                />
              </View>

              {isVerified && (
                <View style={[S.verifiedBadge, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}40` }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                  <Text style={[S.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              )}
            </View>

            {/* Name + headline */}
            <Text style={[S.companyName, { color: colors.text }]} numberOfLines={2}>
              {company?.name ?? 'Your Company'}
            </Text>
            {company?.headline ? (
              <Text style={[S.headline, { color: accent }]} numberOfLines={2}>
                {company.headline}
              </Text>
            ) : null}

            {/* Industry + location row */}
            {(company?.industry || company?.address) ? (
              <View style={S.metaRow}>
                {company?.industry && (
                  <View style={S.metaItem}>
                    <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
                    <Text style={[S.metaText, { color: colors.textMuted }]}>{company.industry}</Text>
                  </View>
                )}
                {company?.address && (
                  <View style={S.metaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={[S.metaText, { color: colors.textMuted }]} numberOfLines={1}>{company.address}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Badges row */}
            {(company?.companySize || company?.companyType || company?.foundedYear || company?.tin) ? (
              <View style={S.badgeRow}>
                {company?.companySize && (
                  <TagChip
                    label={`${formatSize(company.companySize)} employees`}
                    bg={`${accent}12`}
                    fg={accent}
                  />
                )}
                {company?.companyType && (
                  <TagChip
                    label={formatType(company.companyType)}
                    bg={`${accent}12`}
                    fg={accent}
                  />
                )}
                {company?.foundedYear && (
                  <TagChip
                    label={`Est. ${company.foundedYear}`}
                    bg={`${colors.warning}14`}
                    fg={colors.warning}
                  />
                )}
                {company?.tin && (
                  <TagChip
                    label={`TIN: ${company.tin}`}
                    bg={`${colors.textMuted}12`}
                    fg={colors.textMuted}
                  />
                )}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <View style={S.statsRow}>
          <StatPill
            icon="briefcase-outline"
            value={stats?.postCount ?? 0}
            label="Jobs"
            accent={accent}
            colors={colors}
          />
          <StatPill
            icon="cube-outline"
            value={stats?.productCount ?? 0}
            label="Products"
            accent={accent}
            colors={colors}
          />
          <StatPill
            icon="people-outline"
            value={stats?.followerCount ?? 0}
            label="Followers"
            accent={accent}
            colors={colors}
          />
        </View>

        {/* ── Body sections ────────────────────────────────────────────── */}
        <View style={S.body}>
          {/* Completion */}
          {completion < 100 && (
            <CompletionSection
              pct={completion}
              accent={accent}
              colors={colors}
              onPress={() => navigation.navigate('EditProfile')}
            />
          )}

          {/* About */}
          {company?.description ? (
            <Section title="About" icon="information-circle-outline" accent={accent} colors={colors}>
              <Text style={[S.bodyText, { color: colors.textMuted }]} numberOfLines={8}>
                {company.description}
              </Text>
            </Section>
          ) : null}

          {/* Mission */}
          {company?.mission ? (
            <Section title="Mission" icon="flag-outline" accent={accent} colors={colors}>
              <View style={[S.quoteWrap, { borderLeftColor: accent }]}>
                <Text style={[S.quoteText, { color: colors.textMuted }]}>{company.mission}</Text>
              </View>
            </Section>
          ) : null}

          {/* Contact */}
          <Section title="Contact" icon="call-outline" accent={accent} colors={colors}>
            {hasContact ? (
              <>
                {company?.email && (
                  <InfoRow
                    icon="mail-outline"
                    label="Email"
                    value={company.email}
                    onPress={() => Linking.openURL(`mailto:${company.email}`)}
                    accent={accent}
                    colors={colors}
                    isLink
                  />
                )}
                {company?.phone && (
                  <>
                    {company?.email && <Divider color={colors.border} />}
                    <InfoRow
                      icon="call-outline"
                      label="Phone"
                      value={company.phone}
                      onPress={() => Linking.openURL(`tel:${company.phone}`)}
                      accent={colors.success}
                      colors={colors}
                    />
                  </>
                )}
                {company?.website && (
                  <>
                    {(company?.email || company?.phone) && <Divider color={colors.border} />}
                    <InfoRow
                      icon="globe-outline"
                      label="Website"
                      value={company.website}
                      onPress={() => Linking.openURL(company.website!)}
                      accent={colors.warning}
                      colors={colors}
                      isLink
                    />
                  </>
                )}
                {company?.address && (
                  <>
                    {(company?.email || company?.phone || company?.website) && <Divider color={colors.border} />}
                    <InfoRow
                      icon="location-outline"
                      label="Address"
                      value={company.address}
                      accent={colors.danger}
                      colors={colors}
                    />
                  </>
                )}
              </>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                style={[S.emptyContact, { borderColor: `${accent}30`, backgroundColor: `${accent}06` }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={accent} />
                <Text style={[S.emptyContactText, { color: accent }]}>Add contact information</Text>
              </TouchableOpacity>
            )}
          </Section>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <Section title="Social" icon="share-social-outline" accent={accent} colors={colors}>
              <View style={S.socialRow}>
                {socialLinks.map(link => (
                  <TouchableOpacity
                    key={link.key}
                    onPress={() => Linking.openURL(link.url)}
                    style={[S.socialBtn, { backgroundColor: `${link.color}14`, borderColor: `${link.color}30` }]}
                    activeOpacity={0.7}
                  >
                    <View style={[S.socialIconBox, { backgroundColor: link.color }]}>
                      <Ionicons name={link.icon} size={16} color="#fff" />
                    </View>
                    <Text style={[S.socialLabel, { color: colors.text }]}>{link.label}</Text>
                    <Ionicons name="open-outline" size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          )}

          {/* Specialties */}
          {(company as any)?.specialties?.length > 0 && (
            <Section title="Specialties" icon="ribbon-outline" accent={accent} colors={colors}>
              <View style={S.tagWrap}>
                {(company as any).specialties.map((sp: string, i: number) => (
                  <TagChip key={i} label={sp} bg={`${accent}12`} fg={accent} />
                ))}
              </View>
            </Section>
          )}

          {/* Values */}
          {(company as any)?.values?.length > 0 && (
            <Section title="Values" icon="star-outline" accent={accent} colors={colors}>
              <View style={S.tagWrap}>
                {(company as any).values.map((v: string, i: number) => (
                  <TagChip key={i} label={v} bg={`${colors.success}12`} fg={colors.success} />
                ))}
              </View>
            </Section>
          )}

          {/* Tags */}
          {(company as any)?.tags?.length > 0 && (
            <Section title="Tags" icon="pricetag-outline" accent={accent} colors={colors}>
              <View style={S.tagWrap}>
                {(company as any).tags.map((t: string, i: number) => (
                  <TagChip key={i} label={t} bg={`${colors.warning}12`} fg={colors.warning} />
                ))}
              </View>
            </Section>
          )}

          {/* Culture */}
          {company?.culture ? (
            <Section title="Culture" icon="heart-outline" accent={accent} colors={colors}>
              <Text style={[S.bodyText, { color: colors.textMuted }]}>{company.culture}</Text>
            </Section>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Master Styles ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1 },

  // Edit overlay on cover (top-right)
  editOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 10,
  },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Hero
  heroWrap: { marginHorizontal: 0 },
  cover: { height: COVER_H, overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
  coverGradientWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverDecor: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', gap: 6 },
  coverFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },

  // Identity card
  identityCard: {
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingTop: AVATAR_OFFSET + 4,
    marginBottom: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRow: {
    position: 'absolute',
    top: -AVATAR_OFFSET,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarRing: {
    borderRadius: 18,
    borderWidth: 3,
    overflow: 'hidden',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 4,
  },
  verifiedText: { fontSize: 11, fontWeight: '700' },

  companyName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28, marginBottom: 2 },
  headline: { fontSize: 14, fontWeight: '600', marginBottom: 8, lineHeight: 19 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },

  // Body
  body: { paddingHorizontal: 16 },
  bodyText: { fontSize: 14, lineHeight: 22 },

  quoteWrap: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4 },
  quoteText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // Contact empty
  emptyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyContactText: { fontSize: 13, fontWeight: '600' },

  // Social
  socialRow: { gap: 8 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  socialLabel: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});