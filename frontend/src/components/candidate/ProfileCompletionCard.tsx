import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { getTheme, colorClasses, ThemeMode } from '@/utils/color';

interface ProfileCompletionItem {
  label: string;
  completed: boolean;
  weight: number;
  route: string;
}

interface ProfileCompletionCardProps {
  completion: number;
  items: ProfileCompletionItem[];
  themeMode?: ThemeMode;
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  completion,
  items,
  themeMode = 'light'
}) => {
  const currentTheme = getTheme(themeMode);

  const getStatusColor = (completion: number): keyof typeof colorClasses.text => {
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
    <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${colorClasses.bg.white}`}>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className={`text-lg sm:text-xl font-bold ${colorClasses.text.darkNavy}`}>
          Profile Completion
        </CardTitle>
        <CardDescription className={`text-sm ${colorClasses.text.gray400}`}>
          {statusLabel} - {Math.round(completion)}% Complete
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, completion))}%`,
                backgroundColor: currentTheme.text.teal
              }}
            ></div>
          </div>

          {/* Completion Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`completion-item-${index}-${item.label}`}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center space-x-3">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm sm:text-base font-medium ${colorClasses.text.gray800} truncate max-w-[160px] sm:max-w-none`}>
                    {item.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`
                    text-xs px-2.5 py-0.5 min-w-[70px] text-center
                    ${item.completed
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  {item.completed ? "Complete" : `${item.weight}%`}
                </Badge>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Link href="/dashboard/candidate/profile" className="block mt-6">
            <button
              className={`
                w-full flex items-center justify-center px-4 py-3.5
                font-semibold rounded-lg hover:shadow-xl 
                transition-all duration-300 transform hover:-translate-y-0.5
                active:translate-y-0 group
                ${colorClasses.text.white}
              `}
              style={{ backgroundColor: currentTheme.bg.gold }}
            >
              <span className="text-base">Improve Profile</span>
              <ArrowRight className="ml-2.5 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCard;