/**
 * src/screens/candidate/cv-generator/CvPreviewScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium document builder preview.
 * Upgrades: full-screen generating Modal, error recovery, Zod-safe navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { cvGeneratorService } from '../../../services/cvGeneratorService';
import { useGenerateCV, useRegenerateCV } from '../../../hooks/useCvGenerator';
import { useThemeStore } from '../../../store/themeStore';

type Props = NativeStackScreenProps<CandidateStackParamList, 'CvPreview'>;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Template', 'Preview', 'Download'];

const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const { theme: { colors } } = useThemeStore();
  return (
    <View style={si.row}>
      {STEPS.map((label, i) => {
        const done = i < step; const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View style={[si.dot, { backgroundColor: done ? colors.success : active ? colors.primary : colors.border }]}>
                {done
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#fff' : colors.textMuted }}>{i + 1}</Text>
                }
              </View>
              <Text style={{ fontSize: 10, color: done ? colors.success : active ? colors.primary : colors.textMuted, marginTop: 3 }}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[si.line, { backgroundColor: done ? colors.success : colors.border }]} />}
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

// ─── Pulsing dot ─────────────────────────────────────────────────────────────

const PulseDot: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }} />;
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const CvPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { templateId, templateName, regenerateCvId } = route.params;
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;

  const [previewHtml,    setPreviewHtml]    = useState('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError,   setPreviewError]   = useState(false);

  const generateCV   = useGenerateCV();
  const regenerateCV = useRegenerateCV();
  const isWorking    = generateCV.isPending || regenerateCV.isPending;

  const fetchPreview = useCallback(async () => {
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
  }, [templateId]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const handleGenerate = useCallback(() => {
    if (regenerateCvId) {
      regenerateCV.mutate({ cvId: regenerateCvId, templateId }, {
        onSuccess: () => navigation.navigate('GeneratedCVs'),
      });
    } else {
      generateCV.mutate({ templateId, setAsPrimary: false }, {
        onSuccess: () => navigation.navigate('GeneratedCVs'),
      });
    }
  }, [regenerateCvId, templateId, generateCV, regenerateCV, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: typography.md, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {templateName}
        </Text>
        <TouchableOpacity onPress={fetchPreview} disabled={loadingPreview} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color={loadingPreview ? colors.border : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Steps */}
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 14 }}>
        <StepIndicator step={1} />
      </View>

      {/* Template info banner */}
      <View style={[s.infoBanner, { backgroundColor: colors.primaryLight, borderBottomColor: colors.border }]}>
        <Ionicons name="document-text-outline" size={14} color={colors.primary} />
        <Text style={{ fontSize: 12, color: colors.primary, marginLeft: 6, fontWeight: '600' }}>
          Previewing with your actual profile data
        </Text>
      </View>

      {/* WebView area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {previewHtml !== '' && (
          <WebView
            source={{ html: previewHtml }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            scrollEnabled
            showsVerticalScrollIndicator
            onShouldStartLoadWithRequest={(req) => req.url === 'about:blank'}
          />
        )}

        {/* Loading overlay */}
        {loadingPreview && (
          <View style={[s.overlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 14, color: colors.textMuted, fontSize: typography.sm }}>
              Rendering your CV…
            </Text>
          </View>
        )}

        {/* Error state */}
        {previewError && !loadingPreview && (
          <View style={[s.overlay, { backgroundColor: colors.background }]}>
            <View style={[s.errorCard, { backgroundColor: '#FEE2E2', borderRadius: borderRadius.xl }]}>
              <Ionicons name="warning-outline" size={42} color="#EF4444" />
              <Text style={{ color: '#DC2626', marginTop: 12, fontSize: typography.sm, textAlign: 'center', fontWeight: '700' }}>
                Preview failed
              </Text>
              <Text style={{ color: '#7F1D1D', marginTop: 6, fontSize: typography.xs, textAlign: 'center', lineHeight: 17 }}>
                Check your connection and try again.
              </Text>
              <TouchableOpacity
                onPress={fetchPreview}
                style={[s.retryBtn, { borderColor: '#EF4444', borderRadius: borderRadius.md, marginTop: 16 }]}
              >
                <Ionicons name="refresh-outline" size={14} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: typography.xs, marginLeft: 6 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Action bar */}
      <View style={[s.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border, ...shadows.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.btnSecondary, { borderColor: colors.border, borderRadius: borderRadius.lg }]}
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
            s.btnPrimary,
            {
              backgroundColor: isWorking || loadingPreview || previewError
                ? colors.primaryLight
                : colors.primary,
              borderRadius: borderRadius.lg,
            },
          ]}
          activeOpacity={0.87}
        >
          <Ionicons name="download-outline" size={16} color="#fff" />
          <Text style={{ marginLeft: 6, fontSize: typography.sm, fontWeight: '700', color: '#fff' }}>
            {regenerateCvId ? 'Regenerate PDF' : 'Generate PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Full-screen generating Modal ──────────────────────── */}
      <Modal visible={isWorking} transparent animationType="fade" statusBarTranslucent>
        <View style={s.generatingBackdrop}>
          <View style={[s.generatingBox, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.xl }]}>
            {/* Spinning ring */}
            <View style={s.spinnerRing}>
              <ActivityIndicator size="large" color={colors.primary} />
              <View style={[s.spinnerInner, { backgroundColor: colors.primaryLight, borderRadius: 100 }]}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
            </View>

            <Text style={{ marginTop: 22, fontSize: typography.md, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              {regenerateCvId ? 'Regenerating your CV…' : 'Building your CV…'}
            </Text>
            <Text style={{ marginTop: 8, fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
              This may take 10–20 seconds.{'\n'}Please keep the app open.
            </Text>

            {/* Animated dots */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
              <PulseDot color={colors.primary} delay={0}   />
              <PulseDot color={colors.primary} delay={200} />
              <PulseDot color={colors.primary} delay={400} />
            </View>

            {/* Progress steps */}
            <View style={[s.progressSteps, { backgroundColor: colors.background, borderRadius: borderRadius.lg, marginTop: 24 }]}>
              {['Compiling profile data', 'Applying template', 'Exporting PDF'].map((step, i) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  infoBanner:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  overlay:      { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10 },
  errorCard:    { alignItems: 'center', padding: 28, width: '80%' },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 10 },
  actionBar:    { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1 },
  btnSecondary: { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnPrimary:   { flex: 2, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  generatingBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  generatingBox:  { width: '100%', maxWidth: 340, alignItems: 'center', padding: 36 },
  spinnerRing:    { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  spinnerInner:   { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  progressSteps:  { width: '100%', padding: 14 },
});
