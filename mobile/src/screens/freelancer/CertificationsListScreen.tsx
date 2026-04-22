/**
 * screens/freelancer/CertificationsListScreen.tsx
 * Aligned to backend GET/POST/PUT/DELETE /freelancer/certifications endpoints.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Linking, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import {
  useFreelancerCertifications,
  useDeleteCertification,
} from '../../hooks/useFreelancer';
import {
  ScreenWrapper, ScreenHeader, LoadingState, EmptyState,
} from '../../components/shared/UIComponents';
import CertificationFormModal from '../../components/freelancer/CertificationFormModal';
import type { FreelancerCertification } from '../../types/freelancer';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── Cert Card ────────────────────────────────────────────────────────────────

const CertCard: React.FC<{
  cert: FreelancerCertification;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ cert, onEdit, onDelete }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing, shadows } = theme;

  const now        = new Date();
  const isExpired  = cert.expiryDate ? new Date(cert.expiryDate) < now : false;
  const expiringSoon = cert.expiryDate && !isExpired
    ? new Date(cert.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    : false;

  const statusColor = isExpired ? colors.error : expiringSoon ? colors.warning : colors.success;
  const statusBg    = isExpired ? colors.errorLight : expiringSoon ? colors.warningLight : colors.successLight;
  const statusLabel = isExpired ? 'Expired' : expiringSoon ? 'Expiring Soon' : 'Active';

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

  return (
    <View style={[styles.certCard, {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      borderColor: colors.border,
      ...shadows.sm,
    }]}>
      {/* Header */}
      <View style={styles.certHeader}>
        <View style={[styles.certIcon, {
          backgroundColor: colors.primaryLight,
          borderRadius: borderRadius.md,
        }]}>
          <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing[3] }}>
          <Text style={{ fontSize: typography.base, fontWeight: '700', color: colors.text }} numberOfLines={2}>
            {cert.name}
          </Text>
          <Text style={{ fontSize: typography.sm, color: colors.primary, fontWeight: '600', marginTop: 2 }}>
            {cert.issuer}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderRadius: 10 }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={[styles.datesRow, { marginTop: spacing[3] }]}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginLeft: 4 }}>
            Issued {fmtDate(cert.issueDate)}
          </Text>
        </View>
        {cert.expiryDate && (
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={13} color={isExpired ? colors.error : colors.textMuted} />
            <Text style={{ fontSize: typography.xs, color: isExpired ? colors.error : colors.textMuted, marginLeft: 4 }}>
              Expires {fmtDate(cert.expiryDate)}
            </Text>
          </View>
        )}
      </View>

      {cert.credentialId && (
        <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: spacing[2] }}>
          ID: {cert.credentialId}
        </Text>
      )}

      {/* Skills */}
      {cert.skills && cert.skills.length > 0 && (
        <View style={[styles.skillsRow, { marginTop: spacing[3] }]}>
          {cert.skills.slice(0, 4).map((sk, i) => (
            <View key={i} style={[styles.skillTag, { backgroundColor: colors.primaryLight, borderRadius: 8 }]}>
              <Text style={{ fontSize: 9, fontWeight: '600', color: colors.primary }}>{sk}</Text>
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
      <View style={[styles.certActions, { borderTopColor: colors.border, marginTop: spacing[3], paddingTop: spacing[3] }]}>
        {cert.credentialUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(cert.credentialUrl!)}
            style={[styles.certActionBtn, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md }]}
          >
            <Ionicons name="open-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: typography.xs, color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
              Verify
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onEdit}
          style={[styles.certActionBtn, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
        >
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: typography.xs, color: colors.textSecondary, fontWeight: '700', marginLeft: 4 }}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.certActionBtn, { backgroundColor: colors.errorLight, borderRadius: borderRadius.md }]}
        >
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={{ fontSize: typography.xs, color: colors.error, fontWeight: '700', marginLeft: 4 }}>
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
  const { theme }  = useThemeStore();
  const { colors, spacing } = theme;

  const [formVisible, setFormVisible]   = useState(false);
  const [editingCert, setEditingCert]   = useState<FreelancerCertification | null>(null);

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

      <FlatList
        data={certs}
        keyExtractor={c => c._id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
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
        style={[styles.fab, { backgroundColor: colors.primary }]}
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
  fab:           { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});