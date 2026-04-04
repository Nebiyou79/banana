// components/ui/FilterDropdown.tsx
import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getTheme, ThemeMode } from '@/utils/color';

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  themeMode: ThemeMode;
  className?: string;
  width?: string;
  showCaret?: boolean;
  active?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  isOpen,
  onToggle,
  onClose,
  children,
  themeMode,
  className = '',
  width = 'w-80',
  showCaret = true,
  active = false,
}) => {
  const theme = getTheme(themeMode);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
          isOpen || active ? 'ring-2 ring-offset-2' : ''
        } ${className}`}
        style={{
          backgroundColor: theme.bg.secondary,
          borderColor: isOpen || active
            ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
            : theme.border.primary,
          color: isOpen || active
            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
            : theme.text.secondary
        }}
      >
        {icon}
        <span className="font-medium">{label}</span>
        {showCaret && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 ${width} rounded-xl shadow-2xl border z-50`}
          style={{
            backgroundColor: theme.bg.primary,
            borderColor: theme.border.primary
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;