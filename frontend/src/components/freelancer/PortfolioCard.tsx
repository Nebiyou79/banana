'use client';

import React, { useState } from 'react';
import { PortfolioItem } from '@/services/portfolioService';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  LinkIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface PortfolioCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  isOwnProfile?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  isOwnProfile = false 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      setIsDeleting(true);
      await onDelete(item._id);
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

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
      {item.mediaUrl && !imageError ? (
        <div className="h-48 w-full overflow-hidden relative">
          <Image 
            src={item.mediaUrl}
            alt={item.title}
            width={500}
            height={500}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={handleImageError}
          />
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            <EyeIcon className="w-4 h-4 inline mr-1" />
            Preview
          </div>
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-12 h-12 mx-auto mb-2">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
              </svg>
            </div>
            <p className="text-sm">No image available</p>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">{item.title}</h3>
        
        {item.client && (
          <p className="text-gray-600 mb-2">Client: {item.client}</p>
        )}
        
        {item.description && (
          <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{item.description}</p>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          {item.category && (
            <div className="flex items-center">
              <TagIcon className="w-4 h-4 mr-2" />
              <span>{item.category}</span>
            </div>
          )}
          
          {item.budget && (
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <span>{item.budget}</span>
            </div>
          )}
          
          {item.duration && (
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span>{item.duration}</span>
            </div>
          )}
          
          {item.completionDate && (
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>{formatDate(item.completionDate)}</span>
            </div>
          )}
        </div>

        {item.technologies && item.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.technologies.slice(0, 4).map((tech, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {tech}
              </span>
            ))}
            {item.technologies.length > 4 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                +{item.technologies.length - 4} more
              </span>
            )}
          </div>
        )}

        {item.projectUrl && (
          <div className="mb-4">
            <a
              href={item.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <LinkIcon className="w-4 h-4 mr-1" />
              View Live Project
            </a>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Added {formatDate(item.createdAt)}
          </span>
          
          {isOwnProfile && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                disabled={isDeleting}
                title="Edit item"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                disabled={isDeleting}
                title="Delete item"
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
      </div>
    </div>
  );
};

export default PortfolioCard;