// src/components/bids/BidderInfo.tsx
// Bidder name resolution with fallback hierarchy:
//   coverSheet.companyName → bidderCompany.name → bidder.firstName lastName
// FIXED: Removed invalid `title` prop from Text component
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BidderInfoProps {
  bidder?: any;
  company?: any;
  coverSheetName?: string;
  size?: 'sm' | 'md';
}

// ─── Component ─────────────────────────────────────────────────────────────

export const BidderInfo: React.FC<BidderInfoProps> = ({
  bidder,
  company,
  coverSheetName,
  size = 'md',
}) => {
  const { colors } = useTheme();

  // Resolution order: coverSheet → populated company → populated user
  const isPopulatedCompany =
    company != null &&
    typeof company === 'object' &&
    'name' in company &&
    typeof company.name === 'string' &&
    company.name.trim().length > 0;

  const isPopulatedUser =
    bidder != null &&
    typeof bidder === 'object' &&
    'firstName' in bidder;

  const name = coverSheetName?.trim()
    ? coverSheetName.trim()
    : isPopulatedCompany
    ? company.name
    : isPopulatedUser
    ? `${bidder.firstName ?? ''} ${bidder.lastName ?? ''}`.trim() || 'Bidder'
    : null;

  // Show skeleton when no data
  if (!name && (typeof bidder === 'string' || (typeof company === 'string' && !isPopulatedUser))) {
    return (
      <View style={styles.skeleton}>
        <View style={[styles.skelAvatar, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.skelName, { backgroundColor: colors.skeleton }]} />
      </View>
    );
  }

  const displayName = name ?? 'Bidder';
  const logo = isPopulatedCompany ? company.logo ?? null : null;
  const avatarSize = size === 'sm' ? 30 : 40;
  const nameSize = size === 'sm' ? 12 : 14;

  return (
    <View style={styles.container}>
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: 10 }]}
          accessibilityLabel={`${displayName} logo`}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            {
              width: avatarSize,
              height: avatarSize,
              backgroundColor: colors.primaryBg,
              borderRadius: 10,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: colors.primary, fontSize: size === 'sm' ? 12 : 15 },
            ]}
          >
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.name,
          { color: colors.text, fontSize: nameSize },
        ]}
        numberOfLines={1}
        accessibilityLabel={displayName}
      >
        {displayName}
      </Text>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  avatar: {
    flexShrink: 0,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontWeight: '800',
  },
  name: {
    fontWeight: '700',
    flex: 1,
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  skelName: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
});

export default BidderInfo;