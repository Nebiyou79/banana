/**
 * mobile/src/components/products/ProductFilterSheet.tsx  (NEW)
 *
 * Bottom-sheet style filter panel for the mobile marketplace.
 * Triggered by a filter button; animates in from the bottom.
 * Supports: category, subcategory, price range, featured toggle, sort.
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  SafeAreaView, ScrollView, TextInput, Switch, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useProductCategories } from '../../hooks/useProducts';
import { ProductFilters, CategoryItem } from '../../services/productService';

export interface FilterState {
  category?:    string;
  subcategory?: string;
  minPrice?:    number;
  maxPrice?:    number;
  featured?:    boolean;
  sortBy?:      string;
  sortOrder?:   'asc' | 'desc';
}

interface Props {
  visible:  boolean;
  onClose:  () => void;
  current:  FilterState;
  onApply:  (f: FilterState) => void;
}

const SORT_OPTIONS: { label: string; sortBy: string; sortOrder: 'asc' | 'desc' }[] = [
  { label: 'Newest',        sortBy: 'createdAt',  sortOrder: 'desc' },
  { label: 'Oldest',        sortBy: 'createdAt',  sortOrder: 'asc'  },
  { label: 'Price: Low→High', sortBy: 'price.amount', sortOrder: 'asc'  },
  { label: 'Price: High→Low', sortBy: 'price.amount', sortOrder: 'desc' },
  { label: 'Most Popular',  sortBy: 'views',      sortOrder: 'desc' },
  { label: 'Most Saved',    sortBy: 'savedCount', sortOrder: 'desc' },
  { label: 'Name A–Z',      sortBy: 'name',       sortOrder: 'asc'  },
];

export const ProductFilterSheet: React.FC<Props> = ({ visible, onClose, current, onApply }) => {
  const { colors, spacing } = useTheme();
  const { data: categories = [] } = useProductCategories();

  const [draft, setDraft]           = useState<FilterState>(current);
  const [minInput, setMinInput]     = useState(current.minPrice?.toString() ?? '');
  const [maxInput, setMaxInput]     = useState(current.maxPrice?.toString() ?? '');
  const [step, setStep]             = useState<'main' | 'category' | 'subcategory'>('main');

  useEffect(() => {
    if (visible) {
      setDraft(current);
      setMinInput(current.minPrice?.toString() ?? '');
      setMaxInput(current.maxPrice?.toString() ?? '');
      setStep('main');
    }
  }, [visible, current]);

  const activeCat = categories.find(c => c.id === draft.category);

  const handleApply = () => {
    onApply({
      ...draft,
      minPrice: minInput ? parseFloat(minInput) : undefined,
      maxPrice: maxInput ? parseFloat(maxInput) : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setDraft({});
    setMinInput('');
    setMaxInput('');
  };

  const activeCount = Object.values(draft).filter(v => v !== undefined && v !== '' && v !== false).length;

  if (!visible) return null;

  const renderMain = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 24 }}>
      {/* Sort */}
      <Section label="Sort By" colors={colors}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SORT_OPTIONS.map(opt => {
            const key     = `${opt.sortBy}-${opt.sortOrder}`;
            const curKey  = `${draft.sortBy}-${draft.sortOrder}`;
            const isActive = key === curKey;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setDraft(d => ({ ...d, sortBy: opt.sortBy, sortOrder: opt.sortOrder }))}
                style={[
                  fs.pill,
                  { backgroundColor: isActive ? colors.accent : colors.inputBg, borderColor: isActive ? colors.accent : colors.borderPrimary },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#fff' : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* Category */}
      <Section label="Category" colors={colors}>
        <TouchableOpacity
          onPress={() => setStep('category')}
          style={[fs.selector, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}
        >
          <Text style={{ fontSize: 14, color: draft.category ? colors.textPrimary : colors.inputPlaceholder, flex: 1 }}>
            {activeCat
              ? draft.subcategory
                ? `${activeCat.label} › ${activeCat.subcategories.find(s => s.id === draft.subcategory)?.label ?? draft.subcategory}`
                : activeCat.label
              : 'All categories'}
          </Text>
          {draft.category ? (
            <TouchableOpacity onPress={() => setDraft(d => ({ ...d, category: undefined, subcategory: undefined }))}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </Section>

      {/* Price range */}
      <Section label="Price Range" colors={colors}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            value={minInput} onChangeText={setMinInput}
            style={[fs.priceInput, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary, color: colors.textPrimary }]}
            placeholder="Min" placeholderTextColor={colors.inputPlaceholder}
            keyboardType="decimal-pad"
          />
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>—</Text>
          <TextInput
            value={maxInput} onChangeText={setMaxInput}
            style={[fs.priceInput, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary, color: colors.textPrimary }]}
            placeholder="Max" placeholderTextColor={colors.inputPlaceholder}
            keyboardType="decimal-pad"
          />
        </View>
      </Section>

      {/* Featured */}
      <Section label="Availability" colors={colors}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: colors.textPrimary }}>Featured products only</Text>
          <Switch
            value={!!draft.featured}
            onValueChange={v => setDraft(d => ({ ...d, featured: v || undefined }))}
            trackColor={{ true: colors.accent, false: colors.borderPrimary }}
          />
        </View>
      </Section>
    </ScrollView>
  );

  const renderCategoryList = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
      <TouchableOpacity
        onPress={() => { setDraft(d => ({ ...d, category: undefined, subcategory: undefined })); setStep('main'); }}
        style={[fs.catItem, { backgroundColor: !draft.category ? `${colors.accent}14` : colors.bgSurface, borderColor: !draft.category ? colors.accent : colors.borderPrimary }]}
      >
        <Ionicons name="grid-outline" size={18} color={!draft.category ? colors.accent : colors.textMuted} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: !draft.category ? colors.accent : colors.textPrimary }}>All Categories</Text>
        {!draft.category && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
      </TouchableOpacity>

      {categories.map(cat => {
        const isActive = draft.category === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => {
              setDraft(d => ({ ...d, category: cat.id, subcategory: undefined }));
              if (cat.subcategories?.length) setStep('subcategory');
              else setStep('main');
            }}
            style={[fs.catItem, { backgroundColor: isActive ? `${colors.accent}14` : colors.bgSurface, borderColor: isActive ? colors.accent : colors.borderPrimary }]}
          >
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: isActive ? colors.accent : colors.textPrimary }}>
              {cat.label}
            </Text>
            {cat.subcategories?.length > 0 && !isActive && (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
            {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderSubcategoryList = () => {
    if (!activeCat) return null;
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
        {activeCat.subcategories.map(sub => {
          const isActive = draft.subcategory === sub.id;
          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => { setDraft(d => ({ ...d, subcategory: sub.id })); setStep('main'); }}
              style={[fs.catItem, { backgroundColor: isActive ? `${colors.accent}14` : colors.bgSurface, borderColor: isActive ? colors.accent : colors.borderPrimary }]}
            >
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: isActive ? colors.accent : colors.textPrimary }}>{sub.label}</Text>
              {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => { setDraft(d => ({ ...d, subcategory: undefined })); setStep('main'); }}
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Skip — use "{activeCat.label}" without subcategory</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        {/* Header */}
        <View style={[fs.header, { borderBottomColor: colors.borderPrimary }]}>
          {step !== 'main' ? (
            <TouchableOpacity onPress={() => setStep(step === 'subcategory' ? 'category' : 'main')}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleReset}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Reset{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
            </TouchableOpacity>
          )}

          <Text style={[fs.headerTitle, { color: colors.textPrimary }]}>
            {step === 'main' ? 'Filter & Sort' : step === 'category' ? 'Category' : `${activeCat?.label ?? ''}`}
          </Text>

          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          {step === 'main'        && renderMain()}
          {step === 'category'    && renderCategoryList()}
          {step === 'subcategory' && renderSubcategoryList()}
        </View>

        {/* Apply button */}
        {step === 'main' && (
          <View style={[fs.footer, { borderTopColor: colors.borderPrimary }]}>
            <TouchableOpacity
              onPress={handleApply}
              style={[fs.applyBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={fs.applyTxt}>
                Apply Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode; colors: Record<string, string> }> = ({ label, children, colors }) => (
  <View style={{ gap: 10 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    {children}
  </View>
);

const fs = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  pill:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  selector:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderWidth: 1, borderRadius: 10, gap: 8 },
  priceInput:  { flex: 1, height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  catItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1, gap: 12 },
  footer:      { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, borderTopWidth: 1 },
  applyBtn:    { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
