// components/freelancer/PortfolioCard.tsx
'use client';

import React, { useState } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import { 
  PencilIcon, 
  TrashIcon, 
  LinkIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  BuildingOfficeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { colorClasses } from '@/utils/color';

interface PortfolioCardProps {
  item: PortfolioItem;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
  viewMode?: 'grid' | 'list';
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  isOwnProfile = false,
  viewMode = 'grid'
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      setIsDeleting(true);
      await onDelete?.(item._id);
      setIsDeleting(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (budget: number, budgetType?: string) => {
    if (!budget) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
    
    const amount = formatter.format(budget);
    return budgetType ? `${amount} ${budgetType}` : amount;
  };

  const mainImage = item.mediaUrls?.[0];

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-amber-200">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative md:w-64 h-48 md:h-auto overflow-hidden bg-gradient-to-br from-slate-50 to-amber-50">
            {mainImage && !imageError ? (
              <Image 
                src={mainImage}
                alt={item.title}
                width={256}
                height={192}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                  <p className="text-sm font-semibold text-gray-500">Project Image</p>
                </div>
              </div>
            )}
            
            {item.featured && (
              <div className="absolute top-3 left-3">
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center">
                  <StarIcon className="w-3 h-3 mr-1" />
                  Featured
                </div>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} group-hover:text-amber-700 transition-colors duration-300 line-clamp-2`}>
                    {item.title}
                  </h3>
                  {isOwnProfile && onEdit && onDelete && (
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors duration-200"
                        title="Edit project"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        disabled={isDeleting}
                        title="Delete project"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {item.client && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="text-sm font-semibold">{item.client}</span>
                  </div>
                )}

                {item.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed text-sm">
                    {item.description}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {item.category && (
                    <div className="flex items-center text-gray-700">
                      <TagIcon className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium capitalize">{item.category}</span>
                    </div>
                  )}
                  
                  {item.budget && (
                    <div className="flex items-center text-gray-700">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm font-medium">{formatBudget(item.budget, item.budgetType)}</span>
                    </div>
                  )}
                  
                  {item.duration && (
                    <div className="flex items-center text-gray-700">
                      <ClockIcon className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-sm font-medium">{item.duration}</span>
                    </div>
                  )}
                  
                  {item.completionDate && (
                    <div className="flex items-center text-gray-700">
                      <CalendarIcon className="w-4 h-4 mr-2 text-orange-500" />
                      <span className="text-sm font-medium">{formatDate(item.completionDate)}</span>
                    </div>
                  )}
                </div>

                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.technologies.slice(0, 4).map((tech, index) => (
                      <span 
                        key={index} 
                        className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200"
                      >
                        {tech}
                      </span>
                    ))}
                    {item.technologies.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                        +{item.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm transition-all duration-200 group/link"
                    >
                      <LinkIcon className="w-4 h-4 mr-2 group-hover/link:translate-x-1 transition-transform duration-200" />
                      View Project
                    </a>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {Math.floor(Math.random() * 100)} views
                  </span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-amber-200">
      {/* Premium Badge */}
      {item.featured && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center">
            <StarIcon className="w-3 h-3 mr-1" />
            Featured
          </div>
        </div>
      )}
      
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-amber-50">
        {mainImage && !imageError ? (
          <Image 
            src={mainImage}
            alt={item.title}
            width={400}
            height={192}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-amber-400" />
              <p className="text-sm font-semibold text-gray-500">Project Image</p>
            </div>
          </div>
        )}
        
        {/* Action Overlay */}
        {isOwnProfile && onEdit && onDelete && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="p-2 bg-white/90 backdrop-blur-sm text-amber-600 rounded-lg shadow-lg hover:bg-amber-50 transition-all duration-200"
              title="Edit project"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow-lg hover:bg-red-50 transition-all duration-200"
              disabled={isDeleting}
              title="Delete project"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-5">
        {/* Title & Client */}
        <div className="mb-3">
          <h3 className={`font-bold ${colorClasses.text.darkNavy} mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors duration-300 text-lg`}>
            {item.title}
          </h3>
          {item.client && (
            <div className="flex items-center text-gray-600 text-sm">
              <BuildingOfficeIcon className="w-4 h-4 mr-2 text-amber-500" />
              <span className="font-medium">{item.client}</span>
            </div>
          )}
        </div>
        
        {/* Description */}
        {item.description && (
          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed text-sm">
            {item.description}
          </p>
        )}

        {/* Project Details */}
        <div className="space-y-2 mb-4">
          {item.category && (
            <div className="flex items-center text-gray-700 text-sm">
              <TagIcon className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium capitalize">{item.category}</span>
            </div>
          )}
          
          {item.budget && (
            <div className="flex items-center text-gray-700 text-sm">
              <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-500" />
              <span className="font-medium">{formatBudget(item.budget, item.budgetType)}</span>
            </div>
          )}
        </div>

        {/* Technologies */}
        {item.technologies && item.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {item.technologies.slice(0, 3).map((tech, index) => (
                <span 
                  key={index} 
                  className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-semibold border border-amber-200"
                >
                  {tech}
                </span>
              ))}
              {item.technologies.length > 3 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">
                  +{item.technologies.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {item.projectUrl && (
              <a
                href={item.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm transition-all duration-200"
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                View
              </a>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;