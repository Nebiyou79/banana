/**
 * screens/freelancer/CertificationsListScreen.tsx
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, Linking, Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { formatShortDate } from '../../theme/utils';
import {
  useFreelancerCertifications,
  useDeleteCertification,
} from '../../hooks/useFreelancer';
import {
  ScreenWrapper, LoadingState, EmptyState,
} from '../../components/shared/UIComponents';
import CertificationFormModal from '../../components/freelancer/CertificationFormModal';
import type { FreelancerCertification } from '../../types/freelancer';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';
import { ScreenHeader } from '../../components/freelancer/ScreenHeader';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const shadow = (color: string) =>
  Platform.OS === 'ios'
    ? { shadowColor: color, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 }
    : { elevation: 4 };

// ─── Cert Card ────────────────────────────────────────────────────────────────

const CertCard: React.FC<{
  cert: FreelancerCertification;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ cert, onEdit, onDelete }) => {
  const { colors, radius, spacing } = useTheme();

  const now = new Date();
  const isExpired = cert.expiryDate ? new Date(cert.expiryDate) < now : false;
  const expiringSoon = cert.expiryDate && !isExpired
    ? new Date(cert.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    : false;

  const statusColor = isExpired ? colors.danger : expiringSoon ? colors.warning : colors.success;
  const statusBg = isExpired ? colors.dangerBg : expiringSoon ? colors.warningBg : colors.successBg;
  const statusLabel = isExpired ? 'Expired' : expiringSoon ? 'Expiring Soon' : 'Active';

  return (
    <View style={[styles.certCard, {
      backgroundColor: colors.bgCard,
      borderRadius: radius.xl,
      borderColor: colors.border,
      ...shadow(colors.shadowColor),
    }]}>
      {/* Header */}
      <View style={styles.certHeader}>
        <View style={[styles.certIcon, {
          backgroundColor: withAlpha(colors.freelancer, 0.10),
          borderRadius: radius.md,
        }]}>
          <Ionicons name="ribbon-outline" size={24} color={colors.freelancer} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ fontSize: FONT_SIZE.base, fontWeight: '700', color: colors.text }} numberOfLines={2}>
            {cert.name}
          </Text>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.freelancer, fontWeight: '600', marginTop: 2 }}>
            {cert.issuer}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderRadius: 10 }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={[styles.datesRow, { marginTop: spacing.md }]}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginLeft: 4 }}>
            Issued {formatShortDate(cert.issueDate)}
          </Text>
        </View>
        {cert.expiryDate && (
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={13} color={isExpired ? colors.danger : colors.textMuted} />
            <Text style={{ fontSize: FONT_SIZE.xs, color: isExpired ? colors.danger : colors.textMuted, marginLeft: 4 }}>
              Expires {formatShortDate(cert.expiryDate)}
            </Text>
          </View>
        )}
      </View>

      {cert.credentialId && (
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: spacing.sm }}>
          ID: {cert.credentialId}
        </Text>
      )}

      {/* Skills */}
      {cert.skills && cert.skills.length > 0 && (
        <View style={[styles.skillsRow, { marginTop: spacing.md }]}>
          {cert.skills.slice(0, 4).map((sk, i) => (
            <View key={i} style={[styles.skillTag, { backgroundColor: withAlpha(colors.freelancer, 0.10), borderRadius: 8 }]}>
              <Text style={{ fontSize: 9, fontWeight: '600', color: colors.freelancer }}>{sk}</Text>
            </View>
          ))}
          {cert.skills.length > 4 && (
            <Text style={{ fontSize: 9, color: colors.textMuted, marginLeft: 4 }}>
              +{cert.skills.length - 4} more
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.certActions, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
        {cert.credentialUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(cert.credentialUrl!)}
            style={[styles.certActionBtn, { backgroundColor: withAlpha(colors.freelancer, 0.10), borderRadius: radius.md }]}
          >
            <Ionicons name="open-outline" size={14} color={colors.freelancer} />
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.freelancer, fontWeight: '700', marginLeft: 4 }}>
              Verify
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onEdit}
          style={[styles.certActionBtn, { backgroundColor: colors.bgCard, borderRadius: radius.md }]}
        >
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, fontWeight: '700', marginLeft: 4 }}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.certActionBtn, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.danger, fontWeight: '700', marginLeft: 4 }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CertificationsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [formVisible, setFormVisible] = useState(false);
  const [editingCert, setEditingCert] = useState<FreelancerCertification | null>(null);

  const { data: certs = [], isLoading, refetch, isRefetching } = useFreelancerCertifications();
  const deleteMutation = useDeleteCertification();

  const handleEdit = (cert: FreelancerCertification) => {
    setEditingCert(cert);
    setFormVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Certification', 'Remove this certification from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const handleAdd = () => {
    setEditingCert(null);
    setFormVisible(true);
  };

  if (isLoading) return (
    <ScreenWrapper>
      <ScreenHeader title="Certifications" onBack={() => navigation.goBack()} />
      <LoadingState message="Loading certifications…" />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Certifications"
        subtitle={`${certs.length} certification${certs.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add', onPress: handleAdd }}
      />

      <FlashList
        data={certs}
        keyExtractor={c => c._id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="ribbon-outline"
            title="No certifications yet"
            subtitle="Add your professional certifications to boost your profile credibility."
            action={{ label: 'Add Certification', onPress: handleAdd }}
          />
        }
        renderItem={({ item }) => (
          <CertCard
            cert={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item._id)}
          />
        )}
      />

      <TouchableOpacity
        onPress={handleAdd}
        style={[styles.fab, {
          backgroundColor: colors.primary,
          bottom: insets.bottom + spacing.lg,
        }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CertificationFormModal
        visible={formVisible}
        certification={editingCert}
        onClose={() => { setFormVisible(false); setEditingCert(null); }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  certCard:      { padding: 16, borderWidth: 1, marginBottom: 12 },
  certHeader:    { flexDirection: 'row', alignItems: 'flex-start' },
  certIcon:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  datesRow:      { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  dateItem:      { flexDirection: 'row', alignItems: 'center' },
  skillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  skillTag:      { paddingHorizontal: 8, paddingVertical: 3 },
  certActions:   { flexDirection: 'row', gap: 8, borderTopWidth: 1 },
  certActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36 },
  fab:           { position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});