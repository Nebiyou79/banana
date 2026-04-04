// src/utils/sidebar-theme.ts
// Sidebar-specific theme utilities that don't depend on RoleThemeProvider

export type RoleType = 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';

export interface SidebarThemeColors {
    // Sidebar background
    sidebarBg: string;

    // Card backgrounds
    cardBg: string;
    cardBorder: string;

    // Text colors
    primaryText: string;
    secondaryText: string;
    mutedText: string;

    // Button/Interactive states
    primary: string;
    secondary: string;
    accent: string;

    // State colors
    activeBg: string;
    hoverBg: string;
    error: string;
    success: string;

    // Icon colors
    iconPrimary: string;
    iconSecondary: string;

    // Badge colors
    badgeBg: string;
    badgeText: string;
}

// Light mode sidebar themes for each role
export const LIGHT_SIDEBAR_THEMES: Record<RoleType, SidebarThemeColors> = {
    candidate: {
        sidebarBg: 'rgba(248, 249, 247, 0.98)',
        cardBg: 'rgba(255, 255, 255, 0.97)',
        cardBorder: 'rgba(47, 62, 70, 0.12)',
        primaryText: '#1B262B',
        secondaryText: '#2D6A4F',
        mutedText: '#526A73',
        primary: '#490202ff',
        secondary: '#2D6A4F',
        accent: '#84A98C',
        activeBg: 'rgba(73, 2, 2, 0.12)',
        hoverBg: 'rgba(73, 2, 2, 0.08)',
        error: '#9B2226',
        success: '#2D6A4F',
        iconPrimary: '#490202ff',
        iconSecondary: '#2D6A4F',
        badgeBg: '#2D6A4F',
        badgeText: '#FFFFFF'
    },
    company: {
        sidebarBg: 'rgba(248, 249, 255, 0.98)',
        cardBg: 'rgba(248, 249, 255, 0.95)',
        cardBorder: 'rgba(67, 97, 238, 0.2)',
        primaryText: '#1E293B',
        secondaryText: '#7209B7',
        mutedText: '#64748B',
        primary: '#4361EE',
        secondary: '#7209B7',
        accent: '#4CC9F0',
        activeBg: 'rgba(67, 97, 238, 0.15)',
        hoverBg: 'rgba(67, 97, 238, 0.08)',
        error: '#EF4444',
        success: '#10B981',
        iconPrimary: '#4361EE',
        iconSecondary: '#7209B7',
        badgeBg: '#7209B7',
        badgeText: '#FFFFFF'
    },
    freelancer: {
        sidebarBg: 'rgba(250, 248, 245, 0.98)',
        cardBg: 'rgba(255, 255, 255, 0.96)',
        cardBorder: 'rgba(141, 110, 99, 0.18)',
        primaryText: '#241B17',
        secondaryText: '#8D6E63',
        mutedText: '#5A4A42',
        primary: '#3A2E2A',
        secondary: '#8D6E63',
        accent: '#D4A373',
        activeBg: 'rgba(58, 46, 42, 0.15)',
        hoverBg: 'rgba(58, 46, 42, 0.08)',
        error: '#9B2226',
        success: '#6A994E',
        iconPrimary: '#3A2E2A',
        iconSecondary: '#8D6E63',
        badgeBg: '#8D6E63',
        badgeText: '#FFFFFF'
    },
    organization: {
        sidebarBg: 'rgba(240, 245, 255, 0.98)',
        cardBg: 'rgba(240, 245, 255, 0.95)',
        cardBorder: 'rgba(58, 134, 255, 0.2)',
        primaryText: '#1A2F4A',
        secondaryText: '#FB5607',
        mutedText: '#475569',
        primary: '#3A86FF',
        secondary: '#FB5607',
        accent: '#8338EC',
        activeBg: 'rgba(58, 134, 255, 0.15)',
        hoverBg: 'rgba(58, 134, 255, 0.08)',
        error: '#F44336',
        success: '#4CAF50',
        iconPrimary: '#3A86FF',
        iconSecondary: '#FB5607',
        badgeBg: '#FB5607',
        badgeText: '#FFFFFF'
    },
    admin: {
        sidebarBg: 'rgba(245, 243, 255, 0.98)',
        cardBg: 'rgba(245, 243, 255, 0.95)',
        cardBorder: 'rgba(124, 58, 237, 0.2)',
        primaryText: '#2A1A4A',
        secondaryText: '#10B981',
        mutedText: '#6B7280',
        primary: '#7C3AED',
        secondary: '#10B981',
        accent: '#C084FC',
        activeBg: 'rgba(124, 58, 237, 0.15)',
        hoverBg: 'rgba(124, 58, 237, 0.08)',
        error: '#EF4444',
        success: '#10B981',
        iconPrimary: '#7C3AED',
        iconSecondary: '#10B981',
        badgeBg: '#10B981',
        badgeText: '#FFFFFF'
    }
};

