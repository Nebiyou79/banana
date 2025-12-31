// components/organization/OrganizationProjectsSection.tsx
import React from 'react';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Target, Calendar, Users, Globe, Award, TrendingUp, ArrowRight, PlusCircle } from 'lucide-react';

interface Project {
    _id?: string;
    title: string;
    description?: string;
    category?: string;
    completionDate?: string;
    impact?: string;
    budget?: number;
    teamSize?: number;
}

interface OrganizationProjectsSectionProps {
    organizationId: string;
    organizationName: string;
    projects: Project[];
    isOwnOrganization: boolean;
    showFullList?: boolean;
}

export const OrganizationProjectsSection: React.FC<OrganizationProjectsSectionProps> = ({
    organizationId,
    organizationName,
    projects,
    isOwnOrganization,
    showFullList = false,
}) => {
    const displayedProjects = showFullList ? projects : projects.slice(0, 6);

    if (projects.length === 0) {
        return (
            <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Projects Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                    {organizationName} hasn't shared any projects yet. Check back soon for updates on their initiatives and impact.
                </p>
                {isOwnOrganization && (
                    <Button
                        onClick={() => window.location.href = '/social/organization/projects/create'}
                        variant="premium"
                        className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Your First Project
                    </Button>
                )}
            </Card>
        );
    }

    return (
        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Projects & Initiatives
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {projects.length} projects • Making an impact in our community
                        </p>
                    </div>
                </div>
                {isOwnOrganization && (
                    <Button
                        onClick={() => window.location.href = '/social/organization/projects/create'}
                        variant="premium"
                        className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Project
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProjects.map((project, index) => (
                    <div
                        key={project._id || index}
                        className="group backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-500 transition-all duration-300 hover:scale-105"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                <Target className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                {project.title}
                            </h4>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {project.description || 'No description provided.'}
                        </p>

                        <div className="space-y-3">
                            {project.category && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-green-500">•</span>
                                    <span>{project.category}</span>
                                </div>
                            )}

                            {project.completionDate && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>Completed: {new Date(project.completionDate).getFullYear()}</span>
                                </div>
                            )}

                            {project.teamSize && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-3 h-3" />
                                    <span>{project.teamSize} team members</span>
                                </div>
                            )}

                            {project.budget && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>💰</span>
                                    <span>Budget: ${project.budget.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {project.impact && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Impact: {project.impact}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {projects.length > 6 && !showFullList && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Button
                        onClick={() => window.location.href = `/social/organization/${organizationId}/projects`}
                        variant="outline"
                        className="w-full group backdrop-blur-lg border-gray-300"
                    >
                        View All {projects.length} Projects
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </Card>
    );
};