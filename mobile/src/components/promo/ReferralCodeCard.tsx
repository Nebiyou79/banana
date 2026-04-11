/**
 * src/components/promo/ReferralCodeCard.tsx
 * Amber/gold card displaying the user's referral code with copy + share actions.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralStats } from '../../services/promoCodeService';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  code: string;
  stats: ReferralStats;
  onShare: () => void;
  onCopy: () => void;
  isGenerating?: boolean;
}

const StatPill = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text
      style={{
        fontSize:   22,
        fontWeight: '800',
        color:      accent ? '#D97706' : '#92400E',
      }}
    >
      {value}
    </Text>
    <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>{label}</Text>
  </View>
);

export const ReferralCodeCard: React.FC<Props> = ({
  code,
  stats,
  onShare,
  onCopy,
  isGenerating = false,
}) => {
  const { theme } = useThemeStore();
  const { borderRadius, typography } = theme;

  return (
    <View
      style={[
        styles.card,
        { borderRadius: borderRadius.xl },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={{ fontSize: 22 }}>🎁</Text>
        <Text
          style={{
            fontSize:   typography.sm,
            fontWeight: '700',
            color:      '#92400E',
            marginLeft: 8,
          }}
        >
          Your Referral Code
        </Text>
      </View>

      {/* Code box */}
      <View style={[styles.codeBox, { borderRadius: borderRadius.lg }]}>
        {isGenerating ? (
          <ActivityIndicator color="#D97706" size="small" style={{ flex: 1 }} />
        ) : (
          <Text
            style={styles.codeText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {code}
          </Text>
        )}
        <TouchableOpacity
          onPress={onCopy}
          disabled={isGenerating}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="copy-outline" size={20} color="#B45309" />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          onPress={onCopy}
          disabled={isGenerating}
          style={[
            styles.btnOutline,
            { borderRadius: borderRadius.lg },
          ]}
        >
          <Ionicons name="copy-outline" size={16} color="#D97706" />
          <Text style={styles.btnOutlineText}>Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          disabled={isGenerating}
          style={[
            styles.btnFilled,
            { borderRadius: borderRadius.lg },
          ]}
        >
          <Ionicons name="share-social-outline" size={16} color="#fff" />
          <Text style={styles.btnFilledText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <StatPill label="Referred"  value={stats.totalReferrals} />
        <View style={styles.divider} />
        <StatPill label="Completed" value={stats.completedReferrals} />
        <View style={styles.divider} />
        <StatPill label="Points"    value={stats.rewardPoints} accent />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin:           16,
    padding:          20,
    backgroundColor:  '#FFFBEB',
    borderWidth:      1.5,
    borderColor:      '#FDE68A',
    // shadow
    shadowColor:      '#F59E0B',
    shadowOpacity:    0.2,
    shadowRadius:     10,
    shadowOffset:     { width: 0, height: 4 },
    elevation:        5,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   16,
  },
  codeBox: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical:   14,
    marginBottom:     14,
    gap:              10,
  },
  codeText: {
    flex:        1,
    fontSize:    22,
    fontWeight:  '800',
    color:       '#B45309',
    letterSpacing: 3,
    fontFamily:  'monospace',
    textAlign:   'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  16,
  },
  btnOutline: {
    flex:           1,
    height:         46,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    borderColor:    '#F59E0B',
    gap:            6,
  },
  btnOutlineText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#D97706',
  },
  btnFilled: {
    flex:           1,
    height:         46,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    gap:            6,
  },
  btnFilledText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#fff',
  },
  statsStrip: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     16,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  divider: {
    width:           1,
    height:          36,
    backgroundColor: '#FDE68A',
  },
});