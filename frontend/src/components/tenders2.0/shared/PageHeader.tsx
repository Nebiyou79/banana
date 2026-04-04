// src/components/tender/shared/PageHeader.tsx
'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatBadge {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

interface PageHeaderProps {
    theme: 'freelancer' | 'company' | 'owner' | 'applications';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    stats?: StatBadge[];
    actions?: React.ReactNode;
}

const themeMap = {
    freelancer: {
        gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-800 dark:via-teal-700 dark:to-cyan-800',
        orb1: 'bg-teal-300/20',
        orb2: 'bg-cyan-200/15',
        orb3: 'bg-emerald-300/10',
    },
    company: {
        gradient: 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800',
        orb1: 'bg-blue-300/15',
        orb2: 'bg-indigo-200/10',
        orb3: 'bg-blue-400/10',
    },
    owner: {
        gradient: 'bg-gradient-to-br from-[#0A2540] via-[#1a3a5c] to-[#0A2540] dark:from-gray-900 dark:via-[#0A2540] dark:to-gray-900',
        orb1: 'bg-[#F1BB03]/8',
        orb2: 'bg-[#F1BB03]/5',
        orb3: 'bg-[#F1BB03]/4',
    },
    applications: {
        gradient: 'bg-gradient-to-br from-purple-600 via-purple-500 to-rose-500 dark:from-purple-900 dark:via-purple-800 dark:to-rose-800',
        orb1: 'bg-rose-300/15',
        orb2: 'bg-purple-200/10',
        orb3: 'bg-rose-400/8',
    },
};

export function PageHeader({ theme, title, subtitle, icon, stats, actions }: PageHeaderProps) {
    const t = themeMap[theme];

    return (
        <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn('relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10', t.gradient)}
        >
            {/* Animated orbs */}
            <motion.div
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2', t.orb1)}
            />
            <motion.div
                animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2', t.orb2)}
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('absolute top-1/2 left-1/4 w-32 h-32 rounded-full blur-2xl', t.orb3)}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                    {/* Icon + title */}
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                            {icon}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{title}</h1>
                            <p className="text-white/90 text-sm sm:text-base mt-1">{subtitle}</p>
                        </div>
                    </div>

                    {/* Stats badges */}
                    {stats && stats.length > 0 && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                            className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
                        >
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                    className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg shrink-0"
                                >
                                    {stat.icon && <span className="text-white/80">{stat.icon}</span>}
                                    <span className="font-bold text-white text-sm">{stat.value}</span>
                                    <span className="text-white/70 text-xs">{stat.label}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>

            {/* Owner gold bottom bar */}
            {theme === 'owner' && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="absolute bottom-0 left-0 h-0.5 bg-[#F1BB03]"
                />
            )}
        </motion.div>
    );
}