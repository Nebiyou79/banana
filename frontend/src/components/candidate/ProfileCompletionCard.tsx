import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { applyBgColor, applyColor } from '@/utils/color';

interface ProfileCompletionItem {
  label: string;
  completed: boolean;
  weight: number;
  route: string;
}

interface ProfileCompletionCardProps {
  completion: number;
  items: ProfileCompletionItem[];
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ completion, items }) => {
  const getStatusColor = (completion: number) => {
    try {
      if (completion >= 90) return 'teal';
      if (completion >= 70) return 'gold';
      if (completion >= 50) return 'orange';
      return 'orange';
    } catch (error) {
      console.error('Status color error:', error);
      return 'orange';
    }
  };

  const getStatusLabel = (completion: number) => {
    try {
      if (completion >= 90) return 'Excellent';
      if (completion >= 70) return 'Good';
      if (completion >= 50) return 'Average';
      return 'Needs Work';
    } catch (error) {
      console.error('Status label error:', error);
      return 'Needs Work';
    }
  };

  const statusColor = getStatusColor(completion);
  const statusLabel = getStatusLabel(completion);

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle style={applyColor('darkNavy')}>Profile Completion</CardTitle>
        <CardDescription>
          {statusLabel} - {Math.round(completion)}% Complete
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500" 
              style={{ 
                width: `${Math.min(100, Math.max(0, completion))}%`,
                backgroundColor: applyColor(statusColor).color
              }}
            ></div>
          </div>

          {/* Completion Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`completion-item-${index}-${item.label}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={item.completed ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600"}
                >
                  {item.completed ? "Complete" : `${item.weight}%`}
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Action Button */}
          <Link href="/dashboard/candidate/profile" className="block">
            <button 
              className="w-full flex items-center justify-center px-4 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
              style={applyBgColor('gold')}
            >
              Improve Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCard;