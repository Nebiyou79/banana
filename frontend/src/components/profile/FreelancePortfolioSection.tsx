// components/freelancer/FreelancerPortfolioDisplay.tsx
import React from 'react';
import {
    Briefcase,
    Calendar,
    Users,
    Globe,
    Star,
    ExternalLink,
    Award,
    TrendingUp,
    DollarSign,
    Clock,
    Eye,
    Link as LinkIcon,
    Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PortfolioItem } from '@/services/freelancerService';

interface FreelancerPortfolioDisplayProps {
    portfolioItems: PortfolioItem[];
    freelancerName: string;
    showFullList?: boolean;
    showStats?: boolean;
    maxDisplay?: number;
}

export const FreelancerPortfolioDisplay: React.FC<FreelancerPortfolioDisplayProps> = ({
    portfolioItems,
    freelancerName,
    showFullList = false,
    showStats = true,
    maxDisplay = 6,
}) => {
    // Filter portfolio items based on visibility (only show public items for public views)
    const filteredItems = portfolioItems?.filter(item =>
        item.visibility === 'public' || item.visibility === undefined
    ) || [];

    const displayedItems = showFullList ? filteredItems : filteredItems.slice(0, maxDisplay);

    // Calculate portfolio stats
    const stats = showStats && filteredItems.length > 0 ? {
        totalProjects: filteredItems.length,
        featuredProjects: filteredItems.filter(item => item.featured).length,
        totalBudget: filteredItems.reduce((sum, item) => sum + (item.budget || 0), 0),
        categories: Array.from(new Set(filteredItems.map(item => item.category).filter(Boolean))) as string[],
        completedProjects: filteredItems.filter(item => item.completionDate).length,
        technologies: Array.from(new Set(filteredItems.flatMap(item => item.technologies || []))),
    } : null;

    if (filteredItems.length === 0) {
        return (
            <Card className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Briefcase className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Portfolio Projects Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {freelancerName} hasn't added any portfolio projects yet. Check back soon!
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                    <p>Tip: Portfolio projects help showcase your skills and experience</p>
                    <p>Add projects to increase your chances of getting hired</p>
                </div>
            </Card>
        );
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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="space-y-8">
            {/* Portfolio Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-700 font-medium mb-1">Total Projects</p>
                                    <h3 className="text-2xl font-bold text-blue-900">{stats.totalProjects}</h3>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {stats.completedProjects} completed
                                    </p>
                                </div>
                                <Briefcase className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-700 font-medium mb-1">Featured</p>
                                    <h3 className="text-2xl font-bold text-amber-900">{stats.featuredProjects}</h3>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Highlighted work
                                    </p>
                                </div>
                                <Star className="w-8 h-8 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-700 font-medium mb-1">Total Budget</p>
                                    <h3 className="text-2xl font-bold text-green-900">
                                        {formatCurrency(stats.totalBudget)}
                                    </h3>
                                    <p className="text-xs text-green-600 mt-1">
                                        Combined project value
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-700 font-medium mb-1">Categories</p>
                                    <h3 className="text-2xl font-bold text-purple-900">
                                        {stats.categories.length}
                                    </h3>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Areas of expertise
                                    </p>
                                </div>
                                <Tag className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Portfolio Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            Portfolio
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {filteredItems.length} {filteredItems.length === 1 ? 'project' : 'projects'} •
                            {stats?.technologies?.length ? ` ${stats.technologies.length} technologies` : ''}
                        </p>
                    </div>
                </div>

                {!showFullList && filteredItems.length > maxDisplay && (
                    <div className="text-sm text-gray-600">
                        Showing {displayedItems.length} of {filteredItems.length}
                    </div>
                )}
            </div>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item) => (
                    <Card
                        key={item._id}
                        className="group hover:shadow-xl transition-all duration-300 hover:border-amber-500 overflow-hidden border hover:-translate-y-1"
                    >
                        {/* Featured Badge */}
                        {item.featured && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow-lg">
                                <Star className="w-3 h-3" />
                                Featured
                            </div>
                        )}

                        <CardContent className="p-0">
                            {/* Project Media */}
                            {item.mediaUrls && item.mediaUrls.length > 0 ? (
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={item.mediaUrls[0]}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/400x300/FFD700/000000?text=Project+Preview';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    {item.mediaUrls.length > 1 && (
                                        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            +{item.mediaUrls.length - 1} more
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <Briefcase className="w-16 h-16 text-gray-400" />
                                </div>
                            )}

                            <div className="p-6">
                                {/* Category & Budget */}
                                <div className="flex items-center justify-between mb-3">
                                    {item.category && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium"
                                        >
                                            {item.category}
                                        </Badge>
                                    )}
                                    {item.budget && (
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatCurrency(item.budget)}
                                            <span className="text-xs font-normal text-gray-600 ml-1">
                                                {formatBudgetType(item.budgetType)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <h4 className="font-bold text-lg text-gray-900 group-hover:text-amber-600 transition-colors mb-2 line-clamp-2">
                                    {item.title}
                                </h4>

                                {/* Description */}
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[60px]">
                                    {item.description || 'No description provided.'}
                                </p>

                                {/* Project Details */}
                                <div className="space-y-2 mb-4">
                                    {item.client && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">Client: {item.client}</span>
                                        </div>
                                    )}

                                    {item.completionDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Completed: {formatDate(item.completionDate)}</span>
                                        </div>
                                    )}

                                    {item.duration && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>Duration: {item.duration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Technologies */}
                                {item.technologies && item.technologies.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex flex-wrap gap-1">
                                            {item.technologies.slice(0, 5).map((tech, index) => (
                                                <Badge
                                                    key={`${item._id}-tech-${index}`}
                                                    variant="secondary"
                                                    className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                                                >
                                                    {tech}
                                                </Badge>
                                            ))}
                                            {item.technologies.length > 5 && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    +{item.technologies.length - 5}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Project Actions */}
                                <div className="mt-6 flex gap-2">
                                    {item.projectUrl && (
                                        <a
                                            href={item.projectUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm font-medium shadow-sm"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Live Project
                                        </a>
                                    )}

                                    {(!item.projectUrl && item.mediaUrls && item.mediaUrls.length > 0) && (
                                        <a
                                            href={item.mediaUrls[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View Details
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View All Button */}
            {filteredItems.length > maxDisplay && !showFullList && (
                <div className="text-center pt-8 border-t border-gray-200">
                    <div className="inline-flex flex-col items-center gap-4">
                        <p className="text-gray-600 text-sm">
                            Showing {displayedItems.length} of {filteredItems.length} projects
                        </p>
                        <button
                            onClick={() => window.location.hash = 'view-all-projects'}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                        >
                            <TrendingUp className="w-4 h-4" />
                            View All Projects
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {filteredItems.length}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Technologies Summary */}
            {stats && stats.technologies && stats.technologies.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Tag className="w-5 h-5 text-amber-600" />
                            <CardTitle>Technologies Used</CardTitle>
                        </div>
                        <CardDescription>
                            {stats.technologies.length} technologies across all projects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {stats.technologies.slice(0, 20).map((tech, index) => (
                                <Badge
                                    key={`tech-${index}`}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-300 hover:from-gray-100 hover:to-gray-200 transition-colors"
                                >
                                    {tech}
                                </Badge>
                            ))}
                            {stats.technologies.length > 20 && (
                                <div className="text-sm text-gray-500 mt-2">
                                    +{stats.technologies.length - 20} more technologies
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Categories Summary */}
            {stats && stats.categories.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-600" />
                            <CardTitle>Project Categories</CardTitle>
                        </div>
                        <CardDescription>
                            Expertise across {stats.categories.length} domain{stats.categories.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {stats.categories.map((category, index) => {
                                const categoryProjects = filteredItems.filter(item => item.category === category).length;
                                return (
                                    <div
                                        key={`cat-${index}`}
                                        className="px-4 py-3 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
                                    >
                                        <div className="font-medium text-purple-900 mb-1">{category}</div>
                                        <div className="text-sm text-purple-700">
                                            {categoryProjects} project{categoryProjects !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FreelancerPortfolioDisplay;