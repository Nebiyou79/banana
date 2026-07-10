/**
 * mobile/src/social/components/publicProfile/VisibilitySheet.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom-sheet modal for controlling public profile visibility.
 * Used by MyPublicProfileScreen.
 *
 * Controls:
 *   • Master "Publicly visible" toggle (shows/hides the entire profile)
 *   • Granular field toggles: email, phone, location, education, experience,
 *     certifications, portfolio, services, social links
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocialTheme } from '../../theme/socialTheme';
import { useTogglePublicVisibility } from '../../hooks/usePublicProfileNew';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VisibilityState {
  isPubliclyVisible:  boolean;
  visibility: {
    profile:        'public' | 'connections' | 'private';
    email:          boolean;
    phone:          boolean;
    location:       boolean;
    education:      boolean;
    experience:     boolean;
    certifications: boolean;
    portfolio:      boolean;
    services:       boolean;
    socialLinks:    boolean;
  };
}

interface VisibilitySheetProps {
  visible:         boolean;
  onClose:         () => void;
  current:         VisibilityState;
  /** Role determines which granular fields are shown */
  role:            'candidate' | 'freelancer' | 'company' | 'organization' | string;
}

// ── Row component ─────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  icon:      string;
  label:     string;
  sublabel?: string;
  value:     boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
}> = memo(({ icon, label, sublabel, value, onChange, disabled }) => {
  const theme = useSocialTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.1) }]}>
        <Ionicons name={icon as any} size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: disabled ? theme.muted : theme.text }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.rowSub, { color: theme.muted }]} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.colors.primary + '80' }}
        thumbColor={value ? theme.colors.primary : theme.muted}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
});

ToggleRow.displayName = 'ToggleRow';

// ── Main component ────────────────────────────────────────────────────────────

const VisibilitySheet: React.FC<VisibilitySheetProps> = memo(({
  visible,
  onClose,
  current,
  role,
}) => {
  const theme       = useSocialTheme();
  const toggleM     = useTogglePublicVisibility();
  const slideAnim   = useRef(new Animated.Value(600)).current;

  // Local state mirrors the server state so toggles feel instant
  const [masterVisible, setMasterVisible] = useState(current.isPubliclyVisible);
  const [fields, setFields]               = useState(current.visibility);

  // Re-sync when modal opens with fresh data
  useEffect(() => {
    if (visible) {
      setMasterVisible(current.isPubliclyVisible);
      setFields(current.visibility);
      Animated.spring(slideAnim, {
        toValue: 0, friction: 8, tension: 120, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible, current]);

  const handleMasterToggle = (val: boolean) => {
    setMasterVisible(val);
    toggleM.mutate({ isPubliclyVisible: val });
  };

  const handleFieldToggle = (field: keyof typeof fields, val: boolean) => {
    const next = { ...fields, [field]: val };
    setFields(next);
    toggleM.mutate({ visibility: { [field]: val } });
  };

  const isCandidate   = role === 'candidate';
  const isFreelancer  = role === 'freelancer';
  const isCompanyOrg  = role === 'company' || role === 'organization';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.bg, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <SafeAreaView edges={['bottom']}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Title row */}
          <View style={[styles.titleRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Visibility settings
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 480 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Master toggle */}
            <View style={[styles.section, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.05) }]}>
              <ToggleRow
                icon="globe-outline"
                label="Publicly visible"
                sublabel="When off, only you can see your public profile"
                value={masterVisible}
                onChange={handleMasterToggle}
              />
            </View>

            {/* Granular fields — only meaningful when master is on */}
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>
              FIELD VISIBILITY
            </Text>

            <ToggleRow
              icon="location-outline"
              label="Location"
              value={fields.location}
              onChange={(v) => handleFieldToggle('location', v)}
              disabled={!masterVisible}
            />
            <ToggleRow
              icon="mail-outline"
              label="Email address"
              value={fields.email}
              onChange={(v) => handleFieldToggle('email', v)}
              disabled={!masterVisible}
            />
            <ToggleRow
              icon="call-outline"
              label="Phone number"
              value={fields.phone}
              onChange={(v) => handleFieldToggle('phone', v)}
              disabled={!masterVisible}
            />
            <ToggleRow
              icon="share-social-outline"
              label="Social links"
              value={fields.socialLinks}
              onChange={(v) => handleFieldToggle('socialLinks', v)}
              disabled={!masterVisible}
            />

            {/* Candidate + Freelancer fields */}
            {(isCandidate || isFreelancer) ? (
              <>
                <ToggleRow
                  icon="school-outline"
                  label="Education & Experience"
                  value={fields.education && fields.experience}
                  onChange={(v) => {
                    handleFieldToggle('education', v);
                    handleFieldToggle('experience', v);
                  }}
                  disabled={!masterVisible}
                />
                <ToggleRow
                  icon="ribbon-outline"
                  label="Certifications"
                  value={fields.certifications}
                  onChange={(v) => handleFieldToggle('certifications', v)}
                  disabled={!masterVisible}
                />
              </>
            ) : null}

            {/* Freelancer-only */}
            {isFreelancer ? (
              <>
                <ToggleRow
                  icon="albums-outline"
                  label="Portfolio"
                  value={fields.portfolio}
                  onChange={(v) => handleFieldToggle('portfolio', v)}
                  disabled={!masterVisible}
                />
                <ToggleRow
                  icon="construct-outline"
                  label="Services"
                  value={fields.services}
                  onChange={(v) => handleFieldToggle('services', v)}
                  disabled={!masterVisible}
                />
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
});

VisibilitySheet.displayName = 'VisibilitySheet';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position:     'absolute',
    bottom:       0,
    left:         0,
    right:        0,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingTop:   4,
    ...Platform.select({
      android: { elevation: 24 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handle:     { width: 40, height: 4, borderRadius: 2 },
  titleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingBottom:  12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom:   8,
  },
  title: { fontSize: 16, fontWeight: '700' },
  section: { marginHorizontal: 0, marginBottom: 8 },
  sectionTitle: {
    fontSize:  10,
    fontWeight:'700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop:   12,
    paddingBottom: 6,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:  14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap:            12,
    minHeight:      56,
  },
  rowIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel:{ fontSize: 14, fontWeight: '600' },
  rowSub:  { fontSize: 11, marginTop: 2 },
});

export default VisibilitySheet;