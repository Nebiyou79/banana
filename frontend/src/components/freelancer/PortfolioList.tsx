'use client';

import React from 'react';
import { PortfolioItem } from '@/services/portfolioService';
import PortfolioCard from './PortfolioCard';

interface PortfolioListProps {
  items: PortfolioItem[];
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  isOwnProfile?: boolean;
  emptyMessage?: string;
}

const PortfolioList: React.FC<PortfolioListProps> = ({ 
  items, 
  onEdit, 
  onDelete, 
  isOwnProfile = false,
  emptyMessage = "No portfolio items yet." 
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
          </svg>
        </div>
        <p className="text-gray-500 text-lg font-medium mb-2">{emptyMessage}</p>
        <p className="text-gray-400 text-sm">Get started by adding your first project</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <PortfolioCard
          key={item._id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          isOwnProfile={isOwnProfile}
        />
      ))}
    </div>
  );
};

export default PortfolioList;