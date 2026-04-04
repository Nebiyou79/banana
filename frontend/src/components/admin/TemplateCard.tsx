import React from 'react';

interface TemplateCardProps {
  title: string;
  description: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
  onUse?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  description,
  category,
  usageCount,
  lastUsed,
  onUse,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
          {category}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {description}
      </p>
      
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span>Used {usageCount} times</span>
        {lastUsed && <span>Last used: {new Date(lastUsed).toLocaleDateString()}</span>}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onUse}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          Use Template
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;