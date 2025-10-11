/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/EnhancedTenderManagement.tsx
import React, { useState, useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Flag,
  Send,
  Eye,
  Edit,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillsRequired: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string;
  duration: number;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  company: {
    _id: string;
    name: string;
    industry: string;
    verified: boolean;
    website?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  proposals: any[];
  metadata: {
    views: number;
    proposalCount: number;
    savedBy: string[];
  };
  moderated?: boolean;
  moderationReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BulkAction {
  action: 'publish' | 'unpublish' | 'complete' | 'cancel' | 'flag' | 'delete';
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline';
  description: string;
}

const EnhancedTenderManagement: React.FC = () => {
  const [selectedTenders, setSelectedTenders] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    category: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const { 
    getTenders, 
    bulkTenderActions, 
    updateTenderStatus,
    moderateTender,
    data, 
    loading 
  } = useAdminData();
  const { toast } = useToast();

  useEffect(() => {
    loadTenders();
  }, [filters, currentPage, itemsPerPage]);

  const loadTenders = async () => {
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      };
      await getTenders(params);
    } catch (error) {
      console.error('Failed to load tenders:', error);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      action: 'publish',
      label: 'Publish Selected',
      icon: <Send className="h-4 w-4" />,
      variant: 'default',
      description: 'Make selected tenders visible to freelancers'
    },
    {
      action: 'unpublish',
      label: 'Unpublish Selected',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'outline',
      description: 'Move selected tenders to draft status'
    },
    {
      action: 'complete',
      label: 'Mark as Completed',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      description: 'Mark selected tenders as completed'
    },
    {
      action: 'cancel',
      label: 'Cancel Selected',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'outline',
      description: 'Cancel selected tenders'
    },
    {
      action: 'flag',
      label: 'Flag as Suspicious',
      icon: <Flag className="h-4 w-4" />,
      variant: 'outline',
      description: 'Flag selected tenders for review'
    }
  ];

  const handleBulkAction = async (action: BulkAction['action']) => {
    if (selectedTenders.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one tender',
        variant: 'destructive',
      });
      return;
    }

    try {
      await bulkTenderActions({
        action,
        tenderIds: selectedTenders,
        data: action === 'flag' ? { reason: 'Bulk action by admin' } : undefined
      });

      toast({
        title: 'Success',
        description: `Successfully performed ${action} on ${selectedTenders.length} tenders`,
      });

      setSelectedTenders([]);
      loadTenders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to perform bulk ${action}`,
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const tenders = getTendersFromResponse(data);
    setSelectedTenders(checked ? tenders.map((t: any) => t._id) : []);
  };

  const handleSelectTender = (tenderId: string, checked: boolean) => {
    setSelectedTenders(prev =>
      checked ? [...prev, tenderId] : prev.filter(id => id !== tenderId)
    );
  };

  const handleStatusUpdate = async (tenderId: string, newStatus: string) => {
    try {
      await updateTenderStatus(tenderId, { status: newStatus });
      toast({
        title: 'Success',
        description: `Tender status updated to ${newStatus}`,
      });
      loadTenders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tender status',
        variant: 'destructive',
      });
    }
  };

  const handleModerate = async (tenderId: string, action: 'flag' | 'approve') => {
    try {
      await moderateTender(tenderId, { 
        action, 
        reason: action === 'flag' ? 'Manual moderation by admin' : undefined 
      });
      toast({
        title: 'Success',
        description: `Tender ${action === 'flag' ? 'flagged' : 'approved'}`,
      });
      loadTenders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} tender`,
        variant: 'destructive',
      });
    }
  };

  const getTendersFromResponse = (responseData: any): Tender[] => {
    if (!responseData) return [];
    
    if (Array.isArray(responseData)) {
      return responseData;
    }
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    if (responseData.tenders && Array.isArray(responseData.tenders)) {
      return responseData.tenders;
    }
    
    return [];
  };

  const getStatusBadge = (status: string, moderated: boolean = false) => {
    const statusConfig = {
      published: 'default',
      draft: 'secondary', 
      completed: 'success',
      cancelled: 'destructive'
    };

    const variant = statusConfig[status as keyof typeof statusConfig] as any || 'outline';
    
    return (
      <div className="flex items-center gap-1">
        <Badge variant={variant}>
          {status}
        </Badge>
        {moderated && (
          <Badge variant="destructive" className="text-xs">
            <Flag className="h-3 w-3 mr-1" />
            Flagged
          </Badge>
        )}
      </div>
    );
  };

  const formatBudget = (budget: Tender['budget']) => {
    return `${budget.currency} ${budget.min?.toLocaleString() || 0} - ${budget.max?.toLocaleString() || 0}`;
  };

  const tenders = getTendersFromResponse(data);
  const allSelected = selectedTenders.length > 0 && selectedTenders.length === tenders.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enhanced Tender Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced tender management with bulk actions and detailed controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            // variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            size="sm"
          >
            Table View
          </Button>
          <Button
            // variant={viewMode === 'card' ? 'default' : 'outline'}
            onClick={() => setViewMode('card')}
            size="sm"
          >
            Card View
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTenders.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    {selectedTenders.length} tender(s) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {bulkActions.map((action) => (
                    <Button
                      key={action.action}
                      // variant={action.variant}
                      size="sm"
                      onClick={() => handleBulkAction(action.action)}
                      className="flex items-center gap-1"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTenders([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Search Tenders</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, company, or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Items per page</label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="10 per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenders Display */}
      {viewMode === 'table' ? (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : tenders.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tender Details
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tenders.map((tender: Tender) => (
                    <tr key={tender._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedTenders.includes(tender._id)}
                          onCheckedChange={(checked) => 
                            handleSelectTender(tender._id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tender.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tender.category}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(tender.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {tender.company?.name}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {tender.company?.verified && (
                                <Badge variant="outline" className="text-xs">Verified</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatBudget(tender.budget)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {tender.proposals?.length || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tender.status, tender.moderated)}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Tender
                            </DropdownMenuItem>
                            
                            {tender.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(tender._id, 'cancelled')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Tender
                              </DropdownMenuItem>
                            )}
                            
                            {tender.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(tender._id, 'published')}>
                                <Send className="h-4 w-4 mr-2" />
                                Publish Tender
                              </DropdownMenuItem>
                            )}

                            {!tender.moderated ? (
                              <DropdownMenuItem onClick={() => handleModerate(tender._id, 'flag')}>
                                <Flag className="h-4 w-4 mr-2" />
                                Flag Tender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleModerate(tender._id, 'approve')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Tender
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  No tenders found matching your criteria.
                </div>
                <Button 
                  onClick={() => setFilters({ status: '', search: '', category: '' })}
                  variant="outline" 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-64"></CardContent>
              </Card>
            ))
          ) : tenders.length > 0 ? (
            tenders.map((tender: Tender) => (
              <Card key={tender._id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTenders.includes(tender._id)}
                        onCheckedChange={(checked) => 
                          handleSelectTender(tender._id, checked as boolean)
                        }
                      />
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">{tender.title}</h3>
                        <Badge variant="outline" className="mt-1">{tender.category}</Badge>
                      </div>
                    </div>
                    {getStatusBadge(tender.status, tender.moderated)}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>{tender.company?.name}</span>
                      {tender.company?.verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{formatBudget(tender.budget)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Due: {new Date(tender.deadline).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span>{tender.metadata?.views || 0} views • {tender.proposals?.length || 0} proposals</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(tender.createdAt).toLocaleDateString()}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!tender.moderated ? (
                          <DropdownMenuItem onClick={() => handleModerate(tender._id, 'flag')}>
                            <Flag className="h-4 w-4 mr-2" />
                            Flag
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleModerate(tender._id, 'approve')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">
                No tenders found matching your criteria.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTenderManagement;