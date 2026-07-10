// src/screens/NotificationPreferencesScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/useNotifications';
import type {
  NotificationCategory,
  NotificationPreferences,
  ChannelSettings,
} from '../types/notification';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  social:       '💬 Social (likes, follows, mentions)',
  messaging:    '✉️ Messaging (DMs, requests)',
  jobs:         '💼 Jobs & Applications',
  tenders:      '📋 Tenders & Bids',
  proposals:    '📄 Proposals (freelance)',
  verification: '🛡️ Verification',
  appointments: '📅 Appointments',
  referrals:    '🎁 Referrals & Rewards',
  system:       '📢 System Announcements',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as NotificationCategory[];

export const NotificationPreferencesScreen: React.FC = () => {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: updatePrefs } = useUpdateNotificationPreferences();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0A2540" />
      </View>
    );
  }

  if (!prefs) return null;

  const handleGlobalToggle = (value: boolean) => {
    updatePrefs({ globalEnabled: value });
  };

  const handleCategoryChannelToggle = (
    category: NotificationCategory,
    channel: keyof ChannelSettings,
    value: boolean
  ) => {
    updatePrefs({
      categories: {
        ...prefs.categories,
        [category]: {
          ...prefs.categories[category],
          [channel]: value,
        },
      },
    } as Partial<NotificationPreferences>);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>All Notifications</Text>
            <Text style={styles.rowSubtitle}>
              Master switch for all notifications
            </Text>
          </View>
          <Switch
            value={prefs.globalEnabled}
            onValueChange={handleGlobalToggle}
            trackColor={{ true: '#0A2540', false: '#D1D5DB' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {prefs.globalEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {CATEGORIES.map((category) => {
            const catPrefs = prefs.categories[category];
            return (
              <View key={category} style={styles.categoryCard}>
                <Text style={styles.categoryLabel}>
                  {CATEGORY_LABELS[category]}
                </Text>
                <View style={styles.channelRow}>
                  <ChannelToggle
                    label="In-app"
                    value={catPrefs.inApp}
                    onChange={(v) =>
                      handleCategoryChannelToggle(category, 'inApp', v)
                    }
                  />
                  <ChannelToggle
                    label="Push"
                    value={catPrefs.push}
                    onChange={(v) =>
                      handleCategoryChannelToggle(category, 'push', v)
                    }
                  />
                  <ChannelToggle
                    label="Email"
                    value={catPrefs.email}
                    onChange={(v) =>
                      handleCategoryChannelToggle(category, 'email', v)
                    }
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const ChannelToggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, value, onChange }) => (
  <View style={styles.channelToggle}>
    <Text style={styles.channelLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: '#0A2540', false: '#D1D5DB' }}
      thumbColor="#FFFFFF"
      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  categoryCard: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 0,
  },
  channelToggle: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  channelLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});