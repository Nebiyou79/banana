import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderFormSelector } from '@/components/tenders/TenderFormSelector';
import FreelanceTenderForm from '@/components/tenders/FreelanceTenderForm';
import ProfessionalTenderForm from '@/components/tenders/ProfessionalTenderForm';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  ArrowLeft, 
  Briefcase, 
  Building2, 
  FileText, 
  Shield,
  Users,
  Globe,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const OrganizationCreateTenderPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<'freelance' | 'professional' | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle browser back button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges && !url.includes('create') && !showBackConfirmation) {
        router.events.emit('routeChangeError');
        throw 'Abort route change';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [hasUnsavedChanges, showBackConfirmation, router]);

  const handleSelectType = (type: 'freelance' | 'professional') => {
    setSelectedType(type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Log analytics for organization
    console.log(`Organization selected tender type: ${type}`);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowBackConfirmation(true);
    } else {
      setSelectedType(null);
    }
  };

  const handleConfirmBack = () => {
    setSelectedType(null);
    setHasUnsavedChanges(false);
    setShowBackConfirmation(false);
  };

  const handleFormChange = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  const handleSuccess = () => {
    toast({
      title: 'Tender Created!',
      description: selectedType === 'freelance' 
        ? 'Freelance tender has been created and submitted for approval'
        : 'Professional tender has been created and submitted for approval',
      variant: 'default',
    });
    
    // Redirect to organization tenders page
    router.push('/dashboard/organization/tenders');
  };

  const renderBreadcrumb = () => (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/organization')}
        className="text-gray-600 hover:text-gray-900"
      >
        Dashboard
      </Button>
      <span className="text-gray-400">/</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/organization/tenders')}
        className="text-gray-600 hover:text-gray-900"
      >
        Organization Tenders
      </Button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-900 font-medium">Create Tender</span>
    </nav>
  );

  const renderOrganizationInfo = () => (
    <Card className="mb-6 border-l-4 border-l-purple-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Organization Tender</h3>
              <p className="text-gray-600">
                Creating tender on behalf of <span className="font-semibold">{user?.company || 'Your Organization'}</span>
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Organization Members: {user?.company || 'Multiple'}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>Visibility: Organization & Partners</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>Compliance: Required</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Organization Account
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderForm = () => {
    if (!selectedType) return null;

    return (
      <div className="space-y-6">
        {/* Form Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Selection
            </Button>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${selectedType === 'freelance' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                {selectedType === 'freelance' ? (
                  <Briefcase className="h-6 w-6" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create {selectedType === 'freelance' ? 'Freelance' : 'Professional'} Tender
                </h2>
                <p className="text-gray-600">
                  {selectedType === 'freelance' 
                    ? 'Create a freelance tender for individual contributors'
                    : 'Create a formal procurement tender for registered companies'}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedType === 'freelance' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
              {selectedType === 'freelance' ? 'Freelance' : 'Professional'}
            </div>
            <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              Organization
            </div>
          </div>
        </div>

        {/* Organization Specific Requirements */}
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Organization Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All tenders require organizational approval before publication</li>
                  <li>• Budget approval may be required for large projects</li>
                  <li>• Compliance documents must be attached for professional tenders</li>
                  <li>• All communications are logged for audit purposes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Creating {selectedType === 'freelance' ? 'Freelance' : 'Professional'} Tender</h3>
              <p className="text-gray-600 text-sm">
                Complete all sections and submit for organizational approval
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Organization approval required</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`h-2 flex-1 rounded-full ${selectedType === 'freelance' ? 'bg-emerald-200' : 'bg-blue-200'}`}>
              <div 
                className={`h-full rounded-full ${selectedType === 'freelance' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: '25%' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">Step 1 of 4</span>
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tender Details
            </CardTitle>
            <CardDescription>
              Fill in all required information to create your tender
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {selectedType === 'freelance' ? (
              <FreelanceTenderForm 
                defaultConfig={{
                  workflowType: 'open',
                  status: 'draft'
                }}
                onSuccess={handleSuccess}
              />
            ) : (
              <ProfessionalTenderForm />
            )}
          </CardContent>
        </Card>

        {/* Organization Approval Process */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Organization Approval Process
            </CardTitle>
            <CardDescription>
              Your tender will go through the following approval process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <h4 className="font-semibold text-gray-900">Draft Creation</h4>
                </div>
                <p className="text-sm text-gray-600">
                  You create and save the tender draft
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <h4 className="font-semibold text-gray-900">Review</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Organization admin reviews the tender
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <h4 className="font-semibold text-gray-900">Approval</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tender is approved or modifications requested
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <h4 className="font-semibold text-gray-900">Publication</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tender is published to the marketplace
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Create Tender | Organization | BananaLink</title>
        <meta name="description" content="Create a new tender on behalf of your organization" />
      </Head>

      <DashboardLayout requiredRole="organization">
        <div className="p-6 max-w-7xl mx-auto">
          {renderBreadcrumb()}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Organization Tender</h1>
            <p className="text-gray-600">
              Create a tender on behalf of your organization for procurement needs
            </p>
          </div>

          {renderOrganizationInfo()}

          {!selectedType ? (
            <TenderFormSelector onSelect={handleSelectType} />
          ) : (
            renderForm()
          )}
        </div>

        {/* Back Confirmation Dialog */}
        {showBackConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Unsaved Changes</CardTitle>
                <CardDescription>
                  You have unsaved changes. Are you sure you want to go back?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Going back will discard all unsaved changes in your tender.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowBackConfirmation(false)}
                    >
                      Continue Editing
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleConfirmBack}
                    >
                      Discard Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </>
  );
};

export default OrganizationCreateTenderPage;