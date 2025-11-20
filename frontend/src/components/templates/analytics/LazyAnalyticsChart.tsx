import React, { Suspense, lazy } from 'react';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';

// Lazy load the chart component
const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

interface LazyAnalyticsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area';
  title: string;
  description?: string;
}

/**
 * LazyAnalyticsChart Component
 * 
 * Lazy loads the analytics chart component to reduce initial bundle size.
 * The chart library (recharts) is only loaded when this component is rendered.
 * 
 * Performance Benefits:
 * - Reduces initial bundle size by ~100KB
 * - Charts only load when user navigates to analytics
 * - Improves initial page load time
 */
export const LazyAnalyticsChart: React.FC<LazyAnalyticsChartProps> = ({
  data,
  type,
  title,
  description,
}) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{description}</p>
        )}
        
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  Loading chart...
                </p>
              </div>
            </div>
          }
        >
          <AnalyticsChart data={data} type={type} />
        </Suspense>
      </div>
    </Card>
  );
};

export default LazyAnalyticsChart;
