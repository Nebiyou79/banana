/* eslint-disable @typescript-eslint/no-unused-vars */
// components/company/CompanyCard.tsx - UPDATED
import { CompanyProfile as Company } from '@/services/companyService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, Phone, Globe, FileText, Eye, BadgeCheck, Sparkles, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface CompanyCardProps {
  company: Company;
  showActions?: boolean;
  onView?: (company: Company) => void;
}

export default function CompanyCard({ company, showActions = false, onView }: CompanyCardProps) {
  // Get image URLs directly from company object (assuming similar structure)
  const coverPhoto = company.bannerUrl || null;
  const avatar = company.logoUrl || null;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (onView) {
        onView(company);
      }
    } catch (error) {
      toast({
        title: 'Navigation Error',
        description: 'Unable to view company details',
        variant: 'destructive',
      });
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!company.website) {
      e.preventDefault();
      toast({
        title: 'No Website',
        description: 'This company has not provided a website',
        variant: 'warning',
      });
    }
  };

  return (
    <Card className="group relative bg-gradient-to-br from-white to-gray-50/80 hover:to-blue-50/50 border border-gray-200/60 hover:border-blue-300/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden backdrop-blur-sm">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Banner with shimmer effect */}
      <div className="relative h-24 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
        {coverPhoto ? (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={coverPhoto}
              alt={`${company.name} banner`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onLoad={() => console.log('✅ Banner loaded successfully')}
              onError={(e) => {
                console.error('❌ Banner failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col items-center justify-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-2">
              <Building2 className="w-4 h-4 text-white/80" />
            </div>
            <p className="text-white/80 text-xs">No banner image</p>
          </div>
        )}

        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <CardHeader className="pb-3 relative">
        {/* Logo with glow effect */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 -mt-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl border-2 border-white bg-white shadow-2xl overflow-hidden flex-shrink-0 group-hover:shadow-blue-500/25 transition-all duration-300 relative group/logo">
                  {avatar ? (
                    <>
                      <img
                        src={avatar}
                        alt={`${company.name} logo`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onLoad={() => console.log('✅ Logo loaded successfully')}
                        onError={(e) => {
                          console.error('❌ Logo failed to load');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                {company.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <BadgeCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-bold truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {company.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {company.industry && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {company.industry}
                    </Badge>
                  )}
                  <Badge variant={company.verified ? "default" : "outline"} className="text-xs">
                    {company.verified ? (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Verified
                      </span>
                    ) : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            <CardDescription className="text-sm flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500">Joined</span>
              <span className="text-gray-700 font-medium">
                {new Date(company.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {company.description && (
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-1 text-gray-700">
                <FileText className="w-3 h-3 text-blue-600" />
                About
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {company.description}
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            {company.address && (
              <div className="flex items-center gap-2 group/item">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                <span className="text-gray-600 truncate">{company.address}</span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2 group/item">
                <Phone className="w-3 h-3 text-green-600 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                <span className="text-gray-600">{company.phone}</span>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-2 group/item">
                <Globe className="w-3 h-3 text-purple-600 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-blue-600 hover:text-blue-700 hover:underline text-sm truncate transition-colors"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/80 backdrop-blur-sm border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group/btn"
                onClick={handleView}
              >
                <Link href={`/companies/${company._id}`}>
                  <Eye className="w-3 h-3 mr-2 group-hover/btn:scale-110 transition-transform" />
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