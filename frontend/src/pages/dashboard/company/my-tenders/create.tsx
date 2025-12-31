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
import { ArrowLeft, Briefcase, Building2, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CompanyCreateTenderPage: NextPage = () => {
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
      title: 'Success!',
      description: selectedType === 'freelance' 
        ? 'Freelance tender created successfully'
        : 'Professional tender created successfully',
      variant: 'default',
    });
    router.push('/dashboard/company/my-tenders');
  };

  const renderBreadcrumb = () => (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/company')}
        className="text-gray-600 hover:text-gray-900"
      >
        Dashboard
      </Button>
      <span className="text-gray-400">/</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/company/my-tenders')}
        className="text-gray-600 hover:text-gray-900"
      >
        My Tenders
      </Button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-900 font-medium">Create Tender</span>
    </nav>
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
                  {selectedType === 'freelance' ? 'Create Freelance Tender' : 'Create Professional Tender'}
                </h2>
                <p className="text-gray-600">
                  {selectedType === 'freelance' 
                    ? 'Post a project and find the perfect freelancer for your needs'
                    : 'Create a formal procurement tender for registered companies'}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedType === 'freelance' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
              {selectedType === 'freelance' ? 'Freelance' : 'Professional'} Tender
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
              Company: {user?.companyName || 'Your Company'}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Creating {selectedType === 'freelance' ? 'Freelance' : 'Professional'} Tender</h3>
              <p className="text-gray-600 text-sm">
                Complete all sections to publish your tender
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Auto-save enabled</span>
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
            <span className="text-sm font-medium text-gray-700">25% complete</span>
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

        {/* Help Section */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Need Help?</CardTitle>
            <CardDescription>
              Get assistance with creating your tender
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Be specific with requirements</li>
                  <li>• Set realistic deadlines</li>
                  <li>• Include clear deliverables</li>
                  <li>• Define evaluation criteria</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Email: support@bananalink.com</li>
                  <li>• Phone: +1 (555) 123-4567</li>
                  <li>• Live Chat: Available 24/7</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Tips</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Save as draft first</li>
                  <li>• Review before publishing</li>
                  <li>• Set appropriate visibility</li>
                  <li>• Define clear milestones</li>
                </ul>
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
        <title>Create Tender | BananaLink</title>
        <meta name="description" content="Create a new tender to find freelancers or companies for your project" />
      </Head>

      <DashboardLayout requiredRole="company">
        <div className="p-6 max-w-7xl mx-auto">
          {renderBreadcrumb()}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Tender</h1>
            <p className="text-gray-600">
              Create a tender to find the perfect talent or company for your project needs
            </p>
          </div>

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

export default CompanyCreateTenderPage;