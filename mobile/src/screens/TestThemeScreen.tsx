import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useThemeStore } from '../store/themeStores';
import { useTheme } from '../hooks/useTheme';

export const TestThemeScreen: React.FC = () => {
  const { colors, isDark, spacing } = useTheme();
  const { toggle, theme } = useThemeStore();

  console.log('=== Theme Debug ===');
  console.log('isDark:', isDark);
  console.log('bg:', colors.bg);
  console.log('text:', colors.text);
  console.log('bgCard:', colors.bgCard);
  console.log('Mode:', theme.mode);
  console.log('Should be:', isDark ? 'dark (#1A2235 bg)' : 'light (#FFFFFF bg)');
  console.log('==================');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[s.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {/* Current Theme Indicator */}
        <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.text }]}>
            Current Theme: {isDark ? '🌙 Dark' : '☀️ Light'}
          </Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>
            Mode: {theme.mode || 'system'}
          </Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>
            Background: {colors.bg}
          </Text>
        </View>

        {/* Toggle Button */}
        <TouchableOpacity
          style={[s.button, { backgroundColor: colors.primary }]}
          onPress={toggle}
        >
          <Text style={[s.buttonText, { color: colors.textInverse }]}>
            Toggle Theme
          </Text>
        </TouchableOpacity>

        {/* Color Swatches */}
        <Text style={[s.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Color Swatches
        </Text>
        
        <View style={s.swatchGrid}>
          {[
            { name: 'bg', color: colors.bg },
            { name: 'bgCard', color: colors.bgCard },
            { name: 'surface', color: colors.surface },
            { name: 'text', color: colors.text },
            { name: 'textSecondary', color: colors.textSecondary },
            { name: 'textMuted', color: colors.textMuted },
            { name: 'primary', color: colors.primary },
            { name: 'danger', color: colors.danger },
            { name: 'success', color: colors.success },
            { name: 'candidate', color: colors.candidate },
          ].map((swatch) => (
            <View key={swatch.name} style={s.swatchItem}>
              <View
                style={[
                  s.swatchColor,
                  { backgroundColor: swatch.color, borderColor: colors.border },
                ]}
              />
              <Text style={[s.swatchName, { color: colors.textMuted }]}>
                {swatch.name}
              </Text>
              <Text style={[s.swatchHex, { color: colors.textMuted }]}>
                {swatch.color}
              </Text>
            </View>
          ))}
        </View>

        {/* Status Colors */}
        <Text style={[s.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Status Colors
        </Text>
        
        {['success', 'warning', 'danger', 'info'].map((status) => (
          <View
            key={status}
            style={[
              s.statusBar,
              {
                backgroundColor: (colors as any)[status + 'Bg'] || colors.surface,
                borderColor: (colors as any)[status],
              },
            ]}
          >
            <Text style={{ color: (colors as any)[status], fontWeight: '600' }}>
              {status.toUpperCase()}: {(colors as any)[status]}
            </Text>
          </View>
        ))}

        {/* Input Preview */}
        <Text style={[s.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Input Preview
        </Text>
        
        <View
          style={[
            s.inputPreview,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Text style={{ color: colors.inputPlaceholder }}>
            Placeholder text
          </Text>
        </View>

        {/* Tab Bar Preview */}
        <Text style={[s.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Tab Bar Preview
        </Text>
        
        <View style={[s.tabBar, { backgroundColor: colors.tabBar, borderColor: colors.tabBarBorder }]}>
          <View style={[s.tabItem, { backgroundColor: colors.tabActive + '20' }]}>
            <Text style={{ color: colors.tabActive, fontWeight: '700' }}>Active Tab</Text>
          </View>
          <View style={s.tabItem}>
            <Text style={{ color: colors.tabInactive }}>Inactive Tab</Text>
          </View>
        </View>

        {/* Add some bottom padding for the debugger */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Floating Theme Debugger ──────────────────────────────────── */}
      <View style={[debugStyles.container, { 
        backgroundColor: colors.bgCard,
        borderColor: colors.primary + '40',
        shadowColor: colors.shadowColor,
      }]}>
        <View style={debugStyles.header}>
          <Text style={[debugStyles.title, { color: colors.text }]}>
            🎨 Theme Debugger
          </Text>
          <View style={[debugStyles.badge, { 
            backgroundColor: isDark ? '#1A2235' : colors.primary + '20' 
          }]}>
            <Text style={[debugStyles.badgeText, { 
              color: isDark ? colors.text : colors.primary 
            }]}>
              {theme.mode || 'system'}
            </Text>
          </View>
        </View>
        
        <View style={debugStyles.row}>
          <Text style={[debugStyles.label, { color: colors.textMuted }]}>
            Theme:
          </Text>
          <Text style={[debugStyles.value, { color: colors.primary }]}>
            {isDark ? '🌙 Dark' : '☀️ Light'}
          </Text>
        </View>
        
        <View style={debugStyles.row}>
          <Text style={[debugStyles.label, { color: colors.textMuted }]}>
            Background:
          </Text>
          <Text style={[debugStyles.value, { color: colors.text, fontFamily: 'monospace' }]}>
            {colors.bg}
          </Text>
        </View>
        
        <View style={debugStyles.row}>
          <Text style={[debugStyles.label, { color: colors.textMuted }]}>
            Card:
          </Text>
          <Text style={[debugStyles.value, { color: colors.text, fontFamily: 'monospace' }]}>
            {colors.bgCard}
          </Text>
        </View>

        <View style={debugStyles.row}>
          <Text style={[debugStyles.label, { color: colors.textMuted }]}>
            Text:
          </Text>
          <Text style={[debugStyles.value, { color: colors.text, fontFamily: 'monospace' }]}>
            {colors.text}
          </Text>
        </View>

        <View style={[debugStyles.divider, { backgroundColor: colors.border }]} />

        <View style={debugStyles.colorPreview}>
          <View style={[debugStyles.colorBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={[debugStyles.colorBoxText, { color: colors.text }]}>bg</Text>
          </View>
          <View style={[debugStyles.colorBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[debugStyles.colorBoxText, { color: colors.text }]}>card</Text>
          </View>
          <View style={[debugStyles.colorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[debugStyles.colorBoxText, { color: colors.text }]}>surface</Text>
          </View>
          <View style={[debugStyles.colorBox, { backgroundColor: colors.primary, borderColor: colors.primaryDark }]}>
            <Text style={[debugStyles.colorBoxText, { color: '#FFFFFF' }]}>primary</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[debugStyles.toggleBtn, { backgroundColor: colors.primary }]}
          onPress={toggle}
          activeOpacity={0.8}
        >
          <Text style={[debugStyles.toggleText, { color: colors.textInverse }]}>
            Toggle Theme
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  swatchColor: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  swatchName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  swatchHex: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  statusBar: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  inputPreview: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

// ─── Debugger specific styles ─────────────────────────────────────────────────
const debugStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  colorBox: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBoxText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
});