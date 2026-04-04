// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type TouchTargetSize = 'sm' | 'md' | 'lg';

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkBreakpoint();
    checkTouch();

    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  const getTouchTargetSize = (size: TouchTargetSize = 'md'): string => {
    if (!isTouch) return '';
    
    const sizes = {
      sm: 'min-h-[36px] min-w-[36px]',
      md: 'min-h-[44px] min-w-[44px]',
      lg: 'min-h-[52px] min-w-[52px]'
    };
    return sizes[size];
  };

  return { breakpoint, isTouch, getTouchTargetSize };
};