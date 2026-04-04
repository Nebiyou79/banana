// pages/dashboard/admin/tenders/index.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import TenderDashboard from '@/components/admin/TenderDashboard';
import TenderManagement from '@/components/admin/TenderMangment';
import EnhancedTenderManagement from '@/components/admin/EnhancedTenderMangment';
import TenderAnalytics from '@/components/admin/TenderAnalytics';
import SuspiciousTenders from '@/components/admin/SuspiciousTenders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  BarChart3, 
  Settings, 
  Users, 
  AlertTriangle,
  Grid3X3
} from 'lucide-react';
import React from 'react';

const TendersPage: React.FC = () => {
  return (
    <AdminRouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tender Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive tender management and analytics dashboard
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Management
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Bulk Actions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="suspicious" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Suspicious
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <TenderDashboard />
            </TabsContent>

            <TabsContent value="management">
              <TenderManagement />
            </TabsContent>

            <TabsContent value="enhanced">
              <EnhancedTenderManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <TenderAnalytics />
            </TabsContent>

            <TabsContent value="suspicious">
              <SuspiciousTenders />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRouteGuard>
  );
};

export default TendersPage;