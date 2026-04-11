/**
 * src/screens/candidate/cv-generator/CvTemplatesScreen.tsx
 * Step 1 of CV Generator — browse and select a template.
 */

import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { TemplateCard } from '../../../components/cv/TemplateCard';
import { useTemplates } from '../../../hooks/useCvGenerator';
import { useThemeStore } from '../../../store/themeStore';
import { CVTemplate } from '../../../services/cvGeneratorService';

type Props = NativeStackScreenProps<CandidateStackParamList, 'CvTemplates'>;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Template', 'Preview', 'Download'];

const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={styles.stepRow}>
      {STEPS.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      done || active ? colors.primary : colors.borderLight,
                  },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={11} color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontSize:   10,
                      fontWeight: '700',
                      color:      active ? '#fff' : colors.textMuted,
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontSize:   10,
                  color:
                    done || active ? colors.primary : colors.textMuted,
                  marginTop: 3,
                  fontWeight: active ? '700' : '400',
                }}
              >
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: done ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── Filter chips ─────────────────────────────────────────────────────────────

const KNOWN_STYLES = ['modern', 'classic', 'creative', 'professional', 'tech'];
const ALL_FILTERS  = ['All', ...KNOWN_STYLES, 'other'];

// ─── Main screen ─────────────────────────────────────────────────────────────

export const CvTemplatesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;

  const { data: templates = [], isLoading } = useTemplates();
  const [activeFilter, setActiveFilter]     = useState('All');
  const [selectedId,   setSelectedId]       = useState<string | null>(null);

  const filtered = useMemo<CVTemplate[]>(() => {
    if (activeFilter === 'All')   return templates;
    if (activeFilter === 'other')
      return templates.filter(t => !KNOWN_STYLES.includes(t.style));
    return templates.filter(t => t.style === activeFilter);
  }, [templates, activeFilter]);

  const handleSelect = (template: CVTemplate) => {
    setSelectedId(template.id);
    navigation.navigate('CvPreview', {
      templateId:   template.id,
      templateName: template.name,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
          Choose Template
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('GeneratedCVs')}>
          <Text style={{ fontSize: typography.sm, fontWeight: '600', color: colors.primary }}>
            My CVs
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Step indicator ──────────────────────────────────────── */}
      <View
        style={{
          backgroundColor:  colors.surface,
          paddingHorizontal: 24,
          paddingVertical:  14,
        }}
      >
        <StepIndicator step={0} />
      </View>

      {/* ── Style filter chips ──────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ maxHeight: 50 }}
      >
        {ALL_FILTERS.map(f => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor:     active ? colors.primary : colors.border,
                  borderRadius:    borderRadius.full,
                },
              ]}
            >
              <Text
                style={{
                  fontSize:      typography.xs,
                  fontWeight:    '600',
                  textTransform: 'capitalize',
                  color:         active ? '#fff' : colors.textMuted,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Template grid ───────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: typography.sm }}>
            Loading templates…
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-evenly', paddingHorizontal: 8 }}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              selected={selectedId === item.id}
              onSelect={() => handleSelect(item)}
              style={{ marginBottom: 14 }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-outline" size={52} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: typography.sm }}>
                No templates in this category
              </Text>
            </View>
          }
        />
      )}

      {/* ── Footer tip ──────────────────────────────────────────── */}
      <View
        style={[
          styles.tip,
          { backgroundColor: colors.infoLight, borderRadius: borderRadius.md },
        ]}
      >
        <Ionicons name="information-circle-outline" size={15} color={colors.info} />
        <Text style={{ fontSize: 11, color: colors.info, flex: 1, marginLeft: 6, lineHeight: 16 }}>
          Your profile data fills the CV automatically — keep your profile updated for the best results.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  stepRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepDot: {
    width:          26,
    height:         26,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex:      1,
    height:    2,
    maxWidth:  56,
    marginHorizontal: 6,
  },
  chipRow: {
    paddingHorizontal: 14,
    alignItems:        'center',
    gap:               8,
    paddingVertical:   8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderWidth:       1.5,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     60,
  },
  tip: {
    flexDirection: 'row',
    alignItems:    'center',
    position:      'absolute',
    bottom:        10,
    left:          12,
    right:         12,
    padding:       10,
  },
});