/**
 * src/screens/candidate/cv-generator/CvPreviewScreen.tsx
 * Refactored: useTheme(), correct color aliases, insets for sticky action bar.
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { cvGeneratorService } from '../../../services/cvGeneratorService';
import { useGenerateCV, useRegenerateCV } from '../../../hooks/useCvGenerator';
import { useTheme } from '../../../hooks/useTheme';

type Props = NativeStackScreenProps<CandidateStackParamList, 'CvPreview'>;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Template', 'Preview', 'Download'];

const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const { colors, radius } = useTheme();
  return (
    <View style={si.row}>
      {STEPS.map((label, i) => {
        const done = i < step; const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View style={[si.dot, {
                backgroundColor: done ? colors.success : active ? colors.primary : colors.border,
                borderRadius: radius.full,
              }]}>
                {done
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#fff' : colors.textMuted }}>{i + 1}</Text>
                }
              </View>
              <Text style={{ fontSize: 10, color: done ? colors.success : active ? colors.primary : colors.textMuted, marginTop: 3 }}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[si.line, { backgroundColor: done ? colors.success : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const si = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot:  { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
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
  return (
    <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }} />
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const CvPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { templateId, templateName, regenerateCvId } = route.params;
  const { colors, radius, shadows, spacing, type } = useTheme();
  const insets = useSafeAreaInsets();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="default" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: type.body.fontSize, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {templateName}
        </Text>
        <TouchableOpacity
          onPress={fetchPreview}
          disabled={loadingPreview}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh-outline" size={22} color={loadingPreview ? colors.border : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Steps */}
      <View style={{ backgroundColor: colors.bgCard, paddingHorizontal: 24, paddingVertical: 14 }}>
        <StepIndicator step={1} />
      </View>

      {/* Info banner */}
      <View style={[s.infoBanner, { backgroundColor: colors.primaryBg, borderBottomColor: colors.border }]}>
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
          <View style={[s.overlay, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 14, color: colors.textMuted, fontSize: type.bodySm.fontSize }}>
              Rendering your CV…
            </Text>
          </View>
        )}

        {/* Error state */}
        {previewError && !loadingPreview && (
          <View style={[s.overlay, { backgroundColor: colors.bg }]}>
            <View style={[s.errorCard, { backgroundColor: colors.dangerBg, borderRadius: radius.xl }]}>
              <Ionicons name="warning-outline" size={42} color={colors.danger} />
              <Text style={{ color: colors.danger, marginTop: 12, fontSize: type.bodySm.fontSize, textAlign: 'center', fontWeight: '700' }}>
                Preview failed
              </Text>
              <Text style={{ color: colors.danger, marginTop: 6, fontSize: type.caption.fontSize, textAlign: 'center', lineHeight: 17, opacity: 0.8 }}>
                Check your connection and try again.
              </Text>
              <TouchableOpacity
                onPress={fetchPreview}
                style={[s.retryBtn, { borderColor: colors.danger, borderRadius: radius.md, marginTop: 16 }]}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: type.caption.fontSize, marginLeft: 6 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Action bar */}
      <View style={[
        s.actionBar,
        {
          backgroundColor: colors.bgCard,
          borderTopColor:  colors.border,
          paddingBottom:   insets.bottom + spacing.md,
          ...shadows.lg,
        },
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.btnSecondary, { borderColor: colors.border, borderRadius: radius.lg }]}
        >
          <Ionicons name="arrow-back-outline" size={15} color={colors.text} />
          <Text style={{ marginLeft: 5, fontSize: type.bodySm.fontSize, fontWeight: '600', color: colors.text }}>
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
                ? colors.primaryBg
                : colors.primary,
              borderRadius: radius.lg,
            },
          ]}
          activeOpacity={0.87}
        >
          <Ionicons name="download-outline" size={16} color="#fff" />
          <Text style={{ marginLeft: 6, fontSize: type.bodySm.fontSize, fontWeight: '700', color: '#fff' }}>
            {regenerateCvId ? 'Regenerate PDF' : 'Generate PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen generating Modal */}
      <Modal visible={isWorking} transparent animationType="fade" statusBarTranslucent>
        <View style={s.generatingBackdrop}>
          <View style={[s.generatingBox, { backgroundColor: colors.bgCard, borderRadius: radius.xl, ...shadows.md }]}>
            {/* Spinner ring */}
            <View style={s.spinnerRing}>
              <ActivityIndicator size="large" color={colors.primary} />
              <View style={[s.spinnerInner, { backgroundColor: colors.primaryBg, borderRadius: radius.full }]}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
            </View>

            <Text style={{ marginTop: 22, fontSize: type.body.fontSize, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              {regenerateCvId ? 'Regenerating your CV…' : 'Building your CV…'}
            </Text>
            <Text style={{ marginTop: 8, fontSize: type.bodySm.fontSize, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
              {'This may take 10–20 seconds.\nPlease keep the app open.'}
            </Text>

            {/* Animated dots */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
              <PulseDot color={colors.primary} delay={0}   />
              <PulseDot color={colors.primary} delay={200} />
              <PulseDot color={colors.primary} delay={400} />
            </View>

            {/* Progress steps */}
            <View style={[s.progressSteps, { backgroundColor: colors.bg, borderRadius: radius.lg, marginTop: 24 }]}>
              {['Compiling profile data', 'Applying template', 'Exporting PDF'].map((step) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: type.caption.fontSize, color: colors.textMuted }}>{step}</Text>
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
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  infoBanner:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  overlay:            { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10 },
  errorCard:          { alignItems: 'center', padding: 28, width: '80%' },
  retryBtn:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 10 },
  actionBar:          { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1 },
  btnSecondary:       { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnPrimary:         { flex: 2, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  generatingBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  generatingBox:      { width: '100%', maxWidth: 340, alignItems: 'center', padding: 36 },
  spinnerRing:        { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  spinnerInner:       { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  progressSteps:      { width: '100%', padding: 14 },
});