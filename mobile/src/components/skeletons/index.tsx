// index.tsx (Skeletons)
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ShimmerProps {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({ style, borderRadius = 8 }) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <Animated.View style={[{ backgroundColor: colors.skeleton, borderRadius, opacity }, style]} />
  );
};

export const JobCardSkeleton: React.FC = () => {
  const { colors, radius } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.xl }]}>
      <View style={sk.row1}>
        <Shimmer style={sk.logo} borderRadius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer style={sk.titleLine} />
          <Shimmer style={sk.subLine} />
        </View>
      </View>
      <View style={sk.metaRow}>
        {[80, 100, 70].map((w, i) => <Shimmer key={i} style={[sk.metaChip, { width: w }]} borderRadius={radius.full} />)}
      </View>
      <View style={sk.row3}>
        <Shimmer style={sk.salaryChip} borderRadius={radius.sm} />
        <Shimmer style={sk.typePill} borderRadius={radius.full} />
      </View>
      <View style={[sk.footer, { borderTopColor: colors.borderPrimary }]}>
        <Shimmer style={sk.footerLine} />
      </View>
    </View>
  );
};

export const ApplicationCardSkeleton: React.FC = () => {
  const { colors, radius } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.xl }]}>
      <View style={sk.row1}>
        <Shimmer style={sk.logo} borderRadius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer style={sk.titleLine} />
          <Shimmer style={sk.subLine} />
        </View>
        <Shimmer style={sk.badge} borderRadius={radius.full} />
      </View>
      <View style={sk.progressRow}>
        {[1,2,3,4,5].map(i => (
          <React.Fragment key={i}>
            <Shimmer style={sk.progDot} borderRadius={radius.sm} />
            {i < 5 && <Shimmer style={sk.progLine} />}
          </React.Fragment>
        ))}
      </View>
      <View style={[sk.footer, { borderTopColor: colors.borderPrimary }]}>
        <Shimmer style={sk.footerLine} />
        <Shimmer style={{ width: 60, height: 24 }} borderRadius={radius.full} />
      </View>
    </View>
  );
};

export const CompanyJobCardSkeleton: React.FC = () => {
  const { colors, radius } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.xl, borderLeftWidth: 4 }]}>
      <View style={sk.row1}>
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer style={sk.titleLine} />
          <Shimmer style={[sk.subLine, { width: '50%' }]} />
        </View>
        <Shimmer style={sk.badge} borderRadius={radius.full} />
      </View>
      <Shimmer style={sk.statsBar} borderRadius={radius.md} />
      <Shimmer style={[sk.subLine, { marginTop: 10, width: '100%' }]} />
      <View style={sk.metaRow}>
        {[90, 110, 80].map((w, i) => <Shimmer key={i} style={[sk.metaChip, { width: w }]} borderRadius={radius.full} />)}
      </View>
      <Shimmer style={sk.actionBar} borderRadius={radius.md} />
    </View>
  );
};

export const ApplicantCardSkeleton: React.FC = () => {
  const { colors, radius } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.xl }]}>
      <View style={sk.row1}>
        <Shimmer style={[sk.logo, { width: 46, height: 46 }]} borderRadius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer style={sk.titleLine} />
          <Shimmer style={sk.subLine} />
        </View>
        <Shimmer style={sk.badge} borderRadius={radius.full} />
      </View>
      <View style={sk.metaRow}>
        {[70, 90, 60, 80].map((w, i) => <Shimmer key={i} style={[sk.metaChip, { width: w }]} borderRadius={radius.md} />)}
      </View>
      <View style={[sk.footer, { borderTopColor: colors.borderPrimary }]}>
        <Shimmer style={{ width: 100, height: 14 }} />
        <Shimmer style={{ width: 80, height: 28 }} borderRadius={radius.full} />
      </View>
    </View>
  );
};

interface ListSkeletonProps {
  count?: number;
  type?: 'job' | 'application' | 'companyJob' | 'applicant';
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 4, type = 'job' }) => {
  const map = {
    job: JobCardSkeleton,
    application: ApplicationCardSkeleton,
    companyJob: CompanyJobCardSkeleton,
    applicant: ApplicantCardSkeleton,
  };
  const Component = map[type];
  return (
    <View style={{ gap: 12, padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </View>
  );
};

const sk = StyleSheet.create({
  card: { borderWidth: 1, padding: 16 },
  row1: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logo: { width: 44, height: 44 },
  titleLine: { height: 16, width: '80%', borderRadius: 4 },
  subLine: { height: 12, width: '50%', borderRadius: 4 },
  badge: { width: 72, height: 24, borderRadius: 20 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaChip: { height: 26, borderRadius: 20 },
  row3: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  salaryChip: { width: 100, height: 24, borderRadius: 8 },
  typePill: { width: 64, height: 24, borderRadius: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  footerLine: { width: 100, height: 12, borderRadius: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  progDot: { width: 16, height: 16 },
  progLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'transparent' },
  statsBar: { height: 60, marginTop: 14, borderRadius: 12 },
  actionBar: { height: 42, marginTop: 14, borderRadius: 10 },
});