// FreelancerCard.tsx
import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { FreelancerListItem, AvailabilityStatus } from '../../services/freelancerMarketplaceService';

const AVAILABILITY_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string }
> = {
  available: { label: 'Available', color: '#22C55E' },
  busy: { label: 'Busy', color: '#F59E0B' },
  unavailable: { label: 'Unavailable', color: '#EF4444' },
  'part-time': {
    label: '',
    color: ''
  },
  'not-available': {
    label: '',
    color: ''
  }
};

interface FreelancerCardProps {
  freelancer: FreelancerListItem;
  onPress: () => void;
  onToggleShortlist?: () => void;
  isShortlistLoading?: boolean;
  style?: ViewStyle;
}

export const FreelancerCard: React.FC<FreelancerCardProps> = memo(
  ({ freelancer, onPress, onToggleShortlist, isShortlistLoading, style }) => {
    const { colors, radius, shadows, type } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(6)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    };

    const availability = freelancer.availability ?? 'unavailable';
    const avConfig = AVAILABILITY_CONFIG[availability];
    const rating = freelancer.ratings?.average ?? 0;
    const ratingCount = freelancer.ratings?.count ?? 0;
    const skills = freelancer.skills?.slice(0, 3) ?? [];
    const initials = freelancer.user?.name
      ? freelancer.user.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderPrimary,
              borderRadius: radius.xl,
              ...shadows.sm,
            },
            style,
          ]}
        >
          <View style={styles.topRow}>
            {freelancer.user?.avatar ? (
              <Image
                source={{ uri: freelancer.user.avatar }}
                style={[styles.avatar, { borderColor: colors.borderPrimary }]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.accentBg, borderColor: colors.accent },
                ]}
              >
                <Text style={[styles.initials, { color: colors.accent }]}>
                  {initials}
                </Text>
              </View>
            )}

            {onToggleShortlist && (
              <TouchableOpacity
                onPress={onToggleShortlist}
                disabled={isShortlistLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.saveBtn}
              >
                <Ionicons
                  name={freelancer.isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={freelancer.isSaved ? colors.accent : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.name, type.h3, { color: colors.textPrimary }]} numberOfLines={1}>
            {freelancer.user?.name ?? 'Freelancer'}
          </Text>
          {(freelancer.profession ?? freelancer.title) ? (
            <Text style={[styles.profession, type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>
              {freelancer.profession ?? freelancer.title}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={[styles.ratingText, type.caption, { color: colors.textPrimary }]}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </Text>
              {ratingCount > 0 && (
                <Text style={[styles.ratingCount, type.caption, { color: colors.textMuted }]}>
                  ({ratingCount})
                </Text>
              )}
            </View>

            {freelancer.hourlyRate ? (
              <Text style={[styles.rate, type.caption, { color: colors.accent }]}>
                {freelancer.currency ?? '$'}{freelancer.hourlyRate}/hr
              </Text>
            ) : null}
          </View>

          <View style={[styles.availBadge, { backgroundColor: avConfig.color + '1A' }]}>
            <View style={[styles.dot, { backgroundColor: avConfig.color }]} />
            <Text style={[styles.availText, type.caption, { color: avConfig.color }]}>
              {avConfig.label}
            </Text>
          </View>

          {skills.length > 0 && (
            <View style={styles.skillsRow}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[
                    styles.skillChip,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary },
                  ]}
                >
                  <Text style={[styles.skillText, type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                    {skill}
                  </Text>
                </View>
              ))}
              {(freelancer.skills?.length ?? 0) > 3 && (
                <Text style={[styles.moreSkills, type.caption, { color: colors.textMuted }]}>
                  +{(freelancer.skills?.length ?? 0) - 3}
                </Text>
              )}
            </View>
          )}

          {freelancer.user?.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.locationText, type.caption, { color: colors.textMuted }]} numberOfLines={1}>
                {freelancer.user.location}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

FreelancerCard.displayName = 'FreelancerCard';

export const FreelancerCardSkeleton: React.FC = () => {
  const { colors, radius, shadows } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.xl, ...shadows.sm }]}>
      <View style={[styles.skeletonLine, { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 14, marginTop: 10, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 6, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 10, marginTop: 8, backgroundColor: colors.skeleton }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1, gap: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 18, fontWeight: '700' },
  saveBtn: { padding: 4 },
  name: { marginBottom: 2 },
  profession: { marginBottom: 8, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontWeight: '700' },
  ratingCount: { fontWeight: '400' },
  rate: { fontWeight: '700' },
  availBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginBottom: 10, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontWeight: '600' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  skillChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  skillText: { fontWeight: '500' },
  moreSkills: { alignSelf: 'center', marginLeft: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontWeight: '400' },
  skeletonLine: { borderRadius: 6 },
});