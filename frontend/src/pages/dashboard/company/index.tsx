import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/companyService';
import { CompanyProfile as Company } from '@/services/companyService';
import { jobService, Job } from '@/services/jobService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  Briefcase, 
  Users, 
  Plus, 
  Eye, 
  Edit,
  BarChart3,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function CompanyDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!user || user.role !== 'company') {
      router.push('/dashboard/company');
      return;
    }

    fetchCompanyData();
  }, [user, isLoading, router]);

const fetchCompanyData = async () => {
  try {
    setLoading(true);
    
    // Get company data - handle null case
    const companyData = await companyService.getMyCompany();
    
    // Only fetch jobs if company exists
    let jobsData: Job[] = [];
    if (companyData) {
      jobsData = await jobService.getCompanyJobs().catch(() => []);
    }

    setCompany(companyData);
    setJobs(jobsData);

    // Calculate stats only if we have jobs
    const activeJobs = jobsData.filter(job => job.status === 'active').length;
    const totalApplications = jobsData.reduce((total, job) => total + (job.applicationCount || 0), 0);

    setStats({
      totalJobs: jobsData.length,
      activeJobs,
      totalApplications,
    });
  } catch (error) {
    console.error('Error fetching company data:', error);
  } finally {
    setLoading(false);
  }
};

  if (isLoading || loading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard/company/jobs">
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/company/profile">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        {company && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeJobs} active jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  Total applications received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant={company.verified ? "default" : "secondary"}>
                    {company.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Company verification status
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!company && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Setup Your Company Profile
              </CardTitle>
              <CardDescription>
                Complete your company profile to start posting jobs and attracting candidates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/company/profile">
                  Setup Company Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Job Postings</CardTitle>
                <CardDescription>
                  Your most recent job listings
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/company/jobs">
                  View All Jobs
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first job posting to attract candidates.
                </p>
                <Button asChild>
                  <Link href="/dashboard/company/jobs">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Job
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{job.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {job.type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {job.type}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/company/jobs/${job._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}