import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import HomeSplashScreen from '../screens/HomeSplashScreen';
import NetworkScreen from '../screens/NetworkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { useSocialTheme } from '../theme/socialTheme';
import PostsNavigator from './PostsNavigator';
import type { SocialTabParamList } from './types';

const Tab = createBottomTabNavigator<SocialTabParamList>();

const ICONS: Record<
  keyof SocialTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Posts: { active: 'newspaper', inactive: 'newspaper-outline' },
  Network: { active: 'people', inactive: 'people-outline' },
  Search: { active: 'search', inactive: 'search-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

/**
 * Social bottom-tabs. Active colour follows the current role (blue/purple/
 * green/orange) via useSocialTheme().
 */
const SocialNavigator: React.FC = () => {
  const theme = useSocialTheme();
  return (
    <Tab.Navigator
      initialRouteName="Posts"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBg,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icon = ICONS[route.name as keyof SocialTabParamList];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeSplashScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Posts"
        component={PostsNavigator}
        options={{ tabBarLabel: 'Posts' }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkScreen}
        options={{ tabBarLabel: 'Network' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default SocialNavigator;