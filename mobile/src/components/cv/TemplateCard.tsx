/**
 * src/components/cv/TemplateCard.tsx
 * Selectable CV template card used in the template picker grid.
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CVTemplate } from '../../services/cvGeneratorService';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  template: CVTemplate;
  selected?: boolean;
  onSelect: () => void;
  style?: ViewStyle;
}

// Map template style → Ionicon name for the thumbnail illustration
const STYLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  classic:      'business-outline',
  modern:       'sparkles-outline',
  creative:     'color-palette-outline',
  professional: 'briefcase-outline',
  elegant:      'pencil-outline',
  tech:         'code-slash-outline',
  infographic:  'bar-chart-outline',
  compact:      'document-text-outline',
  academic:     'school-outline',
  freelancer:   'rocket-outline',
};

export const TemplateCard: React.FC<Props> = ({
  template,
  selected = false,
  onSelect,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  const iconName: keyof typeof Ionicons.glyphMap =
    STYLE_ICONS[template.style] ?? 'document-outline';

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius:    borderRadius.lg,
          borderWidth:     selected ? 2.5 : 1.5,
          borderColor:     selected ? template.primaryColor : colors.border,
          shadowColor:     selected ? template.primaryColor : '#000',
          shadowOpacity:   selected ? 0.28 : 0.06,
          shadowRadius:    selected ? 10 : 4,
          shadowOffset:    { width: 0, height: selected ? 4 : 2 },
          elevation:       selected ? 8 : 2,
          transform:       [{ scale: selected ? 1.02 : 1 }],
        },
        style,
      ]}
    >
      {/* ── Thumbnail ──────────────────────────────────────────── */}
      <View
        style={[
          styles.thumb,
          {
            backgroundColor:    template.primaryColor + '1E',
            borderTopLeftRadius:  borderRadius.lg - 2,
            borderTopRightRadius: borderRadius.lg - 2,
          },
        ]}
      >
        <Ionicons name={iconName} size={30} color={template.primaryColor} />

        {/* Checkmark badge when selected */}
        {selected && (
          <View
            style={[
              styles.checkBadge,
              { backgroundColor: template.primaryColor },
            ]}
          >
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        )}
      </View>

      {/* ── Info ───────────────────────────────────────────────── */}
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={{
            fontSize:   typography.sm,
            fontWeight: '700',
            color:      selected ? template.primaryColor : colors.text,
          }}
        >
          {template.name}
        </Text>

        <View
          style={[
            styles.stylePill,
            { backgroundColor: template.primaryColor + '18' },
          ]}
        >
          <Text
            style={{
              fontSize:      9,
              fontWeight:    '700',
              color:         template.primaryColor,
              textTransform: 'capitalize',
            }}
          >
            {template.style}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 148,
    overflow: 'hidden',
  },
  thumb: {
    height: 96,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  checkBadge: {
    position:       'absolute',
    top:            8,
    right:          8,
    width:          20,
    height:         20,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  info: {
    padding: 8,
    gap:     5,
  },
  stylePill: {
    alignSelf:       'flex-start',
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:    20,
  },
});