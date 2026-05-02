/**
 * mobile/src/screens/company/CreateProductScreen.tsx
 *
 * UPDATED:
 *  - useIsCompanyOwner() guard — non-owners cannot reach this screen
 *  - useTheme() throughout, no inline styles use hardcoded colors
 *  - StatusBar barStyle reacts to dark mode
 *  - On success, resets the navigation stack to MyProducts so back button
 *    doesn’t bring user back to the empty form
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import { useCreateProduct } from '../../hooks/useProducts';

import { ProductForm } from '../../components/products/ProductForm';
import { CreateProductData, ImageAsset } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CreateProduct'>;

export const CreateProductScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const isOwner = useIsCompanyOwner();
  const createProduct = useCreateProduct();

  // Hard guard for non-owners (deep link safety)
  if (!isOwner) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.center}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
            Company access only
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = (
    data: CreateProductData,
    imageAssets: ImageAsset[],
    _existingIds: string[],
  ) => {
    createProduct.mutate(
      { data, imageAssets },
      {
        onSuccess: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'CompanyProductList' }],
          }),
      },
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ProductForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={createProduct.isPending}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:  { fontSize: 18, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});