/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/TenderDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  Target, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  FileText,
  Building,
  RefreshCw
} from 'lucide-react';

interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  company: {
    _id: string;
    name: string;
    verified: boolean;
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
  };
  moderated?: boolean;
  createdAt: string;
  updatedAt: string;
}

const TenderDashboard: React.FC = () => {
  const { getTenders, getSuspiciousTenders, data, loading } = useAdminData();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [suspiciousCount, setSuspiciousCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all tenders to calculate statistics
      const tendersResponse = await getTenders({ limit: 1000 });
      const tenders = tendersResponse?.data || tendersResponse?.tenders || [];
      
      // Load suspicious tenders count
      const suspiciousResponse = await getSuspiciousTenders({ limit: 1 });
      const suspiciousTenders = suspiciousResponse?.data || suspiciousResponse?.tenders || [];
      setSuspiciousCount(Array.isArray(suspiciousTenders) ? suspiciousTenders.length : 0);

      if (tenders.length > 0) {
        calculateDashboardStats(tenders);
      } else {
        // If no tenders from stats endpoint, use calculated data
        setDashboardData(calculateStatsFromTenders(tenders));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Info',
        description: 'Using calculated statistics from available data',
        variant: 'default',
      });
    }
  };

  const calculateStatsFromTenders = (tenders: Tender[]) => {
    const totalTenders = tenders.length;
    const publishedTenders = tenders.filter(t => t.status === 'published').length;
    const draftTenders = tenders.filter(t => t.status === 'draft').length;
    const completedTenders = tenders.filter(t => t.status === 'completed').length;
    const cancelledTenders = tenders.filter(t => t.status === 'cancelled').length;
    
    const totalProposals = tenders.reduce((sum, t) => sum + (t.proposals?.length || 0), 0);
    const avgProposalsPerTender = totalTenders > 0 ? totalProposals / totalTenders : 0;
    
    const highValueTenders = tenders.filter(t => t.budget?.max > 5000).length;
    const completionRate = totalTenders > 0 ? (completedTenders / totalTenders) * 100 : 0;

    // Calculate tenders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const tendersLast30Days = tenders.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo
    ).length;

    // Category statistics
    const categoryStats: any = {};
    tenders.forEach(tender => {
      const category = tender.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category]++;
    });

    const categories = Object.entries(categoryStats)
      .map(([name, count]) => ({ _id: name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity (latest 5 tenders)
    const recentActivity = [...tenders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(tender => ({
        title: tender.title,
        company: tender.company,
        status: tender.status,
        createdAt: tender.createdAt
      }));

    return {
      overview: {
        totalTenders,
        publishedTenders,
        draftTenders,
        completedTenders,
        cancelledTenders,
        tendersLast30Days,
        totalProposals,
        avgProposalsPerTender,
        highValueTenders,
        completionRate
      },
      categories,
      recentActivity
    };
  };

  const calculateDashboardStats = (tenders: Tender[]) => {
    const stats = calculateStatsFromTenders(tenders);
    setDashboardData(stats);
  };

  const stats = dashboardData || data?.data || data;

  const statCards = [
    {
      title: 'Total Tenders',
      value: stats?.overview?.totalTenders || 0,
      description: `${stats?.overview?.tendersLast30Days || 0} new last 30 days`,
      icon: Target,
      color: 'text-blue-600',
      trend: 'up'
    },
    {
      title: 'Active Tenders',
      value: stats?.overview?.publishedTenders || 0,
      description: `${stats?.overview?.draftTenders || 0} in draft`,
      icon: BarChart3,
      color: 'text-green-600',
      trend: 'stable'
    },
    {
      title: 'Total Proposals',
      value: stats?.overview?.totalProposals || 0,
      description: `${stats?.overview?.avgProposalsPerTender?.toFixed(1) || '0.0'} avg per tender`,
      icon: Users,
      color: 'text-purple-600',
      trend: 'up'
    },
    {
      title: 'Completion Rate',
      value: `${stats?.overview?.completionRate?.toFixed(1) || 0}%`,
      description: `${stats?.overview?.completedTenders || 0} completed`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      trend: 'up'
    },
    {
      title: 'High Value Tenders',
      value: stats?.overview?.highValueTenders || 0,
      description: 'Budget > $5,000',
      icon: DollarSign,
      color: 'text-amber-600',
      trend: 'up'
    },
    {
      title: 'Suspicious Tenders',
      value: suspiciousCount,
      description: 'Requires review',
      icon: AlertTriangle,
      color: 'text-red-600',
      trend: suspiciousCount > 0 ? 'alert' : 'neutral'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: 'default',
      draft: 'secondary', 
      completed: 'success',
      cancelled: 'destructive'
    };

    const variant = statusConfig[status as keyof typeof statusConfig] as any || 'outline';
    
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tender Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Overview of tender performance and statistics</p>
          </div>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tender Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of tender performance, statistics, and recent activity
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className="flex items-center gap-2">
                {getTrendIcon(card.trend)}
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tender Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-600">{stats?.overview?.publishedTenders || 0}</div>
                  <div className="text-sm text-blue-600 font-medium">Published</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.overview?.draftTenders || 0}</div>
                  <div className="text-sm text-yellow-600 font-medium">Draft</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600">{stats?.overview?.completedTenders || 0}</div>
                  <div className="text-sm text-green-600 font-medium">Completed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600">{stats?.overview?.cancelledTenders || 0}</div>
                  <div className="text-sm text-red-600 font-medium">Cancelled</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Proposals:</span>
                  <span className="font-semibold">{stats?.overview?.totalProposals || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Average Proposals/Tender:</span>
                  <span className="font-semibold">{stats?.overview?.avgProposalsPerTender?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">High Value Tenders:</span>
                  <span className="font-semibold">{stats?.overview?.highValueTenders || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.company?.name || 'Unknown Company'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Recent Activity</h3>
                  <p className="text-muted-foreground mt-2">
                    There hasn`t been any tender activity recently.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.categories?.slice(0, 5).map((category: any, index: number) => (
              <div key={category._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <span className="font-medium">{category._id || 'Uncategorized'}</span>
                    <p className="text-sm text-muted-foreground">
                      {category.count} tender{category.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{category.count}</Badge>
                  <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(category.count / (stats?.overview?.totalTenders || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.categories || stats.categories.length === 0) && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Category Data</h3>
                <p className="text-muted-foreground mt-2">
                  Category statistics are not available at the moment.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderDashboard;