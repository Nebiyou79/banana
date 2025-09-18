import { CompanyProfile as Company } from '@/services/companyService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, Phone, Globe, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

interface CompanyCardProps {
  company: Company;
  showActions?: boolean;
  onView?: (company: Company) => void;
}

export default function CompanyCard({ company, showActions = false, onView }: CompanyCardProps) {
  const handleView = () => {
    if (onView) {
      onView(company);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">{company.name}</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              {company.industry && (
                <Badge variant="secondary" className="text-sm">
                  {company.industry}
                </Badge>
              )}
              <Badge variant={company.verified ? "default" : "outline"}>
                {company.verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <CardDescription className="mt-2">
              Member since {new Date(company.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {company.description && (
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                About
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {company.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {company.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{company.address}</span>
              </div>
            )}
            
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{company.phone}</span>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={handleView} asChild={true}>
                <Link href={`/companies/${company._id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Company
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}