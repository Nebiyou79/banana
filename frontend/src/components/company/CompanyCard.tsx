// components/company/CompanyCard.tsx
import { CompanyProfile as Company } from '@/services/companyService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, Phone, Globe, FileText, Eye, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CompanyCardProps {
  company: Company;
  showActions?: boolean;
  onView?: (company: Company) => void;
}

export default function CompanyCard({ company, showActions = false, onView }: CompanyCardProps) {
  const logoUrl = company.logoUrl?.startsWith('http')
    ? company.logoUrl
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${company.logoUrl}`;

  const bannerUrl = company.bannerUrl?.startsWith('http')
    ? company.bannerUrl
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${company.bannerUrl}`;

  const handleView = () => {
    if (onView) {
      onView(company);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
      {/* Banner */}
      <div 
        className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"
        style={bannerUrl ? { 
          backgroundImage: `url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      >
        {!bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90" />
        )}
      </div>

      <CardHeader className="pb-3 relative">
        {/* Logo */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 -mt-12">
              <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <Image 
                    src={logoUrl} 
                    alt={`${company.name} logo`}
                    className="w-full h-full object-cover"
                    width={50}
                    height={50}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-bold truncate">{company.name}</CardTitle>
                  {company.verified && (
                    <BadgeCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {company.industry && (
                    <Badge variant="secondary" className="text-xs">
                      {company.industry}
                    </Badge>
                  )}
                  <Badge variant={company.verified ? "default" : "outline"} className="text-xs">
                    {company.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <CardDescription className="text-sm">
              Member since {new Date(company.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {company.description && (
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <FileText className="w-3 h-3" />
                About
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {company.description}
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            {company.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate">{company.address}</span>
              </div>
            )}
            
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{company.phone}</span>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm truncate"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleView}>
                <Link href={`/companies/${company._id}`}>
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}