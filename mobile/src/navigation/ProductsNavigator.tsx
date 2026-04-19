/**
 * mobile/src/navigation/ProductsNavigator.tsx
 *
 * Public-facing product navigation stack.
 * Routes: Marketplace → ProductDetails
 *         SavedProducts → ProductDetails
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductMarketplaceScreen }   from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }       from '../screens/products/ProductDetailsScreen';
import { SavedProductsScreen }        from '../screens/products/SavedProductsScreen';

// ── Param list ─────────────────────────────────────────────────────────────────

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  SavedProducts:      undefined;
};

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export const ProductsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen} />
    <Stack.Screen name="SavedProducts"      component={SavedProductsScreen} />
  </Stack.Navigator>
);