// Dark mode sidebar themes for each role
export const DARK_SIDEBAR_THEMES: Record<RoleType, SidebarThemeColors> = {
    candidate: {
        sidebarBg: 'rgba(14, 20, 22, 0.98)',
        cardBg: 'rgba(28, 36, 39, 0.97)',
        cardBorder: 'rgba(132, 169, 140, 0.18)',
        primaryText: '#CAD2C5',
        secondaryText: '#84A98C',
        mutedText: '#52796F',
        primary: '#84A98C',
        secondary: '#2D6A4F',
        accent: '#CAD2C5',
        activeBg: 'rgba(132, 169, 140, 0.18)',
        hoverBg: 'rgba(132, 169, 140, 0.10)',
        error: '#9B2226',
        success: '#2D6A4F',
        iconPrimary: '#84A98C',
        iconSecondary: '#2D6A4F',
        badgeBg: '#2D6A4F',
        badgeText: '#FFFFFF'
    },
    company: {
        sidebarBg: 'rgba(15, 23, 42, 0.98)',
        cardBg: 'rgba(30, 41, 59, 0.95)',
        cardBorder: 'rgba(108, 138, 255, 0.3)',
        primaryText: '#CBD5E1',
        secondaryText: '#9D4EDD',
        mutedText: '#94A3B8',
        primary: '#6C8AFF',
        secondary: '#9D4EDD',
        accent: '#4CC9F0',
        activeBg: 'rgba(108, 138, 255, 0.20)',
        hoverBg: 'rgba(108, 138, 255, 0.12)',
        error: '#EF4444',
        success: '#10B981',
        iconPrimary: '#6C8AFF',
        iconSecondary: '#9D4EDD',
        badgeBg: '#9D4EDD',
        badgeText: '#FFFFFF'
    },
    freelancer: {
        sidebarBg: 'rgba(23, 17, 14, 0.98)',
        cardBg: 'rgba(36, 27, 23, 0.96)',
        cardBorder: 'rgba(212, 163, 115, 0.25)',
        primaryText: '#E9CBA7',
        secondaryText: '#D4A373',
        mutedText: '#B08968',
        primary: '#D4A373',
        secondary: '#8D6E63',
        accent: '#E9CBA7',
        activeBg: 'rgba(212, 163, 115, 0.20)',
        hoverBg: 'rgba(212, 163, 115, 0.12)',
        error: '#9B2226',
        success: '#6A994E',
        iconPrimary: '#D4A373',
        iconSecondary: '#8D6E63',
        badgeBg: '#D4A373',
        badgeText: '#241B17'
    },
    organization: {
        sidebarBg: 'rgba(15, 31, 58, 0.98)',
        cardBg: 'rgba(26, 47, 74, 0.95)',
        cardBorder: 'rgba(95, 160, 255, 0.3)',
        primaryText: '#B8D4FE',
        secondaryText: '#FF7B3D',
        mutedText: '#94A3B8',
        primary: '#5FA0FF',
        secondary: '#FF7B3D',
        accent: '#9D4EDD',
        activeBg: 'rgba(95, 160, 255, 0.20)',
        hoverBg: 'rgba(95, 160, 255, 0.12)',
        error: '#F44336',
        success: '#4CAF50',
        iconPrimary: '#5FA0FF',
        iconSecondary: '#FF7B3D',
        badgeBg: '#FF7B3D',
        badgeText: '#FFFFFF'
    },
    admin: {
        sidebarBg: 'rgba(31, 10, 58, 0.98)',
        cardBg: 'rgba(42, 26, 74, 0.95)',
        cardBorder: 'rgba(167, 139, 250, 0.3)',
        primaryText: '#D8B4FE',
        secondaryText: '#34D399',
        mutedText: '#A5B4CB',
        primary: '#A78BFA',
        secondary: '#34D399',
        accent: '#D8B4FE',
        activeBg: 'rgba(167, 139, 250, 0.20)',
        hoverBg: 'rgba(167, 139, 250, 0.12)',
        error: '#EF4444',
        success: '#10B981',
        iconPrimary: '#A78BFA',
        iconSecondary: '#34D399',
        badgeBg: '#34D399',
        badgeText: '#1F2937'
    }
};

// Helper function to get sidebar theme based on role and mode
export const getSidebarTheme = (role: RoleType = 'candidate', isDarkMode: boolean = false): SidebarThemeColors => {
    return isDarkMode ? DARK_SIDEBAR_THEMES[role] : LIGHT_SIDEBAR_THEMES[role];
};

// Helper to check if we're in dark mode
export const isDarkMode = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check localStorage first
    const storedMode = localStorage.getItem('theme-mode');
    if (storedMode === 'dark') return true;
    if (storedMode === 'light') return false;

    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Navigation item type with optional badge
export interface SidebarNavItem {
    href: string;
    label: string;
    icon: React.ComponentType<any>;
    badge?: string | number;
}
