// src/screens/shared/RoleVerificationScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, Linking, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import {
  useMyVerificationStatus,
  useOfficeLocation
} from '../../hooks/useVerification';
import { verificationService, getUserId } from '../../services/verificationService';
import { getChecklistByRole, getDocumentsByRole, getRoleStats } from '../../data/verificationChecklists';

// Document Item Component
const DocumentItem: React.FC<{
  doc: any;
  index: number;
  colors: any;
  type: any;
  radius: any;
}> = ({ doc, index, colors, type, radius }) => (
  <View style={[styles.docCard, {
    backgroundColor: colors.surface,
    borderColor: doc.required ? `${colors.danger}40` : `${colors.primary}40`,
    borderRadius: radius.lg
  }]}>
    <View style={styles.docHeader}>
      <View style={[styles.docNumber, {
        backgroundColor: doc.required ? `${colors.danger}20` : `${colors.primary}20`,
        borderRadius: radius.sm
      }]}>
        <Text style={{ color: doc.required ? colors.danger : colors.primary, fontWeight: '700' }}>
          {index + 1}
        </Text>
      </View>
      <View style={[styles.docRequiredBadge, {
        backgroundColor: doc.required ? `${colors.danger}15` : `${colors.primary}15`,
        borderRadius: radius.md
      }]}>
        <Text style={[type.caption, { color: doc.required ? colors.danger : colors.primary, fontWeight: '700' }]}>
          {doc.required ? 'Required' : 'Optional'}
        </Text>
      </View>
    </View>
    <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginTop: 8 }]}>
      {doc.title}
    </Text>
    <Text style={[type.caption, { color: colors.textMuted, marginTop: 4 }]}>
      {doc.description}
    </Text>
    {doc.example && (
      <View style={[styles.docExample, { backgroundColor: `${colors.info}10`, borderRadius: radius.md, marginTop: 8 }]}>
        <Ionicons name="bulb-outline" size={14} color={colors.info} />
        <Text style={[type.caption, { color: colors.info, marginLeft: 6, flex: 1 }]}>
          Example: {doc.example}
        </Text>
      </View>
    )}
    {doc.notes && (
      <View style={[styles.docNote, { backgroundColor: `${colors.warning}10`, borderRadius: radius.md, marginTop: 6 }]}>
        <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
        <Text style={[type.caption, { color: colors.warning, marginLeft: 6, flex: 1 }]}>
          Note: {doc.notes}
        </Text>
      </View>
    )}
  </View>
);

