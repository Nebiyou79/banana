/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/TenderTable.tsx
import React from 'react';
import { useToast } from '@/hooks/use-toast';

interface Tender {
  _id: string;
  title: string;
  company: {
    name: string;
    verified: boolean;
    industry?: string;
  };
  status: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  proposals: any[];
  createdAt: string;
  deadline: string;
  moderated?: boolean;
  moderationReason?: string;
}

interface TenderTableProps {
  tenders: Tender[];
  loading?: boolean;
  onEdit?: (tender: Tender) => void;
  onDelete?: (tenderId: string) => void;
  onModerate?: (tenderId: string, action: 'flag' | 'approve') => void;
}

const TenderTable: React.FC<TenderTableProps> = ({ 
  tenders, 
  loading, 
  onEdit, 
  onDelete, 
  onModerate 
}) => {
  const { toast } = useToast();

  const getStatusBadge = (status: string, moderated: boolean = false) => {
    const statusConfig = {
      published: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
        label: 'Published' 
      },
      draft: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 
        label: 'Draft' 
      },
      completed: { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 
        label: 'Completed' 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', 
        label: 'Cancelled' 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <div className="flex items-center gap-1">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
        {moderated && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Flagged
          </span>
        )}
      </div>
    );
  };

  const formatBudget = (budget: Tender['budget']) => {
    return `${budget.currency} ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
  };

  const handleDeleteClick = (tender: Tender) => {
    if (window.confirm(`Are you sure you want to delete the tender "${tender.title}"?`)) {
      onDelete?.(tender._id);
    }
  };

  const handleModerateClick = (tender: Tender, action: 'flag' | 'approve') => {
    const actionText = action === 'flag' ? 'flag' : 'approve';
    if (window.confirm(`Are you sure you want to ${actionText} the tender "${tender.title}"?`)) {
      onModerate?.(tender._id, action);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tender Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Budget
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Proposals
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tenders.map((tender) => (
            <tr key={tender._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {tender.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tender.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {tender.company.name}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {tender.company.verified && (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1 rounded">
                      Verified
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tender.company.industry}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatBudget(tender.budget)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {tender.proposals?.length || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(tender.status, tender.moderated)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(tender.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit?.(tender)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Edit
                </button>
                {!tender.moderated ? (
                  <button
                    onClick={() => handleModerateClick(tender, 'flag')}
                    className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    Flag
                  </button>
                ) : (
                  <button
                    onClick={() => handleModerateClick(tender, 'approve')}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDeleteClick(tender)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tenders.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tenders found
        </div>
      )}
    </div>
  );
};

export default TenderTable;