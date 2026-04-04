// components/freelancer/FreelancerPortfolioDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Calendar,
    Users,
    Star,
    TrendingUp,
    Clock,
    Eye,
    Tag,
    ChevronRight,
    Cloud,
    Edit,
    Trash2,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { PortfolioItem } from '@/services/freelancerService';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';

interface FreelancerPortfolioDisplayProps {
    portfolioItems: PortfolioItem[];
    freelancerName: string;
    freelancerId?: string;
    showFullList?: boolean;
    showStats?: boolean;
    maxDisplay?: number;
    isOwnProfile?: boolean;
    onEdit?: (item: PortfolioItem) => void;
    onDelete?: (id: string) => void;
    themeMode?: 'light' | 'dark';
}

// Format currency
const formatCurrency = (amount?: number) => {
    if (!amount) return 'Negotiable';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format budget type
const formatBudgetType = (type?: string) => {
    if (!type) return '';
    switch (type) {
        case 'hourly': return '/hr';
        case 'daily': return '/day';
        case 'monthly': return '/month';
        default: return '';
    }
};

// Format date
const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ongoing';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

// Get optimized Cloudinary URL
const getOptimizedImageUrl = (url: string, width: number = 400, height: number = 300) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    try {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},h_${height},c_fill,g_auto,q_auto,f_auto/${parts[1]}`;
        }
    } catch (e) {
        console.error('Error optimizing Cloudinary URL:', e);
    }
    return url;
};

// Portfolio Card Component
const PortfolioCard: React.FC<{
    item: PortfolioItem;
    isOwnProfile: boolean;
    onEdit?: (item: PortfolioItem) => void;
    onDelete?: (id: string) => void;
    isDeleting?: boolean;
}> = ({ item, isOwnProfile, onEdit, onDelete, isDeleting }) => {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const hasValidImage = item.mediaUrls?.some(url => url?.includes('cloudinary.com')) && !imageError;

    return (
        <Link
            href={isOwnProfile
                ? `/dashboard/freelancer/portfolio/${item._id}`
                : `/freelancer/${item._id}/portfolio`
            }
            className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 rounded-xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card className={cn(
                "border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300",
                isHovered && "shadow-xl transform -translate-y-1"
            )}>
                <CardContent className="p-0">
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        {hasValidImage ? (
                            <>
                                <img
                                    src={getOptimizedImageUrl(item.mediaUrls![0], 400, 300)}
                                    alt={item.title}
                                    className={cn(
                                        "w-full h-full object-cover transition-transform duration-700",
                                        isHovered && "scale-110"
                                    )}
                                    onError={() => setImageError(true)}
                                />
                                {/* Image Count Badge */}
                                {item.mediaUrls && item.mediaUrls.length > 1 && (
                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        +{item.mediaUrls.length - 1}
                                    </div>
                                )}
                                {/* Cloudinary Badge */}
                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                                    <Cloud className="w-3 h-3" />
                                    Cloud
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Briefcase className="w-12 h-12 text-gray-400" />
                            </div>
                        )}

                        {/* Featured Badge */}
                        {item.featured && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-linear-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-lg">
                                <Star className="w-3 h-3 fill-white" />
                                Featured
                            </div>
                        )}

                        {/* Edit/Delete Buttons for Own Profile */}
                        {isOwnProfile && onEdit && onDelete && (
                            <div className={cn(
                                "absolute top-3 left-3 flex gap-2 transition-opacity duration-300",
                                isHovered ? "opacity-100" : "opacity-0"
                            )}>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onEdit(item);
                                    }}
                                    className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                    aria-label="Edit project"
                                >
                                    <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(item._id);
                                    }}
                                    disabled={isDeleting}
                                    className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                    aria-label="Delete project"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {/* Category & Budget */}
                        <div className="flex items-center justify-between mb-3">
                            {item.category && (
                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                    {item.category.replace('-', ' ')}
                                </Badge>
                            )}
                            {item.budget && (
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(item.budget)}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                                        {formatBudgetType(item.budgetType)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {item.title}
                        </h4>

                        {/* Description */}
                        {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                {item.description}
                            </p>
                        )}

                        {/* Project Details */}
                        <div className="space-y-2 mb-4">
                            {item.client && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <Users className="w-3 h-3" />
                                    <span className="truncate">Client: {item.client}</span>
                                </div>
                            )}
                            {item.completionDate && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(item.completionDate)}</span>
                                </div>
                            )}
                            {item.duration && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Duration: {item.duration}</span>
                                </div>
                            )}
                        </div>

                        {/* Technologies */}
                        {item.technologies && item.technologies.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex flex-wrap gap-1">
                                    {item.technologies.slice(0, 3).map((tech, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {tech}
                                        </Badge>
                                    ))}
                                    {item.technologies.length > 3 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            +{item.technologies.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View Details Link */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                                <span className="text-sm font-medium">View Details</span>
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform",
                                    isHovered && "translate-x-1"
                                )} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export const FreelancerPortfolioDisplay: React.FC<FreelancerPortfolioDisplayProps> = ({
    portfolioItems,
    freelancerName,
    freelancerId,
    showFullList = false,
    showStats = true,
    maxDisplay = 6,
    isOwnProfile = false,
    onEdit,
    onDelete,
    themeMode = 'light'
}) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Log received items for debugging
    useEffect(() => {
        console.log('📦 Portfolio items received:', {
            count: portfolioItems?.length,
            items: portfolioItems?.map(item => ({
                id: item._id,
                title: item.title,
                visibility: item.visibility,
                mediaUrls: item.mediaUrls,
                isCloudinary: item.isCloudinary
            }))
        });
    }, [portfolioItems]);

    // Filter portfolio items
    const filteredItems = React.useMemo(() => {
        if (!portfolioItems || portfolioItems.length === 0) {
            return [];
        }

        return portfolioItems.filter(item => {
            // For public view, only show public items
            if (!isOwnProfile && item.visibility === 'private') {
                return false;
            }
            return true;
        });
    }, [portfolioItems, isOwnProfile]);

    const displayedItems = showFullList ? filteredItems : filteredItems.slice(0, maxDisplay);

    // Calculate portfolio stats
    const stats = React.useMemo(() => {
        if (!showStats || filteredItems.length === 0) return null;

        const totalImages = filteredItems.reduce((acc, item) => 
            acc + (item.mediaUrls?.filter(url => url?.includes('cloudinary.com')).length || 0), 0
        );

        const technologies = Array.from(new Set(
            filteredItems.flatMap(item => item.technologies || [])
        ));

        const categories = Array.from(new Set(
            filteredItems.map(item => item.category).filter(Boolean)
        )) as string[];

        const totalBudget = filteredItems.reduce((sum, item) => sum + (item.budget || 0), 0);

        return {
            totalProjects: filteredItems.length,
            featuredProjects: filteredItems.filter(item => item.featured).length,
            totalImages,
            totalBudget,
            categories,
            technologies,
            completedProjects: filteredItems.filter(item => item.completionDate).length,
            averageBudget: filteredItems.length > 0 ? totalBudget / filteredItems.length : 0
        };
    }, [filteredItems, showStats]);

    const handleDelete = async (id: string) => {
        if (!onDelete) return;
        
        if (window.confirm('Are you sure you want to delete this portfolio item?')) {
            setDeletingId(id);
            await onDelete(id);
            setDeletingId(null);
        }
    };

    if (filteredItems.length === 0) {
        return (
            <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        No Portfolio Projects Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {isOwnProfile 
                            ? 'Showcase your best work by adding projects to your portfolio. Upload images and share your achievements.'
                            : `${freelancerName} hasn't added any portfolio projects yet. Check back soon!`}
                    </p>
                    {isOwnProfile && (
                        <Button
                            onClick={() => window.location.href = '/dashboard/freelancer/portfolio/add'}
                            className="bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Add Your First Project
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Portfolio Stats */}
            {stats && showStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500">
                                    <Briefcase className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs text-green-600 dark:text-green-400">+{stats.totalProjects}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Projects</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-500">
                                    <Star className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs text-amber-600 dark:text-amber-400">{stats.featuredProjects}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.featuredProjects}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Featured</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
                                    <Cloud className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs text-purple-600 dark:text-purple-400">{stats.totalImages}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalImages}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Cloud Images</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-500">
                                    <Tag className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs text-green-600 dark:text-green-400">{stats.categories.length}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.categories.length}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Categories</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item) => (
                    <PortfolioCard
                        key={item._id}
                        item={item}
                        isOwnProfile={isOwnProfile}
                        onEdit={onEdit}
                        onDelete={handleDelete}
                        isDeleting={deletingId === item._id}
                    />
                ))}
            </div>

            {/* View All Button */}
            {filteredItems.length > maxDisplay && !showFullList && (
                <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
                    <Button
                        onClick={() => {
                            const url = isOwnProfile 
                                ? '/dashboard/freelancer/portfolio'
                                : `/freelancer/${freelancerId || 'profile'}/portfolio`;
                            window.location.href = url;
                        }}
                        className="bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View All Projects
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {filteredItems.length}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FreelancerPortfolioDisplay;