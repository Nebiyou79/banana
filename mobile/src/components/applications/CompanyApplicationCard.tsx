import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationStatus,
  ALLOWED_TRANSITIONS,
  STATUS_LABEL,
} from '../../services/applicationService';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

interface Props {
  application: Application;
  onPress: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  colors: any;
  typography: any;
}

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const CompanyApplicationCard: React.FC<Props> = ({
  application,
  onPress,
  onStatusChange,
  colors,
  typography,
}) => {
  const candidate = application.candidate ?? application.userInfo;
  const name = (candidate as any)?.name ?? 'Candidate';
  const headline = (candidate as any)?.headline ?? (candidate as any)?.email ?? '';
  const avatarUrl = (candidate as any)?.avatar;
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  const allowed = ALLOWED_TRANSITIONS[application.status] ?? [];

  const handleMoveStatus = () => {
    if (!allowed.length) return;
    const options = allowed.map((s) => STATUS_LABEL[s]);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
          title: 'Move application to…',
        },
        (idx) => {
          if (idx < options.length) onStatusChange(allowed[idx]);
        }
      );
    } else {
      Alert.alert(
        'Move to…',
        undefined,
        [
          ...allowed.map((s) => ({
            text: STATUS_LABEL[s],
            onPress: () => onStatusChange(s),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={s.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: typography.sm }}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.name, { color: colors.text, fontSize: typography.base }]} numberOfLines={1}>
          {name}
        </Text>
        {!!headline && (
          <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]} numberOfLines={1}>
            {headline}
          </Text>
        )}
        <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>
          {fmt(application.createdAt)}
        </Text>
        <View style={s.row}>
          <ApplicationStatusBadge status={application.status} size="sm" />
        </View>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {allowed.length > 0 && (
          <TouchableOpacity
            style={[s.moveBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
            onPress={(e) => { e.stopPropagation(); handleMoveStatus(); }}
          >
            <Text style={{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }}>Move →</Text>
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const AVATAR = 44;

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  avatarWrap: {},
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  info: { flex: 1, gap: 3 },
  name: { fontWeight: '700' },
  row: { flexDirection: 'row', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moveBtn: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
