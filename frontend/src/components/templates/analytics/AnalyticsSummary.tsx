import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Download, 
  Calendar as CalendarIcon,
  BarChart3,
  AlertTriangle,
  Trophy,
  Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TopTemplatesList } from './TopTemplatesList';
import { LowPerformingTemplatesList } from './LowPerformingTemplatesList';
import { CategoryBreakdown } from './CategoryBreakdown';
import { LanguageComparison } from './LanguageComparison';

interface DateRange {
  from: Date;
  to: Date;
}

export const AnalyticsSummary: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('approved');

  // Fetch analytics summary
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-summary', dateRange, categoryFilter, languageFilter, statusFilter],
    queryFn: () =>
      templatesService.getAnalyticsSummary({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        category: categoryFilter || undefined,
        language: languageFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templatesService.getCategories(),
  });

  // Fetch languages for filter
  const { data: languagesData } = useQuery({
    queryKey: ['template-languages'],
    queryFn: () => templatesService.getLanguages(),
  });

  const handleExport = async () => {
    try {
      const exportData = await templatesService.exportAnalytics({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        category: categoryFilter || undefined,
        language: languageFilter || undefined,
        format: 'csv',
      });

      // Create download link
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics summary. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Summary</h2>
          <p className="text-muted-foreground">
            Overview of template performance and insights
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), 7),
                      to: new Date(),
                    })
                  }
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    })
                  }
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), 90),
                      to: new Date(),
                    })
                  }
                >
                  Last 90 days
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categoriesData?.categories.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Language Filter */}
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Languages</SelectItem>
              {languagesData?.languages
                .filter((lang) => lang.popular)
                .map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overall Metrics Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overallMetrics.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {summary.overallMetrics.activeTemplates} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.overallMetrics.totalSent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                In selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.overallMetrics.avgDeliveryRate.toFixed(1)}%
              </div>
              <MetricBadge value={summary.overallMetrics.avgDeliveryRate} threshold={85} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.overallMetrics.avgResponseRate.toFixed(1)}%
              </div>
              <MetricBadge value={summary.overallMetrics.avgResponseRate} threshold={10} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Different Views */}
      <Tabs defaultValue="top-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-templates">
            <Trophy className="mr-2 h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="low-performing">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Needs Attention
          </TabsTrigger>
          <TabsTrigger value="category-breakdown">
            <BarChart3 className="mr-2 h-4 w-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="language-comparison">
            <Activity className="mr-2 h-4 w-4" />
            By Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-templates" className="space-y-4">
          {summary && (
            <TopTemplatesList 
              templates={summary.topTemplates}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="low-performing" className="space-y-4">
          {summary && (
            <LowPerformingTemplatesList
              templates={summary.lowPerformingTemplates}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="category-breakdown" className="space-y-4">
          {summary && (
            <CategoryBreakdown
              breakdown={summary.categoryBreakdown}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="language-comparison" className="space-y-4">
          {summary && (
            <LanguageComparison
              dateRange={dateRange}
              categoryFilter={categoryFilter}
              isLoading={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for metric badges
const MetricBadge: React.FC<{ value: number; threshold: number }> = ({ value, threshold }) => {
  if (value >= threshold) {
    return (
      <Badge variant="default" className="bg-green-500">
        <TrendingUp className="mr-1 h-3 w-3" />
        Good
      </Badge>
    );
  } else if (value >= threshold * 0.8) {
    return (
      <Badge variant="secondary">
        <Minus className="mr-1 h-3 w-3" />
        Average
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive">
        <TrendingDown className="mr-1 h-3 w-3" />
        Low
      </Badge>
    );
  }
};
