/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Tender/TenderList.tsx
import React from 'react';
import TenderCard from './TenderCard';
import { Tender } from '@/services/tenderService';
import { PaginationInfo } from '@/services/tenderService';
import { Filter, Grid, List } from 'lucide-react';

interface Props {
  tenders: Tender[];
  pagination?: PaginationInfo;
  onItemClick?: (t: Tender) => void;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: any) => void;
  noResults?: React.ReactNode;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  loading?: boolean;
  showFilters?: boolean;
}

const TenderList: React.FC<Props> = ({ 
  tenders, 
  pagination,
  onItemClick, 
  onPageChange,
  onFilterChange,
  // noResults, 
  viewMode = 'grid',
  onViewModeChange,
  loading = false,
  showFilters = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4 mb-6"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tenders || tenders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No tenders found</div>
        <p className="text-gray-500">Try adjusting your search filters or check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(showFilters || onViewModeChange) && (
        <div className="flex items-center justify-between">
          {showFilters && onFilterChange && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition">
              <Filter size={18} />
              <span>Filters</span>
            </button>
          )}
          
          {onViewModeChange && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {tenders.map((tender) => (
          <TenderCard 
            key={tender._id} 
            tender={tender} 
            onClick={() => onItemClick?.(tender)}
            compact={viewMode === 'list'}
            showStatus={viewMode === 'grid'}
          />
        ))}
      </div>
      
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Previous
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            const page = i + 1;
            // Show limited page numbers with ellipsis
            if (
              page === 1 || 
              page === pagination.totalPages || 
              (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-10 h-10 rounded-lg ${
                    page === pagination.currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              page === pagination.currentPage - 2 ||
              page === pagination.currentPage + 2
            ) {
              return <span key={page} className="px-2 text-gray-400">...</span>;
            }
            return null;
          })}
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TenderList;