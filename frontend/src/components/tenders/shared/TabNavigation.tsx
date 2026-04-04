// src/components/tenders/shared/TabNavigation.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { TabItem } from '@/types/tender.types';
import { useResponsive } from '@/hooks/useResponsive';

interface TabNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    tabs,
    activeTab,
    onChange,
    className
}) => {
    const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
    const [showLeftGradient, setShowLeftGradient] = useState(false);
    const [showRightGradient, setShowRightGradient] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setShowLeftGradient(container.scrollLeft > 10);
        setShowRightGradient(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            checkScroll();
            return () => container.removeEventListener('scroll', checkScroll);
        }
    }, []);

    // Mobile: Bottom navigation
    if (breakpoint === 'mobile') {
        return (
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "border-t backdrop-blur-lg",
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "shadow-lg",
                className
            )}>
                <div className="flex justify-around items-center h-16 px-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1",
                                    "transition-all duration-200",
                                    getTouchTargetSize('lg'),
                                    isActive
                                        ? cn(colorClasses.text.primary, "scale-110")
                                        : cn(colorClasses.text.muted, "hover:scale-105")
                                )}
                                aria-label={tab.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="relative">
                                    {tab.mobileIcon || tab.icon}
                                    {tab.badge && (
                                        <span className={cn(
                                            "absolute -top-1 -right-1",
                                            "min-w-[18px] h-[18px]",
                                            "flex items-center justify-center",
                                            "text-[10px] font-medium",
                                            "rounded-full",
                                            colorClasses.bg.red,
                                            colorClasses.text.white
                                        )}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] mt-1 truncate max-w-[60px]">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        );
    }

    // Tablet: Scrollable tabs with gradient indicators
    if (breakpoint === 'tablet') {
        return (
            <div className={cn("relative", className)}>
                {showLeftGradient && (
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-8",
                        "bg-gradient-to-r",
                        "from-white dark:from-gray-900",
                        "to-transparent",
                        "pointer-events-none z-10"
                    )} />
                )}

                <div
                    ref={scrollContainerRef}
                    className="flex gap-1 overflow-x-auto scrollbar-hide pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2",
                                    "rounded-lg whitespace-nowrap",
                                    "transition-all duration-200",
                                    getTouchTargetSize('md'),
                                    isActive
                                        ? cn(colorClasses.bg.blue, colorClasses.text.white, "shadow-md")
                                        : cn(
                                            colorClasses.bg.secondary,
                                            colorClasses.text.primary,
                                            "hover:bg-opacity-80"
                                        )
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.icon}
                                <span className="text-sm font-medium">{tab.label}</span>
                                {tab.badge && (
                                    <span className={cn(
                                        "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                                        isActive
                                            ? colorClasses.bg.white
                                            : colorClasses.bg.primary,
                                        isActive ? colorClasses.text.blue : colorClasses.text.muted
                                    )}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {showRightGradient && (
                    <div className={cn(
                        "absolute right-0 top-0 bottom-0 w-8",
                        "bg-gradient-to-l",
                        "from-white dark:from-gray-900",
                        "to-transparent",
                        "pointer-events-none z-10"
                    )} />
                )}
            </div>
        );
    }

    // Desktop: Full tab bar
    return (
        <div className={cn(
            "flex gap-2 p-1 rounded-lg",
            colorClasses.bg.secondary,
            className
        )}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5",
                            "rounded-md transition-all duration-200",
                            "font-medium",
                            isActive
                                ? cn(colorClasses.bg.primary, colorClasses.text.primary, "shadow-sm")
                                : cn(colorClasses.text.muted, "hover:text-opacity-80")
                        )}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className={cn(
                                "ml-2 px-2 py-0.5 text-xs rounded-full",
                                isActive
                                    ? colorClasses.bg.blue
                                    : colorClasses.bg.primary,
                                isActive ? colorClasses.text.white : colorClasses.text.muted
                            )}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};