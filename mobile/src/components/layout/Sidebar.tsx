// Sidebar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSidebar } from '../../context/SidebarContext';
import { roleConfig } from '../../constants/roles';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.78, 300);

interface MenuItem {
  icon: string;
  label: string;
  screen: string;
  badge?: number;
}

const MENU_ITEMS: Record<string, MenuItem[]> = {
  candidate: [
    { icon: 'person-outline', label: 'My Profile', screen: 'Profile' },
    { icon: 'document-text-outline', label: 'CV Generator', screen: 'CvTemplates' },
    { icon: 'bookmark-outline', label: 'Saved Jobs', screen: 'SavedJobs' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  ],
  freelancer: [
    { icon: 'person-outline', label: 'My Profile', screen: 'Profile' },
    { icon: 'images-outline', label: 'Portfolio', screen: 'PortfolioList' },
    { icon: 'construct-outline', label: 'Services', screen: 'ServicesList' },
    { icon: 'ribbon-outline', label: 'Certifications', screen: 'CertsList' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  ],
  company: [
    { icon: 'business-outline', label: 'Company Profile', screen: 'Profile' },
    { icon: 'cube-outline', label: 'Products', screen: 'CompanyProductList' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  ],
  organization: [
    { icon: 'people-outline', label: 'Org Profile', screen: 'Profile' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  ],
};

export const Sidebar: React.FC = () => {
  const { colors, radius, type, shadows, spacing } = useTheme();
  const { user, logout } = useAuthStore();
  const { isOpen, close } = useSidebar();
  const navigation = useNavigation<any>();

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: isOpen ? 0 : -SIDEBAR_WIDTH, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: isOpen ? 1 : 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [isOpen]);

  if (!user) return null;

  const config = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.candidate;
  const menuItems = MENU_ITEMS[user.role] ?? [];

  const handleNavigate = (screen: string) => {
    close();
    setTimeout(() => navigation.navigate(screen), 300);
  };

  const handleLogout = async () => {
    close();
    await logout();
  };

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View
            style={[styles.backdrop, { backgroundColor: colors.overlay, opacity: backdropOpacity }]}
            pointerEvents={isOpen ? 'auto' : 'none'}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: colors.bgCard,
            transform: [{ translateX }],
            ...shadows.md,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <View style={[styles.header, { borderBottomColor: colors.borderPrimary }]}>
          <Avatar uri={user.avatar} name={user.name} size="lg" />
          <View style={styles.headerText}>
            <Text style={[styles.userName, type.h4, { color: colors.textPrimary }]} numberOfLines={1}>
              {user.name}
            </Text>
            <View style={styles.badgeRow}>
              <Badge label={config.label} variant="info" size="sm" />
            </View>
          </View>
          <TouchableOpacity onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, { borderRadius: radius.md }]}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, type.body, { color: colors.textPrimary }]}>
                {item.label}
              </Text>
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.error, borderRadius: radius.full }]}>
                  <Text style={[styles.badgeText, type.caption, { color: '#fff' }]}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.borderPrimary }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderRadius: radius.md }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, type.body, { color: colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 101, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, gap: 12 },
  headerText: { flex: 1 },
  userName: { fontWeight: '700', marginBottom: 4 },
  badgeRow: { flexDirection: 'row' },
  closeBtn: { padding: 4 },
  menu: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, marginBottom: 2 },
  menuIcon: { marginRight: 14 },
  menuLabel: { flex: 1, fontWeight: '500' },
  badge: { minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { fontWeight: '700' },
  footer: { paddingHorizontal: 12, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1 },
});