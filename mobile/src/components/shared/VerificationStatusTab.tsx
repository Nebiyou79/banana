// src/components/shared/VerificationStatusTab.tsx
/**
 * Shared Verification Status Tab Component
 * Displays user's verification status with appropriate styling and actions
 * Can be used in Profile, More, or Dashboard screens
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService } from '../../services/verificationService';

// Types
export type VerificationTabSize = 'small' | 'medium' | 'large';
export type VerificationTabVariant = 'card' | 'badge' | 'banner' | 'inline';

interface VerificationStatusTabProps {
  size?: VerificationTabSize;
  variant?: VerificationTabVariant;
  showActions?: boolean;
  showProgress?: boolean;
  onPress?: () => void;
  customStyle?: any;
  compact?: boolean;
}

// Skeleton Loader
const VerificationSkeleton: React.FC<{ variant: VerificationTabVariant; colors: any }> = ({ 
  variant, 
  colors 
}) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  if (variant === 'badge') {
    return (
      <Animated.View
        style={[
          styles.skeletonBadge,
          { backgroundColor: colors.skeleton, opacity: anim }
        ]}
      />
    );
  }

  if (variant === 'inline') {
    return (
      <Animated.View
        style={[
          styles.skeletonInline,
          { backgroundColor: colors.skeleton, opacity: anim }
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeletonCard,
        { backgroundColor: colors.skeleton, opacity: anim }
      ]}
    />
  );
};

// Main Component
export const VerificationStatusTab: React.FC<VerificationStatusTabProps> = ({
  size = 'medium',
  variant = 'card',
  showActions = true,
  showProgress = true,
  onPress,
  customStyle,
  compact = false,
}) => {
  const { colors, spacing, radius, type, shadows } = useTheme();
  const navigation = useNavigation<any>();
  const { user, role } = useAuthStore();
  
  const { data, isLoading, refetch } = useMyVerificationStatus();

  const status = data?.verificationStatus || 'none';
  const details = data?.verificationDetails;
  const progress = details ? verificationService.calculateProgress(details) : 0;
  const badge = verificationService.getBadgeConfig(status);
  const canRequest = verificationService.canRequestVerification(status, details?.lastVerified);

  // Role-specific messages
  const roleMessages = useMemo(() => {
    const roleMap: Record<string, string> = {
      candidate: 'Complete verification to get more job opportunities',
      freelancer: 'Verified freelancers get 3x more project invites',
      company: 'Verified companies build trust with freelancers',
      organization: 'Verification enhances your credibility',
    };
    return roleMap[role || 'candidate'] || 'Complete verification to unlock full features';
  }, [role]);

  // Handle press
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (showActions) {
      if (status === 'none' || (status === 'partial' && canRequest)) {
        navigation.navigate('RequestVerification' as never);
      } else {
        navigation.navigate('VerificationStatus' as never);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return <VerificationSkeleton variant={variant} colors={colors} />;
  }

  // Badge variant (small, compact)
  if (variant === 'badge') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.badgeContainer,
          {
            backgroundColor: withAlpha(badge.color, 0.12),
            borderColor: withAlpha(badge.color, 0.3),
            paddingVertical: size === 'small' ? 6 : 8,
            paddingHorizontal: size === 'small' ? 10 : 14,
            borderRadius: radius.lg,
          },
          customStyle,
        ]}
      >
        <Ionicons name={badge.icon} size={size === 'small' ? 14 : 16} color={badge.color} />
        <Text
          style={[
            type.caption,
            {
              color: badge.color,
              fontWeight: '700',
              marginLeft: 6,
              fontSize: size === 'small' ? 11 : 12,
            },
          ]}
        >
          {compact ? (status === 'full' ? 'Verified' : status === 'partial' ? 'Partial' : 'Unverified') : badge.label}
        </Text>
        {!compact && status !== 'full' && showActions && (
          <Ionicons name="chevron-forward" size={14} color={badge.color} style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>
    );
  }

  // Inline variant (horizontal, compact)
  if (variant === 'inline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.inlineContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            paddingVertical: size === 'small' ? 10 : 12,
            paddingHorizontal: spacing.md,
          },
          customStyle,
        ]}
      >
        <View style={[styles.inlineIcon, { backgroundColor: withAlpha(badge.color, 0.12), borderRadius: radius.md }]}>
          <Ionicons name={badge.icon} size={20} color={badge.color} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '700' }]}>
            {badge.label}
          </Text>
          {!compact && (
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
              {status === 'full' ? 'Your account is fully verified' : roleMessages}
            </Text>
          )}
        </View>
        {showActions && status !== 'full' && (
          <View style={[styles.actionButton, { backgroundColor: badge.color, borderRadius: radius.md }]}>
            <Text style={[type.caption, { color: colors.textInverse, fontWeight: '700' }]}>
              {status === 'none' ? 'Verify' : 'Complete'}
            </Text>
          </View>
        )}
        {status === 'full' && (
          <Ionicons name="checkmark-circle" size={22} color={badge.color} />
        )}
      </TouchableOpacity>
    );
  }

  // Banner variant (full width, prominent)
  if (variant === 'banner') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.bannerContainer,
          {
            backgroundColor: badge.bgColor,
            borderLeftColor: badge.color,
            borderLeftWidth: 4,
            borderRadius: radius.lg,
            padding: spacing.lg,
          },
          customStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.bannerIcon, { backgroundColor: withAlpha(badge.color, 0.2), borderRadius: radius.lg }]}>
            <Ionicons name={badge.icon} size={28} color={badge.color} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[type.body, { color: badge.color, fontWeight: '800' }]}>
              {badge.label}
            </Text>
            <Text style={[type.caption, { color: colors.text, marginTop: 4, opacity: 0.8 }]}>
              {status === 'full' 
                ? 'You have full access to all platform features' 
                : roleMessages}
            </Text>
            {showProgress && status !== 'full' && (
              <View style={[styles.progressContainer, { marginTop: spacing.md }]}>
                <View style={[styles.progressBar, { backgroundColor: withAlpha(badge.color, 0.2), borderRadius: radius.sm }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%`, backgroundColor: badge.color, borderRadius: radius.sm }
                    ]} 
                  />
                </View>
                <Text style={[type.caption, { color: badge.color, fontWeight: '700', marginTop: 4 }]}>
                  {progress}% Complete
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Card variant (default, comprehensive)
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: size === 'large' ? spacing.xl : spacing.lg,
          ...shadows.sm,
        },
        customStyle,
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: withAlpha(badge.color, 0.12), borderRadius: radius.lg }]}>
          <Ionicons name={badge.icon} size={size === 'large' ? 32 : 24} color={badge.color} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[type.h3, { color: badge.color, fontWeight: '800', fontSize: size === 'large' ? 20 : 16 }]}>
            {badge.label}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {status === 'full' 
              ? 'Trusted member with full verification' 
              : `${progress}% verification complete`}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {showProgress && status !== 'full' && (
        <View style={[styles.progressContainer, { marginTop: spacing.md }]}>
          <View style={[styles.progressBar, { backgroundColor: withAlpha(badge.color, 0.15), borderRadius: radius.sm }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: badge.color, borderRadius: radius.sm }
              ]} 
            />
          </View>
          <Text style={[type.caption, { color: badge.color, fontWeight: '700', marginTop: 6 }]}>
            {progress}% Complete
          </Text>
        </View>
      )}

      {/* Verification Checks Summary */}
      {!compact && details && (
        <View style={[styles.checksContainer, { marginTop: spacing.md, gap: spacing.sm }]}>
          {[
            { key: 'profileVerified', label: 'Profile', icon: 'person-outline' },
            { key: 'emailVerified', label: 'Email', icon: 'mail-outline' },
            { key: 'phoneVerified', label: 'Phone', icon: 'call-outline' },
            { key: 'documentsVerified', label: 'Documents', icon: 'document-text-outline' },
            { key: 'socialVerified', label: 'Social', icon: 'share-social-outline' },
          ].map((check) => {
            const isVerified = details[check.key as keyof typeof details] as boolean;
            return (
              <View key={check.key} style={styles.checkRow}>
                <Ionicons 
                  name={isVerified ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={16} 
                  color={isVerified ? badge.color : colors.textMuted} 
                />
                <Text style={[type.caption, { color: isVerified ? colors.text : colors.textMuted, marginLeft: spacing.sm, flex: 1 }]}>
                  {check.label}
                </Text>
                {!isVerified && status !== 'full' && (
                  <Text style={[type.caption, { color: badge.color, fontWeight: '600' }]}>Pending</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Action Button */}
      {showActions && status !== 'full' && (
        <View style={[styles.actionContainer, { marginTop: spacing.lg }]}>
          <View style={[styles.actionButtonLarge, { backgroundColor: badge.color, borderRadius: radius.lg }]}>
            <Text style={[type.bodySm, { color: colors.textInverse, fontWeight: '700' }]}>
              {status === 'none' ? 'Start Verification' : 'Complete Verification'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textInverse} style={{ marginLeft: 6 }} />
          </View>
        </View>
      )}

      {/* Fully Verified Badge */}
      {status === 'full' && (
        <View style={[styles.verifiedBadge, { backgroundColor: withAlpha(badge.color, 0.12), borderRadius: radius.lg, marginTop: spacing.md }]}>
          <Ionicons name="checkmark-circle" size={18} color={badge.color} />
          <Text style={[type.caption, { color: badge.color, fontWeight: '700', marginLeft: spacing.sm }]}>
            All verification steps completed
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
  // Badge variant
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  // Inline variant
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  inlineIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  // Banner variant
  bannerContainer: {
    overflow: 'hidden',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card variant
  cardContainer: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Progress
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  
  // Checks
  checksContainer: {
    marginTop: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Actions
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  
  // Verified badge
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  
  // Skeletons
  skeletonBadge: {
    width: 100,
    height: 32,
    borderRadius: 8,
  },
  skeletonInline: {
    height: 60,
    borderRadius: 12,
  },
  skeletonCard: {
    height: 180,
    borderRadius: 16,
  },
});

export default VerificationStatusTab;