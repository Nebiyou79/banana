import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { applyColor } from '@/utils/color';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

interface QuickStatsCardProps {
  stats: StatItem[];
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ stats }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={`stat-${index}-${stat.title}`} className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={applyColor('darkNavy')}>
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={applyColor('darkNavy')}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span style={{ color: stat.color }}>{stat.change}</span> {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStatsCard;