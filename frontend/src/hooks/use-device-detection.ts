// hooks/use-device-detection.ts
import { useMediaQuery } from './use-media-query';

export function useDeviceDetection() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
    const isDesktop = useMediaQuery('(min-width: 1025px)');
    const isLargeDesktop = useMediaQuery('(min-width: 1440px)');

    return {
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        isTouchDevice: isMobile || isTablet
    };
}