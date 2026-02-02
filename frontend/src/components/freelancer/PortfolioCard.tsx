// components/freelancer/PortfolioCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import { colorClasses, getTheme } from '@/utils/color';
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
  CloudIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';


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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

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

  // NEW: Get optimized Cloudinary URL with responsive sizes
  const getOptimizedImageUrl = (url: string, width?: number, height?: number) => {
    if (!url) return '';
    
    // If it's a Cloudinary URL, add optimization parameters
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        let transformation = '';
        
        if (width && height) {
          transformation = `w_${width},h_${height},c_fill,q_auto,f_auto/`;
        } else {
          // Responsive transformations based on view mode
          if (viewMode === 'list') {
            transformation = 'w_256,h_192,c_fill,q_auto,f_auto/';
          } else {
            transformation = 'w_400,h_300,c_fill,q_auto,f_auto/';
          }
        }
        
        return `${parts[0]}/upload/${transformation}${parts[1]}`;
      }
    }
    
    return url;
  };

  // Mobile optimized image URL
  const getMobileImageUrl = (url: string) => {
    return getOptimizedImageUrl(url, 300, 200);
  };

  // Desktop optimized image URL
  const getDesktopImageUrl = (url: string) => {
    return getOptimizedImageUrl(url, viewMode === 'list' ? 256 : 400, viewMode === 'list' ? 192 : 300);
  };

  if (viewMode === 'list') {
    return (
      <div className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-amber-600' 
          : 'bg-white border-gray-100 hover:border-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className={`relative md:w-64 h-48 md:h-auto overflow-hidden ${
            isDarkMode 
              ? 'bg-linear-to-br from-gray-900 to-amber-900/20' 
              : 'bg-linear-to-br from-slate-50 to-amber-50'
          }`}>
            {mainImage && !imageError ? (
              <>
                {/* Mobile Image */}
                <Image 
                  src={getMobileImageUrl(mainImage)}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 md:hidden"
                  onError={handleImageError}
                  unoptimized
                />
                {/* Desktop Image */}
                <Image 
                  src={getDesktopImageUrl(mainImage)}
                  alt={item.title}
                  width={256}
                  height={192}
                  className="hidden md:block w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={handleImageError}
                  unoptimized
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <BuildingOfficeIcon className={`w-10 h-10 md:w-12 md:h-12 mb-2 ${
                  isDarkMode ? 'text-amber-500' : 'text-amber-400'
                }`} />
                <p className={`text-xs md:text-sm font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Project Image</p>
                {mainImage && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <CloudIcon className="w-3 h-3 mr-1" />
                    Cloudinary
                  </div>
                )}
              </div>
            )}
            
            {item.featured && (
              <div className="absolute top-3 left-3">
                <div className="bg-linear-to-r from-amber-400 to-amber-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center">
                  <StarIcon className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Featured</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                  <div>
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300 line-clamp-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    {item.client && (
                      <div className={`flex items-center text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <BuildingOfficeIcon className={`w-3 h-3 mr-1 ${
                          isDarkMode ? 'text-amber-500' : 'text-amber-500'
                        }`} />
                        <span className="font-medium truncate">{item.client}</span>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && onEdit && onDelete && (
                    <div className="flex space-x-1 sm:space-x-2 mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => onEdit(item)}
                        className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-800/50' 
                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        }`}
                        title="Edit project"
                      >
                        <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-800/50' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        disabled={isDeleting}
                        title="Delete project"
                      >
                        {isDeleting ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className={`mb-3 md:mb-4 line-clamp-2 leading-relaxed text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
                  {item.category && (
                    <div className={`flex items-center text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <TagIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-blue-500" />
                      <span className="font-medium truncate capitalize">{item.category}</span>
                    </div>
                  )}
                  
                  {item.budget && (
                    <div className={`flex items-center text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <CurrencyDollarIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-green-500" />
                      <span className="font-medium truncate">{formatBudget(item.budget, item.budgetType)}</span>
                    </div>
                  )}
                  
                  {item.duration && (
                    <div className={`flex items-center text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <ClockIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-purple-500" />
                      <span className="font-medium truncate">{item.duration}</span>
                    </div>
                  )}
                  
                  {item.completionDate && (
                    <div className={`flex items-center text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-orange-500" />
                      <span className="font-medium truncate">{formatDate(item.completionDate)}</span>
                    </div>
                  )}
                </div>

                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
                    {item.technologies.slice(0, 3).map((tech, index) => (
                      <span 
                        key={index} 
                        className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-semibold border ${
                          isDarkMode 
                            ? 'bg-amber-900/30 text-amber-300 border-amber-700/50' 
                            : 'bg-linear-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                    {item.technologies.length > 3 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        +{item.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={`flex flex-col sm:flex-row justify-between items-center pt-3 md:pt-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <div className="flex items-center space-x-3 md:space-x-4 mb-2 sm:mb-0">
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium text-xs md:text-sm transition-all duration-200 group/link"
                    >
                      <LinkIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 group-hover/link:translate-x-0.5 md:group-hover/link:translate-x-1 transition-transform duration-200" />
                      View Project
                    </a>
                  )}
                </div>
                
                <div className={`flex items-center space-x-2 md:space-x-3 text-xs md:text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {mainImage && mainImage.includes('cloudinary.com') && (
                    <span className="flex items-center">
                      <CloudIcon className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Cloudinary</span>
                    </span>
                  )}
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
    <div className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border overflow-hidden ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-amber-600' 
        : 'bg-white border-gray-100 hover:border-amber-200'
    }`}>
      {/* Premium Badge */}
      {item.featured && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
          <div className="bg-linear-to-r from-amber-400 to-amber-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center">
            <StarIcon className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Featured</span>
          </div>
        </div>
      )}
      
      {/* Image Section */}
      <div className={`relative h-40 sm:h-48 w-full overflow-hidden ${
        isDarkMode 
          ? 'bg-linear-to-br from-gray-900 to-amber-900/20' 
          : 'bg-linear-to-br from-slate-50 to-amber-50'
      }`}>
        {mainImage && !imageError ? (
          <>
            {/* Mobile Image */}
            <Image 
              src={getMobileImageUrl(mainImage)}
              alt={item.title}
              width={300}
              height={200}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 sm:hidden"
              onError={handleImageError}
              unoptimized
            />
            {/* Desktop Image */}
            <Image 
              src={getDesktopImageUrl(mainImage)}
              alt={item.title}
              width={400}
              height={300}
              className="hidden sm:block w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={handleImageError}
              unoptimized
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <BuildingOfficeIcon className={`w-10 h-10 sm:w-12 sm:h-12 mb-2 ${
              isDarkMode ? 'text-amber-500' : 'text-amber-400'
            }`} />
            <p className={`text-xs sm:text-sm font-semibold ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Project Image</p>
            {mainImage && (
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <CloudIcon className="w-3 h-3 mr-1" />
                Cloudinary
              </div>
            )}
          </div>
        )}
        
        {/* Action Overlay */}
        {isOwnProfile && onEdit && onDelete && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onEdit(item)}
              className={`p-1.5 sm:p-2 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-900/80 text-amber-400 hover:bg-gray-800/90' 
                  : 'bg-white/90 text-amber-600 hover:bg-amber-50'
              }`}
              title="Edit project"
            >
              <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-1.5 sm:p-2 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-900/80 text-red-400 hover:bg-gray-800/90' 
                  : 'bg-white/90 text-red-600 hover:bg-red-50'
              }`}
              disabled={isDeleting}
              title="Delete project"
            >
              {isDeleting ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-5">
        {/* Title & Client */}
        <div className="mb-2 sm:mb-3">
          <h3 className={`font-bold mb-1 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300 text-sm sm:text-base md:text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {item.title}
          </h3>
          {item.client && (
            <div className={`flex items-center text-xs sm:text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <BuildingOfficeIcon className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                isDarkMode ? 'text-amber-500' : 'text-amber-500'
              }`} />
              <span className="font-medium truncate">{item.client}</span>
            </div>
          )}
        </div>
        
        {/* Description */}
        {item.description && (
          <p className={`mb-2 sm:mb-3 md:mb-4 line-clamp-2 leading-relaxed text-xs sm:text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {item.description}
          </p>
        )}

        {/* Project Details */}
        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3 md:mb-4">
          {item.category && (
            <div className={`flex items-center text-xs sm:text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <TagIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
              <span className="font-medium truncate capitalize">{item.category}</span>
            </div>
          )}
          
          {item.budget && (
            <div className={`flex items-center text-xs sm:text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <CurrencyDollarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
              <span className="font-medium truncate">{formatBudget(item.budget, item.budgetType)}</span>
            </div>
          )}
        </div>

        {/* Technologies */}
        {item.technologies && item.technologies.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {item.technologies.slice(0, 2).map((tech, index) => (
                <span 
                  key={index} 
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold border ${
                    isDarkMode 
                      ? 'bg-amber-900/30 text-amber-300 border-amber-700/50' 
                      : 'bg-linear-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                  }`}
                >
                  {tech}
                </span>
              ))}
              {item.technologies.length > 2 && (
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  +{item.technologies.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {item.projectUrl && (
              <a
                href={item.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium text-xs sm:text-sm transition-all duration-200"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">View</span>
              </a>
            )}
            {mainImage && mainImage.includes('cloudinary.com') && (
              <span className={`text-xs ${colorClasses.text.gray600} hidden sm:flex items-center`}>
                <CloudIcon className="w-3 h-3 mr-1" />
              </span>
            )}
          </div>
          
          <div className={`text-xs ${colorClasses.text.gray600}`}>
            {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;