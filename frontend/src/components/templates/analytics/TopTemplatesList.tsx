import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Eye, MessageSquare, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopTemplate {
  templateId: string;
  templateName: string;
  category: string;
  totalSent: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
}

interface TopTemplatesListProps {
  templates: TopTemplate[];
  isLoading: boolean;
}

export const TopTemplatesList: React.FC<TopTemplatesListProps> = ({ templates, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Templates</CardTitle>
          <CardDescription>Templates with the best engagement metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Templates</CardTitle>
          <CardDescription>Templates with the best engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No template data available for the selected period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Performing Templates
        </CardTitle>
        <CardDescription>
          Templates with the best engagement metrics (top {templates.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map((template, index) => (
          <div
            key={template.templateId}
            className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold">{template.templateName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      {template.totalSent.toLocaleString()} sent
                    </span>
                  </div>
                </div>
              </div>
              
              {index === 0 && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                  <Trophy className="mr-1 h-3 w-3" />
                  Best
                </Badge>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Delivery
                  </span>
                  <span className="font-medium">{template.deliveryRate.toFixed(1)}%</span>
                </div>
                <Progress value={template.deliveryRate} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Read
                  </span>
                  <span className="font-medium">{template.readRate.toFixed(1)}%</span>
                </div>
                <Progress value={template.readRate} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Response
                  </span>
                  <span className="font-medium">{template.responseRate.toFixed(1)}%</span>
                </div>
                <Progress value={template.responseRate} className="h-1.5" />
              </div>
            </div>

            {/* Performance Score */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Overall Score:</span>
              <span className="font-semibold text-foreground">
                {calculateScore(template).toFixed(0)}/100
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Calculate composite performance score
function calculateScore(template: TopTemplate): number {
  return (
    template.deliveryRate * 0.3 +
    template.readRate * 0.3 +
    template.responseRate * 0.4
  );
}
