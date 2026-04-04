// theme/colors.ts
export const colors = {
  // Base Colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  
  // Text Colors
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    inverted: '#FFFFFF'
  },
  
  // Brand Colors (elegant SaaS palette)
  brand: {
    primary: '#3B82F6', // Professional blue
    secondary: '#8B5CF6', // Vibrant purple
    success: '#10B981', // Emerald green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: '#06B6D4' // Cyan
  },
  
  // Social Engagement Colors
  social: {
    like: '#EF4444', // Red for likes
    love: '#EC4899', // Pink for love
    celebrate: '#F59E0B', // Gold for celebrate
    comment: '#3B82F6', // Blue for comments
    share: '#10B981', // Green for shares
    bookmark: '#8B5CF6' // Purple for saves
  },
  
  // Role-specific accents (subtle variations)
  role: {
    candidate: '#3B82F6', // Blue
    company: '#10B981', // Green
    freelancer: '#F59E0B', // Amber
    organization: '#8B5CF6', // Purple
    admin: '#EF4444' // Red
  },
  
  // Gradients (elegant, professional)
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    premium: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
    subtle: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
  },
  
  // Shadows (modern, subtle)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};

export const typography = {
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif`,
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem'
};