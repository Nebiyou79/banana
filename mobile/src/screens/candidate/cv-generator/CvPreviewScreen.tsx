/**
 * src/screens/candidate/cv-generator/CvPreviewScreen.tsx
 * Step 2 — preview the CV template with user data, then trigger PDF generation.
 *
 * ⚠️  PDF generation is slow (3–15 s). A full-screen Modal overlay is shown
 *     so the user cannot accidentally navigate away.
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { cvGeneratorService } from '../../../services/cvGeneratorService';
import { useGenerateCV, useRegenerateCV } from '../../../hooks/useCvGenerator';
import { useThemeStore } from '../../../store/themeStore';

type Props = NativeStackScreenProps<CandidateStackParamList, 'CvPreview'>;

// ─── Step indicator (reused) ──────────────────────────────────────────────────

const STEPS = ['Template', 'Preview', 'Download'];

const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={si.row}>
      {STEPS.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={[
                  si.dot,
                  { backgroundColor: done || active ? colors.primary : colors.borderLight },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={11} color="#fff" />
                ) : (
                  <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#fff' : colors.textMuted }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 10, color: done || active ? colors.primary : colors.textMuted, marginTop: 3 }}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[si.line, { backgroundColor: done ? colors.primary : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const si = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot:  { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2, maxWidth: 56, marginHorizontal: 6 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CvPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { templateId, templateName, regenerateCvId } = route.params;
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;

  const [previewHtml,   setPreviewHtml]   = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError,   setPreviewError]   = useState(false);

  const generateCV   = useGenerateCV();
  const regenerateCV = useRegenerateCV();

  const isWorking = generateCV.isPending || regenerateCV.isPending;

  // ── Load HTML preview ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchPreview();
  }, [templateId]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setPreviewError(false);
    try {
      const html = await cvGeneratorService.previewCV(templateId);
      setPreviewHtml(html);
    } catch {
      setPreviewError(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Generate / Regenerate ─────────────────────────────────────────────────

  const handleGenerate = () => {
    if (regenerateCvId) {
      regenerateCV.mutate(
        { cvId: regenerateCvId, templateId },
        { onSuccess: () => navigation.navigate('GeneratedCVs') },
      );
    } else {
      generateCV.mutate(
        { templateId, setAsPrimary: false },
        { onSuccess: () => navigation.navigate('GeneratedCVs') },
      );
    }
  };

  const generateLabel  = regenerateCvId ? 'Regenerate PDF' : 'Generate PDF';
  const generatingText = regenerateCvId ? 'Regenerating your CV…' : 'Generating your CV…';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={{ fontSize: typography.md, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {templateName}
        </Text>

        {/* Reload preview */}
        <TouchableOpacity
          onPress={fetchPreview}
          disabled={loadingPreview}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 14 }}>
        <StepIndicator step={1} />
      </View>

      {/* WebView preview area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {previewHtml !== '' && (
          <WebView
            source={{ html: previewHtml }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            scrollEnabled
            showsVerticalScrollIndicator
            // Prevent links from navigating away
            onShouldStartLoadWithRequest={(req: { url: string; }) => req.url === 'about:blank'}
          />
        )}

        {/* Loading overlay */}
        {loadingPreview && (
          <View style={[styles.overlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 14, color: colors.textMuted, fontSize: typography.sm }}>
              Rendering preview…
            </Text>
          </View>
        )}

        {/* Error state */}
        {previewError && !loadingPreview && (
          <View style={[styles.overlay, { backgroundColor: colors.background }]}>
            <Ionicons name="warning-outline" size={52} color={colors.error} />
            <Text
              style={{
                color: colors.error, marginTop: 10, fontSize: typography.sm, textAlign: 'center',
              }}
            >
              Could not load the preview.{'\n'}Check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={fetchPreview}
              style={[
                styles.retryBtn,
                { borderColor: colors.error, borderRadius: borderRadius.lg },
              ]}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: '600', marginLeft: 6 }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.btnSecondary,
            { borderColor: colors.border, borderRadius: borderRadius.lg },
          ]}
        >
          <Ionicons name="arrow-back-outline" size={15} color={colors.text} />
          <Text style={{ marginLeft: 5, fontSize: typography.sm, fontWeight: '600', color: colors.text }}>
            Change
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isWorking || loadingPreview || previewError}
          style={[
            styles.btnPrimary,
            {
              backgroundColor:
                isWorking || loadingPreview || previewError
                  ? colors.primaryLight
                  : colors.primary,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Ionicons name="download-outline" size={16} color="#fff" />
          <Text style={{ marginLeft: 6, fontSize: typography.sm, fontWeight: '700', color: '#fff' }}>
            {generateLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Full-screen generating overlay (Modal) ─────────────── */}
      <Modal visible={isWorking} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.generatingBackdrop}>
          <View
            style={[
              styles.generatingBox,
              { backgroundColor: colors.card, borderRadius: borderRadius.xl },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                marginTop: 18,
                fontSize:  typography.md,
                fontWeight: '700',
                color:     colors.text,
                textAlign: 'center',
              }}
            >
              {generatingText}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize:  typography.sm,
                color:     colors.textMuted,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              This may take 10–20 seconds.{'\n'}Please don't close the app.
            </Text>

            {/* Animated dots indicator */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={{
                    width:           8,
                    height:          8,
                    borderRadius:    4,
                    backgroundColor: colors.primary,
                    opacity:         0.4 + i * 0.3,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    gap:            10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        24,
    zIndex:         10,
  },
  retryBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      16,
    borderWidth:    1.5,
    paddingHorizontal: 20,
    paddingVertical:   10,
  },
  actionBar: {
    flexDirection: 'row',
    padding:       12,
    gap:           10,
    borderTopWidth: 1,
  },
  btnSecondary: {
    flex:           1,
    height:         50,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
  },
  btnPrimary: {
    flex:           2,
    height:         50,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  generatingBackdrop: {
    flex:             1,
    backgroundColor:  'rgba(0,0,0,0.68)',
    alignItems:       'center',
    justifyContent:   'center',
    padding:          24,
  },
  generatingBox: {
    width:      '100%',
    maxWidth:   340,
    alignItems: 'center',
    padding:    36,
    // shadow
    shadowColor:    '#000',
    shadowOpacity:  0.3,
    shadowRadius:   20,
    shadowOffset:   { width: 0, height: 8 },
    elevation:      12,
  },
});