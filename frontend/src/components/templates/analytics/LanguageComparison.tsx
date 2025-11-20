import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, Eye, MessageSquare, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LanguageComparisonProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  categoryFilter: string;
  isLoading: boolean;
}

interface LanguageMetrics {
  language: string;
  languageName: string;
  templateCount: number;
  totalSent: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
}

export const LanguageComparison: React.FC<LanguageComparisonProps> = ({
  dateRange,
  categoryFilter,
  isLoading: parentLoading,
}) => {
  // Fetch languages metadata
  const { data: languagesData } = useQuery({
    queryKey: ['template-languages'],
    queryFn: () => templatesService.getLanguages(),
  });

  // Fetch analytics summary for each popular language
  const languageCodes = useMemo(
    () => languagesData?.languages.filter((lang) => lang.popular).map((lang) => lang.code) || [],
    [languagesData]
  );

  // Fetch analytics for all languages
  const languageQueries = useQuery({
    queryKey: ['language-comparison', dateRange, categoryFilter, languageCodes],
    queryFn: async () => {
      if (languageCodes.length === 0) return [];

      const results = await Promise.all(
        languageCodes.map(async (langCode) => {
          try {
            const summary = await templatesService.getAnalyticsSummary({
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
              language: langCode,
              category: categoryFilter || undefined,
            });

            const language = languagesData?.languages.find((l) => l.code === langCode);

            return {
              language: langCode,
              languageName: language?.name || langCode,
              templateCount: summary.overallMetrics.totalTemplates,
              totalSent: summary.overallMetrics.totalSent,
              avgDeliveryRate: summary.overallMetrics.avgDeliveryRate,
              avgReadRate: summary.overallMetrics.avgReadRate,
              avgResponseRate: summary.overallMetrics.avgResponseRate,
            };
          } catch (error) {
            console.error(`Error fetching analytics for ${langCode}:`, error);
            return null;
          }
        })
      );

      return results.filter((r): r is LanguageMetrics => r !== null && r.totalSent > 0);
    },
    enabled: languageCodes.length > 0,
  });

  const isLoading = parentLoading || languageQueries.isLoading;
  const languageMetrics = languageQueries.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by Language</CardTitle>
          <CardDescription>Compare template performance across languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (languageMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by Language</CardTitle>
          <CardDescription>Compare template performance across languages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No language data available for the selected period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for percentage bars
  const totalSent = languageMetrics.reduce((sum, lang) => sum + lang.totalSent, 0);
  const maxSent = Math.max(...languageMetrics.map((lang) => lang.totalSent));

  // Sort by total sent (descending)
  const sortedMetrics = [...languageMetrics].sort((a, b) => b.totalSent - a.totalSent);

  // Find best performing language
  const bestLanguage = sortedMetrics.reduce((best, current) => {
    const currentScore =
      current.avgDeliveryRate * 0.3 +
      current.avgReadRate * 0.3 +
      current.avgResponseRate * 0.4;
    const bestScore =
      best.avgDeliveryRate * 0.3 + best.avgReadRate * 0.3 + best.avgResponseRate * 0.4;
    return currentScore > bestScore ? current : best;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Performance by Language
        </CardTitle>
        <CardDescription>
          Compare template performance across {languageMetrics.length} languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedMetrics.map((langMetrics) => {
          const isBest = langMetrics.language === bestLanguage.language;

          return (
            <div
              key={langMetrics.language}
              className={`space-y-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors ${
                isBest ? 'border-primary bg-primary/5' : ''
              }`}
            >
              {/* Language Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{langMetrics.languageName}</h4>
                      {isBest && (
                        <Badge className="bg-primary">
                          Best Performing
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {langMetrics.templateCount} template
                      {langMetrics.templateCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="text-xs">
                  <Send className="mr-1 h-3 w-3" />
                  {langMetrics.totalSent.toLocaleString()}
                </Badge>
              </div>

              {/* Volume Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Volume</span>
                  <span>{((langMetrics.totalSent / totalSent) * 100).toFixed(1)}% of total</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(langMetrics.totalSent / maxSent) * 100}%` }}
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
                    <span className="font-medium">{langMetrics.avgDeliveryRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={langMetrics.avgDeliveryRate} className="h-1.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Read
                    </span>
                    <span className="font-medium">{langMetrics.avgReadRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={langMetrics.avgReadRate} className="h-1.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Response
                    </span>
                    <span className="font-medium">{langMetrics.avgResponseRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={langMetrics.avgResponseRate} className="h-1.5" />
                </div>
              </div>

              {/* Performance Score */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Overall Score:</span>
                <span className="font-semibold">
                  {calculateScore(langMetrics).toFixed(0)}/100
                </span>
              </div>
            </div>
          );
        })}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{languageMetrics.length}</div>
            <div className="text-xs text-muted-foreground">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {languageMetrics.reduce((sum, lang) => sum + lang.templateCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Templates</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Calculate composite performance score
function calculateScore(metrics: LanguageMetrics): number {
  return (
    metrics.avgDeliveryRate * 0.3 +
    metrics.avgReadRate * 0.3 +
    metrics.avgResponseRate * 0.4
  );
}
