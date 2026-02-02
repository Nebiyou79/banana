import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';

export interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  description: string;
  color: keyof typeof colorClasses.text;
}

interface QuickStatsCardProps {
  stats: StatItem[];
  themeMode?: ThemeMode;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ stats, themeMode = 'light' }) => {
  const currentTheme = getTheme(themeMode);

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={`stat-${index}-${stat.title}`}
          className={`
            border-0 shadow-sm hover:shadow-md 
            transition-all duration-300 hover:scale-[1.02]
            ${colorClasses.bg.white}
            overflow-hidden
            min-h-[120px] sm:min-h-[140px]
          `}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
            <CardTitle className={`text-xs sm:text-sm font-medium ${colorClasses.text.gray800} truncate`}>
              {stat.title}
            </CardTitle>
            <div className={colorClasses.text[stat.color]}>
              <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colorClasses.text.darkNavy} mb-1`}>
              {stat.value}
            </div>
            <p className={`text-xs ${colorClasses.text.gray400} mt-1 line-clamp-2`}>
              <span className={colorClasses.text[stat.color]}>{stat.change}</span> {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStatsCard;