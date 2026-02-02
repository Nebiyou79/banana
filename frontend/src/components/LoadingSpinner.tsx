import React from 'react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  themeMode?: ThemeMode;
  variant?: 'primary' | 'secondary' | 'accent';
  showText?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  themeMode = 'light',
  variant = 'primary',
  showText = false,
  text = 'Loading...'
}) => {
  const theme = getTheme(themeMode);

  const sizeClasses = {
    sm: {
      spinner: 'h-4 w-4',
      text: 'text-xs',
      container: 'gap-1'
    },
    md: {
      spinner: 'h-8 w-8',
      text: 'text-sm',
      container: 'gap-2'
    },
    lg: {
      spinner: 'h-12 w-12',
      text: 'text-base',
      container: 'gap-3'
    },
    xl: {
      spinner: 'h-16 w-16',
      text: 'text-lg',
      container: 'gap-4'
    }
  };

  const variantColors = {
    primary: {
      light: '#2563EB', // blue-600
      dark: '#3B82F6'   // blue-500
    },
    secondary: {
      light: '#0A2540', // darkNavy
      dark: '#FFFFFF'   // white
    },
    accent: {
      light: '#FFD700', // gold
      dark: '#FFD700'   // gold
    }
  };

  const getBorderColor = () => {
    const colors = variantColors[variant];
    return themeMode === 'dark' ? colors.dark : colors.light;
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex ${showText ? 'flex-col items-center' : 'flex-row items-center'} ${sizeClasses[size].container}`}>
        <div
          className={`animate-spin rounded-full border-2 ${sizeClasses[size].spinner}`}
          style={{
            borderColor: theme.border.secondary,
            borderTopColor: getBorderColor()
          }}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">{text}</span>
        </div>
        {showText && (
          <span
            className={`font-medium ${sizeClasses[size].text}`}
            style={{ color: theme.text.secondary }}
          >
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;