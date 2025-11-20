import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Eye, MessageSquare, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryData {
  category: string;
  templateCount: number;
  totalSent: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
}

interface CategoryBreakdownProps {
  breakdown: CategoryData[];
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  TRANSACTIONAL: 'bg-blue-500',
  UTILITY: 'bg-green-500',
  MARKETING: 'bg-purple-500',
  ACCOUNT_UPDATE: 'bg-orange-500',
  OTP: 'bg-red-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  TRANSACTIONAL: 'Transactional',
  UTILITY: 'Utility',
  MARKETING: 'Marketing',
  ACCOUNT_UPDATE: 'Account Update',
  OTP: 'OTP',
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ breakdown, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>Compare template performance across categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>Compare template performance across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No category data available for the selected period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for percentage bars
  const totalSent = breakdown.reduce((sum, cat) => sum + cat.totalSent, 0);
  const maxSent = Math.max(...breakdown.map((cat) => cat.totalSent));

  // Sort by total sent (descending)
  const sortedBreakdown = [...breakdown].sort((a, b) => b.totalSent - a.totalSent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance by Category
        </CardTitle>
        <CardDescription>
          Compare template performance across {breakdown.length} categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedBreakdown.map((category) => (
          <div
            key={category.category}
            className="space-y-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    CATEGORY_COLORS[category.category] || 'bg-gray-500'
                  }`}
                />
                <div>
                  <h4 className="font-semibold">
                    {CATEGORY_LABELS[category.category] || category.category}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {category.templateCount} template{category.templateCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <Badge variant="secondary" className="text-xs">
                <Send className="mr-1 h-3 w-3" />
                {category.totalSent.toLocaleString()}
              </Badge>
            </div>

            {/* Volume Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Volume</span>
                <span>{((category.totalSent / totalSent) * 100).toFixed(1)}% of total</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${CATEGORY_COLORS[category.category] || 'bg-gray-500'}`}
                  style={{ width: `${(category.totalSent / maxSent) * 100}%` }}
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Delivery
                  </span>
                  <span className="font-medium">{category.avgDeliveryRate.toFixed(1)}%</span>
                </div>
                <Progress value={category.avgDeliveryRate} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Read
                  </span>
                  <span className="font-medium">{category.avgReadRate.toFixed(1)}%</span>
                </div>
                <Progress value={category.avgReadRate} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Response
                  </span>
                  <span className="font-medium">{category.avgResponseRate.toFixed(1)}%</span>
                </div>
                <Progress value={category.avgResponseRate} className="h-1.5" />
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Performance:</span>
              <PerformanceBadge
                deliveryRate={category.avgDeliveryRate}
                readRate={category.avgReadRate}
                responseRate={category.avgResponseRate}
              />
            </div>
          </div>
        ))}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Messages Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {breakdown.reduce((sum, cat) => sum + cat.templateCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Templates</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance badge component
const PerformanceBadge: React.FC<{
  deliveryRate: number;
  readRate: number;
  responseRate: number;
}> = ({ deliveryRate, readRate, responseRate }) => {
  const score = deliveryRate * 0.3 + readRate * 0.3 + responseRate * 0.4;

  if (score >= 70) {
    return (
      <Badge className="bg-green-500 hover:bg-green-600">
        Excellent
      </Badge>
    );
  } else if (score >= 50) {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600">
        Good
      </Badge>
    );
  } else if (score >= 30) {
    return (
      <Badge variant="secondary">
        Average
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive">
        Needs Improvement
      </Badge>
    );
  }
};
