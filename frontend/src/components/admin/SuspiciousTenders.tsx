/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/SuspiciousTenders.tsx
import React, { useState, useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw
} from 'lucide-react';

interface SuspiciousTender {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
    verified: boolean;
    createdAt: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  proposals: any[];
  metadata: {
    views: number;
  };
  createdAt: string;
  moderated?: boolean;
  moderationReason?: string;
}

const SuspiciousTenders: React.FC = () => {
  const [tenders, setTenders] = useState<SuspiciousTender[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    minBudget: '',
    maxBudget: ''
  });

  const { getSuspiciousTenders, moderateTender, updateTenderStatus } = useAdminData();
  const { toast } = useToast();

  useEffect(() => {
    loadSuspiciousTenders();
  }, []);

  const loadSuspiciousTenders = async () => {
    setLoading(true);
    try {
      const response = await getSuspiciousTenders();
      // Handle different response structures
      const tendersData = response?.data || response?.tenders || [];
      console.log('Suspicious tenders response:', response);
      console.log('Processed tenders:', tendersData);
      setTenders(Array.isArray(tendersData) ? tendersData : []);
    } catch (error) {
      console.error('Failed to load suspicious tenders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suspicious tenders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTender = async (tenderId: string) => {
    setActionLoading(tenderId);
    try {
      await moderateTender(tenderId, { action: 'approve' });
      toast({
        title: 'Success',
        description: 'Tender approved and removed from suspicious list',
      });
      // Remove the tender from the local list immediately
      setTenders(prev => prev.filter(t => t._id !== tenderId));
    } catch (error: any) {
      console.error('Approve error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve tender',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlagTender = async (tenderId: string) => {
    setActionLoading(tenderId);
    try {
      await moderateTender(tenderId, { 
        action: 'flag', 
        reason: 'Confirmed suspicious activity by admin' 
      });
      toast({
        title: 'Success',
        description: 'Tender flagged as suspicious',
      });
      // Update the tender status locally
      setTenders(prev => prev.map(t => 
        t._id === tenderId 
          ? { ...t, moderated: true, moderationReason: 'Confirmed suspicious activity by admin' }
          : t
      ));
    } catch (error: any) {
      console.error('Flag error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to flag tender',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTender = async (tenderId: string) => {
    setActionLoading(tenderId);
    try {
      await updateTenderStatus(tenderId, { status: 'cancelled' });
      toast({
        title: 'Success',
        description: 'Tender cancelled successfully',
      });
      // Remove the tender from the list
      setTenders(prev => prev.filter(t => t._id !== tenderId));
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel tender',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getSuspicionReason = (tender: SuspiciousTender): string => {
    const reasons = [];
    
    if (tender.budget?.max > 100000) {
      reasons.push('Unusually high budget');
    }
    if (tender.metadata?.views < 5 && (tender.proposals?.length || 0) > 0) {
      reasons.push('Low views but has proposals');
    }
    if (!tender.company?.verified && tender.budget?.max > 10000) {
      reasons.push('High budget from unverified company');
    }
    if (tender.metadata?.views < 10 && (tender.proposals?.length || 0) > 0) {
      reasons.push('Suspicious engagement pattern');
    }

    return reasons.join(', ') || (tender.moderationReason || 'Automatically flagged by system');
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = filters.search === '' || 
      tender.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      tender.company?.name.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesMinBudget = filters.minBudget === '' || (tender.budget?.max || 0) >= Number(filters.minBudget);
    const matchesMaxBudget = filters.maxBudget === '' || (tender.budget?.max || 0) <= Number(filters.maxBudget);

    return matchesSearch && matchesMinBudget && matchesMaxBudget;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suspicious Tenders</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and moderate potentially fraudulent or inappropriate tenders
          </p>
        </div>
        <Button onClick={loadSuspiciousTenders} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenders..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Budget</label>
              <Input
                type="number"
                placeholder="Min budget"
                value={filters.minBudget}
                onChange={(e) => setFilters(prev => ({ ...prev, minBudget: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Budget</label>
              <Input
                type="number"
                placeholder="Max budget"
                value={filters.maxBudget}
                onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Actions</label>
              <Button 
                onClick={() => setFilters({ search: '', minBudget: '', maxBudget: '' })}
                variant="outline" 
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Suspicious Tenders ({filteredTenders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTenders.length > 0 ? (
            <div className="space-y-4">
              {filteredTenders.map((tender) => (
                <div key={tender._id} className="p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{tender.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tender.company?.name || 'Unknown Company'} • {new Date(tender.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Suspicious
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <strong>Budget:</strong> {tender.budget?.currency || '$'} {tender.budget?.min?.toLocaleString() || 0} - {tender.budget?.max?.toLocaleString() || 0}
                    </div>
                    <div>
                      <strong>Views:</strong> {tender.metadata?.views || 0}
                    </div>
                    <div>
                      <strong>Proposals:</strong> {tender.proposals?.length || 0}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Suspicion Reasons: {getSuspicionReason(tender)}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={tender.company?.verified ? "default" : "outline"}>
                        {tender.company?.verified ? "Verified Company" : "Unverified Company"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Created by: {tender.createdBy?.name || 'Unknown'} ({tender.createdBy?.email || 'No email'})
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleApproveTender(tender._id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === tender._id}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === tender._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleFlagTender(tender._id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === tender._id || tender.moderated}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === tender._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {tender.moderated ? 'Flagged' : 'Confirm Flag'}
                      </Button>
                      <Button
                        onClick={() => handleCancelTender(tender._id)}
                        // variant="destructive"
                        size="sm"
                        disabled={actionLoading === tender._id}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === tender._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No suspicious tenders found</h3>
              <p className="text-muted-foreground">
                {tenders.length === 0 
                  ? "No tenders flagged as suspicious at this time." 
                  : "No tenders match your current filters."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspiciousTenders;