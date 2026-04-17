// navigation/shared/SocialNavigator.tsx
// ⚠️  ALL SOCIAL SCREENS ARE PLACEHOLDERS — create screens in screens/social/
// Used by: Candidate, Freelancer, Company, Organization

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SocialTabParamList } from './types';

// ⚠️ Placeholder screens — replace when built
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';
import useTheme from '../hooks/useTheme';

const Tab = createBottomTabNavigator<SocialTabParamList>();

interface SocialNavigatorProps {
  parentNavigationKey: string; // e.g. 'CandidateMain', 'CompanyMain'
}

const SOCIAL_TABS = [
  { name: 'Feed' as keyof SocialTabParamList, icon: 'newspaper-outline', activeIcon: 'newspaper' },
  { name: 'MyPosts' as keyof SocialTabParamList, icon: 'create-outline', activeIcon: 'create' },
  { name: 'Network' as keyof SocialTabParamList, icon: 'people-outline', activeIcon: 'people' },
  { name: 'SocialProfile' as keyof SocialTabParamList, icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
  { name: 'SavedPosts' as keyof SocialTabParamList, icon: 'bookmark-outline', activeIcon: 'bookmark', label: 'Saved' },
];

export default function SocialNavigator({ parentNavigationKey }: SocialNavigatorProps) {
  const rootNav = useNavigation<any>();
    const { colors, type, spacing, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = SOCIAL_TABS.find(t => t.name === route.name);
        return {
          headerShown: true,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.bgSurface },
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTitleStyle: { color: colors.textSecondary, fontWeight: '700' },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? tab?.activeIcon : tab?.icon) as any}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: tab?.label ?? route.name,
        };
      }}
    >
      {SOCIAL_TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={PlaceholderScreen} // ⚠️ Replace with real screen
          options={{ title: tab.label ?? tab.name }}
        />
      ))}

      {/* Back to Home — rendered as a tab that triggers navigation */}
      <Tab.Screen
        name={'BackToHome' as any}
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Back',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="arrow-back-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => {
            // Filter out delayLongPress and disabled if they are null
            const { delayLongPress, disabled, ...rest } = props;
            const touchableProps: any = { ...rest };
            if (delayLongPress !== null && delayLongPress !== undefined) {
              touchableProps.delayLongPress = delayLongPress;
            }
            if (disabled !== null && disabled !== undefined) {
              touchableProps.disabled = disabled;
            }
            return (
              <TouchableOpacity
                {...touchableProps}
                onPress={() => rootNav.navigate(parentNavigationKey)}
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}
