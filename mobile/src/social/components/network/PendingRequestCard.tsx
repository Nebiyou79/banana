import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { FollowTarget } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';

interface Props {
  followId: string;
  user: FollowTarget;
  createdAt?: string;
  onPress?: () => void;
  onAccept: () => void;
  onReject: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

/**
 * Pending follow request. Two side-by-side buttons (Accept, Reject) with
 * live loading states.
 */
const PendingRequestCard: React.FC<Props> = memo(
  ({
    user,
    createdAt,
    onPress,
    onAccept,
    onReject,
    acceptLoading,
    rejectLoading,
  }) => {
    const theme = useSocialTheme();
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.top}
        >
          <Avatar
            uri={user.avatar}
            name={user.name}
            size={SOCIAL_LAYOUT.avatarMd}
          />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: theme.text }]}
                numberOfLines={1}
              >
                {user.name}
              </Text>
              {user.role ? <RoleBadge role={user.role} /> : null}
            </View>
            {user.headline ? (
              <Text
                style={[styles.headline, { color: theme.subtext }]}
                numberOfLines={1}
              >
                {user.headline}
              </Text>
            ) : null}
            {createdAt ? (
              <Text style={[styles.time, { color: theme.muted }]}>
                Requested {formatRelativeTime(createdAt)}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onReject}
            disabled={rejectLoading || acceptLoading}
            activeOpacity={0.8}
            style={[
              styles.btn,
              {
                backgroundColor: theme.cardAlt,
                borderColor: theme.border,
              },
            ]}
          >
            {rejectLoading ? (
              <ActivityIndicator size="small" color={theme.subtext} />
            ) : (
              <>
                <Ionicons name="close" size={16} color={theme.subtext} />
                <Text
                  style={[styles.btnText, { color: theme.subtext }]}
                >
                  Decline
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            disabled={rejectLoading || acceptLoading}
            activeOpacity={0.85}
            style={[
              styles.btn,
              styles.btnPrimary,
              { backgroundColor: theme.primary },
            ]}
          >
            {acceptLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>
                  Accept
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

PendingRequestCard.displayName = 'PendingRequestCard';

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', maxWidth: 180 },
  headline: { fontSize: 12, marginTop: 1 },
  time: { fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
  },
  btnPrimary: { borderColor: 'transparent' },
  btnText: { fontSize: 13, fontWeight: '700' },
});

export default PendingRequestCard;