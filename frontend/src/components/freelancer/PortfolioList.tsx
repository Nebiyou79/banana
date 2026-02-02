// components/freelancer/PortfolioList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import PortfolioCard from './PortfolioCard';
import { colorClasses } from '@/utils/color';
import { Squares2X2Icon, ListBulletIcon, CloudIcon } from '@heroicons/react/24/outline';

interface PortfolioListProps {
  items: PortfolioItem[];
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
  emptyMessage?: string | React.ReactNode;
  showStats?: boolean;
  viewMode?: 'grid' | 'list' | 'auto';
}

const PortfolioList: React.FC<PortfolioListProps> = ({ 
  items, 
  onEdit, 
  onDelete, 
  isOwnProfile = false,
  emptyMessage = "No portfolio items yet.",
  showStats = true,
  viewMode = 'auto'
}) => {
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>(
    viewMode === 'auto' ? 'grid' : viewMode
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // const theme = getTheme(isDarkMode ? 'dark' : 'light');

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 sm:py-16 rounded-2xl border-2 border-dashed ${
        isDarkMode 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-amber-800/50' 
          : 'bg-linear-to-br from-amber-50 to-orange-50 border-amber-200'
      }`}>
        {typeof emptyMessage === 'string' ? (
          <>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 ${
              isDarkMode ? 'text-amber-500' : 'text-amber-400'
            }`}>
              <CloudIcon className="w-full h-full mb-2" />
            </div>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 ${colorClasses.text.darkNavy}`}>
              {emptyMessage}
            </h3>
            <p className={`max-w-md mx-auto leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base px-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Showcase your best work to attract potential clients and demonstrate your expertise.
            </p>
            {isOwnProfile && (
              <div className="mt-4 sm:mt-6">
                <div className={`flex items-center justify-center mb-2 ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping mr-2"></div>
                  <p className="font-semibold text-sm sm:text-base">Add your first project to get started</p>
                </div>
                <p className={`text-xs sm:text-sm ${colorClasses.text.gray600}`}>
                  Upload directly to Cloudinary with optimized images
                </p>
              </div>
            )}
          </>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats and Controls */}
      {showStats && (
        <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-amber-100'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                  Portfolio Projects
                </h3>
                <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center ${
                  isDarkMode 
                    ? 'bg-amber-900/30 text-amber-300' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <CloudIcon className="w-3 h-3 mr-1" />
                  Cloudinary
                </div>
              </div>
              <p className={`text-sm sm:text-base ${colorClasses.text.gray600}`}>
                {items.length} project{items.length !== 1 ? 's' : ''} • Optimized with Cloudinary
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
              {/* View Mode Toggle */}
              {viewMode === 'auto' && (
                <div className={`flex items-center gap-1 rounded-lg p-1 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <button
                    onClick={() => setCurrentViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                      currentViewMode === 'grid' 
                        ? isDarkMode
                          ? 'bg-gray-600 text-amber-400' 
                          : 'bg-white text-amber-600 shadow-sm'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    aria-label="Grid view"
                  >
                    <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                      currentViewMode === 'list' 
                        ? isDarkMode
                          ? 'bg-gray-600 text-amber-400' 
                          : 'bg-white text-amber-600 shadow-sm'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    aria-label="List view"
                  >
                    <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-center flex-1 sm:flex-none">
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>{items.length}</div>
                  <div className={`text-xs sm:text-sm font-medium ${colorClasses.text.gray600}`}>Total</div>
                </div>
                <div className={`h-6 sm:h-8 w-px ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}></div>
                <div className="text-center flex-1 sm:flex-none">
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {items.filter(item => item.featured).length}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${colorClasses.text.gray600}`}>Featured</div>
                </div>
                <div className={`h-6 sm:h-8 w-px ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}></div>
                <div className="text-center flex-1 sm:flex-none">
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {items.filter(item => item.technologies && item.technologies.length > 0).length}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${colorClasses.text.gray600}`}>With Tech</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid/List */}
      <div className={
        currentViewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
          : "space-y-3 sm:space-y-4"
      }>
        {items.map((item) => (
          <PortfolioCard
            key={item._id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            isOwnProfile={isOwnProfile}
            viewMode={currentViewMode}
          />
        ))}
      </div>

      {/* Load More - Show only on desktop when there are many items */}
      {items.length >= 6 && (
        <div className="hidden sm:block text-center pt-4 sm:pt-6">
          <button className={`px-6 sm:px-8 py-2 sm:py-3 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/25 text-sm sm:text-base`}>
            Load More Projects
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioList;