import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useCreateProduct } from '../../hooks/useProducts';
import { ProductForm } from '../../components/products/ProductForm';
import { CreateProductData, ImageAsset } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CreateProduct'>;

export const CreateProductScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const createProduct = useCreateProduct();

  const handleSubmit = (
    data: CreateProductData,
    imageAssets: ImageAsset[],
    _existingImageIds: string[]
  ) => {
    createProduct.mutate(
      { data, imageAssets },
      {
        onSuccess: () => {
          navigation.navigate('CompanyProductList');
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Product</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
});
