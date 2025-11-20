import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  Send,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface LowPerformingTemplate {
  templateId: string;
  templateName: string;
  category: string;
  totalSent: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  issues: string[];
}

interface LowPerformingTemplatesListProps {
  templates: LowPerformingTemplate[];
  isLoading: boolean;
}

export const LowPerformingTemplatesList: React.FC<LowPerformingTemplatesListProps> = ({
  templates,
  isLoading,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates Needing Attention</CardTitle>
          <CardDescription>Templates with performance issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates Needing Attention</CardTitle>
          <CardDescription>Templates with performance issues</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Great news! All your templates are performing well. No issues detected.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Templates Needing Attention
        </CardTitle>
        <CardDescription>
          Templates with performance issues that may need optimization ({templates.length} found)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.templateId}
            className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{template.templateName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Send className="h-3 w-3" />
                  {template.totalSent.toLocaleString()} sent
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/templates/${template.templateId}`)}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                View
              </Button>
            </div>

            {/* Issues */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                Issues Detected:
              </div>
              <ul className="space-y-1">
                {template.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-orange-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Delivery
                  </span>
                  <span className={`font-medium ${template.deliveryRate < 85 ? 'text-red-600' : ''}`}>
                    {template.deliveryRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={template.deliveryRate} 
                  className={`h-1.5 ${template.deliveryRate < 85 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Read
                  </span>
                  <span className={`font-medium ${template.readRate < 50 ? 'text-red-600' : ''}`}>
                    {template.readRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={template.readRate} 
                  className={`h-1.5 ${template.readRate < 50 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Response
                  </span>
                  <span className={`font-medium ${template.responseRate < 10 ? 'text-red-600' : ''}`}>
                    {template.responseRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={template.responseRate} 
                  className={`h-1.5 ${template.responseRate < 10 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-md p-3 border border-orange-200">
              <div className="flex items-start gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-orange-800">Recommendations:</span>
                  <p className="text-muted-foreground mt-1">
                    {getRecommendation(template)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Generate recommendations based on issues
function getRecommendation(template: LowPerformingTemplate): string {
  const recommendations: string[] = [];

  if (template.deliveryRate < 85) {
    recommendations.push('Verify phone numbers are valid and properly formatted.');
  }

  if (template.readRate < 50) {
    recommendations.push('Consider improving message timing or making the preview text more engaging.');
  }

  if (template.responseRate < 10) {
    recommendations.push('Add clear call-to-action buttons or improve message content to encourage responses.');
  }

  if (recommendations.length === 0) {
    return 'Review template content and consider A/B testing with variations.';
  }

  return recommendations.join(' ');
}
