// src/components/bids/BidTabBar.tsx
// Shared underline tab bar used by MyBidDetailScreen + OwnerBidDetailScreen.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface BidTabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

const BidTabBar: React.FC<BidTabBarProps> = ({ tabs, active, onChange }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        tbs.bar,
        { backgroundColor: colors.bgCard, borderBottomColor: colors.border },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[
              tbs.tab,
              isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                tbs.label,
                {
                  color: isActive ? colors.primary : colors.textMuted,
                  fontWeight: isActive ? '700' : '400',
                },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const tbs = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: { fontSize: 14 },
});

export default BidTabBar;