// Checklist Section Component
const ChecklistSection: React.FC<{
  section: any;
  isVerified: boolean;
  colors: any;
  type: any;
  radius: any;
}> = ({ section, isVerified, colors, type, radius }) => (
  <View style={[styles.checklistSection, {
    borderColor: colors.border,
    borderRadius: radius.xl
  }]}>
    <View style={[styles.checklistHeader, {
      backgroundColor: `${colors.primary}10`,
      borderBottomColor: colors.border
    }]}>
      <View style={styles.checklistHeaderLeft}>
        <View style={[styles.checklistIcon, {
          backgroundColor: colors.surface,
          borderRadius: radius.md
        }]}>
          <Ionicons name={section.icon as any} size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '700' }]}>{section.category}</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {section.items.length} verification points
          </Text>
        </View>
      </View>
      {isVerified && (
        <View style={[styles.verifiedBadge, { backgroundColor: `${colors.success}20`, borderRadius: radius.md }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={[type.caption, { color: colors.success, fontWeight: '700', marginLeft: 4 }]}>Verified</Text>
        </View>
      )}
    </View>
    <View style={styles.checklistBody}>
      {section.items.map((item: string, idx: number) => (
        <View key={idx} style={[styles.checklistItem, { borderBottomColor: idx === section.items.length - 1 ? 'transparent' : colors.border }]}>
          <Ionicons
            name={isVerified ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={isVerified ? colors.success : colors.textMuted}
          />
          <Text style={[type.bodySm, { color: isVerified ? colors.text : colors.textMuted, flex: 1, marginLeft: 10 }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

export const RoleVerificationScreen: React.FC = () => {
  const { colors, spacing, radius, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, role: userRole } = useAuthStore();
  
  // Get role from route params or user role
  const role = (route.params as any)?.role || userRole || 'candidate';
  const stats = getRoleStats(role);
  const checklistItems = getChecklistByRole(role);
  const documents = getDocumentsByRole(role);
  
  const { data: verificationData, isLoading, refetch } = useMyVerificationStatus();
  const { data: officeData } = useOfficeLocation();
  
  const verificationStatus = verificationData?.verificationStatus || 'none';
  const isVerified = verificationStatus === 'full';
  const badge = verificationService.getBadgeConfig(verificationStatus);
  
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  const handleScheduleAppointment = () => {
    navigation.navigate('RequestVerification', { role });
  };
  
  const handleGetDirections = () => {
    if (officeData?.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(officeData.address)}`;
      Linking.openURL(url);
    }
  };
  
  const handlePrint = () => {
    Alert.alert('Print Checklist', 'This will generate a PDF of your verification checklist.');
    // Implement PDF generation if needed
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle="light-content" />
        <AppHeader title={`${role.charAt(0).toUpperCase() + role.slice(1)} Verification`} showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={stats.color} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        title={`${role.charAt(0).toUpperCase() + role.slice(1)} Verification`}
        showBack
        rightAction={
          <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
            <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
      >
        {/* Verification Badge Header */}
        <View style={[styles.headerCard, {
          backgroundColor: withAlpha(badge.color, 0.12),
          borderColor: withAlpha(badge.color, 0.35),
          borderRadius: radius.xl,
          ...shadows.md
        }]}>
          <View style={[styles.headerIcon, { backgroundColor: withAlpha(badge.color, 0.2), borderRadius: radius.xl }]}>
            <Ionicons name={badge.icon as any} size={48} color={badge.color} />
          </View>
          <Text style={[type.h2, { color: badge.color, marginTop: spacing.md, fontWeight: '800' }]}>
            {badge.label}
          </Text>
          {verificationData?.verificationMessage && (
            <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              {verificationData.verificationMessage}
            </Text>
          )}
          
          {/* Progress */}
          {verificationData?.verificationDetails && (
            <>
              <View style={[styles.progressBar, { backgroundColor: withAlpha(colors.border, 0.6), marginTop: spacing.lg }]}>
                <View style={[styles.progressFill, {
                  width: `${verificationService.calculateProgress(verificationData.verificationDetails)}%`,
                  backgroundColor: badge.color
                }]} />
              </View>
              <Text style={[type.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                {verificationService.calculateProgress(verificationData.verificationDetails)}% complete
              </Text>
            </>
          )}
        </View>
        
        {/* Quick Stats */}
        <View style={[styles.statsGrid, { gap: spacing.md, marginTop: spacing.lg }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stats.color}20`, borderRadius: radius.md }]}>
              <Ionicons name="apps-outline" size={22} color={stats.color} />
            </View>
            <Text style={[type.h3, { color: colors.text, fontWeight: '800' }]}>{stats.categories}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>Categories</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stats.color}20`, borderRadius: radius.md }]}>
              <Ionicons name="checkmark-circle" size={22} color={stats.color} />
            </View>
            <Text style={[type.h3, { color: colors.text, fontWeight: '800' }]}>{stats.checkpoints}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>Checkpoints</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stats.color}20`, borderRadius: radius.md }]}>
              <Ionicons name="time-outline" size={22} color={stats.color} />
            </View>
            <Text style={[type.h3, { color: colors.text, fontWeight: '800' }]}>{stats.minutes}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>Minutes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stats.color}20`, borderRadius: radius.md }]}>
              <Ionicons name="calendar-outline" size={22} color={stats.color} />
            </View>
            <Text style={[type.h3, { color: colors.text, fontWeight: '800' }]}>{stats.days}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>Processing Days</Text>
          </View>
        </View>
        
        {/* Required Documents */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={[type.h3, { color: colors.text, fontWeight: '700', marginLeft: spacing.sm }]}>Required Documents</Text>
          </View>
          <Text style={[type.caption, { color: colors.textMuted, marginBottom: spacing.md, marginLeft: 34 }]}>
            Bring these documents to your verification appointment
          </Text>
          
          {documents.map((doc, index) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              index={index}
              colors={colors}
              type={type}
              radius={radius}
            />
          ))}
          
          {/* Instructions Box */}
          <View style={[styles.instructionsBox, { backgroundColor: `${colors.info}10`, borderColor: `${colors.info}30`, borderRadius: radius.lg, marginTop: spacing.md }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.info} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.bodySm, { color: colors.info, fontWeight: '700' }]}>Important Instructions</Text>
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 4 }]}>
                • Bring original documents or certified copies{'\n'}
                • All documents must be current and valid{'\n'}
                • Arrive 15 minutes before appointment time{'\n'}
                • Processing takes {stats.days} business days
              </Text>
            </View>
          </View>
        </View>
        
        {/* Verification Checklist */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkbox-outline" size={22} color={colors.primary} />
            <Text style={[type.h3, { color: colors.text, fontWeight: '700', marginLeft: spacing.sm }]}>Verification Checklist</Text>
          </View>
          <Text style={[type.caption, { color: colors.textMuted, marginBottom: spacing.md, marginLeft: 34 }]}>
            {stats.categories} categories covering all verification requirements
          </Text>
          
          {checklistItems.map((section, index) => (
            <ChecklistSection
              key={index}
              section={section}
              isVerified={isVerified}
              colors={colors}
              type={type}
              radius={radius}
            />
          ))}
        </View>
        
        {/* CTA Section */}
        {!isVerified && (
          <View style={[styles.ctaSection, {
            backgroundColor: stats.color,
            borderRadius: radius.xl,
            marginTop: spacing.xl,
            ...shadows.lg
          }]}>
            <Text style={[type.h3, { color: '#FFF', fontWeight: '800', textAlign: 'center' }]}>
              Ready to Get Verified?
            </Text>
            <Text style={[type.bodySm, { color: `${stats.color}20`, textAlign: 'center', marginTop: spacing.sm }]}>
              Complete your verification to unlock all platform features
            </Text>
            
            <View style={[styles.ctaButtons, { gap: spacing.md, marginTop: spacing.lg }]}>
              <TouchableOpacity
                onPress={handleScheduleAppointment}
                style={[styles.ctaButtonPrimary, { backgroundColor: '#FFF', borderRadius: radius.lg }]}
              >
                <Ionicons name="calendar-outline" size={20} color={stats.color} />
                <Text style={[type.bodySm, { color: stats.color, fontWeight: '700', marginLeft: 8 }]}>Schedule Appointment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleGetDirections}
                style={[styles.ctaButtonSecondary, { backgroundColor: withAlpha('#FFF', 0.2), borderRadius: radius.lg }]}
              >
                <Ionicons name="location-outline" size={20} color="#FFF" />
                <Text style={[type.bodySm, { color: '#FFF', fontWeight: '700', marginLeft: 8 }]}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerCard: { padding: 24, alignItems: 'center', borderWidth: 1 },
  headerIcon: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  progressBar: { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 99 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', padding: 14, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  
  docCard: { padding: 14, marginBottom: 10, borderWidth: 1 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docNumber: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  docRequiredBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  docExample: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  docNote: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  
  checklistSection: { marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  checklistHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  checklistBody: { padding: 14 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5 },
  
  instructionsBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1 },
  
  ctaSection: { padding: 24, overflow: 'hidden' },
  ctaButtons: { flexDirection: 'column' },
  ctaButtonPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  ctaButtonSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
});

export default RoleVerificationScreen;