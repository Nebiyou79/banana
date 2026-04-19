/**
 * mobile/src/screens/company/CreateProductScreen.tsx  (UPDATED)
 * Uses useTheme()
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCreateProduct } from '../../hooks/useProducts';
import { ProductForm } from '../../components/products/ProductForm';
import { CreateProductData, ImageAsset } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CreateProduct'>;

export const CreateProductScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const createProduct = useCreateProduct();

  const handleSubmit = (data: CreateProductData, imageAssets: ImageAsset[], _existingIds: string[]) => {
    createProduct.mutate(
      { data, imageAssets },
      { onSuccess: () => navigation.navigate('CompanyProductList') }
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>New Product</Text>
        <View style={{ width: 24 }} />
      </View>
      <ProductForm mode="create" onSubmit={handleSubmit} isLoading={createProduct.isPending} />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title:  { fontSize: 18, fontWeight: '700' },
});
