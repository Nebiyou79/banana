// components/freelancer/PortfolioList.tsx
'use client';

import React, { useState } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import PortfolioCard from './PortfolioCard';
import { colorClasses } from '@/utils/color';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

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

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200">
        {typeof emptyMessage === 'string' ? (
          <>
            <div className="w-24 h-24 mx-auto mb-6 text-amber-400">
              <svg fill="currentColor" viewBox="0 0 24 24" className="opacity-60">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
              </svg>
            </div>
            <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} mb-3`}>
              {emptyMessage}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
              Showcase your best work to attract potential clients and demonstrate your expertise.
            </p>
            {isOwnProfile && (
              <div className="mt-6">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping mx-auto mb-2"></div>
                <p className="text-amber-600 font-semibold">Add your first project to get started</p>
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
    <div className="space-y-6">
      {/* Header with Stats and Controls */}
      {showStats && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
                Portfolio Projects
              </h3>
              <p className="text-gray-600">
                {items.length} project{items.length !== 1 ? 's' : ''} in your portfolio
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* View Mode Toggle */}
              {viewMode === 'auto' && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentViewMode === 'grid' 
                        ? 'bg-white text-amber-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentViewMode === 'list' 
                        ? 'bg-white text-amber-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{items.length}</div>
                  <div className="text-sm text-gray-500 font-medium">Total</div>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {items.filter(item => item.featured).length}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Featured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid/List */}
      <div className={
        currentViewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
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

      {/* Load More */}
      {items.length >= 9 && (
        <div className="text-center pt-6">
          <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/25">
            Load More Projects
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioList;